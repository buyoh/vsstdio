import { RunnerManager } from './RunnerManager';
import {
  CommandQuery,
  CommandQueryKill,
  CommandQueryRun,
  CommandResponce,
  ViewInterface,
} from './Types';

type ErrorHandler = (err: any, message: string) => void;

export class CommandPanelHandler {
  private view_: ViewInterface;
  private runnerManager_: RunnerManager;
  private internalErrorHandler_: ErrorHandler;
  constructor(
    view: ViewInterface,
    runnerManager: RunnerManager,
    internalErrorHandler: ErrorHandler
  ) {
    this.view_ = view;
    this.runnerManager_ = runnerManager;
    this.internalErrorHandler_ = internalErrorHandler;
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
    const ok = this.runnerManager_.runNewCommand(
      query.id,
      query.cmd,
      query.stdin,
      (err, id, res) => {
        if (err || !res) {
          this.internalErrorHandler_(err, 'run: failed commands');
          this.sendMessageImpl({
            result: 'error',
            id,
            detail: JSON.stringify(err),
          });
          return;
        }
        this.sendMessageImpl({
          result: 'complete',
          id,
          stdout: res.stdout,
          stderr: res.stderr,
          code: res.code,
        });
      }
    );
    if (!ok) {
      this.internalErrorHandler_(undefined, 'run: invalid query parameters');
    }
  }
  private processKill(query: CommandQueryKill) {
    this.runnerManager_.killCommand(query.id);
  }
}
