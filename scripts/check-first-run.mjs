import assert from 'node:assert/strict';
import { PC_SIZES, deliverLetter, settled, skipBoot, start, terminal, url } from './haunt-helpers.mjs';
// The first minute and the OS shell (.kiro/specs/os-case-v4 R1): the boot entry on a fresh desk only, one optional
// callout, phase help, About, and desktop files that open their own objects.

const { browser, outcomes, open, finish } = await start('first-run');
try {
  // 1. Fresh desk: the entry plays and can be skipped; the callout points at Look inside; neither returns.
  let context = await browser.newContext({ viewport: PC_SIZES[1] });
  let p = await context.newPage();
  await p.goto(url);
  assert.equal(await p.locator('#boot').isVisible(), true, 'Restoring last session… on a fresh desk');
  assert.match(await p.locator('.boot-line').textContent(), /Restoring last session/);
  await p.keyboard.press('Shift');
  await p.waitForFunction(() => document.getElementById('boot').hidden);
  await settled(p, 'terminal');
  await p.waitForTimeout(400);
  const coach = p.locator('.coach');
  assert.equal(await coach.isVisible(), true);
  assert.match(await coach.textContent(), /Look inside/);
  const [c, target, win] = [await coach.boundingBox(), await p.locator('[data-enter-session]').boundingBox(), await p.locator('#window-terminal').boundingBox()];
  assert.ok(c.x >= win.x + win.width && Math.abs(c.y + 26 - (target.y + target.height / 2)) < 40, `the callout sits beside TERMINAL, level with Look inside: ${JSON.stringify({ c, target })}`);
  await p.click('.coach [data-coach-close]');
  assert.equal(await coach.count(), 0);
  await p.reload();
  await p.locator('#window-terminal').waitFor();
  assert.equal(await p.locator('#boot:not([hidden])').count(), 0, 'no entry on a reload');
  await p.waitForTimeout(400);
  assert.equal(await p.locator('.coach').count(), 0, 'the callout does not return');
  outcomes.push('A fresh desk shows “Restoring last session…”, skipped by a key; one callout points at TERMINAL’s Look inside and is dismissed with Got it; after a reload neither the entry nor the callout returns.');
  await context.close();

  context = await browser.newContext({ viewport: PC_SIZES[0] });
  p = await context.newPage();
  await p.goto(url);
  await skipBoot(p);
  await settled(p, 'terminal');
  await p.click('[data-enter-session]');
  assert.equal(await p.locator('.coach').count(), 0, 'looking inside dismisses the callout');
  outcomes.push('Choosing Look inside on its own also dismisses the callout.');
  await context.close();

  // 2. Phase help: one question, a nudge, then the answer, all in the phase's own words.
  p = await open({ viewport: PC_SIZES[1] });
  await p.click('#btn-phase');
  assert.match(await p.locator('.phase-question').textContent(), /What keeps bringing it back\?/);
  assert.equal(await p.locator('.phase-hint').isHidden(), true, 'no hint until asked');
  await p.click('[data-phase-hint]');
  assert.match(await p.locator('.phase-hint').textContent(), /Something rings at the end of every minute/);
  await p.click('[data-phase-answer]');
  assert.match(await p.locator('.phase-hint').textContent(), /Muffling the bell only silences it/);
  assert.equal(await p.locator('.phase-steps [aria-current="step"]').textContent(), 'Repeating');
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#phase-popover').isHidden(), true);
  assert.equal(await p.evaluate(() => document.activeElement?.id), 'btn-phase', 'Escape returns focus to the tray');
  outcomes.push('Phase help asks the phase’s question first; Show me gives a nudge and Tell me exactly the answer; the steps list marks Repeating; Escape closes it and returns focus to the tray.');

  // 3. About HAUNT OS: version, scope, storage, attribution.
  // The build identifier names the build so it is recognizable (v5 in playability-v5, v6 in visual-precision-v6, v7 in
  // confirmation-flow-v7, v8 in free-text-v8, v9 in fluid-typing-v9); the fictional OS stays HAUNT OS 4.
  assert.equal(await p.locator('meta[name="haunt-build"]').getAttribute('content'), 'v9');
  await p.click('#btn-launcher');
  await p.click('[data-about]');
  const about = await p.locator('#about-dialog').textContent();
  assert.match(about, /HAUNT OS 4 · build v9/);
  assert.match(about, /Nothing leaves this browser/);
  assert.match(about, /Saved in this browser only \(haunt\.case\.v4\)/);
  assert.match(about, /Codex[\s\S]*Kiro agent/);
  await p.keyboard.press('Escape');
  outcomes.push('About HAUNT OS shows build v9 (also the haunt-build meta), what is fiction and local, the real storage state and the attribution.');

  // 4. Desktop files open their own objects.
  assert.deepEqual(await p.locator('.desktop-file .file-label').allTextContents(), ['last.job']);
  await p.dblclick('.desktop-file[data-file="job"]');
  assert.match(await terminal(p).lines(4), /31 OCT 1987 · MARA · last job/);
  await deliverLetter(p);
  assert.deepEqual(await p.locator('.desktop-file .file-label').allTextContents(), ['last.job', 'capture-1', 'letter', 'receipt']);
  await p.locator('.desktop-file[data-file="capture"]').focus();
  await p.keyboard.press('Enter');
  await settled(p, 'echo');
  assert.equal(await p.locator('#window-echo .capture-item[aria-current="true"]').getAttribute('data-capture'), '1');
  await p.dblclick('.desktop-file[data-file="letter"]');
  await settled(p, 'canvas');
  assert.equal(await p.locator('#window-canvas').evaluate(el => el.classList.contains('is-active')), true);
  await p.dblclick('.desktop-file[data-file="receipt"]');
  await settled(p, 'postman');
  assert.match(await p.locator('#window-postman .message-item[aria-current="true"]').textContent(), /Mara · via last\.session/);
  outcomes.push('Desktop files: last.job prints the job in TERMINAL; capture-1, letter and receipt appear once they exist and open ECHO on that capture, CANVAS on the letter and POSTMAN on the delivered message (double-click or Enter).');
  await p.close();
} finally {
  await browser.close();
  await finish();
}
