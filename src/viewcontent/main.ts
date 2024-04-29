import {
  ApplicationQueryTransmitter,
  ApplicationResponce,
  ApplicationResponceReceiver,
} from '../common/Command';
import { DocumentElement } from './DocumentElement';
import { VscodeMessager } from './VscodeMessager';

// ------------------------------------

class IdGenerator {
  private count: number;

  constructor() {
    this.count = 0;
  }

  next(): string {
    this.count += 1;
    return '' + this.count;
  }
}

class ApplicationResponceWrapper implements ApplicationResponce {
  main: ViewContentMain;

  constructor(    main: ViewContentMain  ) {
    this.main = main;
  }

  error(id: string, detail: string): void {
    this.main.handleOnError(id, detail);
  }

  complete(
    id: string,
    phase: 'build' | 'tests',
    testId: string,
    stdout: string,
    stderr: string,
    code: number
  ): void {
    this.main.handleOnComplete(id, phase, testId, stdout, stderr, code);
  }
}

// ------------------------------------

class ViewContentMain {
  testIdGenerator: IdGenerator;
  aqt: ApplicationQueryTransmitter;
  currentTestId: string;

  constructor() {
    this.testIdGenerator = new IdGenerator();
    this.aqt = new ApplicationQueryTransmitter((json) =>
      VscodeMessager.postMessage(json)
    );
    this.currentTestId = 'none';
  }

  // Button events
  handleRunBuildTests() {
    const testStdins = DocumentElement.getAllTestStdinValue();
    const buildCmd = DocumentElement.getCommandValue('build');
    const testCmd = DocumentElement.getCommandValue('test');
    if (buildCmd === '' || testCmd === '') {
      return;
    }
    const id = this.testIdGenerator.next();
    this.currentTestId = id;
    this.aqt.run(
      id,
      { cmd: buildCmd },
      Object.entries(testStdins).map((kv) => ({
        testId: kv[0],
        cmd: testCmd,
        stdin: kv[1],
      }))
    );
  }
  
  // Button events
  handleRunTests() {
    const testStdins = DocumentElement.getAllTestStdinValue();
    const testCmd = DocumentElement.getCommandValue('test');
    if (testCmd === '') {
      return;
    }
    const id = this.testIdGenerator.next();
    this.currentTestId = id;
    this.aqt.run(
      id,
      null,
      Object.entries(testStdins).map((kv) => ({
        testId: kv[0],
        cmd: testCmd,
        stdin: kv[1],
      }))
    );
  }
  
  // Button events
  handleKill() {
    this.aqt.kill(this.currentTestId);
  }
  
  // Responce from backend
  handleOnError(id: string, detail: string) {
    // note: If i want to display an error to dialog, the error should be
    // sent to vscode side, but the error is came from vscode side...
    console.error('receive internal error', detail);
  }
  
  // Responce from backend
  handleOnComplete(
    id: string,
    phase: 'build' | 'tests',
    testId: string,
    stdout: string,
    stderr: string,
    code: number
  ) {
    if (phase === 'build') {
      DocumentElement.setBuildResultValue('' + code, stdout, stderr);
    } else if (phase === 'tests') {
      DocumentElement.setTestResultValue(testId, '' + code, stdout, stderr);
    }
  }
}

// ------------------------------------

DocumentElement.start(() => {
  DocumentElement.enableRetainValue(
    (id, val) => {
      let state = VscodeMessager.getState();
      if (!state) {
        state = {};
      }
      state[`store-dom-${id}`] = val;
      VscodeMessager.setState(state);
    },
    (id) => {
      let state = VscodeMessager.getState();
      if (!state) {
        return '';
      }
      return state[`store-dom-${id}`] || '';
    }
  );

  const main = new ViewContentMain();

  DocumentElement.setButtonEventHandler({
    runBuildTest: main.handleRunBuildTests.bind(main),
    runTest: main.handleRunTests.bind(main),
    kill: main.handleKill.bind(main),
  });

  const receiver = new ApplicationResponceReceiver(new ApplicationResponceWrapper(main));
  VscodeMessager.addMessageListener((data) => receiver.receive(data));
});
