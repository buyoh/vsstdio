import * as vscode from 'vscode';
import { ViewInterface } from '../common/ViewInterface';

export class HTMLResourceView implements ViewInterface {
  private html_: string = '';
  private postMessageHandler_?: (a: any) => void;
  private receiveMessageHandler_?: (a: any) => void;

  constructor(html: string) {
    this.html_ = html;
  }

  onReceiveMessage(handler: (a: any) => void) {
    this.receiveMessageHandler_ = handler;
  }

  postMessage(a: any): void {
    this.postMessageHandler_?.(a);
  }

  applyToWebview(
    webview: vscode.Webview,
    postMessageHandler: (message: any) => Thenable<boolean>
  ): void {
    // https://code.visualstudio.com/api/extension-guides/webview#getstate-and-setstate
    // retainContextWhenHidden?
    webview.html = this.html_;
    webview.onDidReceiveMessage((a) => {
      this.receiveMessageHandler_?.(a);
    });
    this.postMessageHandler_ = postMessageHandler;
  }
}
