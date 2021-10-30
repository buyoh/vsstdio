import { CommandQuery, CommandResponce } from '../app/Command';
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
  const msg: CommandQuery = { method: 'run', id: cmdCount, cmd, stdin };
  VscodeMessager.postMessage(msg);
}

function handleKill() {
  const msg: CommandQuery = { method: 'kill', id: cmdCount };
  VscodeMessager.postMessage(msg);
}

function onReceiveMessage(data: CommandResponce) {
  if (data.result === 'error') {
    DocumentElement.setTestResultValue('[internal error]', '', '');
  } else if (data.result === 'complete') {
    DocumentElement.setTestResultValue(
      data.code as any,
      data.stdout,
      data.stderr
    );
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
