import assert from 'node:assert/strict';
import { PC_SIZES, caseSave, frameHand, glassIdle, reachGlass, settled, start, terminal } from './haunt-helpers.mjs';
// Typing in POSTMAN (.kiro/specs/fluid-typing-v9) with real keys, pointer and clipboard: what is typed is exactly what the
// draft, the save, Send and a reload hold; editing, selection, paste and the field's own Undo keep working; while a key
// is typed in Message no other window changes or draws, and POSTMAN's letter is not drawn again; a real change of the
// case still reaches every window, minimized or not; questions, storage failures, A/B and copies stay honest.

const { browser, outcomes, open, finish } = await start('fluid-typing');

/**
 * Counts DOM mutation records and canvas drawing calls by window (window.__typing): during each input event in a POSTMAN
 * field (from a capture listener on window to a bubble listener on window: everything a key made the page do at once), and
 * in total while recording. The taskbar clock is not counted: it changes on its own every 30 seconds.
 */
const instrument = () => {
  const state = window.__typing = { recording: false, total: { mutations: {}, draws: {} }, events: { mutations: {}, draws: {}, count: 0 }, inEvent: false };
  const bump = (bag, id) => { bag[id] = (bag[id] ?? 0) + 1; };
  const where = el => {
    if (!el || !el.isConnected) return 'detached';
    const win = el.closest?.('.window');
    if (win) return win.id.replace('window-', '');
    return el.closest?.('#taskbar') ? 'taskbar' : 'desktop';
  };
  const count = (kind, id) => { if (!state.recording) return; bump(state.total[kind], id); if (state.inEvent) bump(state.events[kind], id); };
  for (const name of ['drawImage', 'putImageData', 'fillRect', 'clearRect', 'fillText', 'strokeText', 'fill', 'stroke']) {
    const original = CanvasRenderingContext2D.prototype[name];
    CanvasRenderingContext2D.prototype[name] = function (...args) { count('draws', this.canvas.isConnected ? where(this.canvas) : 'offscreen'); return original.apply(this, args); };
  }
  const take = records => { for (const r of records) { const target = r.target.nodeType === 1 ? r.target : r.target.parentElement; if (!target?.closest?.('.tray-clock')) count('mutations', where(target)); } };
  const observer = new MutationObserver(take);
  const observe = () => observer.observe(document, { childList: true, subtree: true, attributes: true, characterData: true });
  if (document.documentElement) observe(); else document.addEventListener('readystatechange', observe, { once: true });
  const field = event => !!event.target?.closest?.('#window-postman') && ['to', 'subject', 'message'].includes(event.target.dataset?.field);
  window.addEventListener('input', event => { if (!field(event)) return; take(observer.takeRecords()); state.inEvent = true; }, true);
  window.addEventListener('input', event => { if (!field(event) || !state.inEvent) return; take(observer.takeRecords()); state.inEvent = false; if (state.recording) state.events.count++; });
  window.__typingStart = () => {
    observer.takeRecords();
    state.total = { mutations: {}, draws: {} }; state.events = { mutations: {}, draws: {}, count: 0 }; state.recording = true;
  };
  window.__typingStop = () => { take(observer.takeRecords()); state.recording = false; return { total: state.total, events: state.events }; };
};
const record = page => page.evaluate(() => window.__typingStart());
const stop = page => page.evaluate(() => window.__typingStop());
/**
 * Waits until the page is quiet: no toast left, and nothing changes or draws for 600 ms (CANVAS's Lift animation, for
 * one, runs 600 ms after its press). Work measured afterwards is the keys', not an animation's.
 */
