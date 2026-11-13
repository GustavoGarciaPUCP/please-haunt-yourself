// Before/after sheets for .kiro/specs/confirmation-flow-v7: screenshots with the same name from the probe run on the v6
// build (output/playwright/v7-baseline/) and on the v7 build (output/playwright/v7-after/), side by side and labelled,
// plus a sheet of the questions each build asked when every question was accepted (from the two probe reports).
// Writes output/playwright/v7-compare/*.png. Composed in Chrome; no image library.
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const before = 'output/playwright/v7-baseline', after = 'output/playwright/v7-after', dir = 'output/playwright/v7-compare';
const BEFORE = `Before: v6 build (${process.env.HAUNT_BEFORE_BUNDLE ?? 'haunt-Db2YorXu.js'})`;
const AFTER = `After: v7 build (${process.env.HAUNT_AFTER_BUNDLE ?? 'current dist'})`;
const sheets = [
  { name: '01-the-question', title: 'Complete letter A delivered; incomplete B sent to guest: what POSTMAN asks',
    note: 'v6: only that B is incomplete (a Replace question follows, then this one again). v7: one question names both facts and the letter it would replace.',
    rows: [['1366-01-after-send-pane.png', '1366×768'], ['1440-01-after-send-pane.png', '1440×900'], ['1920-01-after-send-pane.png', '1920×1080']] },
  { name: '02-after-one-acceptance', title: 'After accepting the first question once',
    note: 'v6: the Replace question; nothing has been delivered, and accepting it brings back the first one. v7: delivered; B is Incomplete, A is Replaced; TERMINAL notes it.',
    rows: [['1366-02-after-one-acceptance.png', '1366×768'], ['1920-02-after-one-acceptance.png', '1920×1080']] },
  { name: '03-letter-changed', title: 'The question asked, then the writing lifted in CANVAS before answering',
    note: 'v6: the question still says the letter is incomplete. v7: it closes and says why; nothing was sent, and Send asks about the letter as it is.',
    rows: [['1366-03-after-canvas-change.png', '1366×768']] },
  { name: '04-postman-minimum', title: 'The first question with POSTMAN at its minimum size (640×460)',
    note: 'v7: the longer question is written so that its three buttons stay in view without scrolling.',
    rows: [['1366-04-postman-minimum-after-send.png', '1366×768']] },
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
        it.s = w * 2 <= colW ? Math.min(2, Math.floor(colW / w)) : Math.min(1, colW / w);
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

  // The sequence of questions with every question accepted, by pointer at 1366×768, from the two probe reports.
  const sequence = async file => {
    const report = JSON.parse(await readFile(file, 'utf8'));
    const s = report.sections.find(item => item.name.includes('by pointer (1366'));
    const steps = [];
    if (s.first?.visible) steps.push({ q: s.first.text, d: 1 });
    for (const step of s.rest.steps) steps.push({ q: step.text, d: step.deliveries });
    return { steps, end: s.rest.end, loops: s.rest.loops };
  };
  const [seqA, seqB] = [await sequence(`${before}.json`), await sequence(`${after}.json`)];
  const png = await page.evaluate(async ({ seqA, seqB, BEFORE, AFTER }) => {
    const colW = 920, gap = 28, pad = 32, W = pad * 2 + colW * 2 + gap;
    const c = new OffscreenCanvas(W, 1400), x = c.getContext('2d');
    const wrap = (text, width) => {
      const words = text.split(' '), lines = []; let line = '';
      for (const word of words) { const next = line ? `${line} ${word}` : word; if (x.measureText(next).width > width && line) { lines.push(line); line = word; } else line = next; }
      if (line) lines.push(line);
      return lines;
    };
    const column = (seq, left, top) => {
      let y = top;
      seq.steps.forEach((step, i) => {
        x.font = '600 14px "Segoe UI", sans-serif'; x.fillStyle = '#cfdde1';
        x.fillText(`${i + 1}. POSTMAN asks (deliveries so far: ${step.d})`, left, y); y += 20;
        x.font = '14px "Segoe UI", sans-serif'; x.fillStyle = '#a9bcc2';
        for (const line of wrap(`“${step.q}”`, colW - 24)) { x.fillText(line, left + 12, y); y += 19; }
        x.fillStyle = '#7f9399'; x.fillText('→ accepted', left + 12, y); y += 28;
      });
      x.font = '600 15px "Segoe UI", sans-serif'; x.fillStyle = seq.loops ? '#f0b78a' : '#9fe0b4';
      const end = seq.end;
      const text = seq.loops ? `Still asking after ${seq.steps.length} acceptances: ${end.deliveries} delivery, A is the job’s letter, phase ${end.phase}.`
        : `Done after ${seq.steps.length} acceptance: ${end.deliveries} deliveries; the new one is incomplete (${end.last.missing.join(', ')}); phase ${end.phase}; A unchanged: ${end.aUnchanged}.`;
      for (const line of wrap(text, colW - 12)) { x.fillText(line, left, y); y += 21; }
      return y;
    };
    x.fillStyle = '#0c1316'; x.fillRect(0, 0, W, 1400);
    x.fillStyle = '#e9f1f3'; x.font = '600 22px "Segoe UI", sans-serif'; x.fillText('Every question accepted, by pointer (1366×768): the questions POSTMAN asked, in order', pad, 38);
    x.fillStyle = '#a9bcc2'; x.font = '15px "Segoe UI", sans-serif'; x.fillText('From the probe reports output/playwright/v7-baseline.json and v7-after.json (the probe stops after seven acceptances).', pad, 64);
    x.font = '600 15px "Segoe UI", sans-serif';
    x.fillStyle = '#f0b78a'; x.fillText(BEFORE, pad, 94);
    x.fillStyle = '#9fe0b4'; x.fillText(AFTER, pad + colW + gap, 94);
    const h = Math.max(column(seqA, pad, 124), column(seqB, pad + colW + gap, 124)) + pad;
    const out = new OffscreenCanvas(W, h); out.getContext('2d').drawImage(c, 0, 0);
    const blob = await out.convertToBlob({ type: 'image/png' });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }, { seqA, seqB, BEFORE, AFTER });
  await writeFile(`${dir}/00-sequence.png`, Buffer.from(png, 'base64'));
  written.unshift({ file: `${dir}/00-sequence.png`, rows: [] });
} finally {
  await browser.close();
}
await writeFile(`${dir}/index.json`, JSON.stringify({ before, after, BEFORE, AFTER, sheets: written }, null, 2));
console.log(written.map(item => `${item.file}: ${item.rows.filter(row => row.before && row.after).length}/${item.rows.length} pairs`).join('\n'));
