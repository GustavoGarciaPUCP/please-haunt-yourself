import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { PC_SIZES, auditLayout, caseSave, deliverLetter, frameHand, glassIdle, phase, reachGlass, settled, start, terminal } from './haunt-helpers.mjs';
import { auditDrawnText, installTextProbe } from './drawn-text-audit.mjs';
// POSTMAN's confirmations (.kiro/specs/confirmation-flow-v7): review 28's loop and the combinations around it, with real
// pointer and keyboard input only. One question per send attempt, one delivery per answer, answers that only apply to
// the attempt they were given for, a working attachment checkbox, honest words afterwards in POSTMAN and TERMINAL, the
// immutable letter A, copies after the end, and each question audited at three PC sizes and at POSTMAN's minimum.

const { browser, outcomes, open, finish } = await start('confirmations');
const dir = 'output/playwright/confirm';
await mkdir(dir, { recursive: true });
const LINES = ['FOR THE NEXT PERSON', 'AT THIS DESK', 'This picture is yours.', 'Keep what matters.', '— Mara, 31 October 1987'];
const FALL_BACK = 'TERMINAL: The letter the job relies on was replaced by an incomplete one. No receipt can finish the job until a complete letter arrives.';
const CHANGED = 'The letter changed after you pressed Send, so nothing was sent. Send checks it again.';
const FINISHED = 'The session finished after you pressed Send, so nothing was sent. Sending now delivers another copy.';
const combined = (lacks, at) => `This letter is incomplete: ${lacks}. Sending it replaces the complete letter delivered at ${at}; that letter stays in Guest Inbox, marked replaced. No receipt will finish the job until a complete letter arrives. Send it anyway?`;
const replaceText = at => `Guest Inbox already has a complete letter from this job. Replace it? The letter delivered at ${at} stays there, marked replaced, and only the new receipt can finish the job.`;
const incompleteText = lacks => `This letter is incomplete: ${lacks}. Send it anyway? It will arrive, but it cannot finish the job.`;
const copyText = lacks => `This letter is incomplete: ${lacks}. Send it anyway? It will arrive as another copy; the letter the job accepted stays as it was.`;
const MIST = 'the writing is still in the mist';

/** What POSTMAN is asking now: its words, its buttons in order and which one has focus. */
const question = page => page.evaluate(() => {
  const box = document.querySelector('#window-postman .mail-confirm');
  const visible = !!box && !box.hidden && box.getBoundingClientRect().height > 0;
  const notice = document.querySelector('#window-postman .mail-notice');
  return {
    visible, text: visible ? box.querySelector('p').textContent : null,
    buttons: visible ? [...box.querySelectorAll('.confirm-buttons button')].map(b => b.dataset.mail) : [],
    focused: document.activeElement?.dataset?.mail ?? document.activeElement?.dataset?.field ?? null,
    notice: notice && !notice.hidden ? notice.textContent : null,
  };
});
const clockOf = (page, at) => page.evaluate(at => new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(at), at);
const delivery = async (page, id) => (await caseSave(page)).mail.deliveries.find(item => item.id === id);
const count = async page => (await caseSave(page)).mail.deliveries.length;
const bringForward = async (page, id) => { if (!await page.locator(`#window-${id}.is-active`).count()) await page.click(`#btn-${id}`); await settled(page, id); };
const transcript = page => page.locator('#window-terminal .console-output .console-line').allTextContents();
async function clean(page, label) {
  await page.evaluate(async () => { await document.fonts.ready; });
  const dom = (await auditLayout(page, label)).problems, drawn = (await auditDrawnText(page, label)).problems;
  assert.deepEqual(dom, [], `${label}: layout — ${JSON.stringify(dom.slice(0, 3))}`);
  assert.deepEqual(drawn, [], `${label}: drawn text — ${JSON.stringify(drawn.slice(0, 3))}`);
}
/** CANVAS → Letter → Reset to the capture… → Reset: the writing goes back into the mist, so the letter is incomplete. */
async function resetLetter(page) {
  await bringForward(page, 'canvas');
  await page.click('#window-canvas [data-menu="letter"]');
  await page.click('#window-canvas .app-menu [data-item="reset"]');
  await page.click('#window-canvas [data-canvas="reset-confirm"]');
}
async function composeToGuest(page) {
  await bringForward(page, 'canvas');
  await page.click('#window-canvas [data-canvas="compose"]');
  await settled(page, 'postman');
  await page.click('#window-postman [data-mail="to-guest"]');
}
/** A complete letter A delivered to guest, not finished; returns A as saved and its delivery time as POSTMAN shows it. */
async function deliverA(page) {
  await deliverLetter(page);
  const a = (await caseSave(page)).mail.deliveries.at(-1);
  assert.equal(a.complete, true);
  return { a, aJson: JSON.stringify(a), at: await clockOf(page, a.at) };
}
const unchanged = async (page, a, aJson) => assert.equal(JSON.stringify(await delivery(page, a.id)), aJson, 'A is byte-for-byte the letter that was sent');
async function toMinimum(page, id) {
  const win = page.locator(`#window-${id}`), r = await win.boundingBox(), handle = await win.locator('.window-resize[data-edge="se"]').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + 20, r.y + 60, { steps: 10 });
  await page.mouse.up();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(200);
}
/** Every button of the open question lies inside the visible part of the reading pane: no scrolling is needed. */
const buttonsInView = page => page.evaluate(() => {
  const pane = document.querySelector('#window-postman .reading-pane').getBoundingClientRect();
  return [...document.querySelectorAll('#window-postman .mail-confirm .confirm-buttons button')].every(b => {
    const r = b.getBoundingClientRect();
    return r.top >= pane.top - 0.5 && r.bottom <= pane.bottom + 0.5 && r.left >= pane.left - 0.5 && r.right <= pane.right + 0.5;
  });
});

