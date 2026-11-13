import assert from 'node:assert/strict';
import { PC_SIZES, auditLayout, caseSave, frameHand, glassIdle, reachGlass, settled, start, terminal } from './haunt-helpers.mjs';
import { auditDrawnText, installTextProbe } from './drawn-text-audit.mjs';
// POSTMAN's free text (.kiro/specs/free-text-v8): text the interface accepts (Subject 120, Message 600, To 80 characters)
// entered into the real fields (Playwright's fill; key by key for the main case at 1366×768) and sent with real input.
// Each state is measured in the page: nothing wider than its pane, every part of the message inside it, the letter at its
// shape, the text shown and stored exactly as entered, the actions reachable, the case finishing. Negative controls show
// the audit still reports this class of defect.

const { browser, outcomes, open, finish } = await start('free-text');
const browserVersion = browser.version();
const TEXTS = {
  longSubject: 'W'.repeat(120),
  longMessage: 'abcdef'.repeat(100),
  spacedSubject: 'Found on the desk at midnight: a photograph of the glass, a hand, a figure and a note for whoever sits here next.',
  spacedMessage: Array.from({ length: 12 }, (_, i) => `Line ${i + 1}: the glass kept a hand, a figure and a note for the next person.`).join('\n').slice(0, 600),
  unicodeSubject: 'Für dich — 幽霊の手紙 👻 مرحبا',
  unicodeMessage: 'Ça marche: ñ, ü, ß; 漢字かな; 👻🕯️; عربى; עברית; e\u0301 (combining)',
  longTo: 'x'.repeat(80),
};
const DEFAULT_SUBJECT = 'For the next person at this desk';
const checked = [];

const bringForward = async (page, id) => { if (!await page.locator(`#window-${id}.is-active`).count()) await page.click(`#btn-${id}`); await settled(page, id); };
async function toMinimum(page, id) {
  const win = page.locator(`#window-${id}`), r = await win.boundingBox(), handle = await win.locator('.window-resize[data-edge="se"]').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + 20, r.y + 60, { steps: 10 });
  await page.mouse.up();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(250);
}
const toggleMaximize = async (page, id) => { await page.click(`#window-${id} [data-window="maximize"]`); await page.mouse.move(2, 2); await page.waitForTimeout(400); };
/** The main route up to a letter in CANVAS, then Compose and the draft's fields filled through the real form. */
async function composeWith(page, { subject = null, message = null, to = 'guest@haunt', lift = true, typed = false } = {}) {
  await reachGlass(page);
  await terminal(page).back();
  await frameHand(page);
  await page.click('#window-echo [data-echo="capture"]');
  await page.click('#window-echo [data-echo="use"]');
  await settled(page, 'canvas');
  if (lift) await page.click('#window-canvas [data-canvas="lift"]');
  await page.click('#window-canvas [data-canvas="compose"]');
  await settled(page, 'postman');
  await fill(page, { subject, message, to, typed });
}
/** Playwright's fill() inserts the text into the real field at once; `typed` presses one key per character instead. Each
 * key updates the draft, so typing 601 keys takes tens of seconds, more under HAUNT_CPU_THROTTLE: the time is recorded,
 * and the timeout is a harness limit, not a product expectation. */
const typing = {};
async function fill(page, { subject = null, message = null, to = null, typed = false }) {
  const enter = async (field, value) => {
    const input = page.locator(`#window-postman [data-field="${field}"]`);
    if (!typed) { await input.fill(value); return; }
    await input.fill('');
    const t0 = Date.now();
    await input.pressSequentially(value, { timeout: 300_000 });
    typing[field] = { keys: value.length, seconds: Math.round((Date.now() - t0) / 100) / 10 };
  };
  if (subject !== null) await enter('subject', subject);
  if (message !== null) await enter('message', message);
  if (to !== null) await enter('to', to);
}
const sendAndOpen = async page => { await page.click('#window-postman [data-mail="send"]'); await page.locator('#window-postman .reading-pane[data-view="delivery"]').waitFor(); };

