// Records the v4 route with real input (not a check): the whole case with one plausible mistake in TERMINAL, CANVAS
// and POSTMAN. Output: Chrome screencast frames at 1366×768 (no video encoder is installed), the measured automated
// duration with labelled beats, and stills of each program at 1366×768, 1440×900 and 1920×1080. The white dot that
// follows the pointer is drawn by this script, because headless recordings show no cursor; it is not in the product.
import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { PC_SIZES, cueDone, glassIdle, handPoint, settled, skipBoot, titlebarPoint, url } from './haunt-helpers.mjs';

const dir = 'output/playwright/v4-route';
await rm(dir, { recursive: true, force: true });
await mkdir(`${dir}/frames`, { recursive: true });
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
  const still = async name => { if (stills) await page.screenshot({ path: `output/playwright/v4-final-${name}-${stills}.png` }); };
  const click = async selector => {
    const locator = page.locator(selector).first(), b = await locator.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
    await page.waitForTimeout(pause * 0.3);
    await locator.click();
  };
  const drag = async (id, dx, dy) => {
    const point = await titlebarPoint(page)(id);
    await page.mouse.move(point.x, point.y, { steps: 10 }); await page.mouse.down();
    await page.mouse.move(point.x + dx, point.y + dy, { steps: 30 }); await page.mouse.up();
  };
  await skipBoot(page);
  await settled(page, 'terminal');
  await page.waitForTimeout(pause * 3); mark('desktop: TERMINAL restores last.session; a line nobody typed'); await still('desktop');
  await click('[data-enter-session]'); await page.waitForTimeout(pause * 1.5); mark('inside the session: note, figure, bell, way out');
  await click('.session-pane [data-main-action]'); await cueDone(page); await page.waitForTimeout(pause); mark('first attempt: the bell rings, HELP ME.');
  await click('.session-pane [data-object="bell"]'); await page.waitForTimeout(pause * 1.5); await still('terminal-bell');
  await click('.session-pane [data-room="muffle"]'); await page.waitForTimeout(pause);
  await click('.session-pane [data-main-action]'); await cueDone(page); await page.waitForTimeout(pause); mark('plausible error: muffled, it still comes back');
  await click('.session-pane [data-room="call"]'); await page.waitForTimeout(pause * 2); mark('Stop the call');
  await click('.session-pane [data-main-action]'); mark('Let it finish this time');
  await cueDone(page); await page.waitForTimeout(900); await still('reveal');
  await glassIdle(page); await page.waitForTimeout(pause * 2); mark('the impression is on the glass'); await still('glass');
  await click('.session-pane [data-main-action]'); await page.waitForTimeout(pause);
  await click('#btn-echo'); await settled(page, 'echo'); await page.waitForTimeout(pause);
  await click('#window-echo .echo-sources label:has(input[value="glass"])'); await page.waitForTimeout(pause);
  const hand = await handPoint(page), monitor = await page.locator('#window-echo .echo-monitor').boundingBox();
  await drag('echo', hand.x - (monitor.x + monitor.width / 2), hand.y - (monitor.y + monitor.height / 2)); await page.waitForTimeout(pause * 2);
  mark('ECHO frames the glass behind it: handprint and writing'); await still('echo-live');
  const screen = await page.locator('#window-echo .echo-screen').boundingBox();
  for (const v of [0.18, 0.26, 0.34]) {
    await page.mouse.move(hand.x + screen.width * 0.08, screen.y + screen.height * v, { steps: 6 }); await page.mouse.down();
    await page.mouse.move(hand.x + screen.width * 0.32, screen.y + screen.height * (v + 0.04), { steps: 14 }); await page.mouse.up();
  }
  await page.waitForTimeout(pause); mark('wiped beside the palm: the figure behind the glass');
  await click('#window-echo [data-echo="capture"]'); await page.waitForTimeout(pause * 2); mark('Capture: full image kept, the frame becomes the picture'); await still('echo-captures');
  await click('#window-echo [data-echo="use"]'); await settled(page, 'canvas'); await page.waitForTimeout(pause * 1.5); mark('CANVAS receives the capture');
  await page.locator('#window-canvas input[type="range"]').fill('0'); await page.waitForTimeout(pause * 2); mark('plausible error: clearing the mist loses the words (“Not the words.”)'); await still('canvas-error');
  await click('#window-canvas [data-canvas="undo"]'); await page.waitForTimeout(pause);
  await click('#window-canvas [data-canvas="lift"]'); await page.waitForTimeout(pause * 2); mark('Lift the writing: the letter is ready'); await still('canvas-letter');
  await click('#window-canvas [data-canvas="compose"]'); await settled(page, 'postman'); await page.waitForTimeout(pause); mark('POSTMAN: a draft with the letter attached');
  await click('#window-postman [data-mail="to-mara"]'); await page.waitForTimeout(pause * 0.6);
  await click('#window-postman [data-mail="send"]'); await page.waitForTimeout(pause * 2); mark('plausible error: sent to Mara, it comes back');
  await click('#window-postman [data-mail="open-draft"]'); await page.waitForTimeout(pause * 0.6);
  await click('#window-postman [data-mail="to-guest"]'); await page.waitForTimeout(pause * 0.6);
  await click('#window-postman [data-mail="send"]'); await page.waitForTimeout(pause * 2); mark('delivered to guest@haunt, with its receipt'); await still('postman-inbox');
  await click('#window-postman [data-mail="return"]'); await settled(page, 'terminal'); await page.waitForTimeout(pause * 1.5); mark('Return to the request'); await still('terminal-receipt');
  await click('[data-finish]'); await page.waitForTimeout(500); mark('Finish session: the delivered letter, then the release');
  await glassIdle(page); await page.waitForTimeout(pause * 3); mark('You were the next person. The glass is clear.'); await still('finished');
  return Date.now() - started;
}

const errors = [];
const context = await browser.newContext({ viewport: PC_SIZES[0] });
const page = await context.newPage();
let frames = 0;
const cdp = await context.newCDPSession(page);
cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
  frames++;
  await writeFile(`${dir}/frames/frame-${String(frames).padStart(4, '0')}.jpg`, Buffer.from(data, 'base64'));
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 72, maxWidth: 1366, maxHeight: 768, everyNthFrame: 2 });
await context.addInitScript(() => localStorage.setItem('haunt.guide.v4', 'seen'));
await context.addInitScript(cursor);
page.on('pageerror', error => errors.push(error.message));
await page.goto(url);
const duration = await route(page, { pause: 600 });
await context.close();
const route1366 = [...beats];

for (const viewport of PC_SIZES) {
  beats.length = 0;
  const stillPage = await browser.newPage({ viewport });
  stillPage.on('pageerror', error => errors.push(error.message));
  await stillPage.addInitScript(() => localStorage.setItem('haunt.guide.v4', 'seen'));
  await stillPage.goto(url);
  await route(stillPage, { pause: 150, stills: `${viewport.width}x${viewport.height}` });
  await stillPage.close();
}
await browser.close();
const report = { url, recording: 'screencast-frames', output: `${dir}/frames (${frames} JPEG frames)`, automatedRouteSeconds: Math.round(duration / 100) / 10, beats: route1366,
  pageErrors: errors, note: 'Automated input with deliberate pauses and three deliberate mistakes; this is not a human play time. The pointer dot is drawn by the capture script.' };
await writeFile('output/playwright/v4-route-capture.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
