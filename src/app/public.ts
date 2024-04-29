import { ApplicationQuery, ApplicationResponce } from "../common/Command";

export interface ViewContentService {
  getViewContentHandler(): ViewContentHandler;
  setBackendHandler(handler: BackendHandler): void;
}

export interface BackendService {
  getBackendHandler(): BackendHandler;
  setViewContentHandler(handler: ViewContentHandler): void;
}

export interface ViewContentHandler {
  // TODO: この API を使うのは Backend ではなく main でやったほうが良さげ
  bindApplication(query: ApplicationQuery): ApplicationResponce;
}

export interface BackendHandler {
  //
}
