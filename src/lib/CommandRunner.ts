import * as ChildProcess from 'child_process';
import { ChildProcessWithoutNullStreams } from 'node:child_process';

// threshold を超えないことを保証するものではない
const K_THREASHOLD_OUTPUT_BYTE = 100000;

export interface CommandRunnerResult {
  code: number;
  signal: string;
  stdout: string;
  stderr: string;
}

export class CommandRunner {
  private command_: string;
  private args_: string[];
  private stdin_: string;
  private ps_: ChildProcessWithoutNullStreams | null;

  constructor(command: string, args: string[], stdin: string) {
    this.command_ = command;
    this.args_ = args;
    this.stdin_ = stdin;
    this.ps_ = null;
  }

  kill() {
    if (!this.ps_) {
      return;
    }
    if (!this.ps_.killed) {
      this.ps_.kill();
    }
  }

  run(): Promise<CommandRunnerResult> {
    this.ps_ = null;
    return new Promise((resolve, reject) => {
      const ps = ChildProcess.spawn(this.command_, this.args_, { shell: true });
      ps.stdin.write(this.stdin_);
      ps.stdin.end();

      let stdoutChunks = [] as Buffer[];
      let stdoutLength = 0;
      let stderrChunks = [] as Buffer[];
      let stderrLength = 0;

      let endflg = 0;
      let endcode = -1;
      let endsignal = '';

      ps.stdout.on('data', (data) => {
        if (stdoutLength > K_THREASHOLD_OUTPUT_BYTE) {
          return;
        }
        stdoutLength += data.length;
        stdoutChunks.push(data);
      });

      ps.stderr.on('data', (data) => {
        if (stderrLength > K_THREASHOLD_OUTPUT_BYTE) {
          return;
        }
        stderrLength += data.length;
        stderrChunks.push(data);
      });

      function checkTermination() {
        if (endflg === 7) {
          resolve({
            code: endcode,
            signal: endsignal,
            stdout: Buffer.concat(stdoutChunks).toString(),
            stderr: Buffer.concat(stderrChunks).toString(),
          });
        }
      }
      ps.stdout.on('end', () => {
        endflg |= 1;
        checkTermination();
      });
      ps.stderr.on('end', () => {
        endflg |= 2;
        checkTermination();
      });
      ps.on('close', (code, signal) => {
        endcode = code;
        endsignal = signal;
        endflg |= 4;
        checkTermination();
      });

      ps.on('err', (err) => {
        reject(err);
      });
      this.ps_ = ps;
    });
  }
}
