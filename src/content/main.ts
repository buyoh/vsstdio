import { CommandQuery, CommandResponce } from '../app/Command';
import { DocumentElement } from './DocumentElement';
import { VscodeMessager } from './VscodeMessager';

let gQueryCount = 0;

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
  const msg: CommandQuery = {
    method: 'run',
    id,
    build: { cmd: buildCmd },
    tests: Object.entries(testStdins).map((kv) => ({
      testId: kv[0],
      cmd: testCmd,
      stdin: kv[1],
    })),
  };
  VscodeMessager.postMessage(msg);
}

function handleRunTests() {
  const testStdins = DocumentElement.getAllTestStdinValue();
  const testCmd = DocumentElement.getCommandValue('test');
  if (testCmd === '') {
    return;
  }
  const id = provideNewTestId();
  gCurrentTestId = id;
  const msg: CommandQuery = {
    method: 'run',
    id,
    build: null,
    tests: Object.entries(testStdins).map((kv) => ({
      testId: kv[0],
      cmd: testCmd,
      stdin: kv[1],
    })),
  };
  console.log(msg);
  VscodeMessager.postMessage(msg);
}

function handleKill() {
  const msg: CommandQuery = { method: 'kill', id: gCurrentTestId };
  VscodeMessager.postMessage(msg);
}

function onReceiveMessage(data: CommandResponce) {
  if (data.result === 'error') {
    // note: If i want to display an error to dialog, the error should be
    // sent to vscode side, but the error is came from vscode side...
    console.error('receive internal error', data.detail);
  } else if (data.result === 'complete') {
    if (data.phase === 'build') {
      DocumentElement.setBuildResultValue(
        data.code as any,
        data.stdout,
        data.stderr
      );
    } else if (data.phase === 'tests') {
      DocumentElement.setTestResultValue(
        data.testId,
        data.code as any,
        data.stdout,
        data.stderr
      );
    }
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
  VscodeMessager.addMessageListener(onReceiveMessage);
});
