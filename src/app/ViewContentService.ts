import * as vscode from 'vscode';
import * as _FS from 'fs';
const FS = _FS.promises;

import { HTMLResourceView } from '../view/HTMLResourceView';
import {
  BackendHandler,
  ViewContentHandler,
  ViewContentService,
} from './public';
import {
  ApplicationQuery,
  ApplicationResponce,
  ApplicationQueryReceiver,
  ApplicationResponceTransmitter,
} from '../common/Command';

// ------------------------------------

class ViewContentServiceImpl implements ViewContentService, ViewContentHandler {
  private htmlResourceView: HTMLResourceView;
  private backendHandler?: BackendHandler;

  private applicationQueryReceiver?: ApplicationQueryReceiver;

  constructor(html: string) {
    this.htmlResourceView = new HTMLResourceView(
      html,
      this.processMessage.bind(this)
    );
  }

  // ViewContentService
  getViewContentHandler(): ViewContentHandler {
    return this;
  }

  // ViewContentService
  setBackendHandler(handler: BackendHandler): void {
    this.backendHandler = handler;
  }

  // ViewContentHandler
  bindApplication(query: ApplicationQuery): ApplicationResponce {
    const applicationQueryReceiver = new ApplicationQueryReceiver(query);
    const applicationResponceTransmitter = new ApplicationResponceTransmitter(
      this.postMessage.bind(this)
    );

    this.applicationQueryReceiver = applicationQueryReceiver;
    return applicationResponceTransmitter;
  }

  getWebviewViewProvider(): vscode.WebviewViewProvider {
    return this.htmlResourceView;
  }

  private processMessage(query: any) {
    // console.log('RX', query);
    if (!this.applicationQueryReceiver) {
      // vscode.window.showErrorMessage('internal error: backend handler is not set');
      return;
    }
    this.applicationQueryReceiver.receive(query);
  }

  private postMessage(a: any): void {
    this.htmlResourceView.postMessage(a);
  }
}

// ------------------------------------

export async function createViewContentService(
  context: vscode.ExtensionContext
) {
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

  const service = new ViewContentServiceImpl(html);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'vsstdio.commandPanelView',
      service.getWebviewViewProvider()
    )
  );

  return service;
}
