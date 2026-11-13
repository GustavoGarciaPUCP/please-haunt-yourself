// Before/after sheets for .kiro/specs/free-text-v8: screenshots with the same name from the probe (scripts/v8-baseline.mjs)
// run on the v7 build (output/playwright/v8-baseline/) and on the v8 build (output/playwright/v8-after/), side by side and
// labelled. Every pair is the same real-input route: text typed into POSTMAN's own fields, within their limits, and sent.
// Writes output/playwright/v8-compare/*.png and index.json. Composed in Chrome; no image library.
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const before = 'output/playwright/v8-baseline', after = 'output/playwright/v8-after', dir = 'output/playwright/v8-compare';
const BEFORE = `Before: v7 build (${process.env.HAUNT_BEFORE_BUNDLE ?? 'haunt-U_tkFtyC.js'})`;
const AFTER = `After: v8 build (${process.env.HAUNT_AFTER_BUNDLE ?? 'current dist'})`;
const BOTH = 'Subject 120 × W and Message 600 unbroken characters (abcdef × 100), typed and sent to guest';
const sheets = [
  { name: '00-desktop', title: `${BOTH}: the whole desktop at 1366×768`,
    note: 'The overflow is inside the POSTMAN window: the other windows and the taskbar are the same in both builds.',
    rows: [['1366-both-default.png', '1366×768, POSTMAN as it opens']] },
  { name: '01-both-fields-three-sizes', title: `${BOTH}: POSTMAN as it opens`,
    note: 'v7: the text sets the width. The reading pane scrolls sideways to 4209 px, the heading and message run past its edge, the letter is drawn at 560 px and cut off, and the list row is centred on a 1507 px subject, so its sender, time and badge go out of the list. v8: the same text wraps inside the pane and the list; the letter is scaled to the pane at its 1.62 shape.',
    rows: [['1366-both-default-postman.png', '1366×768'], ['1440-both-default-postman.png', '1440×900'], ['1920-both-default-postman.png', '1920×1080']] },
  { name: '02-both-fields-maximized-minimum', title: `${BOTH}: POSTMAN maximized and at its minimum (640×460)`,
    note: 'v7: maximized, the heading and message still run past the 970 px pane (its content is 4209 px wide), while the letter fits; at the minimum the pane is 242 px wide and the receipt, heading, From/To lines, message and letter are all cut off. v8: the letter is 560 px maximized and 210 px at the minimum, the text wraps, and the pane scrolls only vertically.',
    rows: [['1366-both-maximized-postman.png', '1366×768, maximized'], ['1366-both-minimum-postman.png', '1366×768, minimum, Guest Inbox'], ['1366-both-sent-minimum-postman.png', '1366×768, minimum, Sent']] },
  { name: '03-one-field', title: 'One long field at a time, POSTMAN as it opens (1366×768)',
    note: 'v7: the subject alone widens the list row and the reading pane (2022 px), cutting off the heading, the receipt’s sentence and the letter. The message alone (with the case’s subject) leaves the list as it was but widens the pane to 4209 px: the message, the receipt’s sentence and the letter are cut off. v8: both wrap inside, and the letter fits the pane.',
    rows: [['1366-subject-default-postman.png', 'Subject alone (120 × W)'], ['1366-message-default-postman.png', 'Message alone (600 unbroken)']] },
  { name: '04-returned', title: 'Returned: the same two fields in a letter to mara@haunt, and the draft kept for correction (1366×768)',
    note: 'v7: the Returned view behaves as in sheet 01; the kept draft shows the long subject in the Drafts list the same way. v8: contained in both.',
    rows: [['1366-returned-default-postman.png', 'Returned, as it opens'], ['1366-returned-draft-minimum-postman.png', 'The kept draft, POSTMAN at its minimum']] },
  { name: '05-unknown-address', title: 'An unknown address of 80 characters in To (the field’s limit): POSTMAN’s notice repeats it',
    note: 'v7: the notice is not wrapped and widens the draft editor to 564 px, so the notice is cut off and the To, Subject and Message fields run past the window’s edge; at the minimum the guest@haunt suggestion is cut off too. v8: the notice wraps the address inside the editor. Nothing is sent in either build.',
    rows: [['1366-recipient-default-postman.png', '1366×768, as it opens'], ['1366-recipient-minimum-postman.png', '1366×768, POSTMAN at its minimum']] },
  { name: '06-incomplete-minimum', title: 'An incomplete letter with both long fields, sent anyway, POSTMAN at its minimum (1366×768)',
    note: 'v7: the receipt’s sentence is cut off and Fix it in CANVAS lies mostly outside the visible pane (“Fix i” shows); Tab focuses it, but it stays out of view. v8: the sentence wraps, Return to the request and Fix it in CANVAS are inside the pane, and the subject, message and letter follow below.',
    rows: [['1366-incomplete-minimum-postman.png', '1366×768, minimum, after Send anyway']] },
  { name: '07-reload', title: `${BOTH}: after Finish session and a reload (1366×768)`,
    note: 'The case finished in both builds and a reload kept the end; the stored delivery is exactly the typed text in both. Only the layout differs.',
    rows: [['1366-both-reloaded-postman.png', '1366×768, Guest Inbox after the reload']] },
  { name: '08-controls-no-defect', title: 'Controls with no defect in v7: long text with spaces and 8 line breaks, a short Unicode sample, the case’s normal content (1366×768)',
    note: 'These rendered inside the pane in v7 already. v8 must keep them as they were: the line breaks, the word wrapping at spaces, the Unicode text and the normal letter.',
    rows: [['1366-spaced-default-postman.png', 'Spaced text with line breaks (113 + 600 characters)'], ['1366-unicode-default-postman.png', 'Short Unicode sample'], ['1366-normal-default-postman.png', 'The case’s normal content']] },
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
      const colW = 920, gap = 28, pad = 32, labelH = 26;
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
      for (const it of items) {
        const w = Math.max(it.a?.width ?? 1, it.b?.width ?? 1);
        it.s = w * 2 <= colW ? Math.min(2, Math.floor(colW / w)) : Math.min(1, colW / w);
        it.h = Math.max(it.a?.height ?? 0, it.b?.height ?? 0) * it.s;
      }
      const H = headH + items.reduce((sum, it) => sum + labelH + it.h + gap, 0) + pad;
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
    written.push({ file: out, title: sheet.title, rows: rows.map(row => ({ file: row.file, before: !!row.before, after: !!row.after })) });
  }
} finally {
  await browser.close();
}
await writeFile(`${dir}/index.json`, JSON.stringify({ before, after, BEFORE, AFTER, sheets: written }, null, 2));
console.log(written.map(item => `${item.file}: ${item.rows.filter(row => row.before && row.after).length}/${item.rows.length} pairs`).join('\n'));
