export interface CommandQueryRun {
  method: 'run';
  id: string;
  // cmd: string;
  // stdin: string;
  build: {
    cmd: string;
  } | null;
  tests: Array<{ testId: string; cmd: string; stdin: string }>;
}

export interface CommandQueryKill {
  method: 'kill';
  id: string;
}

export type CommandQuery = CommandQueryRun | CommandQueryKill;

export interface CommandResponceError {
  result: 'error';
  id: string;
  detail: string;
}

export interface CommandResponceComplete {
  result: 'complete';
  id: string;
  phase: 'build' | 'tests';
  testId: string;
  stdout: string;
  stderr: string;
  code: number;
}

export type CommandResponce = CommandResponceError | CommandResponceComplete;
