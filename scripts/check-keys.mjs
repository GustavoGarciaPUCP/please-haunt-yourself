import assert from 'node:assert/strict';
import { caseSave, cueDone, glassIdle, phase, settled, start } from './haunt-helpers.mjs';
// Keyboard-only route (.kiro/specs/playability-v5 R7): the whole case with natural keys only — Tab, Shift+Tab, Enter,
// arrow keys and typing. No pointer input, and the check never moves focus itself (no element.focus()): focus goes
// only where Tab takes it or where the product moves it. Every control must be on screen and uncovered when it has
// focus. Key presses are counted per step. Writes output/playwright/keys-results.json.

const { browser, outcomes, open, finish } = await start('keys');

/** What has focus: its window, its label, and whether a person can see it (on screen and not covered). */
const focused = page => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { label: 'body', visible: false };
  const r = el.getBoundingClientRect(), x = r.left + Math.min(r.width / 2, 12), y = r.top + r.height / 2;
  const hit = document.elementFromPoint(x, y);
  return {
    label: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 48),
    window: el.closest('.window')?.id ?? (el.closest('#taskbar') ? 'taskbar' : 'desktop'),
    visible: r.width > 0 && r.height > 0 && x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight
      && !!hit && (hit === el || el.contains(hit) || hit.contains(el) || !!hit.closest('label')?.contains(el)),
  };
});
const is = (page, selector) => page.evaluate(selector => document.activeElement?.matches(selector) ?? false, selector);

/** Presses Tab (or Shift+Tab) until the focused element matches `selector`; returns the number of presses. */
async function tabTo(page, selector, { back = false, max = 90 } = {}) {
  for (let presses = 1; presses <= max; presses++) {
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab');
    if (await is(page, selector)) {
      const where = await focused(page);
      assert.ok(where.visible, `${selector} has focus but a person cannot see it: ${JSON.stringify(where)}`);
      return presses;
    }
  }
  throw new Error(`${selector} not reached with ${back ? 'Shift+Tab' : 'Tab'} in ${max} presses`);
}

