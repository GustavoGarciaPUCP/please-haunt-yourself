import assert from 'node:assert/strict';
import { PC_SIZES, auditLayout, cueDone, fakeAudio, glassIdle, settled, start, terminal } from './haunt-helpers.mjs';
// TERMINAL v4 (.kiro/specs/os-case-v4 R3): the inspector keeps the bell's actions in view at every PC size; muffling
// is not stopping; TERMINAL's failed finish is the bell's only producer; Undo, the shadow and reduced motion.

const { browser, outcomes, open, finish } = await start('terminal-halloween');
/** The control is on screen and the point at its centre hits it: no scrolling, nothing on top. */
const reachable = (page, selector) => page.locator(selector).evaluate(el => {
  const r = el.getBoundingClientRect(), win = el.closest('.window').getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { inside: r.top >= win.top && r.bottom <= win.bottom && r.left >= win.left && r.right <= win.right, hit: hit === el || el.contains(hit), top: r.top, bottom: r.bottom, windowBottom: win.bottom };
});
const scrolled = page => page.evaluate(() => [...document.querySelectorAll('#window-terminal *')].some(el => el.scrollTop > 0 && !el.classList.contains('console-output')));
try {
  // 1. The review-24 defect: Bell's actions below the window. Now they are in the inspector, in view, at each size.
  for (const viewport of PC_SIZES) {
    const p = await open({ viewport });
    const t = terminal(p);
    await t.enter();
    await t.object('bell');
    for (const selector of ['.session-pane [data-room="call"]', '.session-pane [data-room="muffle"]', '.session-pane [data-main-action]']) {
      const state = await reachable(p, selector);
      assert.ok(state.inside && state.hit, `${selector} visible and hit at its centre at ${viewport.width}×${viewport.height}: ${JSON.stringify(state)}`);
    }
    assert.equal(await scrolled(p), false, 'nothing scrolled to reach the actions');
    for (const object of ['note', 'figure', 'door']) {
      await t.object(object);
      assert.deepEqual((await auditLayout(p, object)).problems, [], `${object} inspector at ${viewport.width}`);
    }
    await p.screenshot({ path: `output/playwright/v4-inspector-${viewport.width}x${viewport.height}.png` });
    await p.close();
  }
  outcomes.push('1366×768, 1440×900, 1920×1080: with the Bell selected, Stop the call, Muffle the bell and the main action sit inside TERMINAL and are hit at their centres with no scrolling (the v3 defect: Stop the call below the window). The note, figure and way-out inspectors pass the layout audit.');

  // 2. Muffle is not stop; the bell's only producer is TERMINAL's failed finish.
  const p = await open({ viewport: PC_SIZES[1], init: [fakeAudio] });
  const t = terminal(p);
  await p.click('#btn-sound');
  await t.enter();
  await t.primary.click();
  await cueDone(p);
  const ring = await p.evaluate(() => window.__voices.length);
  assert.equal(ring, 3, 'one return rings one chime (three partials)');
  await t.object('bell');
  await p.click('.session-pane [data-room="muffle"]');
  await t.primary.click();
  await cueDone(p);
  assert.equal(await p.evaluate(() => window.__voices.length), ring, 'a muffled bell schedules no chime');
  assert.match(await p.locator('.session-pane .inspector-text').textContent(), /muffled, so it makes no sound/);
  assert.equal(await p.locator('.job-bell-count').textContent(), '2', 'the return still counts');
  assert.equal(await p.locator('#btn-phase').getAttribute('data-phase'), 'repeating', 'muffling does not stop the call');
  // ECHO watching, pausing, capturing never rings or retries.
  await p.click('#btn-echo');
  await settled(p, 'echo');
  await p.click('#window-echo [data-echo="pause"]');
  await p.click('#window-echo [data-echo="pause"]');
  await p.click('#window-echo [data-echo="capture"]');
  const voices = await p.evaluate(() => window.__voices.length);
  assert.equal(voices, ring, 'ECHO never rings the bell');
  assert.equal(await p.locator('.job-bell-count').textContent(), '2', 'ECHO never retries');
  await p.click('#btn-terminal');
  await settled(p, 'terminal');
  // Undo before the milestone, then Stop the call.
  await p.click('.session-pane [data-legacy="undo"]');
  assert.equal(await p.locator('.job-bell-count').textContent(), '1', 'Undo takes back the last return');
  await t.object('bell');
  await p.click('.session-pane [data-room="call"]');
  assert.equal(await p.locator('#btn-phase').getAttribute('data-phase'), 'call-stopped');
  assert.equal(await t.primary.textContent(), 'Let it finish this time');
  outcomes.push('Sound on (a recording AudioContext; nothing audible is claimed): one return schedules one chime; a muffled return schedules none but still counts; ECHO’s pause, resume and capture never ring or retry; Undo takes back one return; Stop the call moves the phase to Call stopped.');

  // 3. Forcing it out leaves a shadow; calling it back lets it finish; the milestone cannot be undone.
  await t.object('door');
  await p.click('.session-pane [data-legacy="kill"]');
  await t.presence('shadow');
  assert.equal(await t.primary.textContent(), 'Call it back');
  await t.primary.click();
  await t.presence('terminal');
  await t.primary.click();
  await t.presence('glass');
  await cueDone(p);
  await glassIdle(p);
  assert.equal(await p.locator('.session-pane [data-legacy="undo"]').isDisabled(), true, 'no Undo past the milestone');
  assert.equal(await p.locator('.session-pane .pane-clock-time').getAttribute('data-ended'), 'true');
  assert.match(await p.locator('.session-pane .pane-clock-date').textContent(), /1 Nov 1987/);
  outcomes.push('Force it out (call off) leaves a shadow; Call it back, then Let it finish reaches the glass. Undo is disabled after the milestone and the recorded clock reads 1 Nov 1987, 00:00:00.');
  await p.close();

  // 4. A live switch to reduced motion during a cue lands on the final state at once.
  const q = await open({ viewport: PC_SIZES[0] });
  const tq = terminal(q);
  await tq.enter();
  await tq.primary.click();
  await q.waitForTimeout(300);
  await q.emulateMedia({ reducedMotion: 'reduce' });
  await q.waitForTimeout(100);
  assert.equal(await q.evaluate(() => document.querySelector('.scene-figure').getAnimations().filter(a => a.playState === 'running').length), 0, 'no cue keeps running');
  assert.match(await q.locator('.session-pane .pane-live').textContent(), /started the same minute again/);
  await tq.primary.click();
  assert.equal(await q.locator('.job-bell-count').textContent(), '2', 'with reduced motion the next return lands at once');
  outcomes.push('Reduced motion switched on mid-cue stops every running cue at its final pose; the evidence (narration, return count) is unchanged and the next action lands immediately.');
  await q.close();
} finally {
  await browser.close();
  await finish();
}
