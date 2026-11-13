import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { auditLayout, caseSave, frameHand, reachGlass, settled, start, terminal } from './haunt-helpers.mjs';
import { auditDrawnText, canvasFontOverride, installTextProbe } from './drawn-text-audit.mjs';
// Text drawn inside images (.kiro/specs/visual-precision-v6 R1–R4, R6): the session window's note on its paper on every
// surface that draws it, the header free of ECHO's labels, letters inside their paper and off their photograph, and no
// DOM element of the window over drawn words. Ink comes from Chrome's own rasterization of each text call (see
// drawn-text-audit.mjs), never from the app's layout numbers. DPR 1 and 2; fallback fonts are simulated by rewriting
// canvas font lists before the app starts, and reported as simulated.

const { browser, outcomes, open, finish } = await start('drawn-text');
const dir = 'output/playwright/drawn';
await mkdir(dir, { recursive: true });
const fonts = page => page.evaluate(async () => { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
// The session window's note is the only drawing whose words end at "PER—" (a letter's first line is "FOR THE NEXT PERSON").
const sessionCanvases = audit => audit.canvases.filter(entry => entry.runs.some(run => run.text.endsWith('PER—')));
const ghosts = [];
/** No drawn-text problem and no DOM problem; returns the tightest note clearance, in device px and in em. */
async function clean(page, label) {
  await fonts(page);
  const drawn = await auditDrawnText(page, label), dom = (await auditLayout(page, label)).problems;
  assert.deepEqual(drawn.problems, [], `${label}: drawn text — ${JSON.stringify(drawn.problems.slice(0, 4))}`);
  assert.deepEqual(dom, [], `${label}: layout — ${JSON.stringify(dom.slice(0, 4))}`);
  const runs = drawn.canvases.flatMap(entry => entry.runs);
  const note = sessionCanvases(drawn).flatMap(entry => entry.runs.filter(run => run.paper));
  return { canvases: drawn.canvases.length, runs: runs.length, noteRuns: note.length, tightest: note.length ? Math.min(...note.map(run => run.clearance / run.em)) : null };
}
async function toMinimum(page, id) {
  const win = page.locator(`#window-${id}`), r = await win.boundingBox(), handle = await win.locator('.window-resize[data-edge="se"]').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + 20, r.y + 60, { steps: 10 });
  await page.mouse.up();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(200);
}
const maximize = async (page, id) => { await page.click(`#window-${id} [data-window="maximize"]`); await page.mouse.move(2, 2); await page.waitForTimeout(400); };
/** ECHO's status bar sits above the picture, never on it. */
const barOutside = page => page.evaluate(() => {
  const bar = document.querySelector('#window-echo .echo-monitor-bar').getBoundingClientRect(), screen = document.querySelector('#window-echo .echo-screen').getBoundingClientRect();
  return bar.bottom <= screen.top + 0.5 && bar.height > 0;
});
/**
 * The paused ghost line from Chrome's own pixels: four screenshots of the picture (the line as shown, hidden, without
 * its glow, and without its glow or its box's clip). Returns what the line adds (its footprint, glow included), the
 * brightest channel of the picture under that footprint, and how many glyph pixels its box cuts off. Nothing here comes
 * from the app's zone numbers.
 */
async function ghostPixels(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('#window-echo .ghost-letter')].every(letter => letter.getAnimations().length === 0));
  const clip = await page.locator('#window-echo .echo-viewport').boundingBox();
  const shot = async css => {
    const was = await page.evaluate(css => { const g = document.querySelector('#window-echo .echo-ghost-line'), was = g.style.cssText; g.style.cssText = `${was};${css}`; return was; }, css);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const png = (await page.screenshot({ clip })).toString('base64');
    await page.evaluate(was => { document.querySelector('#window-echo .echo-ghost-line').style.cssText = was; }, was);
    return png;
  };
  const shots = [await shot(''), await shot('visibility:hidden'), await shot('text-shadow:none'), await shot('text-shadow:none;overflow:visible;max-height:none')];
  return page.evaluate(async shots => {
    const load = async b64 => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
      const c = new OffscreenCanvas(img.width, img.height).getContext('2d'); c.drawImage(img, 0, 0);
      return c.getImageData(0, 0, img.width, img.height);
    };
    const [shown, hidden, plain, open] = await Promise.all(shots.map(load));
    const { width: w, height: h } = shown, differs = (p, q, i) => Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2])) > 16;
    let count = 0, under = 0, cut = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    const cutAt = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (differs(shown.data, hidden.data, i)) {
        count++; under = Math.max(under, hidden.data[i], hidden.data[i + 1], hidden.data[i + 2]);
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
      if (differs(plain.data, open.data, i)) { cut++; if (cutAt.length < 12) cutAt.push([x, y, [...plain.data.slice(i, i + 3)], [...open.data.slice(i, i + 3)]]); }
    }
    // In the session window's own 320×200 units, for the record.
    const box = count ? { x: +(x0 * 320 / w).toFixed(1), y: +(y0 * 200 / h).toFixed(1), right: +((x1 + 1) * 320 / w).toFixed(1), bottom: +((y1 + 1) * 200 / h).toFixed(1) } : null;
    return { count, under, cut, cutAt, w, h, box };
  }, shots);
}

