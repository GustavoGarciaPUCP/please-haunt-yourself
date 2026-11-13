// Probe for prompt06 (.kiro/specs/visual-precision-v6): reproduces review 27 on the served build with real pointer and
// keyboard input only (no case state is injected), and measures what the canvases actually draw. It is a probe, not a
// pass/fail check: it writes output/playwright/v6-baseline.json and screenshots in output/playwright/v6-baseline/.
// HAUNT_PROBE_DIR=output/playwright/v6-after runs the same probe on a later build, with the same file names.
import { mkdir, writeFile } from 'node:fs/promises';
import { auditLayout, caseSave, frameHand, reachGlass, settled, start, terminal } from './haunt-helpers.mjs';
import { auditDrawnText, canvasFontOverride, installTextProbe } from './drawn-text-audit.mjs';

const dir = process.env.HAUNT_PROBE_DIR ?? 'output/playwright/v6-baseline';
await mkdir(dir, { recursive: true });
const { browser, open, errors } = await start('v6-probe');
const report = { dir, sections: [] };
const section = async (name, run) => {
  try { report.sections.push({ name, ...await run() }); }
  catch (error) { report.sections.push({ name, failed: String(error?.stack ?? error) }); }
};

/** A short name for an audited canvas, for files and the report. */
const canvasName = entry => {
  const m = /\scanvas((?:\.[\w-]+)*)/.exec(entry.where), cls = m?.[1]?.split('.').filter(Boolean)[0];
  const win = entry.where.split(' ')[0].replace('window-', '');
  return `${win}-${cls ?? 'thumb'}${/\[(\w+)\]/.exec(entry.where)?.[1] ? `-${/\[(\w+)\]/.exec(entry.where)[1]}` : ''}`;
};
const summary = audit => ({
  problems: audit.problems,
  canvases: audit.canvases.map(entry => ({ name: canvasName(entry), size: entry.size, runs: entry.runs.map(run => ({ text: run.text, font: run.font.replace(/".*$/, '…'), em: run.em, clearance: run.clearance,
    required: run.required, outside: run.outside, outsideCanvas: run.outsideCanvas, overImage: run.overImage, covered: run.covered, via: run.via })) })),
});
const clamp = (page, box, pad) => {
  const vp = page.viewportSize();
  const x = Math.max(0, box.x - pad), y = Math.max(0, box.y - pad);
  return { x, y, width: Math.min(vp.width - x, box.w + pad * 2), height: Math.min(vp.height - y, box.h + pad * 2) };
};
/** Crops of every paper (the note) and every light run (the header) that the audit found, plus the monitor's top. */
async function crops(page, audit, prefix) {
  const files = [];
  for (const entry of audit.canvases) {
    const name = canvasName(entry);
    for (const [index, paper] of entry.papers.entries()) {
      if (paper.w < 12) continue;
      const file = `${dir}/${prefix}-${name}-paper${index ? index + 1 : ''}.png`;
      await page.screenshot({ path: file, clip: clamp(page, paper, Math.max(10, paper.w * 0.35)) });
      files.push(file);
    }
  }
  return files;
}
async function monitorTop(page, prefix) {
  const box = await page.evaluate(() => {
    const monitor = document.querySelector('#window-echo .echo-monitor'), screen = document.querySelector('#window-echo .echo-screen');
    if (!monitor || !screen) return null;
    const m = monitor.getBoundingClientRect(), s = screen.getBoundingClientRect();
    return { x: m.left - 6, y: m.top - 6, w: m.width + 12, h: s.top - m.top + s.height * 0.14 + 12 };
  });
  if (!box) return null;
  const file = `${dir}/${prefix}-echo-monitor-top.png`;
  await page.screenshot({ path: file, clip: clamp(page, box, 0) });
  return file;
}
const fonts = page => page.evaluate(async () => { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
async function toMinimum(page, id) {
  const win = page.locator(`#window-${id}`), r = await win.boundingBox(), handle = await win.locator('.window-resize[data-edge="se"]').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + 20, r.y + 60, { steps: 10 });
  await page.mouse.up();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(200);
  return win.boundingBox();
}
const maximize = async (page, id) => { await page.click(`#window-${id} [data-window="maximize"]`); await page.mouse.move(2, 2); await page.waitForTimeout(400); };
const texts = page => page.evaluate(() => ({
  chips: [...document.querySelectorAll('#window-echo .echo-readout .subject-chip')].map(el => `${el.textContent}${el.dataset.on === 'true' ? ' (on)' : ''}`),
  caption: document.querySelector('#window-echo .echo-caption')?.textContent ?? null,
  status: document.querySelector('#window-echo .echo-overlay-source, #window-echo .echo-transport')?.textContent ?? null,
}));
const captureTexts = page => page.evaluate(() => ({
  title: document.querySelector('#window-echo .capture-title')?.textContent ?? null,
  chips: [...document.querySelectorAll('#window-echo .capture-head .subject-chip')].map(el => `${el.textContent}${el.dataset.on === 'true' ? ' (on)' : ''}`),
  verdict: document.querySelector('#window-echo .capture-verdict')?.textContent ?? null,
  ghost: document.querySelector('#window-echo .capture-ghost')?.textContent ?? null,
  item: document.querySelector('#window-echo .capture-item[aria-current="true"] .capture-item-label span')?.textContent ?? null,
}));

/** The ECHO session-window route at one size and scale: Live, maximized, minimum, Pause, Capture. */
async function sessionRoute({ viewport, scale = 1, prefix, init = [] }) {
  const p = await open({ viewport, scale, init: [installTextProbe, ...init] });
  const out = { viewport, scale, bundle: await p.locator('script[type="module"][src]').getAttribute('src') };
  await p.click('#btn-echo');
  await settled(p, 'echo');
  await fonts(p);
  const live = await auditDrawnText(p, `${prefix} live`);
  out.live = summary(live);
  out.liveDom = (await auditLayout(p, `${prefix} live`)).problems;
  out.liveTexts = await texts(p);
  out.overlay = await p.evaluate(() => {
    const a = document.querySelector('#window-echo .echo-overlay-source, #window-echo .echo-transport')?.getBoundingClientRect(), b = document.querySelector('#window-echo .echo-screen')?.getBoundingClientRect();
    return a && b ? { label: { x: a.left, y: a.top, w: a.width, h: a.height }, screen: { x: b.left, y: b.top, w: b.width, h: b.height }, insideImage: a.bottom > b.top && a.top < b.bottom && a.right > b.left && a.left < b.right } : null;
  });
  await p.screenshot({ path: `${dir}/${prefix}-live.png` });
  out.files = [...await crops(p, live, `${prefix}-live`), await monitorTop(p, `${prefix}-live`)];
  if (!init.length) {
    await maximize(p, 'echo');
    await fonts(p);
    const max = await auditDrawnText(p, `${prefix} maximized`);
    out.maximized = summary(max);
    await p.screenshot({ path: `${dir}/${prefix}-maximized.png` });
    out.files.push(...await crops(p, max, `${prefix}-maximized`), await monitorTop(p, `${prefix}-maximized`));
    await maximize(p, 'echo');
    out.minimumBounds = await toMinimum(p, 'echo');
    await fonts(p);
    const min = await auditDrawnText(p, `${prefix} minimum`);
    out.minimum = summary(min);
    out.minimumDom = (await auditLayout(p, `${prefix} minimum`)).problems;
    await p.screenshot({ path: `${dir}/${prefix}-minimum.png` });
    out.files.push(...await crops(p, min, `${prefix}-minimum`), await monitorTop(p, `${prefix}-minimum`));
    // Pause: the ghost writes its line over the picture.
    await p.click('#window-echo [data-echo="pause"]');
    await p.waitForTimeout(2600);
    const paused = await auditDrawnText(p, `${prefix} paused`);
    out.paused = summary(paused);
    out.pausedTexts = await texts(p);
    out.ghost = await p.evaluate(() => {
      const g = document.querySelector('#window-echo .echo-ghost-line'), s = document.querySelector('#window-echo .echo-screen');
      if (!g || !g.textContent) return null;
      const r = g.getBoundingClientRect(), c = s.getBoundingClientRect();
      return { text: g.textContent, box: { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height }, screen: { w: c.width, h: c.height } };
    });
    await p.screenshot({ path: `${dir}/${prefix}-paused.png` });
    out.files.push(...await crops(p, paused, `${prefix}-paused`));
    // A capture of the session window, kept: the list thumbnail, the negative and the picture.
    await p.click('#window-echo [data-echo="capture"]');
    await p.locator('#window-echo .capture-detail:not([hidden])').waitFor();
    await fonts(p);
    const kept = await auditDrawnText(p, `${prefix} captures`);
    out.captures = summary(kept);
    out.capturesDom = (await auditLayout(p, `${prefix} captures`)).problems;
    out.captureTexts = await captureTexts(p);
    await p.screenshot({ path: `${dir}/${prefix}-captures.png` });
    out.files.push(...await crops(p, kept, `${prefix}-captures`));
    await maximize(p, 'echo');
    await fonts(p);
    const keptMax = await auditDrawnText(p, `${prefix} captures maximized`);
    out.capturesMaximized = summary(keptMax);
    out.capturesMaximizedDom = (await auditLayout(p, `${prefix} captures maximized`)).problems;
    out.editor = await p.evaluate(() => {
      const view = document.querySelector('#window-echo .capture-detail .negative-view')?.getBoundingClientRect(), box = document.querySelector('#window-echo .capture-editor')?.getBoundingClientRect();
      return view && box ? { view: { y: view.top, h: view.height, w: view.width }, editor: { y: box.top, h: box.height, w: box.width }, overflow: +(view.height - box.height).toFixed(1) } : null;
    });
    await p.screenshot({ path: `${dir}/${prefix}-captures-maximized.png` });
    out.files.push(...await crops(p, keptMax, `${prefix}-captures-maximized`));
  }
  await p.close();
  return out;
}

try {
  // 1. The session window at 1366×768, DPR 1: Live, maximized, minimum, paused, kept.
  await section('session window 1366×768 DPR 1', () => sessionRoute({ viewport: { width: 1366, height: 768 }, prefix: '1366-dpr1' }));
  // 2. The same at 1440×900 and 1920×1080, DPR 2.
  await section('session window 1440×900 DPR 2', () => sessionRoute({ viewport: { width: 1440, height: 900 }, scale: 2, prefix: '1440-dpr2' }));
  await section('session window 1920×1080 DPR 1', () => sessionRoute({ viewport: { width: 1920, height: 1080 }, prefix: '1920-dpr1' }));
  // 3. Fallback fonts, simulated: canvas font lists rewritten before the app starts (only canvas text is affected).
  await section('fallback: no Segoe Print (Ink Free next in the list)', () => sessionRoute({ viewport: { width: 1366, height: 768 }, prefix: 'fallback-inkfree',
    init: [canvasFontOverride([['"Segoe Print", ', '']])] }));
  await section('fallback: none of the listed hand fonts (generic cursive)', () => sessionRoute({ viewport: { width: 1366, height: 768 }, prefix: 'fallback-cursive',
    init: [canvasFontOverride([['"Segoe Print", "Ink Free", "Bradley Hand", "Segoe Script", "Comic Sans MS", cursive', 'cursive']])] }));
  await section('fallback: no Cascadia (Consolas next)', () => sessionRoute({ viewport: { width: 1366, height: 768 }, prefix: 'fallback-consolas',
    init: [canvasFontOverride([['"Cascadia Mono", "Cascadia Code", ', '']])] }));

  // 4. After the milestone: what the session source says it shows, and a letter made from it.
  await section('session window after the milestone, and a letter from it', async () => {
    const p = await open({ viewport: { width: 1366, height: 768 }, init: [installTextProbe] });
    await reachGlass(p);
    await terminal(p).back();
    await p.click('#window-terminal [data-open="echo"]');
    await settled(p, 'echo');
    await fonts(p);
    const out = { liveTexts: await texts(p) };
    const live = await auditDrawnText(p, 'after milestone live');
    out.live = summary(live);
    await p.screenshot({ path: `${dir}/after-milestone-live.png` });
    await p.click('#window-echo [data-echo="capture"]');
    await p.locator('#window-echo .capture-detail:not([hidden])').waitFor();
    await p.waitForTimeout(1800);
    out.captureTexts = await captureTexts(p);
    await p.screenshot({ path: `${dir}/after-milestone-captures.png` });
    await p.click('#window-echo [data-echo="use"]');
    await settled(p, 'canvas');
    await fonts(p);
    out.canvas = await p.evaluate(() => ({
      ready: document.querySelector('#window-canvas .canvas-ready')?.textContent ?? null,
      writing: document.querySelector('#window-canvas [data-layer="writing"] .layer-state')?.textContent ?? null,
      photo: document.querySelector('#window-canvas [data-layer="photo"] .layer-note')?.textContent ?? null,
    }));
    const letter = await auditDrawnText(p, 'session letter in CANVAS');
    out.canvasLetter = summary(letter);
    await p.screenshot({ path: `${dir}/session-letter-canvas.png` });
    out.files = await crops(p, letter, 'session-letter-canvas');
    await p.click('#window-canvas [data-canvas="compose"]');
    await settled(p, 'postman');
    out.postmanCaption = await p.locator('#window-postman .draft-attachment figcaption').textContent().catch(() => null);
    await p.click('#window-postman [data-mail="to-guest"]');
    await p.click('#window-postman [data-mail="send"]');
    out.postmanConfirm = await p.locator('#window-postman .mail-confirm p').textContent().catch(() => null);
    await p.click('#window-postman [data-mail="send-anyway"]');
    out.postmanReceipt = await p.locator('#window-postman .receipt-state').textContent().catch(() => null);
    await fonts(p);
    out.postmanLetter = summary(await auditDrawnText(p, 'session letter in POSTMAN'));
    await p.click('#window-postman [data-mail="return"]');
    await settled(p, 'terminal');
    out.terminalReceipt = await p.locator('.receipt-card .receipt-detail').textContent().catch(() => null);
    out.terminalLetter = summary(await auditDrawnText(p, 'session letter in TERMINAL'));
    await p.close();
    return out;
  });

  // 5. The glass route's letter on every surface: CANVAS, POSTMAN, the receipt and the end.
  await section('letter text on every surface (glass route)', async () => {
    const out = {};
    for (const [viewport, scale, tag] of [[{ width: 1366, height: 768 }, 1, '1366-dpr1'], [{ width: 1920, height: 1080 }, 2, '1920-dpr2']]) {
      const p = await open({ viewport, scale, init: [installTextProbe] });
      await reachGlass(p);
      await terminal(p).back();
      await frameHand(p);
      await p.click('#window-echo [data-echo="capture"]');
      await p.click('#window-echo [data-echo="use"]');
      await settled(p, 'canvas');
      await p.click('#window-canvas [data-canvas="lift"]');
      await p.waitForTimeout(900);
      await fonts(p);
      const canvas = await auditDrawnText(p, `${tag} letter in CANVAS`);
      await p.screenshot({ path: `${dir}/${tag}-letter-canvas.png` });
      await p.click('#window-canvas [data-canvas="compose"]');
      await settled(p, 'postman');
      await p.click('#window-postman [data-mail="to-guest"]');
      await p.click('#window-postman [data-mail="send"]');
      await p.locator('#window-postman [data-mail="return"]').waitFor();
      await fonts(p);
      const postman = await auditDrawnText(p, `${tag} letter in POSTMAN`);
      await p.click('#window-postman [data-mail="return"]');
      await settled(p, 'terminal');
      const receipt = await auditDrawnText(p, `${tag} letter in the receipt`);
      await p.click('[data-finish]');
      await p.waitForTimeout(2600);
      const finished = await auditDrawnText(p, `${tag} letter at the end`);
      await p.screenshot({ path: `${dir}/${tag}-finished.png` });
      const dom = (await auditLayout(p, `${tag} finished`)).problems;
      // Last: CANVAS with Night paper and the note Below (in v5 the Below letter grows past its stage).
      await p.click('#btn-canvas');
      await settled(p, 'canvas');
      await p.click('#window-canvas [data-choice="layout"] label:has(input[value="below"])');
      await p.waitForTimeout(250);
      const below = await auditDrawnText(p, `${tag} letter below in CANVAS`);
      await p.click('#window-canvas [data-choice="paper"] label:has(input[value="night"])');
      await p.waitForTimeout(250);
      const night = await auditDrawnText(p, `${tag} night letter below in CANVAS`);
      const belowDom = (await auditLayout(p, `${tag} below in CANVAS`)).problems;
      const belowFrame = await p.evaluate(() => {
        const frame = document.querySelector('#window-canvas .letter-frame')?.getBoundingClientRect(), stage = document.querySelector('#window-canvas .canvas-stage')?.getBoundingClientRect();
        return frame && stage ? { frame: { y: +frame.top.toFixed(1), h: +frame.height.toFixed(1), bottom: +frame.bottom.toFixed(1) }, stage: { y: +stage.top.toFixed(1), h: +stage.height.toFixed(1), bottom: +stage.bottom.toFixed(1) } } : null;
      });
      await p.screenshot({ path: `${dir}/${tag}-letter-canvas-night-below.png` });
      let composeBlocked = false;
      try { await p.click('#window-canvas [data-canvas="compose"]', { timeout: 3000, trial: true }); } catch { composeBlocked = true; }
      out[tag] = { canvas: summary(canvas), postman: summary(postman), receipt: summary(receipt), finished: summary(finished), dom,
        below: summary(below), night: summary(night), belowDom, belowFrame, composeBlocked };
      await p.close();
    }
    return out;
  });

  // 6. ECHO's Captures at 1440×900 maximized, with a glass capture: does the negative stay inside its place?
  await section('capture editor with a glass capture, 1440×900 maximized', async () => {
    const p = await open({ viewport: { width: 1440, height: 900 }, init: [installTextProbe] });
    await reachGlass(p);
    await terminal(p).back();
    await frameHand(p);
    await p.click('#window-echo [data-echo="capture"]');
    await maximize(p, 'echo');
    const out = {
      editor: await p.evaluate(() => {
        const rect = el => { const r = document.querySelector(el)?.getBoundingClientRect(); return r ? { y: +r.top.toFixed(1), h: +r.height.toFixed(1), bottom: +r.bottom.toFixed(1) } : null; };
        return { head: rect('#window-echo .capture-head'), editor: rect('#window-echo .capture-editor'), view: rect('#window-echo .capture-detail .negative-view'), caption: rect('#window-echo .capture-caption') };
      }),
      dom: (await auditLayout(p, 'captures maximized 1440')).problems,
    };
    await p.screenshot({ path: `${dir}/1440-captures-glass-maximized.png` });
    await p.close();
    return out;
  });
} finally {
  report.pageErrors = errors;
  await browser.close();
  await writeFile(`${dir}.json`, JSON.stringify(report, null, 2));
  const count = report.sections.map(s => `${s.name}: ${s.failed ? `FAILED ${s.failed.split('\n')[0]}` : 'ok'}`);
  console.log(count.join('\n'));
  console.log(`page errors: ${errors.length}`);
}
