import { DocumentElement } from './DocumentElement';
import { VscodeMessager } from './VscodeMessager';

let cmdCount = 0;

function handleRun() {
  const stdin = DocumentElement.getTestStdinValue();
  const cmd = DocumentElement.getCommandValue('test');
  if (cmd === '') {
    return;
  }
  cmdCount += 1;
  VscodeMessager.postMessage({ method: 'run', id: cmdCount, cmd, stdin });
}

function handleKill() {
  VscodeMessager.postMessage({ method: 'kill', id: cmdCount });
}

function onReceiveMessage(data: any) {
  if (data.result === 'error') {
    DocumentElement.setTestResultValue('[internal error]', '', '');
  } else if (data.result === 'complete') {
    DocumentElement.setTestResultValue(data.code, data.stdout, data.stderr);
  }
}

DocumentElement.start(() => {
  DocumentElement.setButtonEventHandler({
    runBuildTest: handleRun,
    runTest: handleRun,
    kill: handleKill,
  });
  VscodeMessager.addMessageListener(onReceiveMessage);
});
