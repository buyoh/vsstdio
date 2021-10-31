import { RunnerManager } from '../lib/RunnerManager';
import {
  CommandQuery,
  CommandQueryKill,
  CommandQueryRun,
  CommandResponce,
} from './Command';
import { ViewInterface } from './ViewInterface';

class Task {
  private query_: CommandQueryRun;
  private runnerManager_: RunnerManager;
  private sendResultHandler_: (r: CommandResponce) => void;
  private internalErrorHandler_: ErrorHandler;
  private runnerId_: number | null;
  private killed_: boolean;
  constructor(
    query: CommandQueryRun,
    runnerManager: RunnerManager,
    sendResultHandler: (r: CommandResponce) => void,
    internalErrorHandler: ErrorHandler
  ) {
    this.query_ = query;
    this.runnerManager_ = runnerManager;
    this.sendResultHandler_ = sendResultHandler;
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
    const buildQuery = this.query_.build;
    if (buildQuery) {
      const resBuild = await this.runCommand(buildQuery.cmd, '');
      this.sendResultHandler_({
        result: 'complete',
        id: this.query_.id,
        phase: 'build',
        testId: '-1',
        stdout: resBuild.stdout,
        stderr: resBuild.stderr,
        code: resBuild.code,
      });
      if (resBuild.code !== 0) {
        return false; // quit
      }
    }
    for (const test of this.query_.tests) {
      if (this.killed_) {
        break;
      }
      const resBuild = await this.runCommand(test.cmd, test.stdin);
      this.sendResultHandler_({
        result: 'complete',
        id: this.query_.id,
        phase: 'tests',
        testId: test.testId,
        stdout: resBuild.stdout,
        stderr: resBuild.stderr,
        code: resBuild.code,
      });
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

export class CommandPanelHandler {
  private view_: ViewInterface;
  private runnerManager_: RunnerManager;
  private internalErrorHandler_: ErrorHandler;
  private tasks_: { [key: string]: Task };
  constructor(
    view: ViewInterface,
    runnerManager: RunnerManager,
    internalErrorHandler: ErrorHandler
  ) {
    this.view_ = view;
    this.runnerManager_ = runnerManager;
    this.internalErrorHandler_ = internalErrorHandler;
    this.tasks_ = {};
    view.onReceiveMessage(this.processMessage.bind(this));
  }

  private sendMessageImpl(a: CommandResponce) {
    // console.log('TX', JSON.stringify(a));
    this.view_.postMessage(a);
  }

  processMessage(query: CommandQuery) {
    // console.log('RX', query);
    if (query.method === 'run') {
      this.processRun(query);
    } else if (query.method === 'kill') {
      this.processKill(query);
    }
  }

  private processRun(query: CommandQueryRun) {
    const task = new Task(
      query,
      this.runnerManager_,
      (r) => this.view_.postMessage(r),
      this.internalErrorHandler_
    );

    const queryId = query.id.toString();
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
        this.sendMessageImpl({
          result: 'error',
          id: query.id,
          detail: e,
        });
      });
  }
  private processKill(query: CommandQueryKill) {
    const queryId = query.id.toString();
    this.tasks_[queryId]?.kill();
  }
}
