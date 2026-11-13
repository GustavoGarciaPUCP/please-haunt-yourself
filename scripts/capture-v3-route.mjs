// HISTORICAL (v3): this script targets the retired v3 page (room, prints, haunt.case.v3) and does not run against v4.
// Use scripts/capture-v4-route.mjs. Kept for the provenance of the v3 recording in output/playwright/v3-video/.
// Records the v3 checkpoint route with real input (not a check). Output: a .webm video at 1366×768, its measured
// automated duration, and stills at 1366×768, 1440×900 and 1920×1080. A small dot that follows the pointer is drawn
// by this script only, because headless recordings do not show the system cursor; it is not part of the product.
import { chromium } from 'playwright';
import { mkdir, writeFile, readdir, rename, rm } from 'node:fs/promises';
import { PC_SIZES, settled, titlebarPoint, url } from './haunt-helpers.mjs';

const dir = 'output/playwright/v3-video';
await rm(dir, { recursive: true, force: true });
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const cursor = () => {
  addEventListener('DOMContentLoaded', () => {
    const dot = document.createElement('div');
    dot.style.cssText = 'position:fixed;z-index:99999;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid #fff;background:#ffffff40;box-shadow:0 0 6px #000;pointer-events:none;transition:transform 80ms;';
    document.body.append(dot);
    addEventListener('pointermove', e => { dot.style.left = `${e.clientX}px`; dot.style.top = `${e.clientY}px`; }, true);
    addEventListener('pointerdown', () => { dot.style.transform = 'scale(.75)'; }, true);
    addEventListener('pointerup', () => { dot.style.transform = ''; }, true);
  });
};
const beats = [];
async function route(page, { pause, stills = null }) {
  const started = Date.now();
  const mark = label => beats.push({ label, at: Math.round((Date.now() - started) / 100) / 10 });
  const still = async name => { if (stills) await page.screenshot({ path: `output/playwright/v3-final-${name}-${stills}.png` }); };
  const click = async locator => { const b = await locator.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 }); await page.waitForTimeout(pause * 0.3); await locator.click(); };
  const drag = async (id, dx, dy) => {
    const point = await titlebarPoint(page)(id);
    await page.mouse.move(point.x, point.y, { steps: 10 }); await page.mouse.down();
    await page.mouse.move(point.x + dx, point.y + dy, { steps: 30 }); await page.mouse.up();
  };
  await settled(page, 'terminal');
  await page.waitForTimeout(pause * 3); mark('desktop: TERMINAL with the job and the writing ghost'); await still('shell');
  await click(page.locator('[data-enter-session]')); await page.waitForTimeout(pause * 1.5); mark('room');
  await click(page.locator('.legacy-interior [data-main-action]')); await page.waitForTimeout(3600); mark('first attempt: bell, HELP ME.'); await still('room-bell');
  await click(page.locator('.legacy-interior [data-object="bell"]')); await page.waitForTimeout(pause * 1.5);
  await click(page.locator('#room-panel [data-room="muffle"]')); await page.waitForTimeout(pause);
  await click(page.locator('.legacy-interior [data-main-action]')); await page.waitForTimeout(3600); mark('plausible error: muffled, still comes back'); await still('room-muffled');
  // The Bell panel is still open from muffling; the real fix is the other button in it.
  await click(page.locator('#room-panel [data-room="call"]')); await page.waitForTimeout(pause * 2); mark('recovery: the call has stopped');
  await click(page.locator('.legacy-interior [data-main-action]')); mark('let it finish');
  await page.waitForTimeout(2700); await still('reveal');
  await page.waitForFunction(() => !document.getElementById('desktop-glass').dataset.reveal, null, { timeout: 8000 }); await page.waitForTimeout(pause * 2); mark('the impression is on the glass'); await still('glass');
  await click(page.locator('.legacy-interior [data-legacy="return"]').first()); await page.waitForTimeout(pause * 2);
  await drag('terminal', 1000, 0); await page.waitForTimeout(pause * 3); mark('moved TERMINAL: the fixed handprint and the note'); await still('exposed');
  await click(page.locator('#btn-echo')); await settled(page, 'echo'); await page.waitForTimeout(pause * 1.5);
  await click(page.getByRole('radio', { name: 'Desktop glass' })); await page.waitForTimeout(pause * 1.5);
  const target = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('haunt.case.v3')), stage = document.getElementById('desktop-stage').getBoundingClientRect(), h = stage.height;
    const handLeft = save.glass.hand[0] * stage.width - 0.095 * h + stage.left, handTop = save.glass.hand[1] * h - 0.125 * h + stage.top;
    const monitor = document.querySelector('.echo-screen').getBoundingClientRect();
    return { dx: handLeft - 0.075 * h - (monitor.left + monitor.width / 2), dy: handTop + 0.13 * h - (monitor.top + monitor.height / 2), handLeft, handTop, h };
  });
  await drag('echo', target.dx, target.dy); await page.waitForTimeout(pause * 2); mark('ECHO framing the impression through the glass'); await still('framed');
  const monitor = await page.locator('.echo-screen').boundingBox();
  for (const v of [0.04, 0.1, 0.16, 0.22]) {
    await page.mouse.move(target.handLeft + 0.12 * target.h, target.handTop + v * target.h, { steps: 8 }); await page.mouse.down();
    await page.mouse.move(monitor.x + monitor.width - 14, target.handTop + v * target.h + 6, { steps: 14 }); await page.mouse.up();
  }
  await page.waitForTimeout(pause * 2); mark('wiped beside the palm: the figure behind the glass');
  await click(page.getByRole('button', { name: 'Capture print', exact: true })); await page.waitForTimeout(pause * 2);
  await click(page.getByRole('button', { name: 'Use for the letter', exact: true })); await page.waitForTimeout(pause * 3); mark('print kept for the letter'); await still('kept');
  await click(page.locator('#window-echo [aria-label="Minimize"]')); await page.waitForTimeout(pause * 3); mark('desktop: the letter is still waiting'); await still('end');
  return Date.now() - started;
}

