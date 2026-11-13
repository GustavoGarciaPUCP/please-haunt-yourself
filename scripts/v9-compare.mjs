// Before/after sheets for .kiro/specs/fluid-typing-v9: the active-window probe (scripts/v9-active-baseline.mjs) run on
// the v8 build (output/playwright/v9-active-v8/) and on the v9 build (v9-active-v9/), same steps and file names. Each
// pair is cropped to TERMINAL's window and enlarged, so its frame (border, titlebar accent) can be compared.
// Writes output/playwright/v9-compare/*.png and index.json. Composed in Chrome; no image library.
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const before = 'output/playwright/v9-active-v8', after = 'output/playwright/v9-active-v9', dir = 'output/playwright/v9-compare';
const BEFORE = 'Before: v8 build (haunt-CjGjZ4b_.js)';
const AFTER = `After: v9 build (${process.env.HAUNT_AFTER_BUNDLE ?? 'current dist'})`;
// TERMINAL's default box at 1366×768 (the probe never moves it): x 112, y 24 + the taskbar-free stage offset.
const report = JSON.parse(await readFile(`${after}.json`, 'utf8'));
const terminal = report.steps.find(step => step.windows.some(win => win.id === 'terminal'))?.windows.find(win => win.id === 'terminal');
const crop = { x: 100, y: 0, w: 600, h: 300 };
const sheets = [
  { name: '01-after-close', title: 'ECHO closed with X: TERMINAL is the active window (the taskbar shows it pressed)',
    note: 'v8: TERMINAL keeps the inactive frame (border rgb(42, 58, 64), plain titlebar). v9: it has the active frame at once (border rgb(54, 73, 79), the titlebar accent). Focus is on ECHO\'s taskbar button in both builds.',
    rows: [['after-close.png', 'Right after the close']] },
  { name: '02-after-click', title: 'Then a click in TERMINAL\'s command field and typing “help”',
    note: 'v8: the field has focus and receives the keys, but the frame still looks inactive (the click raises nothing: the model already treats TERMINAL as active). v9: active frame.',
    rows: [['after-click.png', 'After the click and the keys (the command field is below the crop)']] },
  { name: '03-after-minimize', title: 'ECHO opened again, then minimized with its button: TERMINAL is the active window',
    note: 'v8: TERMINAL inactive, while the hidden ECHO keeps the active class. v9: TERMINAL active, the minimized ECHO not.',
    rows: [['after-minimize.png', 'Right after the minimize']] },
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
    const png = await page.evaluate(async ({ sheet, rows, BEFORE, AFTER, crop }) => {
      const load = async data => { if (!data) return null; const img = new Image(); img.src = `data:image/png;base64,${data}`; await img.decode(); return img; };
      const scale = 1.5, colW = crop.w * scale, gap = 28, pad = 32, labelH = 26;
      const W = pad * 2 + colW * 2 + gap;
      const measure = new OffscreenCanvas(1, 1).getContext('2d');
      const wrap = (text, font, width) => {
        measure.font = font;
        const words = text.split(' '), lines = []; let line = '';
        for (const word of words) { const next = line ? `${line} ${word}` : word; if (measure.measureText(next).width > width && line) { lines.push(line); line = word; } else line = next; }
        if (line) lines.push(line);
        return lines;
      };
      const titleFont = '600 22px "Segoe UI", sans-serif', noteFont = '15px "Segoe UI", sans-serif';
      const titleLines = wrap(sheet.title, titleFont, W - pad * 2), noteLines = wrap(sheet.note, noteFont, W - pad * 2);
      const headH = 26 + titleLines.length * 28 + noteLines.length * 21 + 46;
      const H = headH + rows.length * (labelH + crop.h * scale + gap) + pad;
      const c = new OffscreenCanvas(W, H), x = c.getContext('2d');
      x.fillStyle = '#0c1316'; x.fillRect(0, 0, W, H);
      let y = 38;
      x.fillStyle = '#e9f1f3'; x.font = titleFont; for (const line of titleLines) { x.fillText(line, pad, y); y += 28; }
      x.fillStyle = '#a9bcc2'; x.font = noteFont; y -= 2; for (const line of noteLines) { x.fillText(line, pad, y); y += 21; }
      y += 14;
      x.font = '600 15px "Segoe UI", sans-serif';
      x.fillStyle = '#f0b78a'; x.fillText(BEFORE, pad, y);
      x.fillStyle = '#9fe0b4'; x.fillText(AFTER, pad + colW + gap, y);
      y = headH;
      for (const row of rows) {
        x.fillStyle = '#cfdde1'; x.font = '14px "Segoe UI", sans-serif'; x.fillText(`${row.label}  ·  ${row.file}  ·  TERMINAL's titlebar, cropped and enlarged ×${scale}`, pad, y + 17);
        y += labelH;
        for (const [data, left] of [[row.before, pad], [row.after, pad + colW + gap]]) {
          const img = await load(data);
          if (!img) { x.fillStyle = '#5d6d72'; x.fillText('(no image)', left, y + 20); continue; }
          x.imageSmoothingEnabled = true;
          x.drawImage(img, crop.x, crop.y, crop.w, crop.h, left, y, crop.w * scale, crop.h * scale);
          x.strokeStyle = '#2b3b42'; x.lineWidth = 1; x.strokeRect(left - 0.5, y - 0.5, crop.w * scale + 1, crop.h * scale + 1);
        }
        y += crop.h * scale + gap;
      }
      const blob = await c.convertToBlob({ type: 'image/png' });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(s);
    }, { sheet, rows, BEFORE, AFTER, crop });
    const out = `${dir}/${sheet.name}.png`;
    await writeFile(out, Buffer.from(png, 'base64'));
    written.push({ file: out, title: sheet.title, rows: rows.map(row => ({ file: row.file, before: !!row.before, after: !!row.after })) });
  }
} finally {
  await browser.close();
}
await writeFile(`${dir}/index.json`, JSON.stringify({ before, after, BEFORE, AFTER, crop, terminal: terminal ?? null, sheets: written }, null, 2));
console.log(written.map(item => `${item.file}: ${item.rows.filter(row => row.before && row.after).length}/${item.rows.length} pairs`).join('\n'));
