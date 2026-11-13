// Visual review for v6 (.kiro/specs/visual-precision-v6 R6), extending review-v5: the same route through the whole
// case at each PC size, plus TERMINAL's session window in ECHO (live, paused, kept; default, maximized and minimum),
// the session window after the minute, CANVAS on Night paper, Below (default, maximized, minimum) and a letter made
// from the session window. Each state gets a screenshot, the DOM layout audit and the drawn-text audit
// (drawn-text-audit.mjs). Writes output/playwright/v6/<size>-NN-<name>.png and output/playwright/v6-review.json.
// HAUNT_SIZES=1366x768,... and HAUNT_SCALE=2 are optional. An automated inspection route, not a human playtest.
import { mkdir, writeFile } from 'node:fs/promises';
import { PC_SIZES, auditLayout, caseSave, dragWindow, frameHand, glassIdle, reachGlass, settled, start, terminal, workspace } from './haunt-helpers.mjs';
import { auditDrawnText, installTextProbe } from './drawn-text-audit.mjs';

const scale = Number(process.env.HAUNT_SCALE ?? 1);
const dir = `output/playwright/v6${scale === 1 ? '' : `-dpr${scale}`}`;
await mkdir(dir, { recursive: true });
const sizes = process.env.HAUNT_SIZES
  ? process.env.HAUNT_SIZES.split(',').map(text => { const [width, height] = text.split('x').map(Number); return { width, height }; })
  : PC_SIZES;
const { browser, open, errors } = await start(`review-v6${scale === 1 ? '' : `-dpr${scale}`}`);
const report = { scale, sizes: [] };

/** Drags a window's south-east corner far up and left: the window stops at its minimum size. */
async function toMinimum(page, id) {
  const win = page.locator(`#window-${id}`), r = await win.boundingBox(), handle = await win.locator('.window-resize[data-edge="se"]').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + 20, r.y + 60, { steps: 10 });
  await page.mouse.up();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(150);
  return win.boundingBox();
}
/** Drags a window by its titlebar far towards the bottom-right corner: the workspace keeps it inside. */
async function toCorner(page, id) {
  const ws = await workspace(page);
  await dragWindow(page, id, ws.w, ws.h, 12);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(150);
  return page.locator(`#window-${id}`).boundingBox();
}
async function toggleMaximize(page, id) {
  await page.click(`#window-${id} [data-window="maximize"]`);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(350);
}
async function arrange(page) {
  await page.click('#btn-launcher');
  await page.click('[data-arrange]');
  await page.waitForTimeout(450);
}
/** The taskbar button of the active window minimizes it, as on a real desktop; only press it for another window. */
async function bringForward(page, id) {
  if (!await page.locator(`#window-${id}.is-active`).count()) await page.click(`#btn-${id}`);
  await settled(page, id);
}

