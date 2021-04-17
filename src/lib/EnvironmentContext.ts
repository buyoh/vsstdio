import * as vscode from 'vscode';

export class EnvironmentContext {
  constructor() {}

  getWorkspace() {
    if (!vscode.workspace.workspaceFolders) {
      return undefined;
    }
    for (const f of vscode.workspace.workspaceFolders) {
      if (f.uri.scheme === 'file') {
        return f.uri.path;
      }
    }
    return undefined;
  }
}
