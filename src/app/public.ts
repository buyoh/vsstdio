
export interface ViewContentService {
  getViewContentHandler(): ViewContentHandler;
  setBackendHandler(handler: BackendHandler): void;
}

export interface BackendService {
  getBackendHandler(): BackendHandler;
  setViewContentHandler(handler: ViewContentHandler): void;
}

export interface ViewContentHandler {
  // TODO: replace to meanful APIs
  postMessage(a: any): void;
}

export interface BackendHandler {
  // TODO: replace to meanful APIs such as processRun, processKill
  processMessage(a: any): void;
}
