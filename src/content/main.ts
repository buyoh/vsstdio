import { CommandQuery, CommandResponce } from '../app/Command';
import { DocumentElement } from './DocumentElement';
import { VscodeMessager } from './VscodeMessager';

let queryCount = 0;

function handleRunBuildTests() {
  const testStdin = DocumentElement.getTestStdinValue();
  const buildCmd = DocumentElement.getCommandValue('build');
  const testCmd = DocumentElement.getCommandValue('test');
  if (buildCmd === '' || testCmd === '') {
    return;
  }
  queryCount += 1;
  const msg: CommandQuery = {
    method: 'run',
    id: queryCount,
    build: { cmd: buildCmd },
    tests: [{ cmd: testCmd, stdin: testStdin }],
  };
  VscodeMessager.postMessage(msg);
}

function handleRunTests() {
  // TODO!
}

function handleKill() {
  const msg: CommandQuery = { method: 'kill', id: queryCount };
  VscodeMessager.postMessage(msg);
}

function onReceiveMessage(data: CommandResponce) {
  if (data.result === 'error') {
    DocumentElement.setTestResultValue('[internal error]', '', '');
  } else if (data.result === 'complete') {
    if (data.phase === 'build') {
      DocumentElement.setBuildResultValue(
        data.code as any,
        data.stdout,
        data.stderr
      );
    } else if (data.phase === 'tests') {
      DocumentElement.setTestResultValue(
        data.code as any,
        data.stdout,
        data.stderr
      );
    }
  }
}

DocumentElement.start(() => {
  DocumentElement.setButtonEventHandler({
    runBuildTest: handleRunBuildTests,
    runTest: handleRunTests,
    kill: handleKill,
  });
  VscodeMessager.addMessageListener(onReceiveMessage);
});
