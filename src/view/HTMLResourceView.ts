import * as vscode from 'vscode';
import { ViewInterface } from '../common/ViewInterface';

// TODO: Remove ViewInterface
export class HTMLResourceView implements ViewInterface, vscode.WebviewViewProvider {
  private html_: string = '';
  private postMessageHandler_?: (a: any) => void;
  private receiveMessageHandler_?: (a: any) => void;

  constructor(html: string) {
    this.html_ = html;
  }

  getWebviewViewProvider(): vscode.WebviewViewProvider {
    return this;
  }

  // override: ViewInterface
  // TODO: Remove this, and add args into ctor regarding handler.
  onReceiveMessage(handler: (a: any) => void) {
    this.receiveMessageHandler_ = handler;
  }

  // override: ViewInterface
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
