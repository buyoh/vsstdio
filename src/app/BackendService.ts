import * as vscode from 'vscode';

import { RunnerManager } from '../lib/RunnerManager';
import { BackendHandler, BackendService, ViewContentHandler } from './public';
import { EnvironmentContext } from '../lib/EnvironmentContext';
import { ApplicationQuery, ApplicationResponce } from '../common/Command';

class Task {
  private queryId: string;
  private queryBuild: { cmd: string } | null;
  private queryTests: Array<{ testId: string; cmd: string; stdin: string }>;

  private runnerManager: RunnerManager;
  private applicationResponce: ApplicationResponce;
  private internalErrorHandler: ErrorHandler;
  private runnerId: number | null;
  private killed: boolean;
  constructor(
    queryId: string,
    queryBuild: { cmd: string } | null,
    queryTests: Array<{ testId: string; cmd: string; stdin: string }>,
    runnerManager: RunnerManager,
    applicationResponce: ApplicationResponce,
    internalErrorHandler: ErrorHandler
  ) {
    this.queryId = queryId;
    this.queryBuild = queryBuild;
    this.queryTests = queryTests;

    this.runnerManager = runnerManager;
    this.applicationResponce = applicationResponce;
    this.internalErrorHandler = internalErrorHandler;
    this.runnerId = null;
    this.killed = false;
  }

  private runCommand(
    cmd: string,
    stdin: string
  ): Promise<{ code: number; stdout: string; stderr: string }> {
    if (this.killed) {
      return Promise.resolve({ code: -1, stdout: '', stderr: '' });
    }
    return new Promise((resolve, reject) => {
      const runnerId = this.runnerManager.runNewCommand(
        cmd,
        stdin,
        (err, res) => {
          if (err || !res) {
            this.internalErrorHandler(err, 'run: failed commands');
            reject(err);
            return;
          }
          const { code, stdout, stderr } = res;
          resolve({ code, stdout, stderr });
        }
      );
      if (!runnerId) {
        this.internalErrorHandler(undefined, 'run: invalid query parameters');
        reject('invalid query parameters');
        return;
      }
      this.runnerId
   = runnerId;
    });
  }

  async start(): Promise<boolean> {
    this.killed = false;
    const buildQuery = this.queryBuild;
    if (buildQuery) {
      const resBuild = await this.runCommand(buildQuery.cmd, '');
      this.applicationResponce.complete(
        this.queryId,
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
    for (const test of this.queryTests) {
      if (this.killed) {
        break;
      }
      const resBuild = await this.runCommand(test.cmd, test.stdin);
      this.applicationResponce.complete(
        this.queryId,
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
    if (this.runnerId
   !== null) {
      this.runnerManager.killCommand(this.runnerId
    
      );
      this.killed = true;
    }
  }
}

type ErrorHandler = (err: any, message: string) => void;

class BackendServiceImpl implements BackendService, BackendHandler, ApplicationQuery {
  private runnerManager: RunnerManager;
  private internalErrorHandler: ErrorHandler;
  private tasks: { [key: string]: Task };
  private viewContentHandler?: ViewContentHandler;
  private applicationResponce?: ApplicationResponce;

  constructor(
    runnerManager: RunnerManager,
    internalErrorHandler: ErrorHandler
  ) {
    this.runnerManager = runnerManager;
    this.internalErrorHandler = internalErrorHandler;
    this.tasks = {};
  }

  // BackendService
  getBackendHandler(): BackendHandler {
    return this;
  }

  // BackendService
  setViewContentHandler(handler: ViewContentHandler): void {
    this.viewContentHandler = handler;
    // TODO: ここでやる？
    this.applicationResponce = this.viewContentHandler.bindApplication(this);
  }

  // ApplicationQuery
  run(
    id: string,
    build: { cmd: string } | null,
    tests: Array<{ testId: string; cmd: string; stdin: string }>
  ): void {
    if (!this.applicationResponce) {
      this.internalErrorHandler(undefined, 'run: not binded');
      return;
    }
    const task = new Task(
      id,
      build,
      tests,
      this.runnerManager,
      this.applicationResponce,
      this.internalErrorHandler
    );

    const queryId = id.toString();
    if (this.tasks[queryId]) {
      this.internalErrorHandler(undefined, 'run: invalid query parameters');
    }

    this.tasks[queryId] = task;
    task
      .start()
      .then((_res) => {
        // incomplete: res === false
        // incomplete でも中断するだけで特に何もしない
        delete this.tasks[queryId];
      })
      .catch((e) => {
        this.applicationResponce?.error(id, e);
      });
  }

  // ApplicationQuery
  kill(
    id: string
  ): void {
    const queryId = id.toString();
    this.tasks[queryId]?.kill();
    delete this.tasks[queryId];
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