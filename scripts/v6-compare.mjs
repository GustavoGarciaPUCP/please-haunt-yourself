// Before/after sheets for .kiro/specs/visual-precision-v6: screenshots and crops with the same name from the probe run
// on the v5 build (output/playwright/v6-baseline/) and on the v6 build (output/playwright/v6-after/), side by side and
// labelled. Small crops are enlarged with nearest-neighbour scaling, so the pixels shown are the pixels captured.
// Writes output/playwright/v6-compare/*.png. Composed in Chrome; no image library.
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const before = 'output/playwright/v6-baseline', after = 'output/playwright/v6-after', dir = 'output/playwright/v6-compare';
const BEFORE = `Before: v5 build (${process.env.HAUNT_BEFORE_BUNDLE ?? 'haunt-DuQWST70.js'})`;
const AFTER = `After: v6 build (${process.env.HAUNT_AFTER_BUNDLE ?? 'current dist'})`;
const sheets = [
  { name: '01-note-on-its-paper', title: 'The note in TERMINAL’s session window, as ECHO shows it live',
    note: 'v5: “FOR THE NEXT PER—” and the signature run past the paper. v6: measured ink, wrapped by words, signature in TERMINAL’s UI font.',
    rows: [['1366-dpr1-live-echo-echo-screen-paper.png', '1366×768 · DPR 1 · live'], ['1440-dpr2-live-echo-echo-screen-paper.png', '1440×900 · DPR 2 · live'],
      ['1920-dpr1-live-echo-echo-screen-paper.png', '1920×1080 · DPR 1 · live'], ['1366-dpr1-minimum-echo-echo-screen-paper.png', '1366×768 · ECHO at its minimum size'],
      ['1920-dpr1-maximized-echo-echo-screen-paper.png', '1920×1080 · ECHO maximized']] },
  { name: '02-note-when-kept', title: 'The same note in a kept capture: list thumbnail, negative, picture',
    note: 'A capture of the session window draws the same note from its own data, at every size.',
    rows: [['1440-dpr2-captures-echo-thumb-paper.png', '1440×900 · DPR 2 · capture list thumbnail'], ['1440-dpr2-captures-echo-negative-canvas-paper.png', '1440×900 · DPR 2 · negative'],
      ['1440-dpr2-captures-echo-capture-picture-paper.png', '1440×900 · DPR 2 · picture'], ['1366-dpr1-captures-echo-thumb-paper.png', '1366×768 · DPR 1 · thumbnail'],
      ['1920-dpr1-captures-maximized-echo-capture-picture-paper.png', '1920×1080 · ECHO maximized · picture']] },
  { name: '03-note-fallback-fonts', title: 'The note with fallback fonts (simulated by rewriting the canvas font list)',
    note: 'Without Segoe Print (Ink Free), with none of the listed hand fonts (generic cursive), and without Cascadia (Consolas).',
    rows: [['fallback-inkfree-live-echo-echo-screen-paper.png', 'no Segoe Print → Ink Free'], ['fallback-cursive-live-echo-echo-screen-paper.png', 'generic cursive'],
      ['fallback-consolas-live-echo-echo-screen-paper.png', 'no Cascadia → Consolas (header font)']] },
  { name: '04-header-and-status', title: 'The session window’s header and ECHO’s LIVE / PAUSED status',
    note: 'v5: the status badge covers the drawn header (minute, PID). v6: the status has its own bar above the picture.',
    rows: [['1366-dpr1-live-echo-monitor-top.png', '1366×768 · DPR 1 · live'], ['1440-dpr2-live-echo-monitor-top.png', '1440×900 · DPR 2 · live'],
      ['1920-dpr1-live-echo-monitor-top.png', '1920×1080 · DPR 1 · live'], ['1366-dpr1-minimum-echo-monitor-top.png', '1366×768 · ECHO at its minimum size'],
      ['1440-dpr2-maximized-echo-monitor-top.png', '1440×900 · DPR 2 · ECHO maximized']] },
  { name: '05-paused', title: 'Paused while the call is on: the ghost line',
    note: 'v5: the line is written over the signature. v6: it is written where the session window draws only its wall.',
    rows: [['1440-dpr2-paused-echo-echo-screen-paper.png', '1440×900 · DPR 2 · the note while paused'], ['1366-dpr1-paused.png', '1366×768 · DPR 1 · the whole desktop']] },
  { name: '06-capture-negative', title: 'ECHO’s Captures at 1366×768: the negative view',
    note: 'v5: the negative is taller than its place and covers the chips and caption below it. v6: it is sized by its real aspect.',
    rows: [['1366-dpr1-captures.png', '1366×768 · DPR 1'], ['1440-captures-glass-maximized.png', '1440×900 · a glass capture, ECHO maximized']] },
  { name: '07-canvas-below', title: 'CANVAS, Night paper, Below, at 1366×768',
    note: 'v5: the Below letter is taller than the stage and covers Undo, Redo and Compose (Compose could not be clicked). v6: it fits.',
    rows: [['1366-dpr1-letter-canvas-night-below.png', '1366×768 · DPR 1'], ['1920-dpr2-letter-canvas-night-below.png', '1920×1080 · DPR 2']] },
  { name: '08-session-words', title: 'Words for the session window beside its visible note',
    note: 'v5: “No writing”, “Empty window”, “the picture shows only mist”. v6: Unfinished note; its note stops at “PER—”; no handprint.',
    rows: [['after-milestone-live.png', 'ECHO, session window, after the minute'], ['session-letter-canvas.png', 'CANVAS, a letter made from the session window']] },
];