// Playwright's .webm recorder needs its ffmpeg binary. Without it (no tool installs in this task), Chrome's own
// screencast saves the real frames as a numbered JPEG sequence instead.
const errors = [];
let context = await browser.newContext({ viewport: PC_SIZES[0], recordVideo: { dir, size: PC_SIZES[0] } });
let page, recording = 'webm', frames = 0;
try { page = await context.newPage(); } catch {
  await context.close();
  recording = 'screencast-frames';
  context = await browser.newContext({ viewport: PC_SIZES[0] });
  page = await context.newPage();
  await mkdir(`${dir}/frames`, { recursive: true });
  const cdp = await context.newCDPSession(page);
  cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
    frames++;
    await writeFile(`${dir}/frames/frame-${String(frames).padStart(4, '0')}.jpg`, Buffer.from(data, 'base64'));
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 72, maxWidth: 1366, maxHeight: 768, everyNthFrame: 2 });
}
await context.addInitScript(() => localStorage.setItem('haunt.guide.v2', 'dismissed'));
await context.addInitScript(cursor);
page.on('pageerror', error => errors.push(error.message));
await page.goto(url);
const duration = await route(page, { pause: 600 });
await context.close();
if (recording === 'webm') {
  const [video] = (await readdir(dir)).filter(name => name.endsWith('.webm'));
  await rename(`${dir}/${video}`, `${dir}/v3-checkpoint-route-1366x768.webm`);
}
const route1366 = [...beats];

for (const viewport of PC_SIZES) {
  beats.length = 0;
  const stillPage = await browser.newPage({ viewport });
  stillPage.on('pageerror', error => errors.push(error.message));
  await stillPage.addInitScript(() => localStorage.setItem('haunt.guide.v2', 'dismissed'));
  await stillPage.goto(url);
  await route(stillPage, { pause: 150, stills: `${viewport.width}x${viewport.height}` });
  await stillPage.close();
}
await browser.close();
const report = { url, recording, output: recording === 'webm' ? `${dir}/v3-checkpoint-route-1366x768.webm` : `${dir}/frames (${frames} JPEG frames)`,
  automatedRouteSeconds: Math.round(duration / 100) / 10, beats: route1366, pageErrors: errors,
  note: 'Automated input with deliberate pauses; this is not a human play time. The pointer dot is drawn by the capture script.' };
await writeFile('output/playwright/v3-route-capture.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