/** Everything the reading pane and the list show, measured: what lies outside its pane, the letter, the texts. */
const measure = page => page.evaluate(() => {
  const pane = document.querySelector('#window-postman .reading-pane'), list = document.querySelector('#window-postman .message-list');
  const box = el => { const b = el.getBoundingClientRect(); return { left: b.left + el.clientLeft, right: b.left + el.clientLeft + el.clientWidth }; };
  const pb = box(pane), lb = box(list);
  const visible = el => !!el && !el.closest('[hidden]') && el.getBoundingClientRect().width > 0;
  const outside = (els, b) => els.filter(visible).filter(el => { const r = el.getBoundingClientRect(); return r.left < b.left - 0.5 || r.right > b.right + 0.5; })
    .map(el => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}${el.dataset.mail ? `[${el.dataset.mail}]` : ''}`);
  const parts = [...pane.querySelectorAll('.mail-receipt, .receipt-state, .mail-head h3, .mail-head dt, .mail-head dd, .mail-message, .mail-notice, .mail-confirm, .draft-field, .mail-letter, .mail-letter-canvas, button')];
  const item = list.querySelector('.message-item[aria-current="true"]') ?? list.querySelector('.message-item');
  const row = item ? [...item.querySelectorAll('.item-who, .item-when, .item-subject, .item-badge')] : [];
  const canvas = [...pane.querySelectorAll('.mail-letter-canvas')].find(visible);
  const message = pane.querySelector('.mail-message');
  const lineBoxes = el => { const range = document.createRange(); range.selectNodeContents(el); return new Set([...range.getClientRects()].map(r => Math.round(r.top))).size; };
  return {
    pane: { clientWidth: pane.clientWidth, scrollWidth: pane.scrollWidth }, list: { clientWidth: list.clientWidth, scrollWidth: list.scrollWidth, scrollHeight: list.scrollHeight, clientHeight: list.clientHeight, tabIndex: list.tabIndex, scrolls: list.dataset.scrolls === 'true' },
    outsidePane: outside(parts, pb), outsideList: outside(row, lb),
    canvas: canvas ? { width: canvas.getBoundingClientRect().width, shape: canvas.getBoundingClientRect().width / canvas.getBoundingClientRect().height, aspect: Number(canvas.style.aspectRatio.split('/')[0]) / Number(canvas.style.aspectRatio.split('/')[1] ?? 1) } : null,
    heading: pane.querySelector('.mail-head h3')?.textContent ?? null,
    message: message && !message.hidden ? { text: message.textContent, lines: lineBoxes(message) } : null,
    itemText: item?.textContent ?? null,
  };
});
/** Contained, shaped, whole, audited. `expect` names what the delivery view must show. */
async function contained(page, label, expect = {}) {
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
  const m = await measure(page);
  assert.ok(m.pane.scrollWidth <= m.pane.clientWidth + 1, `${label}: the reading pane is ${m.pane.clientWidth} px wide and scrolls to ${m.pane.scrollWidth}`);
  assert.ok(m.list.scrollWidth <= m.list.clientWidth + 1, `${label}: the list is ${m.list.clientWidth} px wide and scrolls to ${m.list.scrollWidth}`);
  assert.deepEqual(m.outsidePane, [], `${label}: inside the reading pane`);
  assert.deepEqual(m.outsideList, [], `${label}: the row inside the list`);
  if (m.list.scrollHeight > m.list.clientHeight + 1) assert.equal(m.list.tabIndex, 0, `${label}: a list that scrolls is a keyboard region`);
  if (m.canvas) {
    assert.ok(Math.abs(m.canvas.shape - m.canvas.aspect) < 0.02, `${label}: the letter keeps its shape (${m.canvas.shape.toFixed(3)} for ${m.canvas.aspect})`);
    assert.ok(m.canvas.width <= 560.5, `${label}: the letter is at most 560 px wide (${m.canvas.width})`);
  }
  if (expect.subject !== undefined) {
    assert.equal(m.heading, expect.subject, `${label}: the heading is the whole subject`);
    assert.ok(m.itemText.includes(expect.subject), `${label}: the list row holds the whole subject`);
    assert.equal(await page.getByRole('button', { name: expect.subject, exact: false }).count() > 0, true, `${label}: the row's accessible name holds the whole subject`);
  }
  if (expect.message !== undefined) {
    if (expect.message === '') assert.equal(m.message, null, `${label}: no message, nothing shown`);
    else {
      assert.equal(m.message.text, expect.message, `${label}: the message is shown whole, as typed`);
      assert.ok(m.message.lines >= expect.message.split('\n').length, `${label}: its ${expect.message.split('\n').length} lines are kept (${m.message.lines} line boxes)`);
    }
  }
  const dom = (await auditLayout(page, label)).problems, drawn = (await auditDrawnText(page, label)).problems;
  assert.deepEqual(dom, [], `${label}: layout — ${JSON.stringify(dom.slice(0, 4))}`);
  assert.deepEqual(drawn, [], `${label}: drawn text — ${JSON.stringify(drawn.slice(0, 3))}`);
  checked.push(label);
  return m;
}
const stored = async (page, subject, message) => {
  const d = (await caseSave(page)).mail.deliveries.at(-1);
  assert.equal(d.subject, subject, 'the stored subject is exactly what was entered');
  assert.equal(d.message, message, 'the stored message is exactly what was entered');
  return d;
};
const finishCase = async page => {
  await page.click('#window-postman [data-mail="return"]');
  await settled(page, 'terminal');
  await page.click('#window-terminal [data-finish]');
  await page.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
  await glassIdle(page);
};

