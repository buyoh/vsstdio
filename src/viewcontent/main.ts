// import { CommandQuery, CommandResponce } from '../common/Command';
import { ApplicationQueryTransmitter, ApplicationResponce, ApplicationResponceReceiver } from '../common/Command';
import { DocumentElement } from './DocumentElement';
import { VscodeMessager } from './VscodeMessager';

let gQueryCount = 0;

const gAqt = new ApplicationQueryTransmitter((json) => VscodeMessager.postMessage(json));

function provideNewTestId() {
  gQueryCount += 1;
  return '' + gQueryCount;
}

let gCurrentTestId = 'none';

function handleRunBuildTests() {
  const testStdins = DocumentElement.getAllTestStdinValue();
  const buildCmd = DocumentElement.getCommandValue('build');
  const testCmd = DocumentElement.getCommandValue('test');
  if (buildCmd === '' || testCmd === '') {
    return;
  }
  const id = provideNewTestId();
  gCurrentTestId = id;
  gAqt.run(id, { cmd: buildCmd }, Object.entries(testStdins).map((kv) => ({
    testId: kv[0],
    cmd: testCmd,
    stdin: kv[1],
  })),
  );

  // const msg: CommandQuery = {
  //   method: 'run',
  //   id,
  //   build: { cmd: buildCmd },
  //   tests: Object.entries(testStdins).map((kv) => ({
  //     testId: kv[0],
  //     cmd: testCmd,
  //     stdin: kv[1],
  //   })),
  // };
  // VscodeMessager.postMessage(msg);
}

function handleRunTests() {
  const testStdins = DocumentElement.getAllTestStdinValue();
  const testCmd = DocumentElement.getCommandValue('test');
  if (testCmd === '') {
    return;
  }
  const id = provideNewTestId();
  gCurrentTestId = id;
  gAqt.run(id, null, Object.entries(testStdins).map((kv) => ({
    testId: kv[0],
    cmd: testCmd,
    stdin: kv[1],
  })),
  );
  // const msg: CommandQuery = {
  //   method: 'run',
  //   id,
  //   build: null,
  //   tests: Object.entries(testStdins).map((kv) => ({
  //     testId: kv[0],
  //     cmd: testCmd,
  //     stdin: kv[1],
  //   })),
  // };
  // console.log(msg);
  // VscodeMessager.postMessage(msg);
}

function handleKill() {
  gAqt.kill(gCurrentTestId);
  // const msg: CommandQuery = { method: 'kill', id: gCurrentTestId };
  // VscodeMessager.postMessage(msg);
}

function handleOnError(id: string, detail: string) {
  // note: If i want to display an error to dialog, the error should be
  // sent to vscode side, but the error is came from vscode side...
  console.error('receive internal error', detail);
}

function handleOnComplete(
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

// function onReceiveMessage(data: CommandResponce) {
//   if (data.result === 'error') {
//     // note: If i want to display an error to dialog, the error should be
//     // sent to vscode side, but the error is came from vscode side...
//     console.error('receive internal error', data.detail);
//   } else if (data.result === 'complete') {
//     if (data.phase === 'build') {
//       DocumentElement.setBuildResultValue(
//         data.code as any,
//         data.stdout,
//         data.stderr
//       );
//     } else if (data.phase === 'tests') {
//       DocumentElement.setTestResultValue(
//         data.testId,
//         data.code as any,
//         data.stdout,
//         data.stderr
//       );
//     }
//   }
// }

// TODO: Refactoring?
class ApplicationResponceStub implements ApplicationResponce {
  errorFunc: (id: string, detail: string) => void;
  completeFunc: (
    id: string,
    phase: 'build' | 'tests',
    testId: string,
    stdout: string,
    stderr: string,
    code: number
  ) => void;

  constructor(errorFunc: (id: string, detail: string) => void, completeFunc: (
    id: string,
    phase: 'build' | 'tests',
    testId: string,
    stdout: string,
    stderr: string,
    code: number
  ) => void) {
    this.errorFunc = errorFunc;
    this.completeFunc = completeFunc;
  }

  error(id: string, detail: string): void {
    this.errorFunc(id, detail);
  }

  complete(
    id: string,
    phase: 'build' | 'tests',
    testId: string,
    stdout: string,
    stderr: string,
    code: number
  ): void {
    this.completeFunc(id, phase, testId, stdout, stderr, code);
  }
}

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
  DocumentElement.setButtonEventHandler({
    runBuildTest: handleRunBuildTests,
    runTest: handleRunTests,
    kill: handleKill,
  });

  const listener = new ApplicationResponceStub(
    (id, detail) => {
      handleOnError(id, detail);
    },
    (id, phase, testId, stdout, stderr, code) => {
      handleOnComplete(id, phase, testId, stdout, stderr, code);
    }
  );

  const receiver = new ApplicationResponceReceiver(listener);
  VscodeMessager.addMessageListener((data) => receiver.receive(data));
});
