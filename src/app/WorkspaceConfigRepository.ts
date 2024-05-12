import * as vscode from 'vscode';

interface WorkspaceConfig {
  defaultValues: {  // TODO: rename
    commandPanel: {
      buildCommand: string;
      testCommand: string;
    };
  }
}

// ------------------------------------

export interface WorkspaceConfigRepository {
  getWorkspaceConfig(): Promise<WorkspaceConfig>;
  addEventListenerDidChangeConfig(cb: () => void): void;
}

// ------------------------------------

function collectConfigFromWorkspace() {
  const config = vscode.workspace.getConfiguration('vsstdio');
  return {
    // TODO: multiple
    commandPanel: {
      buildCommand: '' + config.get('commandPanel.buildCommand'),
      testCommand: '' + config.get('commandPanel.runCommand'),
    },
  };
}

class WorkspaceConfigRepositoryImpl implements WorkspaceConfigRepository {
  callbacksOnDidChangeConfig: (() => void)[] = [];

  constructor() {
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('vsstdio')) {
        this.callbacksOnDidChangeConfig.forEach((cb) => cb());
      }
    });
  }

  async getWorkspaceConfig(): Promise<WorkspaceConfig> {
    const config = collectConfigFromWorkspace();
    return {
      defaultValues: {...config },
    };
  }

  addEventListenerDidChangeConfig(cb: () => void): void {
    this.callbacksOnDidChangeConfig.push(cb);
  }
}

// ------------------------------------

export async function createWorkspaceConfigRepository(): Promise<WorkspaceConfigRepository> {
  return new WorkspaceConfigRepositoryImpl();
}