for (const viewport of sizes) {
  const tag = `${viewport.width}x${viewport.height}`;
  const page = await open({ viewport, scale, init: [installTextProbe] });
  const shots = [];
  const shot = async (name, extra = {}) => {
    await page.waitForTimeout(140);
    await page.evaluate(async () => { await document.fonts.ready; });
    const file = `${dir}/${tag}-${String(shots.length + 1).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: file });
    const { problems } = await auditLayout(page, name);
    const drawn = await auditDrawnText(page, name);
    const drawnProblems = drawn.problems.map(problem => ({ ...problem, kind: `drawn:${problem.kind}`, el: `${problem.where} “${problem.text}”` }));
    // The session window's note is the only drawing whose words end at "PER—" (a letter's first line is "FOR THE NEXT PERSON").
    const noteRuns = drawn.canvases.flatMap(entry => entry.runs.filter(run => run.paper && run.text.endsWith('PER—')));
    shots.push({ name, file, problems: [...problems, ...drawnProblems], drawnRuns: drawn.canvases.reduce((sum, entry) => sum + entry.runs.length, 0), noteRuns: noteRuns.length, ...extra });
  };
  const t = terminal(page);
  /** Every page TERMINAL's session inspector has, in the window's current placement. */
  const inspectorPages = async prefix => {
    await t.enter();
    await shot(`${prefix}-session`);
    for (const object of ['note', 'figure', 'bell', 'door']) { await t.object(object); await shot(`${prefix}-${object}`); }
    await page.click('.session-pane [data-close]');
    await page.click('.session-pane button[data-hint]');
    await shot(`${prefix}-hint`);
    await page.click('.session-pane [data-hint-explicit]');
    await shot(`${prefix}-hint-exactly`);
    await page.click('.session-pane button[data-hood]');
    await shot(`${prefix}-hood`);
    await page.click('.session-pane [data-hood-close]');
    await t.back();
  };

  await shot('desktop');
  await page.click('#btn-launcher');
  await shot('launcher');
  await page.keyboard.press('Escape');
  await page.click('#btn-phase');
  await shot('phase-help');
  await page.keyboard.press('Escape');

  // TERMINAL at its default, minimum, maximized and corner placements, before any progress.
  await inspectorPages('terminal');
  const terminalMin = await toMinimum(page, 'terminal');
  await shot('terminal-min-shell', { bounds: terminalMin });
  await inspectorPages('terminal-min');
  await toggleMaximize(page, 'terminal');
  await t.enter();
  await t.object('bell');
  await shot('terminal-max-bell');
  await t.back();
  await toggleMaximize(page, 'terminal');
  await shot('terminal-min-corner', { bounds: await toCorner(page, 'terminal') });
  await arrange(page);

  // v6: ECHO on TERMINAL's session window before the milestone: live, paused (the ghost line), kept; three sizes.
  await page.click('#btn-echo');
  await settled(page, 'echo');
  await shot('echo-session-live');
  await page.click('#window-echo [data-echo="pause"]');
  await page.waitForTimeout(2600);
  await shot('echo-session-paused');
  await toggleMaximize(page, 'echo');
  await shot('echo-max-session-paused');
  await toggleMaximize(page, 'echo');
  await shot('echo-min-session-paused', { bounds: await toMinimum(page, 'echo') });
  await page.click('#window-echo [data-echo="capture"]');
  await shot('echo-min-session-capture');
  await toggleMaximize(page, 'echo');
  await shot('echo-max-session-capture');
  await toggleMaximize(page, 'echo');
  await page.click('#window-echo [role="tab"][data-tab="live"]');
  await page.click('#window-echo [data-echo="pause"]');
  await arrange(page);
  await bringForward(page, 'terminal');

  // The milestone; the session window after the minute; then ECHO over the hand.
  await reachGlass(page);
  await shot('milestone');
  await t.back();
  await bringForward(page, 'echo');
  await shot('echo-session-after-minute');
  await frameHand(page);
  await shot('echo-live');
  await page.click('#window-echo [data-echo="capture"]');
  await shot('echo-captures');
  await toggleMaximize(page, 'echo');
  await shot('echo-max-captures');
  await toggleMaximize(page, 'echo');
  const echoMin = await toMinimum(page, 'echo');
  await shot('echo-min-captures', { bounds: echoMin });
  await page.click('#window-echo [role="tab"][data-tab="live"]');
  await shot('echo-min-live');
  await shot('echo-min-corner', { bounds: await toCorner(page, 'echo') });
  await arrange(page);
  await frameHand(page);
  await page.click('#window-echo [data-echo="capture"]');

  // CANVAS: the letter from capture 2 (capture 1 is the session window).
  await page.click('#window-echo .capture-item[data-capture="2"]');
  await page.click('#window-echo [data-echo="use"]');
  await settled(page, 'canvas');
  await shot('canvas-draft');
  await page.locator('#window-canvas [data-canvas="lift"]').hover();
  await shot('canvas-lift-pointed');
  await page.mouse.move(2, 2);
  await page.click('#window-canvas [data-canvas="reframe"]');
  await shot('canvas-reframe');
  await page.click('#window-canvas [data-canvas="reframe-cancel"]');
  await page.locator('#window-canvas .keep-option').nth(2).click();
  await page.waitForTimeout(500);
  await shot('canvas-words-lost');
  await page.locator('#window-canvas [data-canvas="recover"]').hover();
  await shot('canvas-recover-pointed');
  await page.click('#window-canvas [data-canvas="recover"]');
  await page.waitForTimeout(800);
  await page.locator('#window-canvas .keep-option').nth(1).click();
  await shot('canvas-keeps-both');
  await page.click('#window-canvas .app-menu-button:has-text("Letter")');
  await page.click('#window-canvas [role="menuitem"]:has-text("Reset to the capture")');
  await shot('canvas-reset-confirm');
  await page.click('#window-canvas [data-canvas="reset-cancel"]');
  await toggleMaximize(page, 'canvas');
  await shot('canvas-max');
  await toggleMaximize(page, 'canvas');
  const canvasMin = await toMinimum(page, 'canvas');
  await shot('canvas-min', { bounds: canvasMin });
  await page.click('#window-canvas [data-canvas="reframe"]');
  await shot('canvas-min-reframe');
  await page.click('#window-canvas [data-canvas="reframe-cancel"]');
  await page.click('#window-canvas .app-menu-button:has-text("Letter")');
  await page.click('#window-canvas [role="menuitem"]:has-text("Reset to the capture")');
  await shot('canvas-min-reset-confirm');
  await page.click('#window-canvas [data-canvas="reset-cancel"]');
  await shot('canvas-min-corner', { bounds: await toCorner(page, 'canvas') });
  await arrange(page);

  // ECHO: a different capture for the same letter asks first.
  await bringForward(page, 'echo');
  await page.click('#window-echo [role="tab"][data-tab="captures"]');
  await page.click('#window-echo .capture-item[data-capture="3"]');
  await page.click('#window-echo [data-echo="use"]');
  await shot('echo-replace-confirm');
  await page.click('#window-echo [data-echo="cancel-use"]');

  // POSTMAN: the incomplete confirmation, the returned reply, the delivery, the replace confirmation.
  await bringForward(page, 'canvas');
  await page.click('#window-canvas [data-canvas="undo"]');
  await page.click('#window-canvas [data-canvas="undo"]');
  await page.click('#window-canvas [data-canvas="compose"]');
  await settled(page, 'postman');
  await shot('postman-draft');
  await page.click('#window-postman [data-mail="to-guest"]');
  await page.click('#window-postman [data-mail="send"]');
  await shot('postman-confirm-incomplete');
  await page.click('#window-postman [data-mail="keep-editing"]');
  await bringForward(page, 'canvas');
  await page.click('#window-canvas [data-canvas="redo"]');
  await page.click('#window-canvas [data-canvas="redo"]');
  await bringForward(page, 'postman');
  await page.click('#window-postman [data-box="recovered"]');
  await shot('postman-recovered');
  await page.click('#window-postman [data-mail="reply"]');
  await page.click('#window-postman [data-mail="send"]');
  await shot('postman-returned');
  await page.click('#window-postman [data-box="drafts"]');
  await page.click('#window-postman [data-mail="to-guest"]');
  await page.click('#window-postman [data-mail="send"]');
  await page.locator('#window-postman [data-mail="return"]').waitFor();
  await shot('postman-delivered');
  await bringForward(page, 'canvas');
  await page.click('#window-canvas [data-choice="paper"] label:has(input[value="night"])');
  await page.click('#window-canvas [data-canvas="compose"]');
  await settled(page, 'postman');
  await page.click('#window-postman [data-mail="to-guest"]');
  await page.click('#window-postman [data-mail="send"]');
  await shot('postman-confirm-replace');
  await page.click('#window-postman [data-mail="keep-editing"]');
  await toggleMaximize(page, 'postman');
  await shot('postman-max');
  await toggleMaximize(page, 'postman');
  const postmanMin = await toMinimum(page, 'postman');
  await page.click('#window-postman [data-mail="send"]');
  await shot('postman-min-confirm-replace', { bounds: postmanMin });
  await page.click('#window-postman [data-mail="keep-editing"]');
  await page.click('#window-postman [data-box="guest"]');
  await page.locator('#window-postman .message-item').first().click().catch(() => {});
  await shot('postman-min-delivered');
  await arrange(page);

  // TERMINAL: the receipt, the release and the end, at the default size and at the minimum.
  await bringForward(page, 'postman');
  await page.click('#window-postman [data-box="guest"]');
  await page.locator('#window-postman [data-mail="return"]').waitFor();
  await page.click('#window-postman [data-mail="return"]');
  await settled(page, 'terminal');
  await shot('terminal-receipt');
  const receiptMin = await toMinimum(page, 'terminal');
  await shot('terminal-min-receipt', { bounds: receiptMin });
  await arrange(page);
  await page.click('#window-terminal [data-finish]');
  await page.waitForTimeout(1100);
  await shot('terminal-release', { receiptGlass: await page.locator('.receipt-figure[data-figure="glass"]').getAttribute('data-glass') });
  await glassIdle(page);
  await shot('finished', { receiptGlass: await page.locator('.receipt-figure[data-figure="glass"]').getAttribute('data-glass') });
  const finishedMin = await toMinimum(page, 'terminal');
  await shot('terminal-min-finished', { bounds: finishedMin });
  await toggleMaximize(page, 'terminal');
  await shot('terminal-max-finished');
  await toggleMaximize(page, 'terminal');
  await arrange(page);
  await page.click('#btn-launcher');
  await page.click('[data-start-over]');
  await shot('start-over-confirm');
  await page.click('#start-over-dialog [data-cancel]');
  await page.click('#btn-launcher');
  await page.click('[data-about]');
  await shot('about');
  await page.keyboard.press('Escape');

  // v6: CANVAS after the end (edits change nothing about the closed case): Below on Night paper at three sizes, and a
  // letter made from the session window, then Undo.
  await bringForward(page, 'canvas');
  await page.click('#window-canvas [data-choice="layout"] label:has(input[value="below"])');
  await page.waitForTimeout(300);
  await shot('canvas-below-night');
  await toggleMaximize(page, 'canvas');
  await shot('canvas-max-below-night');
  await toggleMaximize(page, 'canvas');
  await shot('canvas-min-below-night', { bounds: await toMinimum(page, 'canvas') });
  await arrange(page);
  await bringForward(page, 'echo');
  await page.click('#window-echo [role="tab"][data-tab="captures"]');
  await page.click('#window-echo .capture-item[data-capture="1"]');
  await page.click('#window-echo [data-echo="use"]');
  await page.click('#window-echo [data-echo="confirm-use"]');
  await settled(page, 'canvas');
  await page.waitForTimeout(300);
  await shot('canvas-session-letter');
  await page.click('#window-canvas [data-canvas="undo"]');
  const save = await caseSave(page);
  report.sizes.push({ viewport: tag, phase: save?.terminal?.presence, shots });
  await page.close();
}
report.pageErrors = errors;
await browser.close();
await writeFile(`output/playwright/v6-review${scale === 1 ? '' : `-dpr${scale}`}.json`, JSON.stringify(report, null, 2));
let total = 0;
for (const size of report.sizes) {
  const bad = size.shots.filter(s => s.problems.length);
  total += bad.reduce((sum, s) => sum + s.problems.length, 0);
  const noteStates = size.shots.filter(s => s.noteRuns).length;
  console.log(`${size.viewport}: ${size.shots.length} states (${noteStates} drawing the session window's note), ${bad.length} with problems`);
  for (const s of bad) console.log(`  ${s.name}: ${s.problems.length}\n    ${s.problems.slice(0, 8).map(p => `${p.kind} ${p.el}${p.by ? ` ← ${p.by}` : ''}`).join('\n    ')}`);
}
console.log(`page errors: ${errors.length}${errors.length ? `\n  ${errors.join('\n  ')}` : ''}`);
console.log(`problems: ${total}`);
if (errors.length || total) process.exitCode = 1;