/** The session window through ECHO at one size and scale: Live, maximized, minimum, paused, kept (thumbnail, negative, picture). */
async function sessionSurfaces({ viewport, scale, init = [], tag, full = true }) {
  const p = await open({ viewport, scale, init: [installTextProbe, ...init] });
  const notes = [];
  await p.click('#btn-echo');
  await settled(p, 'echo');
  notes.push(await clean(p, `${tag} live`));
  assert.equal(await barOutside(p), true, `${tag}: the status bar is above the picture`);
  assert.deepEqual(await p.locator('#window-echo .echo-readout .subject-chip').allTextContents(), ['The figure, repeating', 'Unfinished note', 'No handprint']);
  assert.match(await p.locator('#window-echo .echo-transport').textContent(), /● LIVE · last\.session/);
  await p.screenshot({ path: `${dir}/${tag}-live.png` });
  /** Paused: the ghost writes where the session window draws only its wall, and its box cuts off no letter. */
  const paused = async (where, resume) => {
    await p.click('#window-echo [data-echo="pause"]');
    await p.waitForTimeout(2600);
    notes.push(await clean(p, `${tag} paused ${where}`));
    assert.match(await p.locator('#window-echo .echo-transport').textContent(), /Ⅱ PAUSED · last\.session/);
    assert.equal(await p.locator('#window-echo .echo-ghost-line').textContent(), 'You stopped the picture. Not the call.');
    const ghost = await ghostPixels(p);
    assert.ok(ghost.count > 0, `${tag} ${where}: the ghost line is visible`);
    assert.equal(ghost.cut, 0, `${tag} ${where}: the ghost line's box cuts off none of its letters ${JSON.stringify({ cutAt: ghost.cutAt, w: ghost.w, h: ghost.h, box: ghost.box })}`);
    assert.ok(ghost.under < 80, `${tag} ${where}: under the ghost line the picture shows only the session window's wall (brightest channel ${ghost.under})`);
    ghosts.push({ tag: `${tag} ${where}`, ...ghost });
    await p.screenshot({ path: `${dir}/${tag}-paused-${where}.png` });
    if (resume) {
      await p.click('#window-echo [data-echo="pause"]');
      await p.waitForFunction(() => document.querySelector('#window-echo .echo-transport').textContent.startsWith('● LIVE · last.session'));
      assert.equal(await p.locator('#window-echo .echo-ghost-line').textContent(), '', `${tag}: Resume live clears the ghost line`);
    }
  };
  if (full) {
    await paused('opened', true);
    await maximize(p, 'echo');
    notes.push(await clean(p, `${tag} maximized`));
    await maximize(p, 'echo');
    await toMinimum(p, 'echo');
    notes.push(await clean(p, `${tag} minimum`));
    assert.equal(await barOutside(p), true, `${tag} minimum: the status bar is above the picture`);
    await p.screenshot({ path: `${dir}/${tag}-minimum.png` });
    await paused('minimum', false);
    // Kept: the list thumbnail, the negative and the picture all draw the same session window.
    await p.click('#window-echo [data-echo="capture"]');
    await p.locator('#window-echo .capture-detail:not([hidden])').waitFor();
    const kept = await clean(p, `${tag} captures`);
    assert.ok(kept.noteRuns >= 6, `${tag}: the thumbnail, the negative and the picture each draw the note (${kept.noteRuns} runs)`);
    notes.push(kept);
    await maximize(p, 'echo');
    notes.push(await clean(p, `${tag} captures maximized`));
    await p.screenshot({ path: `${dir}/${tag}-captures-maximized.png` });
  }
  await p.close();
  return Math.min(...notes.map(n => n.tightest ?? Infinity));
}

