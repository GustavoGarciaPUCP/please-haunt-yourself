// Probe for prompt08 (.kiro/specs/free-text-v8): POSTMAN with long free text that the interface accepts (Subject up to
// 120 characters, Message up to 600, To up to 80), typed into the real fields and sent with real input; no case state is
// injected. It measures what each view does with it and records the DOM and drawn-text audits. A probe, not a
// pass/fail check: it writes output/playwright/v8-baseline.json and screenshots in output/playwright/v8-baseline/.
// HAUNT_PROBE_DIR=output/playwright/v8-after reruns the same probe on a later build, with the same file names.
import { mkdir, writeFile } from 'node:fs/promises';
import { PC_SIZES, auditLayout, caseSave, deliverLetter, frameHand, glassIdle, reachGlass, settled, start, terminal } from './haunt-helpers.mjs';
import { auditDrawnText, installTextProbe } from './drawn-text-audit.mjs';

const dir = process.env.HAUNT_PROBE_DIR ?? 'output/playwright/v8-baseline';
await mkdir(dir, { recursive: true });
const { browser, open, errors } = await start('v8-probe');
const report = { dir, sections: [] };
const section = async (name, run) => {
  try { report.sections.push({ name, ...await run() }); }
  catch (error) { report.sections.push({ name, failed: String(error?.stack ?? error).split('\n').slice(0, 6).join('\n') }); }
};

