import assert from 'node:assert/strict';
import { PC_SIZES, settled, start, terminal } from './haunt-helpers.mjs';
// TERMINAL's console (.kiro/specs/os-case-v4 R3): a working prompt with history, local game commands only,
// case-aware answers, signals to the current run only, `open` and `finish`.

const { browser, outcomes, open, finish } = await start('process-console');
try {
  const p = await open({ viewport: PC_SIZES[1] });
  const t = terminal(p);
  await t.command('help');
  assert.match(await t.lines(16), /finish\s+accept the receipt[\s\S]*open echo\|canvas\|postman/);
  await t.command('format c:');
  assert.match(await t.lines(1), /Unsupported command/);
  await t.command('ps; ls');
  assert.match(await t.lines(1), /One game command at a time/);
  outcomes.push('help lists the v4 commands (finish, open echo|canvas|postman); unknown input and shell syntax are refused in plain words.');

  await t.command('ps');
  assert.match(await t.lines(6), /3087\s+repeating\s+last\.session/);
  await t.command('kill 9999');
  assert.match(await t.lines(1), /No process 9999/);
  await t.command('kill echo.link');
  assert.match(await t.lines(1), /read-only view/);
  await t.command('kill -TERM 3087');
  assert.match(await t.lines(3), /Stopping the run did not stop the call/);
  assert.equal(await p.locator('.job-bell-count').textContent(), '1', 'a signal with the call on is one more return');
  await t.command('kill 3087');
  assert.match(await t.lines(1), /earlier minute/);
  outcomes.push('ps shows the current run (PID 3087); signals to unknown PIDs or ECHO’s view are refused; TERM on the current run is pulled back by the call (one more return) and the old PID is then reported as an earlier minute.');

  await t.command('echo hello');
  await p.waitForTimeout(1600);
  assert.match(await t.lines(2), /hello[\s\S]*MARA@1987> I'll finish in a minute\./);
  await t.command('ask who was here');
  assert.match(await t.lines(3), /Mara\. Her last session/);
  await t.command('finish');
  assert.match(await t.lines(1), /No receipt has arrived for this job yet/);
  await t.command('cat last.job');
  assert.match(await t.lines(4), /Deliver a picture and a note/);
  outcomes.push('echo is answered by the session’s own line; ask who was here names Mara; finish without a receipt is refused; cat last.job prints the job.');

  await t.input.focus();
  await p.keyboard.press('ArrowUp');
  assert.equal(await t.input.inputValue(), 'cat last.job');
  await p.keyboard.press('ArrowUp');
  assert.equal(await t.input.inputValue(), 'finish');
  await p.keyboard.press('ArrowDown');
  await p.keyboard.press('ArrowDown');
  assert.equal(await t.input.inputValue(), '');
  await p.keyboard.press('Control+l');
  assert.equal(await t.output.locator('.console-line').count(), 0, 'Ctrl+L clears the transcript');
  outcomes.push('ArrowUp/ArrowDown walk the command history back to an empty prompt; Ctrl+L clears the transcript.');

  await t.command('open canvas');
  await settled(p, 'canvas');
  assert.equal(await p.locator('#window-canvas').evaluate(el => el.classList.contains('is-active')), true);
  assert.match(await p.locator('#window-canvas .canvas-empty').textContent(), /No letter yet/);
  outcomes.push('open canvas opens CANVAS in front with focus; with no capture used yet it says how a letter starts.');
  await p.close();
} finally {
  await browser.close();
  await finish();
}