try {
  // 1. Three PC sizes, DPR 1 and 2.
  const tightest = [];
  for (const [width, height] of [[1366, 768], [1440, 900], [1920, 1080]]) {
    for (const scale of [1, 2]) tightest.push(await sessionSurfaces({ viewport: { width, height }, scale, tag: `${width}x${height}-dpr${scale}` }));
  }
  // Windows display scaling: 125 % of 1920×1080 and 150 % of 2560×1440, as CSS pixels and device pixel ratio.
  for (const [width, height, scale] of [[1536, 864, 1.25], [1707, 960, 1.5]]) tightest.push(await sessionSurfaces({ viewport: { width, height }, scale, tag: `${width}x${height}-dpr${scale}` }));
  const brightest = Math.max(...ghosts.map(g => g.under));
  outcomes.push(`Session window at 1366×768, 1440×900 and 1920×1080, DPR 1 and 2, and at 1536×864 DPR 1.25 and 1707×960 DPR 1.5 (Windows display scaling at 125 % and 150 %), in Live, maximized, ECHO at its minimum, paused, and the kept thumbnail, negative and picture: every word of the note is on its paper, the tightest at ${Math.min(...tightest).toFixed(2)} em from its edge (required 0.25); nothing of ECHO's covers the header or the note; the status bar is above the picture; no DOM layout problem.`);
  outcomes.push(`Paused, with ECHO as it opens and at its minimum, in the same eight configurations: the ghost line (glow included, from screenshots) lies over the session window's bare wall only (brightest channel of the picture under it ${brightest}/255, limit 80), its box cuts off none of its letters, and Resume live clears it. Its footprint in window units (x, y of 320×200): ${ghosts.map(g => `${g.tag} ${g.box.x}–${g.box.right}, ${g.box.y}–${g.box.bottom}`).join('; ')}.`);

  // 2. Fallback fonts (simulated): the next family in each list, and none of the listed hand fonts.
  const simulated = [
    ['no Segoe Print (Ink Free is next)', [['"Segoe Print", ', '']]],
    ['none of the listed hand fonts (generic cursive)', [['"Segoe Print", "Ink Free", "Bradley Hand", "Segoe Script", "Comic Sans MS", cursive', 'cursive']]],
    ['no Segoe UI (system-ui)', [['"Segoe UI Variable Text", "Segoe UI", ', '']]],
    ['a wide sans for the hand font (Verdana)', [['"Segoe Print", "Ink Free", "Bradley Hand", "Segoe Script", "Comic Sans MS", cursive', 'Verdana']]],
  ];
  for (const [name, list] of simulated) {
    const t = await sessionSurfaces({ viewport: { width: 1366, height: 768 }, scale: 1, init: [canvasFontOverride(list)], tag: `fallback-${name.split(' ')[0]}-${list[0][1] || 'next'}`.replace(/[^\w-]/g, ''), full: false });
    outcomes.push(`Simulated fallback, ${name}: the note's words stay on the paper (tightest ${t.toFixed(2)} em), no covering, no layout problem.`);
  }

  // 3. After the minute ends: the session source still names the note; a letter made from it, on every surface.
  {
    const p = await open({ viewport: { width: 1440, height: 900 }, scale: 2, init: [installTextProbe] });
    await reachGlass(p);
    await terminal(p).back();
    await p.click('#window-terminal [data-open="echo"]');
    await settled(p, 'echo');
    assert.deepEqual(await p.locator('#window-echo .echo-readout .subject-chip').allTextContents(), ['No figure', 'Unfinished note', 'No handprint']);
    assert.match(await p.locator('#window-echo .echo-caption').textContent(), /Only the note is left here\. The mark is on the glass\./);
    await clean(p, 'after the minute, live');
    await p.click('#window-echo [data-echo="capture"]');
    await p.locator('#window-echo .capture-detail:not([hidden])').waitFor();
    assert.match(await p.locator('#window-echo .capture-title').textContent(), /The note left behind/);
    assert.match(await p.locator('#window-echo .capture-verdict').textContent(), /after the minute: the figure has gone; the note still stops at “PER—”\. No handprint\./);
    await p.click('#window-echo [data-echo="use"]');
    await settled(p, 'canvas');
    assert.match(await p.locator('#window-canvas .canvas-ready').textContent(), /^This capture is TERMINAL’s session window: its note stops at “PER—”, and there is no handprint\. Use a capture of the glass from ECHO\.$/);
    assert.match(await p.locator('#window-canvas [data-layer="writing"] .layer-state').textContent(), /Only the unfinished note, as TERMINAL shows it/);
    const inCanvas = await clean(p, 'session letter in CANVAS');
    await p.click('#window-canvas [data-canvas="compose"]');
    await settled(p, 'postman');
    await p.click('#window-postman [data-mail="to-guest"]');
    await p.click('#window-postman [data-mail="send"]');
    assert.match(await p.locator('#window-postman .mail-confirm p').textContent(), /incomplete: the picture is TERMINAL’s window, not the glass; its note stops at “PER—”/);
    await p.click('#window-postman [data-mail="send-anyway"]');
    assert.match(await p.locator('#window-postman .receipt-state').textContent(), /Incomplete: the picture is TERMINAL’s window, not the glass; its note stops at “PER—”/);
    await clean(p, 'session letter in POSTMAN');
    await p.click('#window-postman [data-mail="return"]');
    await settled(p, 'terminal');
    assert.match(await p.locator('.receipt-card .receipt-detail').textContent(), /TERMINAL’s window, not the glass/);
    await clean(p, 'session letter in TERMINAL');
    const save = await caseSave(p);
    assert.equal(save.mail.deliveries.at(-1).letter.lines, null, 'the session letter carries no words');
    assert.equal(save.mail.deliveries.at(-1).complete, false);
    outcomes.push(`After the minute ends (1440×900, DPR 2): the session source says No figure / Unfinished note / No handprint and “Only the note is left here. The mark is on the glass.”; its capture is “The note left behind”. A letter made from it is described as TERMINAL’s window whose note stops at “PER—” in CANVAS, POSTMAN and TERMINAL; it carries no words and stays incomplete. The note in its photograph stays on its paper on every surface (${inCanvas.noteRuns} note runs in CANVAS's view alone).`);
    await p.close();
  }

  // 4. The letter's own words on every surface, Beside and Below, Bone and Night; the Below letter inside its stage.
  for (const [viewport, scale, tag, init] of [[{ width: 1366, height: 768 }, 1, '1366x768-dpr1', []], [{ width: 1920, height: 1080 }, 2, '1920x1080-dpr2', []],
    [{ width: 1366, height: 768 }, 1, 'fallback-cursive', [canvasFontOverride([['"Segoe Print", "Ink Free", "Bradley Hand", "Segoe Script", "Comic Sans MS", cursive', 'cursive']])]]]) {
    const p = await open({ viewport, scale, init: [installTextProbe, ...init] });
    await reachGlass(p);
    await terminal(p).back();
    await frameHand(p);
    await p.click('#window-echo [data-echo="capture"]');
    await p.click('#window-echo [data-echo="use"]');
    await settled(p, 'canvas');
    await p.click('#window-canvas [data-canvas="lift"]');
    await p.waitForTimeout(900);
    await clean(p, `${tag} letter Beside`);
    await p.click('#window-canvas [data-choice="layout"] label:has(input[value="below"])');
    await p.click('#window-canvas [data-choice="paper"] label:has(input[value="night"])');
    await p.waitForTimeout(300);
    await clean(p, `${tag} letter Below, Night`);
    const frame = await p.evaluate(() => {
      const f = document.querySelector('#window-canvas .letter-frame').getBoundingClientRect(), s = document.querySelector('#window-canvas .canvas-stage').getBoundingClientRect();
      return { inside: f.top >= s.top - 0.5 && f.bottom <= s.bottom + 0.5 && f.left >= s.left - 0.5 && f.right <= s.right + 0.5, ratio: f.width / f.height };
    });
    assert.equal(frame.inside, true, `${tag}: the Below letter fits its stage`);
    assert.ok(Math.abs(frame.ratio - 0.82) < 0.02, `${tag}: the Below letter keeps its 0.82 shape (${frame.ratio.toFixed(3)})`);
    await p.click('#window-canvas [data-canvas="compose"]', { trial: true, timeout: 3000 });
    await p.screenshot({ path: `${dir}/${tag}-letter-below-night.png` });
    await p.click('#window-canvas [data-choice="layout"] label:has(input[value="beside"])');
    await p.click('#window-canvas [data-canvas="compose"]');
    await settled(p, 'postman');
    await p.click('#window-postman [data-mail="to-guest"]');
    await p.click('#window-postman [data-mail="send"]');
    await p.locator('#window-postman [data-mail="return"]').waitFor();
    await clean(p, `${tag} letter in POSTMAN`);
    await p.click('#window-postman [data-mail="return"]');
    await settled(p, 'terminal');
    await clean(p, `${tag} letter in the receipt`);
    await p.click('[data-finish]');
    await p.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
    await p.waitForTimeout(2400);
    await clean(p, `${tag} letter at the end`);
    await p.screenshot({ path: `${dir}/${tag}-finished.png` });
    outcomes.push(`${tag}: Mara's five lines stay on the letter's paper and off its photograph in CANVAS (Beside; Below on Night paper), POSTMAN, the receipt and the end; the Below letter fits its stage at its 0.82 shape and CANVAS's Compose takes a pointer click there; no covering, no layout problem.`);
    await p.close();
  }

  // 5. Lift, frame by frame: Playwright's fake clock steps CANVAS's animation, and every frame is audited. Below on
  // Night paper is where the words sit lowest. (Found by check:paths: v5's drift put the signature past the letter's
  // edge in the first frames.)
  for (const [viewport, scale, tag] of [[{ width: 1366, height: 768 }, 1, '1366x768-dpr1'], [{ width: 1920, height: 1080 }, 2, '1920x1080-dpr2']]) {
    const p = await open({ viewport, scale, init: [installTextProbe] });
    await reachGlass(p);
    await terminal(p).back();
    await frameHand(p);
    await p.click('#window-echo [data-echo="capture"]');
    await p.click('#window-echo [data-echo="use"]');
    await settled(p, 'canvas');
    await p.click('#window-canvas [data-choice="paper"] label:has(input[value="night"])');
    await p.click('#window-canvas [data-choice="layout"] label:has(input[value="below"])');
    await fonts(p);
    await p.clock.install();
    await p.click('#window-canvas [data-canvas="lift"]');
    let elapsed = 0, frames = 0;
    for (const step of [16, 16, 32, 48, 64, 96, 128, 200]) {
      await p.clock.runFor(step);
      elapsed += step;
      const audit = await auditDrawnText(p, `${tag} lift at ${elapsed} ms`);
      const preview = audit.canvases.find(entry => entry.where.includes('letter-preview'));
      if (preview?.runs.length) frames++;
      assert.deepEqual(audit.problems, [], `${tag}: lift at ${elapsed} ms — ${JSON.stringify(audit.problems.slice(0, 3))}`);
    }
    await p.clock.resume();
    outcomes.push(`${tag}: CANVAS's Lift on Night paper, Below, stepped with a fake clock: ${frames} frames with words drawn, from 16 to ${elapsed} ms; in none of them does a word leave or crowd the letter's edge.`);
    await p.close();
  }
} finally {
  await browser.close();
  await finish();
}