export const TEXTS = {
  longSubject: 'W'.repeat(120),
  longMessage: 'abcdef'.repeat(100),
  spacedSubject: 'Found on the desk at midnight: a photograph of the glass, a hand, a figure and a note for whoever sits here next.',
  spacedMessage: Array.from({ length: 12 }, (_, i) => `Line ${i + 1}: the glass kept a hand, a figure and a note for the next person.`).join('\n').slice(0, 600),
  unicodeSubject: 'Für dich — 幽霊の手紙 👻 مرحبا',
  unicodeMessage: 'Ça marche: ñ, ü, ß; 漢字かな; 👻🕯️; عربى; עברית; e\u0301 (combining)',
  longTo: 'x'.repeat(80),
};

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
/** A complete letter in CANVAS (the main route up to Compose), then the draft's fields filled through the real form. */
async function composeWith(page, { subject = null, message = null, to = 'guest@haunt', lift = true } = {}) {
  await reachGlass(page);
  await terminal(page).back();
  await frameHand(page);
  await page.click('#window-echo [data-echo="capture"]');
  await page.click('#window-echo [data-echo="use"]');
  await settled(page, 'canvas');
  if (lift) await page.click('#window-canvas [data-canvas="lift"]');
  await page.click('#window-canvas [data-canvas="compose"]');
  await settled(page, 'postman');
  if (subject !== null) await page.locator('#window-postman [data-field="subject"]').fill(subject);
  if (message !== null) await page.locator('#window-postman [data-field="message"]').fill(message);
  await page.locator('#window-postman [data-field="to"]').fill(to);
}
/** What POSTMAN shows now: the panes' widths and overflow, the text boxes against their pane, the letter and its shape. */
const geometry = page => page.evaluate(() => {
  const q = s => document.querySelector(`#window-postman ${s}`);
  const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return { left: +b.left.toFixed(1), right: +b.right.toFixed(1), top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const pane = q('.reading-pane'), list = q('.message-list'), win = document.getElementById('window-postman');
  const inner = el => { const b = el.getBoundingClientRect(); return { left: b.left + el.clientLeft, right: b.left + el.clientLeft + el.clientWidth }; };
  const pi = inner(pane), li = inner(list);
  const within = (el, box) => { if (!el) return null; const b = el.getBoundingClientRect(); return b.left >= box.left - 0.5 && b.right <= box.right + 0.5; };
  const canvas = pane.querySelector('.mail-letter-canvas');
  const items = [...list.querySelectorAll('.message-item')];
  return {
    window: r(win),
    pane: { ...r(pane), clientWidth: pane.clientWidth, scrollWidth: pane.scrollWidth, overflowX: pane.scrollWidth - pane.clientWidth, scrollHeight: pane.scrollHeight, clientHeight: pane.clientHeight, scrolls: pane.dataset.scrolls === 'true', tabIndex: pane.tabIndex },
    list: { ...r(list), clientWidth: list.clientWidth, scrollWidth: list.scrollWidth, overflowX: list.scrollWidth - list.clientWidth, scrollHeight: list.scrollHeight, clientHeight: list.clientHeight },
    items: items.map(item => ({ selected: item.getAttribute('aria-current') === 'true', ...r(item), subject: r(item.querySelector('.item-subject')), subjectInside: within(item.querySelector('.item-subject'), li), whoInside: within(item.querySelector('.item-who'), li), whenInside: within(item.querySelector('.item-when'), li), badgeInside: within(item.querySelector('.item-badge:not([hidden])'), li) })),
    heading: { ...r(q('.reading-pane .mail-head h3')), inside: within(q('.reading-pane .mail-head h3'), pi) },
    meta: { inside: [...pane.querySelectorAll('.mail-head dd')].map(dd => within(dd, pi)) },
    message: q('.reading-pane .mail-message') ? { ...r(q('.reading-pane .mail-message')), inside: within(q('.reading-pane .mail-message'), pi), hidden: q('.reading-pane .mail-message').hidden } : null,
    receipt: q('.reading-pane .mail-receipt') ? { ...r(q('.reading-pane .mail-receipt')), inside: within(q('.reading-pane .mail-receipt'), pi) } : null,
    notice: q('.reading-pane .mail-notice:not([hidden])') ? { ...r(q('.reading-pane .mail-notice')), inside: within(q('.reading-pane .mail-notice'), pi) } : null,
    buttons: [...pane.querySelectorAll('[data-mail="return"], [data-mail="open-canvas"], [data-mail="open-draft"], [data-mail="send"]')].map(b => ({ mail: b.dataset.mail, ...r(b), inside: within(b, pi) })),
    canvas: canvas && !canvas.closest('[hidden]') ? { ...r(canvas), inside: within(canvas, pi), shape: +(canvas.getBoundingClientRect().width / canvas.getBoundingClientRect().height).toFixed(3), aspect: canvas.style.aspectRatio, buffer: [canvas.width, canvas.height] } : null,
    text: { heading: q('.reading-pane .mail-head h3')?.textContent ?? null, message: q('.reading-pane .mail-message')?.textContent ?? null, selectedItemName: list.querySelector('.message-item[aria-current="true"]')?.textContent ?? null },
  };
});
async function measure(page, label, file) {
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
  const g = await geometry(page);
  const dom = (await auditLayout(page, label)).problems, drawn = (await auditDrawnText(page, label)).problems;
  const kinds = list => list.reduce((acc, item) => ({ ...acc, [item.kind]: (acc[item.kind] ?? 0) + 1 }), {});
  if (file) {
    await page.screenshot({ path: `${dir}/${file}.png` });
    await page.locator('#window-postman').screenshot({ path: `${dir}/${file}-postman.png` });
  }
  return { label, geometry: g, dom: { count: dom.length, kinds: kinds(dom), sample: dom.slice(0, 6) }, drawn: { count: drawn.length, kinds: kinds(drawn), sample: drawn.slice(0, 4) } };
}
const stored = async page => { const d = (await caseSave(page)).mail.deliveries.at(-1); return { subject: d.subject, message: d.message, route: d.route, complete: d.complete }; };
const exact = (s, subject, message) => ({ subject: s.subject === subject, message: s.message === message, subjectLength: s.subject.length, messageLength: s.message.length });

try {
  // 1. Review 29's case: both fields at their limits, unbroken. Three sizes; POSTMAN as it opens, at its minimum, maximized.
  for (const viewport of PC_SIZES) {
    const tag = viewport.width;
    await section(`Long subject and long message (120 W, 600 unbroken), ${viewport.width}×${viewport.height}`, async () => {
      const p = await open({ viewport, init: [installTextProbe] });
      report.bundle ??= await p.locator('script[src*="haunt-"]').getAttribute('src');
      await composeWith(p, { subject: TEXTS.longSubject, message: TEXTS.longMessage });
      await p.click('#window-postman [data-mail="send"]');
      await p.locator('#window-postman [data-mail="return"]').waitFor();
      const saved = await stored(p);
      const states = [await measure(p, 'guest inbox, as it opens', `${tag}-both-default`)];
      await toggleMaximize(p, 'postman');
      states.push(await measure(p, 'guest inbox, maximized', `${tag}-both-maximized`));
      await toggleMaximize(p, 'postman');
      await toMinimum(p, 'postman');
      states.push(await measure(p, 'guest inbox, minimum', `${tag}-both-minimum`));
      await p.click('#window-postman [data-box="sent"]');
      states.push(await measure(p, 'sent, minimum', tag === 1366 ? `${tag}-both-sent-minimum` : null));
      // Return to the request by pointer, Finish session, reload: the delivery is shown again as it was.
      await p.click('#window-postman [data-box="guest"]');
      await p.click('#window-postman [data-mail="return"]');
      await settled(p, 'terminal');
      await p.click('#window-terminal [data-finish]');
      await p.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
      await glassIdle(p);
      await p.reload();
      await p.locator('#window-terminal').waitFor();
      await settled(p, 'terminal');
      const finished = (await caseSave(p)).ack !== null;
      await bringForward(p, 'postman');
      await p.click('#window-postman [data-box="guest"]');
      states.push(await measure(p, 'guest inbox after Finish and reload', tag === 1366 ? `${tag}-both-reloaded` : null));
      await p.close();
      return { exact: exact(saved, TEXTS.longSubject, TEXTS.longMessage), finished, states };
    });
  }

  // 2–5. One field at a time, ordinary long text with spaces and line breaks, and a short Unicode sample (1366×768).
  for (const [name, fields, file] of [
    ['Long subject only', { subject: TEXTS.longSubject }, 'subject'],
    ['Long message only', { message: TEXTS.longMessage }, 'message'],
    ['Long spaced text with line breaks', { subject: TEXTS.spacedSubject, message: TEXTS.spacedMessage }, 'spaced'],
    ['Short Unicode sample', { subject: TEXTS.unicodeSubject, message: TEXTS.unicodeMessage }, 'unicode'],
    ['Normal content (default subject, no message)', {}, 'normal'],
  ]) {
    await section(`${name}, 1366×768`, async () => {
      const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
      await composeWith(p, fields);
      await p.click('#window-postman [data-mail="send"]');
      await p.locator('#window-postman [data-mail="return"]').waitFor();
      const saved = await stored(p);
      const states = [await measure(p, 'guest inbox, as it opens', `1366-${file}-default`)];
      await toMinimum(p, 'postman');
      states.push(await measure(p, 'guest inbox, minimum', `1366-${file}-minimum`));
      const lines = await p.locator('#window-postman .reading-pane .mail-message').evaluate(el => el.getClientRects().length && el.innerText.split('\n').length);
      await p.close();
      return { exact: exact(saved, fields.subject ?? 'For the next person at this desk', fields.message ?? ''), messageLinesRendered: lines, states };
    });
  }

  // 6. Returned: a reply to Mara with both long fields comes back; the Returned view and the kept draft.
  await section('Returned to the sender with long fields, 1366×768', async () => {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    await composeWith(p, { subject: TEXTS.longSubject, message: TEXTS.longMessage, to: 'mara@haunt' });
    await p.click('#window-postman [data-mail="send"]');
    await p.locator('#window-postman [data-box="returned"][aria-current="true"]').waitFor();
    const saved = await stored(p);
    const states = [await measure(p, 'returned, as it opens', '1366-returned-default')];
    await toMinimum(p, 'postman');
    states.push(await measure(p, 'returned, minimum', '1366-returned-minimum'));
    await p.click('#window-postman [data-mail="open-draft"]');
    states.push(await measure(p, 'the kept draft, minimum', '1366-returned-draft-minimum'));
    await p.close();
    return { exact: exact(saved, TEXTS.longSubject, TEXTS.longMessage), states };
  });

  // 7. An unknown recipient of 80 characters: POSTMAN's notice repeats it.
  await section('Unknown recipient of 80 unbroken characters, 1366×768', async () => {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    await composeWith(p, { to: TEXTS.longTo });
    await p.click('#window-postman [data-mail="send"]');
    const states = [await measure(p, 'notice, as it opens', '1366-recipient-default')];
    await toMinimum(p, 'postman');
    states.push(await measure(p, 'notice, minimum', '1366-recipient-minimum'));
    await p.close();
    return { states };
  });

  // 8. An incomplete letter with long fields: Fix it in CANVAS and Return to the request, by keyboard.
  await section('Incomplete letter with long fields: actions by keyboard, POSTMAN at its minimum, 1366×768', async () => {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    await composeWith(p, { subject: TEXTS.longSubject, message: TEXTS.longMessage, lift: false });
    await toMinimum(p, 'postman');
    await p.click('#window-postman [data-mail="send"]');
    await p.click('#window-postman [data-mail="send-anyway"]');
    await p.locator('#window-postman [data-mail="open-canvas"]').waitFor();
    const state = await measure(p, 'incomplete delivery, minimum', '1366-incomplete-minimum');
    // Focus is on Return to the request after the send; Tab reaches Fix it in CANVAS next.
    const focus = [await p.evaluate(() => document.activeElement?.dataset?.mail ?? document.activeElement?.className ?? null)];
    await p.keyboard.press('Tab');
    focus.push(await p.evaluate(() => document.activeElement?.dataset?.mail ?? document.activeElement?.className ?? null));
    const visible = await p.evaluate(() => { const el = document.activeElement, pane = document.querySelector('#window-postman .reading-pane').getBoundingClientRect(), b = el.getBoundingClientRect(); return b.left >= pane.left - 0.5 && b.right <= pane.right + 0.5 && b.top >= pane.top - 0.5 && b.bottom <= pane.bottom + 0.5; });
    await p.close();
    return { focus, focusedInView: visible, state };
  });

  // 9. A control outside POSTMAN: TERMINAL's prompt with a long unbroken command. 300 characters are entered; the field's
  // maxlength (200) keeps 200, so the command echoed is 200 characters (measured in the after run; the v7 run named it 300).
  await section('TERMINAL: a long unbroken command, 300 entered and 200 kept by the field (control), 1366×768', async () => {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    const input = terminal(p).input;
    await input.fill('y'.repeat(300));
    const kept = (await input.inputValue()).length;
    await input.press('Enter');
    const out = await p.evaluate(() => { const o = document.querySelector('#window-terminal .console-output'); return { clientWidth: o.clientWidth, scrollWidth: o.scrollWidth }; });
    const dom = (await auditLayout(p, 'terminal long command')).problems;
    await p.screenshot({ path: `${dir}/1366-terminal-command.png` });
    await p.close();
    return { output: { ...out, kept }, dom: dom.length };
  });
} finally {
  report.pageErrors = errors;
  await browser.close();
  await writeFile(`${dir}.json`, JSON.stringify(report, null, 2));
  for (const s of report.sections) {
    if (s.failed) { console.log(`${s.name}: FAILED ${s.failed.split('\n')[0]}`); continue; }
    const states = s.states ?? (s.state ? [s.state] : []);
    console.log(`${s.name}: ${states.map(x => `${x.label} dom ${x.dom.count} drawn ${x.drawn.count} paneOverflowX ${x.geometry.pane.overflowX}`).join(' | ') || JSON.stringify(s.output ?? s.focus)}`);
  }
  console.log(`page errors: ${errors.length}`);
}
