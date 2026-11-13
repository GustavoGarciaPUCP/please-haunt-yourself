import assert from 'node:assert/strict';
import { PC_SIZES, caseSave, cueDone, fakeAudio, settled, start, terminal, url } from './haunt-helpers.mjs';
// Saves and interruptions (.kiro/specs/os-case-v4 R7): a v3 case migrates with its prints as limited captures, the v1
// ending is removed without completing anything, a corrupt save starts fresh, and minimizing silences a running cue.

const { browser, outcomes, open, finish } = await start('terminal-recovery');
/** A v3 case at the milestone with one glass print (crop only) and one session print, as v3 stored them. */
const seedV3 = () => {
  // Seed once per tab, so a reload shows what the migration left behind.
  if (sessionStorage.getItem('v3-done')) return;
  sessionStorage.setItem('v3-done', '1');
  localStorage.setItem('haunt.guide.v4', 'seen');
  const fog = btoa(String.fromCharCode(...new Uint8Array(128 * 72).fill(190)));
  const patch = { c0: 40, r0: 20, cols: 30, rows: 20, data: btoa(String.fromCharCode(...new Uint8Array(600).fill(150))) };
  localStorage.setItem('haunt.case.v3', JSON.stringify({
    v: 3, terminal: { retry: false, muffled: false, attempts: 2, presence: 'glass', said: ['help', 'same-minute'] },
    glass: { hand: [0.5, 0.45], side: 'right', fog, revealSeen: true },
    studio: { prints: [
      { id: 1, source: 'glass', glass: { stage: { w: 1366, h: 720 }, frame: { x: 330, y: 160, w: 480, h: 300 }, placement: { hand: { u: 0.5, v: 0.45 }, side: 'right' }, patch } },
      { id: 2, source: 'session', session: { presence: 'glass', attempts: 2, pid: null, retry: false, muffled: false } },
    ] },
  }));
};
try {
  // 1. v3 → v4.
  const context = await browser.newContext({ viewport: PC_SIZES[1] });
  let p = await context.newPage();
  await p.addInitScript(seedV3);
  await p.goto(url);
  await p.locator('#window-terminal').waitFor();
  await settled(p, 'terminal');
  assert.match(await terminal(p).lines(8), /updated to HAUNT OS 4[\s\S]*limited captures/);
  assert.match(await p.locator('#toasts').textContent(), /HAUNT OS was updated/);
  assert.equal(await p.evaluate(() => localStorage.getItem('haunt.case.v3')), null, 'the v3 key is removed once v4 is written');
  let save = await caseSave(p);
  assert.deepEqual(save.echo.captures.map(item => item.negative.kind), ['limited', 'session']);
  assert.equal(save.terminal.presence, 'glass');
  assert.equal(await p.locator('#btn-phase').getAttribute('data-phase'), 'call-stopped', 'a limited print is not a useful capture');
  await p.click('#btn-echo');
  await settled(p, 'echo');
  await p.click('#window-echo [role="tab"][data-tab="captures"]');
  await p.locator('#window-echo .capture-item[data-capture="1"]').click();
  assert.match(await p.locator('#window-echo .capture-verdict').textContent(), /older version of this desktop: its picture only, without the writing/);
  assert.equal(await p.locator('#window-echo [data-echo="new-exposure"]').isVisible(), true);
  await p.click('#window-echo [data-echo="use"]');
  await settled(p, 'canvas');
  // visual-precision-v6 R4: an old print is named as such, without the internal word "milestone" (v4/v5: "This capture has no writing").
  assert.match(await p.locator('#window-canvas .canvas-ready').textContent(), /This old picture kept no writing\. A new capture of the glass keeps it\./);
  await p.click('#btn-echo');
  await p.click('#window-echo [data-echo="new-exposure"]');
  assert.equal(await p.locator('#window-echo .echo-sources input:checked').getAttribute('value'), 'glass');
  assert.equal(await p.locator('#window-echo .echo-live').isVisible(), true);
  outcomes.push('v3 → v4: the case continues at the milestone; TERMINAL and the taskbar report the update once; the v3 key is removed; the glass print became a limited capture (picture only, no writing; CANVAS says so) and the session print a session capture; New exposure goes to the live glass; the phase stays Call stopped.');
  await p.reload();
  await p.locator('#window-terminal').waitFor();
  assert.doesNotMatch(await terminal(p).lines(8), /updated to HAUNT OS 4/, 'the migration notice is shown once');
  outcomes.push('Reloading after the migration continues the v4 case without repeating the notice.');
  await context.close();

  // 2. The v1 TERMINAL ending: removed, nothing completed.
  p = await open({ viewport: PC_SIZES[0], init: [() => { if (!sessionStorage.getItem('v1')) { sessionStorage.setItem('v1', '1'); localStorage.setItem('haunt.terminal.v1', JSON.stringify({ ending: 'kept' })); } }] });
  assert.equal(await p.evaluate(() => localStorage.getItem('haunt.terminal.v1')), null);
  assert.match(await terminal(p).lines(8), /older version belongs to an earlier story/);
  assert.equal(await p.locator('#btn-phase').getAttribute('data-phase'), 'repeating');
  outcomes.push('A v1 TERMINAL ending is removed and reported; Mara’s job starts open (Repeating).');
  await p.close();

  // 3. A corrupt v4 save starts fresh and says so.
  p = await open({ viewport: PC_SIZES[0], init: [() => { if (!sessionStorage.getItem('bad')) { sessionStorage.setItem('bad', '1'); localStorage.setItem('haunt.case.v4', '{"v":4,"run":"x"'); } }] });
  assert.match(await terminal(p).lines(8), /could not be read, so it starts fresh/);
  assert.equal((await caseSave(p)).terminal.presence, 'terminal');
  outcomes.push('A corrupt v4 save is replaced by a fresh case and TERMINAL says so; nothing else in the browser is touched.');
  await p.close();

  // 4. Minimizing during a cue silences the bell and cancels the motion; restoring shows the settled state.
  p = await open({ viewport: PC_SIZES[1], init: [fakeAudio] });
  const t = terminal(p);
  await p.click('#btn-sound');
  await t.enter();
  await t.primary.click();
  await p.waitForTimeout(250);
  await p.click('#window-terminal [data-window="minimize"]');
  const stopped = await p.evaluate(() => window.__voices.every(voice => voice.stops.length > 0));
  assert.equal(stopped, true, 'every scheduled voice was stopped');
  await p.click('#btn-terminal');
  await settled(p, 'terminal');
  await cueDone(p);
  assert.equal(await p.locator('.job-bell-count').textContent(), '1', 'the return itself still happened');
  outcomes.push('Minimizing TERMINAL mid-cue stopped every scheduled bell voice (recording AudioContext) and cancelled the cue; on restore the return is counted and nothing replays.');
  await p.close();
} finally {
  await browser.close();
  await finish();
}