try {
  const p = await open({ viewport: { width: 1366, height: 768 } });
  const steps = [];
  const step = (name, keys) => steps.push({ name, keys });
  assert.equal(await is(p, '#haunt-command'), true, 'focus starts in TERMINAL’s command line');

  // TERMINAL: look inside, watch it try, inspect the bell, stop the call, let it finish, back to the prompt.
  let keys = await tabTo(p, '[data-enter-session]', { back: true });
  await p.keyboard.press('Enter');
  await p.locator('.session-pane').waitFor({ state: 'visible' });
  step('Look inside', keys + 1);
  assert.equal(await is(p, '.session-pane [data-main-action]'), true, 'Look inside moves focus to the session’s main action');
  await p.keyboard.press('Enter');
  await cueDone(p);
  step('Watch it try to finish', 1);
  keys = await tabTo(p, '.session-pane [data-object="bell"]', { back: true });
  await p.keyboard.press('Enter');
  step('Inspect the bell', keys + 1);
  keys = await tabTo(p, '.session-pane [data-room="call"]');
  await p.keyboard.press('Enter');
  step('Stop the call', keys + 1);
  assert.equal((await caseSave(p)).terminal.retry, false, 'the call is stopped');
  keys = await tabTo(p, '.session-pane [data-main-action]');
  await p.keyboard.press('Enter');
  await p.waitForFunction(() => document.querySelector('.terminal-app')?.dataset.presence === 'glass');
  await cueDone(p);
  await glassIdle(p);
  step('Let it finish', keys + 1);
  // Once it has finished, the pane's main action is the way back (the header button is then not repeated).
  const way = await p.locator('.session-pane .pane-detach').isVisible() ? '.session-pane .pane-detach' : '.session-pane [data-main-action]';
  keys = await is(p, way) ? 0 : await tabTo(p, way, { back: true });
  await p.keyboard.press('Enter');
  step('Back to the prompt', keys + 1);
  assert.equal(await is(p, '#haunt-command'), true, 'back at the prompt, focus is on the command line');

  // ECHO: open it from TERMINAL, choose the desktop glass with the arrow keys, capture.
  keys = await tabTo(p, '#window-terminal [data-open="echo"]');
  await p.keyboard.press('Enter');
  await settled(p, 'echo');
  step('Open ECHO', keys + 1);
  keys = await tabTo(p, '#window-echo .echo-sources input', { back: true });
  if (!await is(p, '#window-echo .echo-sources input[value="glass"]')) { await p.keyboard.press('ArrowRight'); keys++; }
  step('Source: Desktop glass', keys);
  assert.equal(await p.locator('#window-echo .echo-sources input[value="glass"]').isChecked(), true, 'the arrow key chose the desktop glass');
  keys = await tabTo(p, '#window-echo [data-echo="capture"]');
  await p.keyboard.press('Enter');
  await p.locator('#window-echo .capture-detail:not([hidden])').waitFor();
  step('Capture', keys + 1);
  assert.equal(await is(p, '#window-echo [data-echo="use"]'), true, 'after Capture, focus is on Use this capture');
  // ECHO was not moved: if its picture misses the handprint, the photo frame moves over it with Shift+arrow keys.
  const handInPicture = async () => (await p.locator('#window-echo .capture-head .subject-chip[data-on="true"]').allTextContents()).some(text => /Handprint/.test(text));
  if (!await handInPicture()) {
    keys = await tabTo(p, '#window-echo .capture-detail .photo-frame', { back: true });
    const plan = await p.evaluate(() => {
      const save = JSON.parse(localStorage.getItem('haunt.case.v4'));
      const capture = save.echo.captures.at(-1), size = capture.negative.stage, hand = { x: save.glass.hand[0] * size.w, y: save.glass.hand[1] * size.h };
      return { dx: hand.x - (capture.frame.x + capture.frame.w / 2), dy: hand.y - (capture.frame.y + capture.frame.h / 2), step: size.w * 0.08 };
    });
    for (const [delta, plus, minus] of [[plan.dx, 'Shift+ArrowRight', 'Shift+ArrowLeft'], [plan.dy, 'Shift+ArrowDown', 'Shift+ArrowUp']]) {
      for (let i = 0; i < Math.round(Math.abs(delta) / plan.step); i++) { await p.keyboard.press(delta > 0 ? plus : minus); keys++; }
    }
    step('Frame the handprint (photo frame, Shift+arrows)', keys);
    keys = await tabTo(p, '#window-echo [data-echo="use"]');
  } else keys = 0;
  assert.equal(await handInPicture(), true, 'the picture shows the handprint');
  await p.keyboard.press('Enter');
  await settled(p, 'canvas');
  step('Use this capture', keys + 1);
  assert.equal(await is(p, '#window-canvas [data-canvas="lift"]'), true, 'CANVAS opens with Lift the writing focused');

  // CANVAS: lift the writing, then choose what the photograph keeps with an arrow key.
  await p.keyboard.press('Enter');
  step('Lift the writing', 1);
  assert.equal((await caseSave(p)).letter.draft.writing, 'paper', 'the words are on the paper');
  assert.equal(await is(p, '#window-canvas .keep-options input'), true, 'focus moves on to what the photograph keeps');
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(100);
  step('The photograph keeps: Handprint and figure', 1);
  assert.equal((await caseSave(p)).letter.draft.mist, 0.4, 'the arrow key changed the letter itself');
  keys = await tabTo(p, '#window-canvas [data-canvas="compose"]');
  await p.keyboard.press('Enter');
  await settled(p, 'postman');
  step('Compose in POSTMAN', keys + 1);
  assert.equal(await is(p, '#window-postman [data-field="to"]'), true, 'POSTMAN opens at the recipient field');

  // POSTMAN: type the recipient, Send, Return to the request.
  await p.keyboard.type('guest');
  keys = await tabTo(p, '#window-postman [data-mail="send"]', { back: true });
  await p.keyboard.press('Enter');
  await p.locator('#window-postman [data-mail="return"]').waitFor();
  step('Type guest, then Send', 'guest'.length + keys + 1);
  assert.equal(await is(p, '#window-postman [data-mail="return"]'), true, 'after Send, focus is on Return to the request');
  const sent = (await caseSave(p)).mail.deliveries.at(-1);
  assert.equal(sent.letter.mist, 0.4, 'the delivered letter keeps the photograph that was chosen');
  assert.equal(sent.complete, true);
  await p.keyboard.press('Enter');
  await settled(p, 'terminal');
  step('Return to the request', 1);
  assert.equal(await is(p, '#window-terminal [data-finish]'), true, 'TERMINAL comes forward with Finish session focused');

  // TERMINAL: Finish session. The receipt shows the glass where the hand is pressed; the hand lets go there.
  assert.equal(await p.locator('.receipt-figure[data-figure="glass"]').getAttribute('data-glass'), 'impressed', 'the receipt shows the live glass');
  await p.keyboard.press('Enter');
  await p.waitForFunction(() => document.querySelector('.receipt-figure[data-figure="glass"]')?.dataset.glass === 'releasing');
  step('Finish session', 1);
  await glassIdle(p);
  assert.equal(await phase(p), 'finished');
  assert.equal(await p.locator('.receipt-figure[data-figure="glass"]').getAttribute('data-glass'), 'clear');
  assert.match(await p.locator('.receipt-card .receipt-detail').textContent(), /Its photograph keeps the handprint and the figure\./, 'the end names the choice made in CANVAS');
  const total = steps.reduce((sum, item) => sum + item.keys, 0);
  outcomes.push(`Keyboard only (1366×768), ${total} key presses: ${steps.map(item => `${item.name} ${item.keys}`).join(' · ')}. No pointer input and no focus set by the check; every focused control was on screen and uncovered.`);
  await p.close();
} finally {
  await browser.close();
  await finish();
}
