export interface CommandQueryRun {
  method: 'run';
  id: number;
  // cmd: string;
  // stdin: string;
  build: {
    cmd: string;
  };
  tests: Array<{ cmd: string; stdin: string }>;
}

export interface CommandQueryKill {
  method: 'kill';
  id: number;
}

export type CommandQuery = CommandQueryRun | CommandQueryKill;

export interface CommandResponceError {
  result: 'error';
  id: number;
  detail: string;
}

export interface CommandResponceComplete {
  result: 'complete';
  id: number;
  phase: 'build' | 'tests';
  testIndex: number;
  stdout: string;
  stderr: string;
  code: number;
}

export type CommandResponce = CommandResponceError | CommandResponceComplete;
