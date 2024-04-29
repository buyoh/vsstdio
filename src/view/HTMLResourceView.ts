import * as vscode from 'vscode';

// TODO: Remove ViewInterface
export class HTMLResourceView implements vscode.WebviewViewProvider {
  private html: string = '';
  private postMessageHandler?: (a: any) => void;
  private receiveMessageHandler: (a: any) => void;

  constructor(html: string, receiveMessageHandler: (a: any) => void) {
    this.html = html;
    this.receiveMessageHandler = receiveMessageHandler;
  }

  getWebviewViewProvider(): vscode.WebviewViewProvider {
    return this;
  }

  postMessage(a: any): void {
    this.postMessageHandler?.(a);
  }

  // override
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    con: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    const w = webviewView.webview;
    w.options = { enableScripts: true };
    w.html = this.html;
    w.onDidReceiveMessage((a) => {
      this.receiveMessageHandler?.(a);
    });
    this.postMessageHandler = (msg: any) => w.postMessage(msg);
  }
}
