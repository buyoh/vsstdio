import * as vscode from 'vscode';

import { RunnerManager } from '../lib/RunnerManager';
import { BackendHandler, BackendService, ViewContentHandler } from './public';
import { EnvironmentContext } from '../lib/EnvironmentContext';
import { ApplicationQuery, ApplicationResponce } from '../common/Command';

class Task {
  // TODO: remove _.
  private queryId_: string;
  private queryBuild_: { cmd: string } | null;
  private queryTests_: Array<{ testId: string; cmd: string; stdin: string }>;

  private runnerManager_: RunnerManager;
  private applicationResponce_: ApplicationResponce;
  private internalErrorHandler_: ErrorHandler;
  private runnerId_: number | null;
  private killed_: boolean;
  constructor(
    queryId: string,
    queryBuild: { cmd: string } | null,
    queryTests: Array<{ testId: string; cmd: string; stdin: string }>,
    runnerManager: RunnerManager,
    applicationResponce: ApplicationResponce,
    internalErrorHandler: ErrorHandler
  ) {
    this.queryId_ = queryId;
    this.queryBuild_ = queryBuild;
    this.queryTests_ = queryTests;

    this.runnerManager_ = runnerManager;
    this.applicationResponce_ = applicationResponce;
    this.internalErrorHandler_ = internalErrorHandler;
    this.runnerId_ = null;
    this.killed_ = false;
  }

  private runCommand(
    cmd: string,
    stdin: string
  ): Promise<{ code: number; stdout: string; stderr: string }> {
    if (this.killed_) {
      return Promise.resolve({ code: -1, stdout: '', stderr: '' });
    }
    return new Promise((resolve, reject) => {
      const runnerId = this.runnerManager_.runNewCommand(
        cmd,
        stdin,
        (err, res) => {
          if (err || !res) {
            this.internalErrorHandler_(err, 'run: failed commands');
            reject(err);
            return;
          }
          const { code, stdout, stderr } = res;
          resolve({ code, stdout, stderr });
        }
      );
      if (!runnerId) {
        this.internalErrorHandler_(undefined, 'run: invalid query parameters');
        reject('invalid query parameters');
        return;
      }
      this.runnerId_ = runnerId;
    });
  }

  async start(): Promise<boolean> {
    this.killed_ = false;
    const buildQuery = this.queryBuild_;
    if (buildQuery) {
      const resBuild = await this.runCommand(buildQuery.cmd, '');
      this.applicationResponce_.complete(
        this.queryId_,
        'build',
        '-1',
        resBuild.stdout,
        resBuild.stderr,
        resBuild.code
      );
      if (resBuild.code !== 0) {
        return false; // quit
      }
    }
    for (const test of this.queryTests_) {
      if (this.killed_) {
        break;
      }
      const resBuild = await this.runCommand(test.cmd, test.stdin);
      this.applicationResponce_.complete(
        this.queryId_,
        'tests',
        test.testId,
        resBuild.stdout,
        resBuild.stderr,
        resBuild.code
      );
    }
    return true;
  }

  kill() {
    if (this.runnerId_ !== null) {
      this.runnerManager_.killCommand(this.runnerId_);
      this.killed_ = true;
    }
  }
}

type ErrorHandler = (err: any, message: string) => void;

class BackendServiceImpl implements BackendService, BackendHandler, ApplicationQuery {
  // TODO: remove _.
  private runnerManager_: RunnerManager;
  private internalErrorHandler_: ErrorHandler;
  private tasks_: { [key: string]: Task };
  private viewContentHandler?: ViewContentHandler;
  private applicationResponce_?: ApplicationResponce;

  constructor(
    runnerManager: RunnerManager,
    internalErrorHandler: ErrorHandler
  ) {
    this.runnerManager_ = runnerManager;
    this.internalErrorHandler_ = internalErrorHandler;
    this.tasks_ = {};
  }

  // BackendService
  getBackendHandler(): BackendHandler {
    return this;
  }

  // BackendService
  setViewContentHandler(handler: ViewContentHandler): void {
    this.viewContentHandler = handler;
    // TODO: ここでやる？
    this.applicationResponce_ = this.viewContentHandler.bindApplication(this);
  }

  // ApplicationQuery
  run(
    id: string,
    build: { cmd: string } | null,
    tests: Array<{ testId: string; cmd: string; stdin: string }>
  ): void {
    if (!this.applicationResponce_) {
      this.internalErrorHandler_(undefined, 'run: not binded');
      return;
    }
    const task = new Task(
      id,
      build,
      tests,
      this.runnerManager_,
      this.applicationResponce_,
      this.internalErrorHandler_
    );

    const queryId = id.toString();
    if (this.tasks_[queryId]) {
      this.internalErrorHandler_(undefined, 'run: invalid query parameters');
    }

    this.tasks_[queryId] = task;
    task
      .start()
      .then((_res) => {
        // incomplete: res === false
        // incomplete でも中断するだけで特に何もしない
        delete this.tasks_[queryId];
      })
      .catch((e) => {
        this.applicationResponce_?.error(id, e);
      });
  }

  // ApplicationQuery
  kill(
    id: string
  ): void {
    const queryId = id.toString();
    this.tasks_[queryId]?.kill();
    delete this.tasks_[queryId];
  }
}

export async function createBackendService(
  context: vscode.ExtensionContext,
  environmentContext: EnvironmentContext,
) {
  const runnerManager = new RunnerManager(environmentContext);

  const errorHandler = (err: any, msg: any) => {
    vscode.window.showErrorMessage('internal error: ' + msg.toString());
    console.error(msg, err);
  };

  return new BackendServiceImpl(runnerManager, errorHandler);
}