async function quiet(page) {
  await page.waitForFunction(() => !document.querySelector('#toasts .toast'), null, { timeout: 15000 });
  for (let tries = 0; tries < 20; tries++) {
    await record(page);
    await page.waitForTimeout(600);
    const { total } = await stop(page);
    if (!Object.keys(total.mutations).length && !Object.keys(total.draws).length) return;
  }
  throw new Error('the page did not become quiet');
}
const message = page => page.locator('#window-postman [data-field="message"]');
const draft = async page => (await caseSave(page)).mail.draft;
/** The taskbar shows which window the model treats as active (aria-pressed). */
const forward = async (page, id) => { if (await page.locator(`#btn-${id}`).getAttribute('aria-pressed') !== 'true') await page.click(`#btn-${id}`); await settled(page, id); };
const letterPixels = page => page.locator('#window-postman .draft-letter').evaluate(canvas => canvas.toDataURL());
const sum = bag => Object.values(bag).reduce((a, b) => a + b, 0);
async function toDraft(page) {
  await reachGlass(page);
  await terminal(page).back();
  await frameHand(page);
  await page.click('#window-echo [data-echo="capture"]');
  await page.click('#window-echo [data-echo="use"]');
  await settled(page, 'canvas');
  await page.click('#window-canvas [data-canvas="lift"]');
  await page.click('#window-canvas [data-canvas="compose"]');
  await settled(page, 'postman');
}
/** The field's own value, the draft in the model's save and the caret, after an edit. */
async function same(page, label, expected) {
  const field = message(page);
  const value = await field.inputValue();
  if (expected !== undefined) assert.equal(value, expected, `${label}: the field holds what was typed`);
  assert.equal((await draft(page)).message, value, `${label}: the saved draft holds exactly the field's text`);
  return value;
}