try {
  // 1. Review 29's case: both fields at their limits, unbroken. Three sizes; POSTMAN as it opens, maximized, at its
  // minimum; Sent; then Return to the request by pointer, Finish session, a reload, and the delivery shown again.
  // At 1366×768 the text is typed one key per character, one character past each limit: the fields keep 120 and 600.
  for (const viewport of PC_SIZES) {
    const tag = `${viewport.width}×${viewport.height}`, typed = viewport === PC_SIZES[0];
    const p = await open({ viewport, init: [installTextProbe] });
    const expect = { subject: TEXTS.longSubject, message: TEXTS.longMessage };
    if (typed) {
      await composeWith(p, { subject: `${TEXTS.longSubject}W`, message: `${TEXTS.longMessage}x`, typed: true });
      assert.equal(await p.locator('#window-postman [data-field="subject"]').inputValue(), TEXTS.longSubject, 'typing a 121st character leaves the subject at its 120');
      assert.equal(await p.locator('#window-postman [data-field="message"]').inputValue(), TEXTS.longMessage, 'typing a 601st character leaves the message at its 600');
    } else await composeWith(p, expect);
    await sendAndOpen(p);
    const a = await stored(p, TEXTS.longSubject, TEXTS.longMessage);
    const at = await contained(p, `${tag} both, as it opens`, expect);
    await toggleMaximize(p, 'postman');
    const big = await contained(p, `${tag} both, maximized`, expect);
    await toggleMaximize(p, 'postman');
    await toMinimum(p, 'postman');
    const small = await contained(p, `${tag} both, minimum`, expect);
    await p.click('#window-postman [data-box="sent"]');
    await contained(p, `${tag} both, Sent, minimum`, expect);
    await p.click('#window-postman [data-box="guest"]');
    await finishCase(p);
    await p.reload();
    await p.locator('#window-terminal').waitFor();
    await settled(p, 'terminal');
    assert.equal((await caseSave(p)).ack.deliveryId, a.id, 'a reload keeps the end');
    await bringForward(p, 'postman');
    await p.click('#window-postman [data-box="guest"]');
    await contained(p, `${tag} both, after Finish and a reload`, expect);
    outcomes.push(`${tag}: Subject 120 × W and Message 600 unbroken characters, ${typed ? `typed one key per character (one past each limit: the fields kept 120 and 600; ${typing.subject.keys} keys in ${typing.subject.seconds} s and ${typing.message.keys} in ${typing.message.seconds} s)` : 'entered in the fields (Playwright fill)'} and sent: inside the reading pane and the list as POSTMAN opens (pane ${at.pane.clientWidth} px, letter ${at.canvas.width.toFixed(0)} px), maximized (${big.pane.clientWidth} px, letter ${big.canvas.width.toFixed(0)} px) and at its minimum (${small.pane.clientWidth} px, letter ${small.canvas.width.toFixed(0)} px), in Guest Inbox and Sent; heading, row and message show the whole text; the letter keeps its 1.62 shape; the stored delivery is exactly what was typed; Return to the request and Finish session ended the case, and after a reload it was still finished and shown the same.`);
    await p.close();
  }

  // 2. One field at a time, ordinary long text with spaces and line breaks, Unicode, and the case's normal content.
  for (const [name, fields] of [
    ['the subject alone (120 × W)', { subject: TEXTS.longSubject }],
    ['the message alone (600 unbroken)', { message: TEXTS.longMessage }],
    ['long text with spaces and 8 line breaks', { subject: TEXTS.spacedSubject, message: TEXTS.spacedMessage }],
    ['a short Unicode sample', { subject: TEXTS.unicodeSubject, message: TEXTS.unicodeMessage }],
    ['the case’s normal content', {}],
  ]) {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    await composeWith(p, fields);
    await sendAndOpen(p);
    const expect = { subject: fields.subject ?? DEFAULT_SUBJECT, message: fields.message ?? '' };
    await stored(p, expect.subject, expect.message);
    await contained(p, `1366×768 ${name}, as it opens`, expect);
    await toMinimum(p, 'postman');
    await contained(p, `1366×768 ${name}, minimum`, expect);
    await p.close();
  }
  outcomes.push('1366×768, as POSTMAN opens and at its minimum: the subject alone, the message alone, long text with spaces and 8 line breaks (its lines kept), a short Unicode sample (accents, CJK, emoji, Arabic, Hebrew, a combining accent) and the case’s normal content are each shown whole, inside their panes, and stored exactly as entered.');

  // 3. Returned: a reply to Mara with both long fields; the Returned view; the draft kept for correction.
  {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    const expect = { subject: TEXTS.longSubject, message: TEXTS.longMessage };
    await composeWith(p, { ...expect, to: 'mara@haunt' });
    await p.click('#window-postman [data-mail="send"]');
    await p.locator('#window-postman [data-box="returned"][aria-current="true"]').waitFor();
    await stored(p, TEXTS.longSubject, TEXTS.longMessage);
    await contained(p, '1366×768 Returned, as it opens', expect);
    await toMinimum(p, 'postman');
    await contained(p, '1366×768 Returned, minimum', expect);
    await p.click('#window-postman [data-mail="open-draft"]');
    await contained(p, '1366×768 the kept draft, minimum');
    assert.equal(await p.locator('#window-postman [data-field="subject"]').inputValue(), TEXTS.longSubject, 'the draft keeps the whole subject');
    assert.equal(await p.locator('#window-postman [data-field="message"]').inputValue(), TEXTS.longMessage, 'the draft keeps the whole message');
    outcomes.push('Returned (1366×768): a reply to Mara with both long fields came back and its view is contained as POSTMAN opens and at its minimum; Open the draft shows the kept draft, whole and contained.');
    await p.close();
  }

  // 4. An unknown recipient of 80 characters: the notice repeats it; the draft's row shows it.
  {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    await composeWith(p, { to: TEXTS.longTo });
    await p.click('#window-postman [data-mail="send"]');
    assert.equal(await p.locator('#window-postman .mail-notice').textContent(), `There is no mailbox called “${TEXTS.longTo}” at this desk. The two here are mara@haunt and guest@haunt.`);
    await contained(p, '1366×768 notice for an 80-character address, as it opens');
    await toMinimum(p, 'postman');
    const m = await contained(p, '1366×768 notice for an 80-character address, minimum');
    assert.ok(m.itemText.includes(`To: ${TEXTS.longTo}`), 'the draft row shows the whole address');
    assert.equal((await caseSave(p)).mail.deliveries.length, 0, 'nothing was sent');
    outcomes.push('An unknown address of 80 characters (1366×768): POSTMAN’s notice repeats it whole and wraps it inside the draft editor, as it opens and at its minimum; the To, Subject and Message fields stay inside the window (in v7 they went outside it); nothing was sent.');
    await p.close();
  }

  // 5. An incomplete letter with long fields at POSTMAN's minimum: the actions by keyboard and by pointer, the message by
  // keyboard scrolling, then the letter fixed in CANVAS and the case finished.
  {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    const expect = { subject: TEXTS.longSubject, message: TEXTS.longMessage };
    await composeWith(p, { ...expect, lift: false });
    await toMinimum(p, 'postman');
    await p.click('#window-postman [data-mail="send"]');
    await p.click('#window-postman [data-mail="send-anyway"]');
    await p.locator('#window-postman [data-mail="open-canvas"]').waitFor();
    await contained(p, '1366×768 incomplete delivery, minimum', expect);
    const focused = () => p.evaluate(() => {
      const el = document.activeElement, pane = document.querySelector('#window-postman .reading-pane').getBoundingClientRect(), b = el.getBoundingClientRect();
      return { mail: el.dataset?.mail ?? null, isPane: el.classList.contains('reading-pane'), inView: b.top >= pane.top - 0.5 && b.bottom <= pane.bottom + 0.5 && b.left >= pane.left - 0.5 && b.right <= pane.right + 0.5 };
    });
    assert.equal((await focused()).mail, 'return', 'after the send, focus is on Return to the request');
    await p.keyboard.press('Tab');
    let f = await focused();
    assert.equal(f.mail, 'open-canvas', 'Tab reaches Fix it in CANVAS');
    assert.equal(f.inView, true, 'Fix it in CANVAS is in view');
    // The message and the letter below it: from the actions, Shift+Tab back to the pane, then End scrolls to its end.
    await p.keyboard.press('Shift+Tab');
    await p.keyboard.press('Shift+Tab');
    f = await focused();
    assert.equal(f.isPane, true, 'the reading pane is a keyboard region');
    await p.keyboard.press('End');
    await p.waitForTimeout(300);
    const end = await p.evaluate(() => {
      const pane = document.querySelector('#window-postman .reading-pane'), letter = pane.querySelector('.mail-letter-canvas').getBoundingClientRect(), b = pane.getBoundingClientRect();
      return { scrolled: pane.scrollTop, bottomInView: letter.bottom <= b.bottom + 0.5 && letter.top >= b.top - 0.5 };
    });
    assert.ok(end.scrolled > 0, 'End scrolled the pane');
    assert.equal(end.bottomInView, true, 'End brings the letter into view');
    // By pointer: Fix it in CANVAS, lift, send again (nothing complete is held: no question), finish.
    await p.locator('#window-postman [data-mail="open-canvas"]').scrollIntoViewIfNeeded();
    await p.click('#window-postman [data-mail="open-canvas"]');
    await settled(p, 'canvas');
    await p.click('#window-canvas [data-canvas="lift"]');
    await p.click('#window-canvas [data-canvas="compose"]');
    await settled(p, 'postman');
    await fill(p, { subject: TEXTS.longSubject, message: TEXTS.longMessage, to: 'guest@haunt' });
    await p.click('#window-postman [data-mail="send"]');
    await p.locator('#window-postman [data-mail="return"]').waitFor();
    assert.equal((await caseSave(p)).mail.deliveries.at(-1).complete, true);
    await contained(p, '1366×768 the fixed letter, minimum', expect);
    await finishCase(p);
    assert.equal((await caseSave(p)).ack.deliveryId, (await caseSave(p)).mail.deliveries.at(-1).id);
    outcomes.push(`An incomplete letter with both long fields, POSTMAN at its minimum (1366×768): Return to the request has focus after the send; Tab reaches Fix it in CANVAS, in view; the reading pane is a keyboard region, and End scrolled it (${end.scrolled} px) until the letter was in view. Fix it in CANVAS by pointer opened CANVAS; the fixed letter, sent with the same long fields, needed no question, and Finish session ended the case.`);
    await p.close();
  }

  // 6. Several long subjects in one list, taller than its column: a keyboard region; a copy after the end.
  {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    await composeWith(p, {});
    await p.click('#window-postman [data-mail="send"]');
    await p.locator('#window-postman [data-mail="return"]').waitFor();
    await finishCase(p);
    await toMinimum(p, 'postman');
    for (let i = 0; i < 3; i++) {
      await bringForward(p, 'canvas');
      await p.click('#window-canvas [data-canvas="compose"]');
      await settled(p, 'postman');
      await fill(p, { subject: TEXTS.longSubject, message: `${TEXTS.longMessage.slice(0, 590)}copy ${i + 1}`, to: 'guest@haunt' });
      await p.click('#window-postman [data-mail="send"]');
      await p.locator('#window-postman .reading-pane[data-view="delivery"]').waitFor();
    }
    const m = await contained(p, '1366×768 three long copies after the end, minimum', { subject: TEXTS.longSubject });
    assert.equal(m.list.scrolls, true, 'the list of three long subjects is taller than its column');
    assert.match(await p.locator('#window-postman .receipt-state').textContent(), /^Another copy, sent after the session finished\./);
    assert.equal((await caseSave(p)).ack.deliveryId, (await caseSave(p)).mail.deliveries[0].id, 'the accepted letter is still the first one');
    // Tab reaches the list as a region; the arrow keys scroll it.
    await p.locator('#window-postman [data-box="guest"]').focus();
    let tabs = 0;
    while (tabs < 8 && !await p.evaluate(() => document.activeElement?.classList.contains('message-list'))) { await p.keyboard.press('Tab'); tabs++; }
    assert.ok(tabs < 8, 'Tab reaches the list region');
    const before = await p.evaluate(() => document.querySelector('#window-postman .message-list').scrollTop);
    await p.keyboard.press('PageDown');
    await p.waitForTimeout(300);
    assert.ok(await p.evaluate(() => document.querySelector('#window-postman .message-list').scrollTop) > before, 'PageDown scrolls it');
    outcomes.push(`After Finish session, three copies with 120-character subjects (1366×768, POSTMAN at its minimum): each a Copy, the accepted letter unchanged; the list of whole subjects is taller than its column and is then a keyboard region (reached with ${tabs} Tab presses from the mailboxes; PageDown scrolls it); no audit problem.`);
    await p.close();
  }

  // 7. Negative controls: the audit reports a picture cut off by its pane, and the defect itself with v7's CSS restored.
  {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    const expect = { subject: TEXTS.longSubject, message: TEXTS.longMessage };
    await composeWith(p, expect);
    await sendAndOpen(p);
    await contained(p, '1366×768 control: clean before');
    await p.evaluate(() => {
      const c = document.createElement('canvas');
      c.id = 'v8-wide-canvas'; c.width = 900; c.height = 100;
      c.style.cssText = 'display:block; width:900px; height:100px; background:#333';
      document.querySelector('#window-postman .mail-body').append(c);
    });
    const injected = (await auditLayout(p, 'wide canvas')).problems;
    assert.ok(injected.some(x => x.kind === 'picture-clipped' && x.el.includes('v8-wide-canvas')), `a canvas wider than its pane is reported: ${JSON.stringify(injected.slice(0, 3))}`);
    await p.evaluate(() => document.getElementById('v8-wide-canvas').remove());
    const v7 = await p.evaluate(() => {
      const s = document.createElement('style');
      s.id = 'v8-restore-v7';
      s.textContent = `#window-postman .reading-pane, #window-postman .mail-head, #window-postman .mail-body, #window-postman .draft-editor, #desktop-root #window-postman .message-item { grid-template-columns: none !important; }
        #window-postman .mail-head h3, #window-postman .mail-message, #window-postman .item-subject, #window-postman .mail-notice { overflow-wrap: normal !important; }`;
      document.head.append(s);
      return true;
    });
    await p.waitForTimeout(300);
    const restored = (await auditLayout(p, 'v7 css')).problems;
    const counts = restored.reduce((all, x) => ({ ...all, [x.kind]: (all[x.kind] ?? 0) + 1 }), {});
    const kinds = Object.keys(counts).sort().map(kind => `${counts[kind]} ${kind}`);
    assert.ok(restored.some(x => x.kind === 'picture-clipped'), 'with v7’s rules, the cut-off letter is reported');
    assert.ok(restored.some(x => x.kind === 'text-clipped'), 'with v7’s rules, the cut-off text is reported');
    await p.evaluate(() => document.getElementById('v8-restore-v7').remove());
    await p.waitForTimeout(300);
    await contained(p, '1366×768 control: clean after', expect);
    outcomes.push(`Negative controls (1366×768): a canvas made wider than the reading pane is reported as picture-clipped; with v7’s track and wrapping rules restored in the page (${v7 ? 'an injected stylesheet' : ''}), the audit reports the defect again (${restored.length} reports: ${kinds.join(', ')}); both clean again once removed.`);
    await p.close();
  }
  outcomes.push(`Audited with no layout or drawn-text problem, every part inside its pane, whole text and letter shape checked: ${checked.length} states.`);
} finally {
  await browser.close();
  await finish({ browser: process.env.HAUNT_CHANNEL ?? 'chrome', browserVersion });
}
