export interface CommandQueryRun {
  method: 'run';
  id: number;
  cmd: string;
  stdin: string;
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
  stdout: string;
  stderr: string;
  code: number;
}

export type CommandResponce = CommandResponceError | CommandResponceComplete;
