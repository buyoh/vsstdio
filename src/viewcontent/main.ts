import {
  ApplicationQueryTransmitter,
  ApplicationResponce,
  ApplicationResponceReceiver,
  ViewContentConfig,
  ApplicationEventListener,
  ApplicationEventListenerReceiver,
  ApplicationRemoteTransmitter,
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

class ApplicationEventListenerWrapper implements ApplicationEventListener {
  onViewContentConfigChanged(config: ViewContentConfig): void {
    DocumentElement.setDataList(config.commandPanel);
  }
}

// ------------------------------------

class ViewContentMain {
  testIdGenerator: IdGenerator;
  aqt: ApplicationQueryTransmitter;
  art: ApplicationRemoteTransmitter;
  currentTestId: string;

  constructor() {
    this.testIdGenerator = new IdGenerator();
    this.aqt = new ApplicationQueryTransmitter((json) =>
      VscodeMessager.postMessage({type: 'ApplicationQuery', json})
    );
    this.art = new ApplicationRemoteTransmitter((json) =>
      VscodeMessager.postMessage({type: 'ApplicationRemote', json})
    );

    this.currentTestId = 'none';
  }

  doneSetup() {
    // Send request to backend for loading configuration
    this.art.requestViewContentConfig();
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
  const eventListener = new ApplicationEventListenerReceiver(new ApplicationEventListenerWrapper());
  VscodeMessager.addMessageListener((data) => {
    if (data.type === 'ApplicationResponce') {
      receiver.receive(data.json);
    } else if (data.type === 'ApplicationEventListener') {
      eventListener.receive(data.json);
    }
  });

  main.doneSetup();
});
