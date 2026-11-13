// Visual review route for HAUNT OS 4: real pointer input through the whole case, a screenshot and a DOM layout
// audit at every major state, at each PC size. Writes output/playwright/v4/*.png and v4-review.json.
// This is an automated walkthrough for inspection, not a human playtest.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { auditLayout } from './layout-audit.mjs';

const url = new URL('/haunt.html', process.env.HAUNT_BASE_URL ?? 'http://127.0.0.1:5174').href;
const sizes = (process.env.HAUNT_SIZES ?? '1366x768,1440x900,1920x1080').split(',').map(text => { const [width, height] = text.split('x').map(Number); return { width, height }; });
await mkdir('output/playwright/v4', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { url, sizes: [] };

const settled = (page, id) => page.waitForFunction(id => {
  const el = document.getElementById(`window-${id}`);
  return el && !el.inert && getComputedStyle(el).display !== 'none' && Number(getComputedStyle(el).opacity) > 0.999 && el.getAnimations().length === 0;
}, id, { timeout: 8000 });
const cueDone = page => page.waitForFunction(() => {
  const figure = document.querySelector('.scene-figure');
  return !figure || figure.getAnimations().filter(a => a.playState === 'running').length === 0;
}, null, { timeout: 10000 });
const glassIdle = page => page.waitForFunction(() => { const g = document.getElementById('desktop-glass'); return g && !g.dataset.reveal && !g.dataset.release; }, null, { timeout: 10000 });
const center = (page, selector) => page.locator(selector).first().evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });

async function drag(page, id, dx, dy) {
  const point = await page.locator(`#window-${id} .window-titlebar`).evaluate(bar => {
    const title = bar.querySelector('.window-title').getBoundingClientRect(), controls = bar.querySelector('.window-controls').getBoundingClientRect(), r = bar.getBoundingClientRect();
    return { x: Math.min(title.left + 160, controls.left - 40), y: r.top + r.height / 2 };
  });
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + dx, point.y + dy, { steps: 10 });
  await page.mouse.up();
}

for (const viewport of sizes) {
  const tag = `${viewport.width}x${viewport.height}`;
  const page = await browser.newPage({ viewport });
  const errors = [], shots = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  const shot = async name => {
    const file = `output/playwright/v4/${tag}-${String(shots.length + 1).padStart(2, '0')}-${name}.png`;
    await page.waitForTimeout(120);
    await page.screenshot({ path: file });
    const { problems } = await auditLayout(page, name);
    shots.push({ name, file, problems });
  };
  await page.goto(url);
  await page.waitForSelector('#window-terminal');
  await page.waitForFunction(() => document.getElementById('boot')?.hidden !== false);
  await settled(page, 'terminal');
  await page.waitForTimeout(1600);
  await shot('desktop');
  await page.click('#btn-launcher');
  await shot('launcher');
  await page.keyboard.press('Escape');
  await page.click('#btn-phase');
  await page.click('[data-phase-hint]');
  await shot('phase-help');
  await page.keyboard.press('Escape');

  await page.click('[data-enter-session]');
  await page.waitForTimeout(300);
  await shot('session');
  await page.click('[data-object="bell"]');
  await shot('bell-inspector');
  await page.click('[data-main-action]');
  await cueDone(page);
  await page.waitForTimeout(300);
  await shot('after-return');
  if (await page.locator('[data-room="call"]').isHidden()) await page.click('[data-object="bell"]');
  await page.click('[data-room="call"]');
  await shot('call-stopped');
  await page.click('[data-main-action]');
  await cueDone(page);
  await glassIdle(page);
  await page.waitForTimeout(300);
  await shot('milestone');
  await page.click('[data-main-action]');
  await page.waitForTimeout(200);

  // ECHO over the hand.
  await page.click('#btn-echo');
  await settled(page, 'echo');
  await page.click('.echo-sources label:has(input[value="glass"])');
  const hand = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('haunt.case.v4'));
    const stage = document.getElementById('desktop-stage').getBoundingClientRect();
    return { x: stage.left + save.glass.hand[0] * stage.width, y: stage.top + save.glass.hand[1] * stage.height };
  });
  const monitor = await center(page, '.echo-monitor');
  await drag(page, 'echo', hand.x - monitor.x, hand.y - monitor.y);
  await page.waitForTimeout(200);
  await shot('echo-glass');
  await page.click('[data-echo="capture"]');
  await page.waitForTimeout(200);
  await shot('echo-captures');
  await page.click('#window-echo [data-window="maximize"]');
  await page.waitForTimeout(300);
  await shot('echo-maximized');
  await page.click('#window-echo [data-window="maximize"]');
  await page.waitForTimeout(300);

  await page.click('[data-echo="use"]');
  await settled(page, 'canvas');
  await shot('canvas-draft');
  await page.locator('#window-canvas input[type="range"]').fill('0');
  await page.waitForTimeout(900);
  await shot('canvas-not-the-words');
  await page.click('#window-canvas [data-canvas="undo"]');
  await page.click('#window-canvas [data-canvas="lift"]');
  await page.waitForTimeout(900);
  await shot('canvas-lifted');

  await page.click('#window-canvas [data-canvas="compose"]');
  await settled(page, 'postman');
  await shot('postman-draft');
  await page.click('[data-box="recovered"]');
  await shot('postman-recovered');
  await page.click('[data-mail="reply"]');
  await page.click('[data-mail="send"]');
  await page.waitForTimeout(200);
  await shot('postman-returned');
  await page.click('[data-box="drafts"]');
  await page.click('[data-mail="to-guest"]');
  await page.click('[data-mail="send"]');
  await page.waitForTimeout(500);
  await shot('postman-delivered');
  await page.click('[data-mail="return"]');
  await settled(page, 'terminal');
  await page.waitForTimeout(300);
  await shot('terminal-receipt');
  await page.click('[data-finish]');
  await page.waitForTimeout(400);
  await shot('finish-letter');
  await glassIdle(page);
  await page.waitForTimeout(400);
  await shot('finished');
  await page.click('#btn-launcher');
  await page.click('[data-about]');
  await shot('about');
  await page.keyboard.press('Escape');
  report.sizes.push({ viewport: tag, errors, shots });
  await page.close();
}
await browser.close();
await writeFile('output/playwright/v4-review.json', JSON.stringify(report, null, 2));
for (const size of report.sizes) {
  console.log(`${size.viewport}: ${size.errors.length} errors`);
  for (const error of size.errors) console.log(`  ERROR ${error}`);
  for (const s of size.shots) if (s.problems.length) console.log(`  ${s.name}: ${s.problems.length} problems\n    ${s.problems.slice(0, 8).map(p => `${p.kind} ${p.el}${p.by ? ` ← ${p.by}` : ''}`).join('\n    ')}`);
}
