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

export interface ViewContentConfig {
  commandPanel: {
    buildCommand: string[];
    testCommand: string[];
  };
}

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


export interface ApplicationRemote {
  requestViewContentConfig(): void;
}

export interface ApplicationEventListener {
  onViewContentConfigChanged(config: ViewContentConfig): void;
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
    this.receiver(
      JSON.stringify({ m: 'error', args: { result: 'error', id, detail } })
    );
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
        m: 'complete',
        args: {
          result: 'complete',
          id,
          phase,
          testId,
          stdout,
          stderr,
          code,
        },
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
    if (obj.m === 'error') {
      // TODO: validate
      const args = obj.args;
      this.receiver.error(args.id, args.detail);
    } else if (obj.m === 'complete') {
      // TODO: validate
      const args = obj.args;
      this.receiver.complete(
        args.id,
        args.phase,
        args.testId,
        args.stdout,
        args.stderr,
        args.code
      );
    }
  }
}

// ------------------------------------

export class ApplicationRemoteTransmitter implements ApplicationRemote {
  transmitter: (json: string) => void;

  constructor(transmitter: (json: string) => void) {
    this.transmitter = transmitter;
  }

  requestViewContentConfig(): void {
    this.transmitter(JSON.stringify({ m: 'requestViewContentConfig' }));
  }

}

export class ApplicationRemoteReceiver {
  receiver: ApplicationRemote;

  constructor(receiver: ApplicationRemote) {
    this.receiver = receiver;
  }

  receive(json: string): void {
    const obj = JSON.parse(json);
    if (obj.m === 'requestViewContentConfig') {
      this.receiver.requestViewContentConfig();
    }
  }
}

// ------------------------------------

export class ApplicationEventListenerTransmitter implements ApplicationEventListener {
  receiver: (json: string) => void;

  constructor(receiver: (json: string) => void) {
    this.receiver = receiver;
  }

  onViewContentConfigChanged(config: ViewContentConfig): void {
    this.receiver(JSON.stringify({ m: 'config', args: config }));
  }
}

export class ApplicationEventListenerReceiver {
  receiver: ApplicationEventListener;

  constructor(receiver: ApplicationEventListener) {
    this.receiver = receiver;
  }

  receive(json: string): void {
    const obj = JSON.parse(json);
    if (obj.m === 'config') {
      this.receiver.onViewContentConfigChanged(obj.args);
    }
  }
}
