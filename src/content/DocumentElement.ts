export namespace DocumentElement {
  interface ButtonEventHandler {
    runBuildTest: () => void;
    runTest: () => void;
    kill: () => void;
  }

  function prepare() {
    //
  }

  export function setButtonEventHandler(handlers: ButtonEventHandler): void {
    document
      .getElementById('btn-run-build-test')
      ?.addEventListener('click', handlers.runBuildTest);
    document
      .getElementById('btn-run-test')
      ?.addEventListener('click', handlers.runTest);
    document
      .getElementById('btn-kill')
      ?.addEventListener('click', handlers.kill);
  }

  export function getCommandValue(id: 'build' | 'test'): string {
    const e = document.getElementById(id + '-command') as HTMLInputElement; // force unwrap null
    return e.value || '';
  }

  export function setBuildResultValue(
    code: string,
    out: string,
    err: string
  ): void {
    const eout = document.getElementById('build-stdout') as HTMLTextAreaElement; // force unwrap null
    const eerr = document.getElementById('build-stderr') as HTMLTextAreaElement; // force unwrap null
    const ecode = document.getElementById(
      'build-resultcode'
    ) as HTMLOutputElement; // force unwrap null
    eout.value = out;
    eerr.value = err;
    ecode.value = code;
  }

  export function getTestStdinValue(): string {
    const e = document.getElementById('stdin') as HTMLTextAreaElement; // force unwrap null
    return e.value || '';
  }

  export function setTestResultValue(
    code: string,
    out: string,
    err: string
  ): void {
    const eout = document.getElementById('stdout') as HTMLTextAreaElement; // force unwrap null
    const eerr = document.getElementById('stderr') as HTMLTextAreaElement; // force unwrap null
    const ecode = document.getElementById('resultcode') as HTMLOutputElement; // force unwrap null
    eout.value = out;
    eerr.value = err;
    ecode.value = code;
  }

  export function enableRetainValue(
    store: (id: string, val: string) => void,
    load: (id: string) => string
  ): void {
    const ids = ['build-command', 'test-command'];
    for (const id of ids) {
      const dom = document.getElementById(id) as HTMLInputElement;
      if (!dom) {
        continue;
      }
      dom.value = load(id);
      dom.addEventListener('change', () => {
        store(id, dom.value);
      });
    }
  }

  export function start(cb: Function) {
    document.addEventListener('DOMContentLoaded', () => {
      prepare();
      cb();
    });
  }
}