try {
  const p = await open({ viewport: PC_SIZES[0], init: [instrument] });
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await toDraft(p);
  const field = message(p);

  // 1. Editing in Message with every program open: keys, the caret in the middle, a selection replaced, Backspace, the
  // field's own Undo, paste near the limit, Unicode. Recorded: what the other windows and POSTMAN's letter did meanwhile.
  const before = await letterPixels(p);
  await field.click();
  await quiet(p);
  await record(p);
  await field.pressSequentially('Hello');
  await same(p, 'typed', 'Hello');
  await p.keyboard.press('ArrowLeft');
  await p.keyboard.press('ArrowLeft');
  await p.keyboard.type('X');
  await same(p, 'typed in the middle', 'HelXlo');
  assert.equal(await field.evaluate(el => el.selectionStart), 4, 'the caret stays where the key was typed');
  await p.keyboard.press('Shift+ArrowLeft');
  await p.keyboard.press('Shift+ArrowLeft');
  await p.keyboard.press('Shift+ArrowLeft');
  await p.keyboard.type('i');
  await same(p, 'a selection replaced', 'Hilo');
  await p.keyboard.press('Backspace');
  await same(p, 'Backspace', 'Hlo');
  await p.keyboard.press('Control+z');
  const undone = await same(p, 'the field\'s own Undo');
  assert.notEqual(undone, 'Hlo', 'Ctrl+Z in the field undoes the field\'s last edit');
  const typing = await stop(p);
  // Paste near the limit: 590 characters there, 20 pasted at the end; the field keeps its 600.
  await field.fill('p'.repeat(590));
  await field.press('Control+End');
  let pasted = 'clipboard';
  try { await p.evaluate(text => navigator.clipboard.writeText(text), 'ABCDEFGHIJKLMNOPQRST'); await p.keyboard.press('Control+v'); }
  catch { pasted = 'insertText'; await p.keyboard.insertText('ABCDEFGHIJKLMNOPQRST'); }
  await same(p, 'pasted at the limit', `${'p'.repeat(590)}ABCDEFGHIJ`);
  const unicode = 'Für dich — 幽霊の手紙 👻 مرحبا e\u0301';
  await field.fill('');
  await field.pressSequentially(unicode);
  await same(p, 'Unicode typed key by key', unicode);
  // What POSTMAN shows of the other fields still follows each key: the Drafts row's subject and recipient, and the
  // address suggestion that the typed recipient matches.
  const subject = p.locator('#window-postman [data-field="subject"]'), to = p.locator('#window-postman [data-field="to"]');
  const row = p.locator('#window-postman .message-item[data-message="draft"]');
  await subject.click();
  await subject.press('End');
  await subject.pressSequentially(', typed');
  assert.equal(await row.locator('.item-subject').textContent(), 'For the next person at this desk, typed', 'the Drafts row shows the subject as typed');
  await to.click();
  await to.pressSequentially('gues');
  assert.equal(await p.locator('#window-postman [data-mail="to-guest"]').getAttribute('aria-pressed'), 'false');
  await to.pressSequentially('t');
  assert.equal(await row.locator('.item-who').textContent(), 'To: guest', 'the Drafts row shows the recipient as typed');
  assert.equal(await p.locator('#window-postman [data-mail="to-guest"]').getAttribute('aria-pressed'), 'true', 'the guest suggestion shows as chosen once “guest” is typed');
  assert.deepEqual([(await draft(p)).subject, (await draft(p)).to], ['For the next person at this desk, typed', 'guest']);
  await to.fill('');
  await subject.fill('For the next person at this desk');
  await field.click();
  // During the keys' own input events, and in total while recording: nothing outside POSTMAN changed, nothing was drawn.
  for (const [when, bag] of [['during the input events', typing.events], ['while recording', typing.total]]) {
    assert.deepEqual(Object.keys(bag.mutations).filter(id => id !== 'postman'), [], `${when}, no other window or the desktop changed: ${JSON.stringify(bag.mutations)}`);
    assert.equal(sum(bag.draws), 0, `${when}, nothing was drawn: ${JSON.stringify(bag.draws)}`);
  }
  // Hello (5), X, i (over the selection), Backspace and Ctrl+Z: one input event each.
  assert.equal(typing.events.count, 9, 'the keys\' input events were all counted');
  assert.equal(await letterPixels(p), before, 'POSTMAN\'s attached letter is the same picture after the typing');
  outcomes.push(`Message with the four programs open (1366×768): keys, a key typed in the middle (the caret stays), a selection replaced, Backspace, the field's own Undo (Ctrl+Z gave “${undone}”), a paste at the limit (${pasted}: 590 + 20 kept as 600) and Unicode typed key by key: after every step the saved draft equals the field. During the ${typing.events.count} input events of the edits and around them, POSTMAN's own mutation records were ${typing.total.mutations.postman ?? 0}, no other window or the desktop changed, nothing was drawn, and the attached letter kept its pixels.`);
  outcomes.push('Keys typed in Subject and To still update what POSTMAN shows of them, key by key: the Drafts row\'s subject and recipient, and the guest suggestion once “guest” is typed; the saved draft follows.');

  // 2. A real change of the letter still reaches POSTMAN: the attached letter is drawn again, and only then.
  await forward(p, 'canvas');
  await p.click('#window-canvas [data-choice="paper"] label:has(input[value="night"])');
  await forward(p, 'postman');
  const night = await letterPixels(p);
  assert.notEqual(night, before, 'a paper change in CANVAS redraws POSTMAN\'s attached letter');
  assert.match(await p.locator('#window-postman .draft-attachment figcaption').textContent(), /^The letter from CANVAS, as it is now\./);
  outcomes.push('A real change of the letter (Night paper in CANVAS) redraws POSTMAN\'s attached letter (its pixels changed); typing alone never did.');

  // 3. The last key, then Send at once: by keyboard (Ctrl+Enter), exactly what was typed is delivered.
  await p.click('#window-postman [data-mail="to-guest"]');
  await field.fill('');
  await field.pressSequentially('A, sent right after its last key: Z');
  await field.press('Control+Enter');
  await p.locator('#window-postman [data-mail="return"]').waitFor();
  const save1 = await caseSave(p);
  const a = save1.mail.deliveries.at(-1);
  assert.equal(a.message, 'A, sent right after its last key: Z', 'Ctrl+Enter right after the last key sends exactly what was typed');
  const aJson = JSON.stringify(a);
  outcomes.push('The last key followed at once by Ctrl+Enter: letter A is delivered with exactly the typed message.');

  // 4. Draft B: typed, POSTMAN closed and reopened, the page reloaded: the same text each time.
  await forward(p, 'canvas');
  await p.click('#window-canvas [data-canvas="compose"]');
  await settled(p, 'postman');
  await p.click('#window-postman [data-mail="to-guest"]');
  await field.click();
  await field.pressSequentially('B: typed, then POSTMAN closed');
  await p.click('#window-postman [data-window="close"]');
  await p.locator('#window-postman').waitFor({ state: 'detached' });
  await p.click('#btn-postman');
  await settled(p, 'postman');
  assert.equal(await message(p).inputValue(), 'B: typed, then POSTMAN closed', 'reopened POSTMAN shows the draft as typed');
  await message(p).click();
  await message(p).press('End');
  await message(p).pressSequentially(' and reopened');
  await p.reload();
  await p.locator('#window-terminal').waitFor();
  await settled(p, 'terminal');
  await p.click('#btn-postman');
  await settled(p, 'postman');
  assert.equal(await message(p).inputValue(), 'B: typed, then POSTMAN closed and reopened', 'after a reload the draft is exactly as typed');
  assert.equal(JSON.stringify((await caseSave(p)).mail.deliveries.find(item => item.id === a.id)), aJson, 'A is unchanged while B is typed');
  outcomes.push('Draft B typed, POSTMAN closed and reopened, more typed, the page reloaded: the field and the save hold exactly what was typed; delivered A is byte-identical.');

  // 5. A question about B, then a key typed: it closes and nothing is sent. Asked again, then the letter changes in
  // CANVAS before the answer: it closes and says why. The programs are minimized meanwhile; the answer then delivers B,
  // and every program shows it when restored.
  for (const id of ['echo', 'canvas', 'terminal']) {
    if (!await p.locator(`#window-${id}`).count()) { await p.click(`#btn-${id}`); await settled(p, id); }
  }
  // ECHO on its Captures tab, where it marks the capture that is in the letter.
  await forward(p, 'echo');
  await p.click('#window-echo [role="tab"][data-tab="captures"]');
  await forward(p, 'postman');
  await p.click('#window-postman [data-mail="send"]');
  await p.locator('#window-postman [data-mail="replace"]').waitFor();
  await message(p).click();
  await message(p).press('End');
  await message(p).pressSequentially('!');
  assert.equal(await p.locator('#window-postman .mail-confirm').isHidden(), true, 'a key typed while the question is open closes it');
  assert.equal((await caseSave(p)).mail.deliveries.length, 1, 'nothing was sent');
  await p.click('#window-postman [data-mail="send"]');
  await p.locator('#window-postman [data-mail="replace"]').waitFor();
  await forward(p, 'canvas');
  await p.click('#window-canvas [data-choice="paper"] label:has(input[value="bone"])');
  await forward(p, 'postman');
  assert.equal(await p.locator('#window-postman .mail-confirm').isHidden(), true, 'a letter change in CANVAS closes the question');
  assert.match(await p.locator('#window-postman .mail-notice').textContent(), /^The letter changed after you pressed Send, so nothing was sent\./);
  assert.equal((await caseSave(p)).mail.deliveries.length, 1, 'nothing was sent');
  for (const id of ['terminal', 'echo', 'canvas']) { await forward(p, id); await p.click(`#window-${id} [data-window="minimize"]`); }
  await p.waitForFunction(() => ['terminal', 'echo', 'canvas'].every(id => getComputedStyle(document.getElementById(`window-${id}`)).display === 'none'));
  await forward(p, 'postman');
  await p.click('#window-postman [data-mail="send"]');
  await p.click('#window-postman [data-mail="replace"]');
  await p.locator('#window-postman [data-mail="return"]').waitFor();
  const save2 = await caseSave(p);
  const b = save2.mail.deliveries.at(-1);
  assert.equal(b.message, 'B: typed, then POSTMAN closed and reopened!', 'B is delivered with exactly its typed message');
  assert.equal(JSON.stringify(save2.mail.deliveries.find(item => item.id === a.id)), aJson, 'A is still byte-identical (now marked replaced)');
  await p.click('#btn-canvas');
  await settled(p, 'canvas');
  assert.match(await p.locator('#window-canvas .canvas-ready').textContent(), /This is the letter you sent\.$/, 'CANVAS, restored, shows the send made while it was minimized');
  await p.click('#btn-terminal');
  await settled(p, 'terminal');
  assert.equal(await p.locator('#window-terminal .receipt-card').isVisible(), true, 'TERMINAL, restored, shows the receipt that arrived while it was minimized');
  assert.match(await p.locator('#window-terminal .receipt-detail').textContent(), /This is the letter you sent\./);
  await p.click('#btn-echo');
  await settled(p, 'echo');
  assert.match(await p.locator('#window-echo .capture-item[aria-current="true"]').getAttribute('aria-label'), /in the letter/, 'ECHO, restored, still marks the capture in the letter');
  outcomes.push('A question about B: a key typed closes it (nothing sent); asked again, a letter change in CANVAS closes it and says why (nothing sent). With TERMINAL, ECHO and CANVAS minimized, the answer delivers exactly B; A stays byte-identical; restored, CANVAS says it is the letter sent, TERMINAL shows its receipt and ECHO marks the capture in the letter.');

  // 6. Finish session, then a copy typed with storage blocked and then readable again: Session only and Draft saved at
  // the right moments, in the tray and in CANVAS; the reload reads the last key; the copy leaves the accepted letter as it was.
  await forward(p, 'postman');
  await p.click('#window-postman [data-mail="return"]');
  await settled(p, 'terminal');
  await p.click('#window-terminal [data-finish]');
  await p.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
  await glassIdle(p);
  await forward(p, 'canvas');
  await p.click('#window-canvas [data-canvas="compose"]');
  await settled(p, 'postman');
  await p.click('#window-postman [data-mail="to-guest"]');
  await p.evaluate(() => {
    window.__setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) { if (key === 'haunt.case.v4') throw new DOMException('blocked', 'QuotaExceededError'); return window.__setItem.call(this, key, value); };
  });
  await message(p).click();
  await message(p).pressSequentially('C');
  assert.equal(await p.locator('.tray-session-only').isVisible(), true, 'the tray says Session only as soon as a key could not be saved');
  assert.equal(await p.locator('#window-canvas .canvas-saved').textContent(), 'Session only', 'CANVAS says Session only too, although the key was typed in POSTMAN');
  await message(p).pressSequentially('op');
  await p.evaluate(() => { Storage.prototype.setItem = window.__setItem; });
  await message(p).pressSequentially('y');
  assert.equal(await p.locator('.tray-session-only').isHidden(), true, 'the next key saved: Session only goes');
  assert.equal(await p.locator('#window-canvas .canvas-saved').textContent(), 'Draft saved');
  await p.reload();
  await p.locator('#window-terminal').waitFor();
  await settled(p, 'terminal');
  await p.click('#btn-postman');
  await settled(p, 'postman');
  assert.equal(await message(p).inputValue(), 'Copy', 'after the reload, the draft holds every key, including those typed while storage was blocked');
  await p.click('#window-postman [data-mail="send"]');
  await p.locator('#window-postman .reading-pane[data-view="delivery"]').waitFor();
  const save3 = await caseSave(p);
  assert.equal(save3.ack.deliveryId, b.id, 'the job keeps the letter it accepted');
  assert.equal(JSON.stringify(save3.mail.deliveries.find(item => item.id === b.id)), JSON.stringify(save2.mail.deliveries.find(item => item.id === b.id)), 'the accepted letter is byte-identical');
  assert.equal(save3.mail.deliveries.at(-1).message, 'Copy');
  assert.match(await p.locator('#window-postman .receipt-state').textContent(), /^Another copy, sent after the session finished\./);
  outcomes.push('After Finish session, a copy typed with storage blocked: the first key turns on Session only in the tray and in CANVAS; with storage back, the next key turns it off (Draft saved). After a reload the draft holds all four keys; sent, it is a Copy and the accepted letter B is byte-identical.');

  // 7. Only POSTMAN open: typing still saves every key; the programs reopened show the current case.
  await forward(p, 'canvas');
  await p.click('#window-canvas [data-canvas="compose"]');
  await settled(p, 'postman');
  for (const id of ['terminal', 'echo', 'canvas']) {
    if (!await p.locator(`#window-${id}`).count()) continue;
    await forward(p, id);
    await p.click(`#window-${id} [data-window="close"]`);
    await p.locator(`#window-${id}`).waitFor({ state: 'detached' });
  }
  await forward(p, 'postman');
  await message(p).click();
  await quiet(p);
  await record(p);
  await message(p).pressSequentially('Only POSTMAN open');
  const alone = await stop(p);
  await same(p, 'only POSTMAN', 'Only POSTMAN open');
  for (const id of ['terminal', 'canvas']) { await p.click(`#btn-${id}`); await settled(p, id); }
  assert.match(await p.locator('#window-terminal .receipt-title').textContent(), /^Session finished$/, 'TERMINAL reopened shows the finished case');
  assert.match(await p.locator('#window-canvas .canvas-ready').textContent(), /The job keeps the letter it accepted/, 'CANVAS reopened shows the case after the end');
  assert.equal(sum(alone.total.draws), 0, 'nothing was drawn while typing');
  outcomes.push(`Only POSTMAN open: every key saved (the save equals the field); ${alone.total.mutations.postman ?? 0} mutation records in POSTMAN, nothing drawn. TERMINAL and CANVAS reopened show the finished case.`);
  await p.close();
} finally {
  await browser.close();
  await finish({ browser: process.env.HAUNT_CHANNEL ?? 'chrome' });
}
