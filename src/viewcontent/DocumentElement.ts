// HTML の要素を操作する関数を提供するモジュール
export namespace DocumentElement {
  interface ButtonEventHandler {
    runBuildTest: () => void;
    runTest: () => void;
    kill: () => void;
  }

  function prepare() {
    addTestDom();
    document
      .getElementById('btn-add-test')
      ?.addEventListener('click', () => addTestDom());
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

  export function setDataList(commandPanel: { buildCommand: string, testCommand: string }): void {
    const ebuild = document.getElementById('build-command-list') as HTMLDataListElement; // force unwrap null
    const etest = document.getElementById('test-command-list') as HTMLDataListElement; // force unwrap null

    ebuild.innerHTML = '';
    ebuild.appendChild(new Option(commandPanel.buildCommand, commandPanel.buildCommand));
    etest.innerHTML = '';
    etest.appendChild(new Option(commandPanel.testCommand, commandPanel.testCommand));
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

  export function getAllTestStdinValue(): { [testId: string]: string } {
    return Object.fromEntries(
      Object.entries(getAllTestDom()).map((kv) => [
        kv[0],
        kv[1].stdin.value || '',
      ])
    );
  }

  export function setTestResultValue(
    testId: string,
    code: string,
    out: string,
    err: string
  ): void {
    // ignore overhead?
    const dom = getAllTestDom()[testId];
    if (!dom) {
      return;
    }
    dom.resultcode.value = code;
    dom.stdout.value = out;
    dom.stderr.value = err;
  }

  export function addTestDom() {
    const listDom = document.getElementById('tests');
    const tmplblock = document.getElementById(
      'tmpl-test'
    ) as HTMLTemplateElement | null;
    if (!listDom || !tmplblock) {
      console.error('addTestDom: internal error');
      return;
    }
    const tmpl = document.importNode(tmplblock.content, true);

    const testId = listDom.dataset.nextTestId
      ? parseInt(listDom.dataset.nextTestId)
      : 0;
    listDom.dataset.nextTestId = '' + (testId + 1);

    const node = tmpl.cloneNode(true) as DocumentFragment;
    const dataElem = node.querySelector('._testElem') as HTMLElement | null;
    if (!dataElem) {
      console.error('addTestDom: internal error');
      return;
    }
    dataElem.dataset.testId = '' + testId;
    // appendChild は追加した Node を返す。
    // ただし、DocumentFragment を指定すると空の DocumentFragment が返る。
    // DocumentFragment からデータを取り出して Node に追加するので、
    // 指定した、DocumentFragment は空になる。appendChild は、
    // 指定された引数をただ返しているだけのように見える。
    // 追加した Node が欲しい場合は、以下のように dom から取得しなければならない。
    listDom.appendChild(node);
    const appendedElem = listDom.children.item(
      listDom.children.length - 1
    ) as Element;
    appendedElem.querySelector('._btnRemove')?.addEventListener('click', () => {
      appendedElem.remove();
    });
  }

  function getTestDomFromElem(elem: HTMLElement) {
    // force unwrap null
    const stdin = elem.querySelector('._stdin') as HTMLTextAreaElement;
    const stdout = elem.querySelector('._stdout') as HTMLTextAreaElement;
    const stderr = document.querySelector('._stderr') as HTMLTextAreaElement;
    const resultcode = document.querySelector(
      '._resultcode'
    ) as HTMLOutputElement;
    return {
      stdin,
      stdout,
      stderr,
      resultcode,
    };
  }

  // function getTestDom(testId: number) {
  //   const elem = document.querySelector(
  //     `#tests > ._testElem[data-testId='${testId}']`
  //   );
  //   return elem ? getTestDomFromElem(elem as HTMLElement) : null;
  // }

  function getAllTestDom() {
    const listDom = document.querySelectorAll('#tests ._testElem');
    const table = {} as {
      [key: string]: {
        stdin: HTMLTextAreaElement;
        stdout: HTMLTextAreaElement;
        stderr: HTMLTextAreaElement;
        resultcode: HTMLOutputElement;
      };
    };
    listDom.forEach((elem) => {
      const testId = (elem as HTMLElement).dataset.testId;
      if (testId === undefined) {
        return;
      }
      table[testId] = getTestDomFromElem(elem as HTMLElement);
    });
    return table;
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
