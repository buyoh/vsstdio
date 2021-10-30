export interface ViewInterface {
  onReceiveMessage(handler: (a: any) => void): void;
  postMessage(a: any): void;
}
