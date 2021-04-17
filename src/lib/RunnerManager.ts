import { CommandRunner, CommandRunnerResult } from './CommandRunner';

export class RunnerManager {
  private runners_: { [key: number]: CommandRunner };

  constructor() {
    this.runners_ = {};
  }

  runNewCommand(
    id: number,
    cmd: string,
    stdin: string,
    callback: (err: any, id: number, res: CommandRunnerResult | null) => void
  ): boolean {
    if (cmd === '') {
      return false;
    }
    if (this.runners_[id]) {
      return false;
    }
    // TODO: arguments?
    const runner = new CommandRunner(cmd, [], stdin);
    this.runners_[id] = runner;
    runner
      .run()
      .then((res) => {
        callback(null, id, res);
        delete this.runners_[id];
      })
      .catch((e) => {
        callback(e, id, null);
        delete this.runners_[id];
      });
    return true;
  }

  killCommand(id: number) {
    const r = this.runners_[id];
    r?.kill();
  }
}
