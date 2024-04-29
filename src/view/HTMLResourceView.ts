import * as vscode from 'vscode';

// TODO: Remove ViewInterface
export class HTMLResourceView implements vscode.WebviewViewProvider {
  private html_: string = '';
  private postMessageHandler_?: (a: any) => void;
  private receiveMessageHandler_: (a: any) => void;

  constructor(html: string, receiveMessageHandler: (a: any) => void) {
    this.html_ = html;
    this.receiveMessageHandler_ = receiveMessageHandler;
  }

  getWebviewViewProvider(): vscode.WebviewViewProvider {
    return this;
  }

  postMessage(a: any): void {
    this.postMessageHandler_?.(a);
  }

  // override
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    con: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    const w = webviewView.webview;
    w.options = { enableScripts: true };
    w.html = this.html_;
    w.onDidReceiveMessage((a) => {
      this.receiveMessageHandler_?.(a);
    });
    this.postMessageHandler_ = (msg: any) => w.postMessage(msg);
  }
}
