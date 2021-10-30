export namespace VscodeMessager {
  let gVscode = undefined as any;

  function getVscode(): any {
    if (gVscode !== undefined) {
      return gVscode;
    }
    try {
      gVscode = (window as any).acquireVsCodeApi();
    } catch {
      gVscode = null;
    }
    if (!gVscode) {
      console.error(
        'window.acquireVsCodeApi is wrong! Are we really in vscode webview?'
      );
    }
    return gVscode;
  }

  export function postMessage(o: object) {
    const vscode = getVscode();
    vscode.postMessage(o);
  }

  export function addMessageListener(cb: (o: object) => void) {
    window.addEventListener('message', (event) => {
      cb(event.data);
    });
  }
}
