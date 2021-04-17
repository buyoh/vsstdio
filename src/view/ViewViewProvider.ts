import * as vscode from 'vscode';
import { HTMLResourceView } from './HTMLResourceView';

export class ViewViewProvider implements vscode.WebviewViewProvider {
  private view: HTMLResourceView;

  constructor(view: HTMLResourceView) {
    this.view = view;
  }

  // override
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    con: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    webviewView.webview.options = { enableScripts: true };
    this.view.applyToWebview(webviewView.webview, (msg: any) => {
      return webviewView.webview.postMessage(msg);
    });
  }
}
