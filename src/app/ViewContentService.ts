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
  ApplicationRemote,
  ApplicationRemoteReceiver,
  ApplicationResponceTransmitter,
  ApplicationEventListenerTransmitter,
} from '../common/Command';
import { WorkspaceConfigRepository } from './WorkspaceConfigRepository';

// ------------------------------------

class ViewContentServiceImpl implements ViewContentService, ViewContentHandler, ApplicationRemote {
  private htmlResourceView: HTMLResourceView;
  private backendHandler?: BackendHandler;
  private workspaceConfigRepository: WorkspaceConfigRepository;

  private applicationRemoteReceiver: ApplicationRemoteReceiver;
  private applicationEventListenerTransmitter: ApplicationEventListenerTransmitter;

  private applicationQueryReceiver?: ApplicationQueryReceiver;


  constructor(
    html: string,
    workspaceConfigRepository: WorkspaceConfigRepository
  ) {
    this.htmlResourceView = new HTMLResourceView(
      html,
      this.processMessage.bind(this)
    );

    this.applicationEventListenerTransmitter =
      new ApplicationEventListenerTransmitter((json) =>
        this.postMessage({ type: 'ApplicationEventListener', json })
      );
    this.applicationRemoteReceiver = new ApplicationRemoteReceiver(this);
  
    this.workspaceConfigRepository = workspaceConfigRepository;

    workspaceConfigRepository.addEventListenerDidChangeConfig(async () => {
      this.requestViewContentConfig();
    });
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
      (json) => this.postMessage({ type: 'ApplicationResponce', json })
    );

    this.applicationQueryReceiver = applicationQueryReceiver;
    return applicationResponceTransmitter;
  }

  // ApplicationRemote
  requestViewContentConfig(): void {
    // Transfer the current configuration to the view
    (async () => {
      const config = await this.workspaceConfigRepository.getWorkspaceConfig();
      this.applicationEventListenerTransmitter.onViewContentConfigChanged(
        config.defaultValues
      );
    })();
  }

  getWebviewViewProvider(): vscode.WebviewViewProvider {
    return this.htmlResourceView;
  }

  private processMessage(query: any) {
    // Receive a message from the view
    // console.log('RX', query);
    if (query.type === 'ApplicationQuery') {
      if (!this.applicationQueryReceiver) {
        // vscode.window.showErrorMessage('internal error: backend handler is not set');
        return;
      }
      this.applicationQueryReceiver.receive(query.json);
    } else if (query.type === 'ApplicationRemote') {
      this.applicationRemoteReceiver.receive(query.json);
    }
  }

  private postMessage(a: any): void {
    console.log('TX', a);
    this.htmlResourceView.postMessage(a);
  }
}

// ------------------------------------

export async function createViewContentService(
  context: vscode.ExtensionContext,
  workspaceConfigRepository: WorkspaceConfigRepository
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

  const service = new ViewContentServiceImpl(html, workspaceConfigRepository);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'vsstdio.commandPanelView',
      service.getWebviewViewProvider()
    )
  );

  return service;
}
