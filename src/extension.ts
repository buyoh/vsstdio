// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { HTMLResourceView } from './view/HTMLResourceView';
// import { ViewViewProvider } from './view/ViewViewProvider';
import * as _FS from 'fs';
import { RunnerManager } from './lib/RunnerManager';
import { EnvironmentContext } from './lib/EnvironmentContext';
import { createBackendService } from './app/BackendService';
import { createViewContentService } from './app/ViewContentService';
const FS = _FS.promises;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vsstdio" is now active!');

  const htmlOriginal = (
    await FS.readFile(
      context.asAbsolutePath('./resources/html/command_panel_view.html')
    )
  ).toString();

  const js = (
    await FS.readFile(context.asAbsolutePath('./dist/content.js'))
  ).toString();

  const html = htmlOriginal.replace(
    '<script src="content.js"></script>',
    `<script>\n${js}\n</script>`
  );

  const [backendService, viewContentService] = await Promise.all([
    createBackendService(context, new EnvironmentContext()),
    createViewContentService(context),
  ]);

  backendService.setViewContentHandler(viewContentService.getViewContentHandler());
  viewContentService.setBackendHandler(backendService.getBackendHandler());

}

// this method is called when your extension is deactivated
export function deactivate() {}
