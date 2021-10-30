import { CommandRunner, CommandRunnerResult } from './CommandRunner';
import { EnvironmentContext } from './EnvironmentContext';

export class RunnerManager {
  private idGenerator_: number;
  private runners_: { [key: number]: CommandRunner };
  private ctx_: EnvironmentContext;

  constructor(ctx: EnvironmentContext) {
    this.idGenerator_ = 0;
    this.runners_ = {};
    this.ctx_ = ctx;
  }

  runNewCommand(
    cmd: string,
    stdin: string,
    callback: (err: any, res: CommandRunnerResult | null) => void
  ): number | null {
    if (cmd === '') {
      return null;
    }
    this.idGenerator_ += 1;
    const id = this.idGenerator_;
    // TODO: arguments?
    const runner = new CommandRunner(this.ctx_, cmd, [], stdin);
    this.runners_[id] = runner;
    runner
      .run()
      .then((res) => {
        callback(null, res);
        delete this.runners_[id];
      })
      .catch((e) => {
        callback(e, null);
        delete this.runners_[id];
      });
    return id;
  }

  killCommand(id: number) {
    const r = this.runners_[id];
    r?.kill();
  }
}