await mkdir(dir, { recursive: true });
const b64 = async path => { try { return (await readFile(path)).toString('base64'); } catch { return null; } };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const written = [];
try {
  for (const sheet of sheets) {
    const rows = [];
    for (const [file, label] of sheet.rows) rows.push({ label, file, before: await b64(`${before}/${file}`), after: await b64(`${after}/${file}`) });
    const png = await page.evaluate(async ({ sheet, rows, BEFORE, AFTER }) => {
      const load = async data => { if (!data) return null; const img = new Image(); img.src = `data:image/png;base64,${data}`; await img.decode(); return img; };
      const items = [];
      for (const row of rows) items.push({ ...row, a: await load(row.before), b: await load(row.after) });
      const colW = 920, gap = 28, pad = 32, labelH = 26, headH = 104;
      for (const it of items) {
        const w = Math.max(it.a?.width ?? 1, it.b?.width ?? 1);
        // Enlarge small crops by a whole factor (pixels stay pixels); shrink large screenshots to the column.
        it.s = w * 2 <= colW ? Math.min(4, Math.floor(colW / w)) : Math.min(1, colW / w);
        it.h = Math.max(it.a?.height ?? 0, it.b?.height ?? 0) * it.s;
      }
      const W = pad * 2 + colW * 2 + gap, H = headH + items.reduce((sum, it) => sum + labelH + it.h + gap, 0) + pad;
      const c = new OffscreenCanvas(W, H), x = c.getContext('2d');
      x.fillStyle = '#0c1316'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#e9f1f3'; x.font = '600 22px "Segoe UI", sans-serif'; x.fillText(sheet.title, pad, 38);
      x.fillStyle = '#a9bcc2'; x.font = '15px "Segoe UI", sans-serif'; x.fillText(sheet.note, pad, 64);
      x.font = '600 15px "Segoe UI", sans-serif';
      x.fillStyle = '#f0b78a'; x.fillText(BEFORE, pad, 94);
      x.fillStyle = '#9fe0b4'; x.fillText(AFTER, pad + colW + gap, 94);
      let y = headH;
      for (const it of items) {
        x.fillStyle = '#cfdde1'; x.font = '14px "Segoe UI", sans-serif'; x.fillText(`${it.label}  ·  ${it.file}${it.s > 1 ? `  ·  enlarged ×${it.s}` : it.s < 1 ? `  ·  shown at ${Math.round(it.s * 100)} %` : ''}`, pad, y + 17);
        y += labelH;
        for (const [img, left] of [[it.a, pad], [it.b, pad + colW + gap]]) {
          if (!img) { x.fillStyle = '#5d6d72'; x.fillText('(no image)', left, y + 20); continue; }
          x.imageSmoothingEnabled = it.s < 1;
          x.drawImage(img, left, y, img.width * it.s, img.height * it.s);
          x.strokeStyle = '#2b3b42'; x.lineWidth = 1; x.strokeRect(left - 0.5, y - 0.5, img.width * it.s + 1, img.height * it.s + 1);
        }
        y += it.h + gap;
      }
      const blob = await c.convertToBlob({ type: 'image/png' });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(s);
    }, { sheet, rows, BEFORE, AFTER });
    const out = `${dir}/${sheet.name}.png`;
    await writeFile(out, Buffer.from(png, 'base64'));
    written.push({ file: out, rows: rows.map(row => ({ file: row.file, before: !!row.before, after: !!row.after })) });
  }
} finally {
  await browser.close();
}
await writeFile(`${dir}/index.json`, JSON.stringify({ before, after, BEFORE, AFTER, sheets: written }, null, 2));
console.log(written.map(item => `${item.file}: ${item.rows.filter(row => row.before && row.after).length}/${item.rows.length} pairs`).join('\n'));
