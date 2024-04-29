// export interface CommandQueryRun {
//   method: 'run';
//   id: string;
//   // cmd: string;
//   // stdin: string;
//   build: {
//     cmd: string;
//   } | null;
//   tests: Array<{ testId: string; cmd: string; stdin: string }>;
// }

// export interface CommandQueryKill {
//   method: 'kill';
//   id: string;
// }

// export type CommandQuery = CommandQueryRun | CommandQueryKill;

// export interface CommandResponceError {
//   result: 'error';
//   id: string;
//   detail: string;
// }

// export interface CommandResponceComplete {
//   result: 'complete';
//   id: string;
//   phase: 'build' | 'tests';
//   testId: string;
//   stdout: string;
//   stderr: string;
//   code: number;
// }

// export type CommandResponce = CommandResponceError | CommandResponceComplete;

// ------------------------------------

export interface ApplicationQuery {
  run(
    id: string,
    build: { cmd: string } | null,
    tests: Array<{ testId: string; cmd: string; stdin: string }>
  ): void;
  kill(id: string): void;
}

export interface ApplicationResponce {
  error(id: string, detail: string): void;
  complete(
    id: string,
    phase: 'build' | 'tests',
    testId: string,
    stdout: string,
    stderr: string,
    code: number
  ): void;
}

// ------------------------------------

export class ApplicationQueryTransmitter implements ApplicationQuery {
  transmitter: (json: string) => void;

  constructor(transmitter: (json: string) => void) {
    this.transmitter = transmitter;
  }

  run(
    id: string,
    build: { cmd: string } | null,
    tests: Array<{ testId: string; cmd: string; stdin: string }>
  ): void {
    this.transmitter(JSON.stringify({ method: 'run', id, build, tests }));
  }

  kill(id: string): void {
    this.transmitter(JSON.stringify({ method: 'kill', id }));
  }
}

export class ApplicationQueryReceiver {
  receiver: ApplicationQuery;

  constructor(receiver: ApplicationQuery) {
    this.receiver = receiver;
  }

  receive(json: string): void {
    const obj = JSON.parse(json);
    if (obj.method === 'run') {
      // TODO: validate
      this.receiver.run(obj.id, obj.build, obj.tests);
    } else if (obj.method === 'kill') {
      // TODO: validate
      this.receiver.kill(obj.id);
    }
  }
}

// ------------------------------------

export class ApplicationResponceTransmitter implements ApplicationResponce {
  receiver: (json: string) => void;

  constructor(receiver: (json: string) => void) {
    this.receiver = receiver;
  }

  error(id: string, detail: string): void {
    this.receiver(JSON.stringify({ result: 'error', id, detail }));
  }

  complete(
    id: string,
    phase: 'build' | 'tests',
    testId: string,
    stdout: string,
    stderr: string,
    code: number
  ): void {
    this.receiver(
      JSON.stringify({
        result: 'complete',
        id,
        phase,
        testId,
        stdout,
        stderr,
        code,
      })
    );
  }
}

export class ApplicationResponceReceiver {
  receiver: ApplicationResponce;

  constructor(receiver: ApplicationResponce) {
    this.receiver = receiver;
  }

  receive(json: string): void {
    const obj = JSON.parse(json);
    if (obj.result === 'error') {
      // TODO: validate
      this.receiver.error(obj.id, obj.detail);
    } else if (obj.result === 'complete') {
      // TODO: validate
      this.receiver.complete(
        obj.id,
        obj.phase,
        obj.testId,
        obj.stdout,
        obj.stderr,
        obj.code
      );
    }
  }
}