try {
  // 1. Review 28's route by pointer: one combined question, one delivery, and every surface says what is true after it.
  {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    const { a, aJson, at } = await deliverA(p);
    // The phase help is at its answer for Delivered · ready to finish; after the fall back it must start at the question.
    await p.click('#btn-phase');
    await p.click('#phase-popover [data-phase-hint]');
    await p.click('#phase-popover [data-phase-answer]');
    assert.match(await p.locator('#phase-popover .phase-hint').textContent(), /Return to the request on the receipt, then Finish session/);
    await p.click('#phase-popover [data-phase-close]');
    await resetLetter(p);
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    let q = await question(p);
    assert.equal(q.text, combined(MIST, at));
    assert.deepEqual(q.buttons, ['keep-editing', 'open-canvas', 'send-anyway-replace']);
    assert.equal(q.focused, 'keep-editing', 'the safe action has focus');
    assert.equal(await count(p), 1, 'asking sends nothing');
    await clean(p, 'combined question, 1366×768');
    await p.click('#window-postman [data-mail="send-anyway-replace"]');
    q = await question(p);
    assert.equal(q.visible, false, 'no second question');
    let save = await caseSave(p);
    assert.equal(save.mail.deliveries.length, 2, 'exactly one new delivery');
    const b = save.mail.deliveries.at(-1);
    assert.equal(b.complete, false);
    assert.deepEqual(b.missing, ['writing']);
    assert.equal(save.mail.intended, b.id, 'the incomplete letter is now the one the job relies on');
    await unchanged(p, a, aJson);
    assert.equal(await phase(p), 'capture-retained');
    assert.equal(await p.locator('#window-postman .postman-status').textContent(), 'Delivered to guest@haunt, marked incomplete. The complete letter it replaced is marked replaced; no receipt can finish the job until a complete letter arrives.');
    assert.deepEqual(await p.locator('#window-postman .message-item .item-badge').allTextContents(), ['Incomplete', 'Replaced']);
    assert.equal(await p.locator('#toasts').getByText('ready to finish').count(), 0, 'no toast still says the job is ready to finish');
    assert.equal((await transcript(p)).filter(line => line === FALL_BACK).length, 1, 'TERMINAL notes the fall back once');
    await clean(p, 'after the combined answer, 1366×768');
    // A's receipt is refused in words that do not send the person to the incomplete letter.
    await p.locator(`#window-postman [data-message="d-${a.id}"]`).click();
    assert.equal(await p.locator('#window-postman .receipt-state').textContent(), 'Replaced by a newer letter. This receipt can no longer finish the job.');
    await p.click('#window-postman [data-mail="return"]');
    await settled(p, 'terminal');
    assert.equal(await p.locator('.receipt-card .receipt-detail').textContent(), 'That receipt is for a letter you replaced. The letter that replaced it is incomplete, so no receipt can finish the job until a complete letter arrives.');
    assert.equal(await p.locator('.receipt-card [data-finish]').isHidden(), true, 'no Finish session');
    await clean(p, 'TERMINAL refuses the replaced receipt');
    await p.click('.receipt-card [data-dismiss-receipt]');
    // Help starts again at the new phase's question.
    await p.click('#btn-phase');
    assert.equal(await p.locator('#phase-popover .phase-title').textContent(), 'Capture retained');
    assert.equal(await p.locator('#phase-popover .phase-hint').isHidden(), true, 'no answer shown that nobody asked for');
    assert.equal(await p.locator('#phase-popover [data-phase-hint]').isVisible(), true);
    await p.click('#phase-popover [data-phase-close]');
    // Recovery: lift the writing and send; nothing complete is held, so there is no Replace question.
    await bringForward(p, 'canvas');
    await p.click('#window-canvas [data-canvas="lift"]');
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).visible, false, 'no question: nothing complete is held');
    save = await caseSave(p);
    const c = save.mail.deliveries.at(-1);
    assert.equal(c.complete, true);
    assert.deepEqual(c.letter.lines, LINES);
    assert.equal(await phase(p), 'ready-to-finish');
    await p.click('#window-postman [data-mail="return"]');
    await settled(p, 'terminal');
    await p.click('#window-terminal [data-finish]');
    await p.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
    await glassIdle(p);
    save = await caseSave(p);
    assert.equal(save.ack.deliveryId, c.id);
    await unchanged(p, a, aJson);
    assert.equal(JSON.stringify(save.mail.deliveries.find(item => item.id === b.id)), JSON.stringify(b), 'B is unchanged too');
    outcomes.push(`Review 28's route (1366×768, pointer): A delivered, CANVAS reset, Send to guest. POSTMAN asked once: “${combined(MIST, at)}” with Keep editing focused. Send anyway and replace delivered exactly one letter, marked Incomplete, which the job now relies on; A is byte-identical and marked Replaced; the phase fell back to Capture retained; TERMINAL wrote the fall back once and refuses A's receipt without pointing to the incomplete letter; the ready-to-finish toast is gone and the phase help starts again at the question. Lifting the writing and sending again asked nothing, and that letter finished the case.`);
    await p.close();
  }

  // 2. Natural keys: Ctrl+Enter, Escape, Tab, Enter. No pointer and no focus set by the check after Compose.
  {
    const p = await open({ viewport: PC_SIZES[0] });
    const { a, aJson, at } = await deliverA(p);
    await resetLetter(p);
    await bringForward(p, 'canvas');
    await p.click('#window-canvas [data-canvas="compose"]');
    await settled(p, 'postman');
    const keys = [];
    const press = async key => { keys.push(key); await p.keyboard.press(key); };
    await p.keyboard.type('guest@haunt');
    await press('Control+Enter');
    let q = await question(p);
    assert.equal(q.text, combined(MIST, at));
    assert.equal(q.focused, 'keep-editing');
    await press('Escape');
    q = await question(p);
    assert.equal(q.visible, false, 'Escape closes the question');
    assert.equal(q.focused, 'send', 'focus returns to Send');
    assert.equal(await count(p), 1);
    await press('Control+Enter');
    assert.equal((await question(p)).text, combined(MIST, at), 'the same question again');
    await press('Tab');
    await press('Tab');
    assert.equal((await question(p)).focused, 'send-anyway-replace');
    await press('Enter');
    assert.equal(await count(p), 2);
    assert.equal((await question(p)).visible, false);
    assert.equal(await p.evaluate(() => document.activeElement?.dataset?.mail), 'return', 'focus lands on the result');
    await unchanged(p, a, aJson);
    assert.equal(await phase(p), 'capture-retained');
    outcomes.push(`Natural keys (1366×768): after Compose, typing guest@haunt, ${keys.join(', ')} (${keys.length} presses): Escape closed the question and sent nothing; the answer delivered exactly one letter, focus moved to Return to the request, and A is unchanged.`);
    await p.close();
  }

  // 3. Cancel in every way, a reload with the question open, then A still finishes the case.
  {
    const p = await open({ viewport: PC_SIZES[1] });
    const { a, aJson, at } = await deliverA(p);
    await resetLetter(p);
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    await p.click('#window-postman [data-mail="keep-editing"]');
    let q = await question(p);
    assert.equal(q.visible, false);
    assert.equal(q.focused, 'to', 'Keep editing returns to the recipient');
    await p.click('#window-postman [data-mail="send"]');
    await p.click('#window-postman [data-mail="open-canvas"]');
    await settled(p, 'canvas');
    await bringForward(p, 'postman');
    assert.equal((await question(p)).text, combined(MIST, at), 'Open CANVAS without a change: the question is still true, so it stays');
    await p.click('#window-postman [data-mail="discard"]');
    assert.equal((await caseSave(p)).mail.draft, null, 'Discard draft discards the draft and the question with it');
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).visible, true);
    assert.equal(await count(p), 1, 'no cancel sent anything');
    await p.reload();
    await p.locator('#window-terminal').waitFor();
    await settled(p, 'terminal');
    const save = await caseSave(p);
    assert.ok(save, 'the save is readable after the reload');
    assert.equal(save.mail.intended, a.id);
    assert.equal(await phase(p), 'ready-to-finish');
    await unchanged(p, a, aJson);
    await bringForward(p, 'postman');
    assert.equal((await question(p)).visible, false, 'a question is never saved');
    await p.click('#window-postman [data-box="guest"]');
    await p.locator(`#window-postman [data-message="d-${a.id}"]`).click();
    await p.click('#window-postman [data-mail="return"]');
    await settled(p, 'terminal');
    await p.click('#window-terminal [data-finish]');
    await p.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
    assert.equal((await caseSave(p)).ack.deliveryId, a.id);
    await unchanged(p, a, aJson);
    outcomes.push('Cancel (1440×900): Keep editing (focus back on To), Open CANVAS and back (the question stays, still true), Discard draft, and a reload with the question open each sent nothing; after the reload the save was readable, A was still the job’s letter and finished the case.');
    await p.close();
  }

  // 4. The attachment checkbox (finding D) and B without its attachment.
  {
    const p = await open({ viewport: PC_SIZES[0] });
    const { a, aJson, at } = await deliverA(p);
    await composeToGuest(p);
    const box = p.locator('#window-postman [data-field="attached"]');
    await box.click();
    assert.equal(await box.isChecked(), false, 'a click unticks it');
    assert.equal((await caseSave(p)).mail.draft.attached, false, 'the save holds a boolean');
    await box.focus();
    await p.keyboard.press('Space');
    assert.equal(await box.isChecked(), true, 'Space ticks it');
    assert.equal((await caseSave(p)).mail.draft.attached, true);
    await p.click('#window-postman .attach-toggle span');
    assert.equal(await box.isChecked(), false, 'its label unticks it');
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).text, combined('no letter is attached', at));
    // Changing the attachment closes the question: it was about the draft as it was.
    await box.click();
    assert.equal((await question(p)).visible, false);
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).text, replaceText(at), 'with the letter attached again, only Replace is asked');
    await p.click('#window-postman [data-mail="keep-editing"]');
    await box.click();
    await p.click('#window-postman [data-mail="send"]');
    await p.click('#window-postman [data-mail="send-anyway-replace"]');
    const b = (await caseSave(p)).mail.deliveries.at(-1);
    assert.equal(b.letter, null);
    assert.equal(b.complete, false);
    assert.equal(await count(p), 2);
    await unchanged(p, a, aJson);
    assert.equal(await phase(p), 'draft-ready', 'the letter in CANVAS is still complete');
    assert.equal(await p.locator('#window-postman .receipt-state').textContent(), 'Incomplete: no letter is attached. This receipt cannot finish the job.');
    assert.equal((await transcript(p)).filter(line => line === FALL_BACK).length, 1);
    outcomes.push('The attachment (finding D, 1366×768): click, Space and the label toggle it and the save holds a boolean (v6 kept it ticked and briefly saved "on"). Toggling it with a question open closed the question. Unattached, POSTMAN asked once (“no letter is attached”, replacing A), delivered a letter-less Incomplete delivery, and the phase fell back to Letter draft ready.');
    await p.close();
  }

  // 5. B made from a capture of TERMINAL's session window: the same policy; no words are invented.
  {
    const p = await open({ viewport: PC_SIZES[0] });
    const { a, aJson, at } = await deliverA(p);
    await bringForward(p, 'echo');
    await p.click('#window-echo [role="tab"][data-tab="live"]');
    await p.locator('#window-echo .echo-sources label:has(input[value="session"])').click();
    await p.click('#window-echo [data-echo="capture"]');
    await p.click('#window-echo [data-echo="use"]');
    await p.click('#window-echo [data-echo="confirm-use"]');
    await settled(p, 'canvas');
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).text, combined('the picture is TERMINAL’s window, not the glass; its note stops at “PER—”', at));
    await p.click('#window-postman [data-mail="send-anyway-replace"]');
    const b = (await caseSave(p)).mail.deliveries.at(-1);
    assert.equal(b.letter.kind, 'session');
    assert.equal(b.letter.lines, null);
    assert.deepEqual(b.letter.mistWriting, []);
    for (const line of LINES) assert.equal(JSON.stringify(b.letter).includes(line), false, `the delivered session letter does not contain “${line}”`);
    assert.match(await p.locator('#window-postman .receipt-state').textContent(), /^Incomplete: the picture is TERMINAL’s window, not the glass; its note stops at “PER—”\./);
    await unchanged(p, a, aJson);
    outcomes.push('A letter from a session-window capture (1366×768): asked once in its own words (“the picture is TERMINAL’s window, not the glass; its note stops at “PER—””), delivered as Incomplete with no words and none of Mara’s five lines anywhere in it; A unchanged.');
    await p.close();
  }

  // 6. A question never outlives what it describes.
  {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    const { a, aJson, at } = await deliverA(p);
    // a. Incomplete B asked about, then completed in CANVAS: nothing is sent; Send asks the true question.
    await resetLetter(p);
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    await bringForward(p, 'canvas');
    await p.click('#window-canvas [data-canvas="lift"]');
    await bringForward(p, 'postman');
    let q = await question(p);
    assert.equal(q.visible, false);
    assert.equal(q.notice, CHANGED);
    await clean(p, 'the letter changed after Send');
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).text, replaceText(at));
    await p.click('#window-postman [data-mail="keep-editing"]');
    // b. A Replace question, then the letter reset in CANVAS: nothing is sent; Send asks the combined question.
    await p.click('#window-postman [data-mail="send"]');
    await resetLetter(p);
    await bringForward(p, 'postman');
    assert.equal((await question(p)).notice, CHANGED);
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).text, combined(MIST, at));
    // c. The recipient changed with the question open: it closes; to Mara the letter is returned, with no question.
    await p.click('#window-postman [data-mail="to-mara"]');
    assert.equal((await question(p)).visible, false);
    await p.click('#window-postman [data-mail="send"]');
    let save = await caseSave(p);
    assert.equal(save.mail.deliveries.at(-1).route, 'returned');
    assert.equal(save.mail.intended, a.id, 'a returned letter changes nothing for the job');
    // d. The message typed with the question open: it closes.
    await p.click('#window-postman [data-mail="open-draft"]');
    await p.click('#window-postman [data-mail="to-guest"]');
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).visible, true);
    await p.locator('#window-postman [data-field="message"]').fill('For you.');
    assert.equal((await question(p)).visible, false);
    // e. The session finished in TERMINAL with the question open: POSTMAN says so; the next Send is a copy.
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).text, combined(MIST, at));
    await bringForward(p, 'terminal');
    await p.click('#window-terminal [data-finish]');
    await p.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
    await glassIdle(p);
    await bringForward(p, 'postman');
    q = await question(p);
    assert.equal(q.visible, false);
    assert.equal(q.notice, FINISHED);
    const before = await count(p);
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).text, copyText(MIST));
    await p.click('#window-postman [data-mail="send-anyway"]');
    save = await caseSave(p);
    assert.equal(save.mail.deliveries.length, before + 1);
    assert.equal(save.ack.deliveryId, a.id);
    assert.equal(await p.locator('#window-postman .receipt-state').textContent(), 'Another copy, sent after the session finished. The job keeps the letter it accepted.');
    await unchanged(p, a, aJson);
    outcomes.push(`Answers bound to their attempt (1366×768): completing B in CANVAS, resetting a complete B, changing the recipient, typing a message and finishing the session in TERMINAL each closed the open question without sending (POSTMAN said “${CHANGED}” or “${FINISHED}”, or nothing for edits made in POSTMAN); the next Send asked about what would then happen: Replace, the combined question, nothing for Mara (returned), and an incomplete copy after the end, which arrived as a Copy while A stayed accepted.`);
    await p.close();
  }

  // 7. A double click on the answer delivers once.
  {
    const p = await open({ viewport: PC_SIZES[2] });
    const { a, aJson } = await deliverA(p);
    await resetLetter(p);
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    await p.dblclick('#window-postman [data-mail="send-anyway-replace"]');
    await p.waitForTimeout(300);
    assert.equal(await count(p), 2, 'one delivery for a double click');
    await unchanged(p, a, aJson);
    outcomes.push('A double click on Send anyway and replace (1920×1080) delivered exactly one letter.');
    await p.close();
  }

  // 8. Each question at the three PC sizes, and at POSTMAN's minimum, audited for layout and drawn text.
  const shots = [];
  for (const viewport of PC_SIZES) {
    const tag = `${viewport.width}x${viewport.height}`;
    const p = await open({ viewport, init: [installTextProbe] });
    const shot = async (name, inView = false) => {
      const label = `${tag} ${name}`;
      // Screenshots first, so a failure below can be looked at.
      await p.screenshot({ path: `${dir}/${tag}-${name}.png` });
      await p.locator('#window-postman .reading-pane').screenshot({ path: `${dir}/${tag}-${name}-pane.png` });
      await clean(p, label);
      if (inView) assert.equal(await buttonsInView(p), true, `${label}: every button is in view without scrolling`);
      shots.push(label);
    };
    // Incomplete, nothing complete held.
    await reachGlass(p);
    await terminal(p).back();
    await frameHand(p);
    await p.click('#window-echo [data-echo="capture"]');
    await p.click('#window-echo [data-echo="use"]');
    await settled(p, 'canvas');
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).text, incompleteText(MIST));
    await shot('incomplete', true);
    await p.click('#window-postman [data-mail="keep-editing"]');
    await bringForward(p, 'canvas');
    await p.click('#window-canvas [data-canvas="lift"]');
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    const a = (await caseSave(p)).mail.deliveries.at(-1), at = await clockOf(p, a.at);
    // Replace, then the combined question.
    await bringForward(p, 'canvas');
    await p.click('#window-canvas [data-choice="paper"] label:has(input[value="night"])');
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).text, replaceText(at));
    await shot('replace', true);
    await p.click('#window-postman [data-mail="keep-editing"]');
    await resetLetter(p);
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).text, combined(MIST, at));
    await shot('combined', true);
    await p.click('#window-postman [data-mail="keep-editing"]');
    // POSTMAN at its minimum: the combined question, the replace question, and an incomplete copy after the end.
    await toMinimum(p, 'postman');
    await p.click('#window-postman [data-mail="send"]');
    await shot('minimum-combined', true);
    await p.click('#window-postman [data-mail="keep-editing"]');
    await bringForward(p, 'canvas');
    await p.click('#window-canvas [data-canvas="lift"]');
    await bringForward(p, 'postman');
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).text, replaceText(at));
    await shot('minimum-replace', true);
    await p.click('#window-postman [data-mail="keep-editing"]');
    await bringForward(p, 'terminal');
    await p.click('#window-terminal [data-finish]');
    await p.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
    await glassIdle(p);
    await resetLetter(p);
    await bringForward(p, 'postman');
    await p.click('#window-postman [data-mail="send"]');
    assert.equal((await question(p)).text, copyText(MIST));
    await shot('minimum-copy', true);
    await p.close();
  }
  outcomes.push(`Each question audited with no layout or drawn-text problem and every button in view without scrolling: ${shots.length} states (${shots.join('; ')}).`);
} finally {
  await browser.close();
  await finish();
}
