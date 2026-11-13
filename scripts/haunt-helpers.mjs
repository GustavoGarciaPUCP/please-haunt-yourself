// Shared helpers for the v4 browser checks (.kiro/specs/os-case-v4). Real pointer and keyboard input only.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { auditLayout } from './layout-audit.mjs';

export { auditLayout };
export const url = new URL('/haunt.html', process.env.HAUNT_BASE_URL ?? 'http://127.0.0.1:5174').href;
export const PC_SIZES = [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }];
export const SAVE_KEY = 'haunt.case.v4';

/** A recording AudioContext: proves which voices were scheduled and stopped. Nothing audible is verified. */
export const fakeAudio = () => {
  window.__voices = [];
  class Param { setValueAtTime() {} exponentialRampToValueAtTime() {} cancelScheduledValues() {} }
  class Node { connect(next) { return next; } disconnect() {} }
  class Context {
    constructor() { this.origin = performance.now(); this.destination = new Node(); }
    get currentTime() { return (performance.now() - this.origin) / 1000; }
    resume() { return Promise.resolve(); }
    createGain() { const gain = new Node(); gain.gain = new Param(); return gain; }
    createOscillator() {
      const context = this, voice = new Node();
      Object.assign(voice, { frequency: { value: 0 }, startAt: null, stops: [], start(at) { this.startAt = at; }, stop(at) { this.stops.push({ at, calledAt: context.currentTime }); } });
      window.__voices.push(voice);
      return voice;
    }
  }
  window.AudioContext = Context;
};

export async function start(name) {
  await mkdir('output/playwright', { recursive: true });
  // HAUNT_CHANNEL=msedge runs a check in Edge (already installed; Playwright gives it a temporary profile).
  const browser = await chromium.launch({ channel: process.env.HAUNT_CHANNEL ?? 'chrome', headless: true });
  const outcomes = [], errors = [];
  /**
   * A page with the first-visit callout already seen (unless `guide`), errors recorded and optional CPU throttling.
   * The boot entry plays on a fresh desk; a key press skips it, exactly as a person can.
   */
  const open = async ({ viewport = PC_SIZES[0], reducedMotion = 'no-preference', guide = false, init = [], context = null, scale = 1 } = {}) => {
    const page = context ? await context.newPage() : await browser.newPage({ viewport, reducedMotion, deviceScaleFactor: scale });
    if (context) await page.setViewportSize(viewport);
    if (process.env.HAUNT_CPU_THROTTLE) await (await page.context().newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.HAUNT_CPU_THROTTLE) });
    if (!guide) await page.addInitScript(() => { try { if (!localStorage.getItem('haunt.guide.v4')) localStorage.setItem('haunt.guide.v4', 'seen'); } catch {} });
    for (const script of init) await page.addInitScript(script);
    page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`${name}: console ${message.text()}`); });
    await page.goto(url);
    await skipBoot(page);
    await page.locator('#window-terminal').waitFor();
    await settled(page, 'terminal');
    return page;
  };
  const finish = async (extra = {}) => {
    const report = { url, passed: outcomes.length, outcomes, pageErrors: errors, ...extra };
    await writeFile(`output/playwright/${name}-results.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (errors.length) process.exitCode = 1;
  };
  return { browser, outcomes, errors, open, finish };
}

export async function skipBoot(page) {
  if (await page.locator('#boot:not([hidden])').count()) await page.keyboard.press('Shift');
  await page.waitForFunction(() => document.getElementById('boot')?.hidden !== false);
}

export const box = async (page, selector) => page.locator(selector).first().evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
export const workspace = page => page.evaluate(() => {
  const stage = document.getElementById('desktop-stage').getBoundingClientRect(), dock = document.getElementById('taskbar').getBoundingClientRect();
  return { x: stage.x, y: stage.y, w: stage.width, h: stage.height, dock: dock.y };
});
/** A point on the empty part of a window's titlebar: right of the title text, left of the controls. */
export const titlebarPoint = page => async id => page.locator(`#window-${id}`).evaluate(win => {
  const title = win.querySelector('.window-name').getBoundingClientRect(), bar = win.querySelector('.window-titlebar').getBoundingClientRect();
  const subtitle = win.querySelector('.window-subtitle').getBoundingClientRect(), controls = win.querySelector('.window-controls').getBoundingClientRect();
  return { x: Math.min(Math.max(title.right, subtitle.right) + 40, controls.left - 30), y: bar.y + bar.height / 2 };
});
/** Waits until a window has finished opening (no running animations, fully opaque). */
export const settled = (page, id) => page.waitForFunction(id => {
  const el = document.getElementById(`window-${id}`);
  return el && !el.inert && getComputedStyle(el).display !== 'none' && Number(getComputedStyle(el).opacity) > 0.999 && el.getAnimations().length === 0;
}, id, { timeout: 10000 });

/** Drags a window by its titlebar with real pointer input. */
export async function dragWindow(page, id, dx, dy, steps = 8) {
  const point = await titlebarPoint(page)(id);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + dx, point.y + dy, { steps });
  await page.mouse.up();
  return point;
}

export const caseSave = page => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
export const phase = page => page.locator('#btn-phase').getAttribute('data-phase');
export const glassIdle = page => page.waitForFunction(() => { const g = document.getElementById('desktop-glass'); return g && !g.dataset.reveal && !g.dataset.release; }, null, { timeout: 12000 });
export const cueDone = page => page.waitForFunction(() => {
  const figure = document.querySelector('.scene-figure');
  return !figure || figure.getAnimations().every(animation => animation.playState !== 'running');
}, null, { timeout: 12000 });

export const terminal = page => ({
  pane: page.locator('.session-pane'),
  input: page.locator('#haunt-command'),
  output: page.locator('.console-output'),
  primary: page.locator('.session-pane [data-main-action]'),
  async command(value) { await this.input.fill(value); await this.input.press('Enter'); },
  async enter() { if (!await this.pane.isVisible()) await page.locator('[data-enter-session]').click(); await this.pane.waitFor({ state: 'visible' }); },
  async back() {
    if (!await this.pane.isVisible()) return;
    const header = page.locator('.session-pane .pane-detach');
    await (await header.isVisible() ? header : this.primary).click();
  },
  async object(name) {
    const pressed = await page.locator(`.session-pane [data-object="${name}"]`).getAttribute('aria-pressed');
    if (pressed !== 'true') await page.locator(`.session-pane [data-object="${name}"]`).click();
  },
  async lines(count) { return (await this.output.locator('.console-line').allTextContents()).slice(-count).join('\n'); },
  presence(value) { return page.waitForFunction(expected => document.querySelector('.terminal-app')?.dataset.presence === expected, value); },
});

/** The milestone with real clicks: one return, Stop the call, Let it finish. Waits for the glass to settle. */
export async function reachGlass(page) {
  const t = terminal(page);
  await t.enter();
  await t.primary.click();
  await cueDone(page);
  await t.object('bell');
  await page.locator('.session-pane [data-room="call"]').click();
  await t.primary.click();
  await t.presence('glass');
  await cueDone(page);
  await glassIdle(page);
}

/** Where the hand is pressed on the glass, in viewport pixels. */
export const handPoint = page => page.evaluate(() => {
  const [u, v] = document.getElementById('desktop-glass').dataset.hand.split(',').map(Number);
  const stage = document.getElementById('desktop-stage').getBoundingClientRect();
  return { x: stage.left + u * stage.width, y: stage.top + v * stage.height };
});

/** Opens ECHO on the desktop glass and drags it so its monitor is centred on the hand. */
export async function frameHand(page) {
  if (!await page.locator('#window-echo').count()) { await page.click('#btn-echo'); await settled(page, 'echo'); }
  await page.locator('#window-echo [role="tab"][data-tab="live"]').click();
  await page.locator('#window-echo .echo-sources label:has(input[value="glass"])').click();
  // The picture itself (the monitor also has a status bar above it since v6).
  const hand = await handPoint(page), monitor = await box(page, '#window-echo .echo-screen');
  await dragWindow(page, 'echo', hand.x - (monitor.x + monitor.w / 2), hand.y - (monitor.y + monitor.h / 2), 10);
}

/** The whole correct route with the pointer, up to the receipt in Guest Inbox. */
export async function deliverLetter(page) {
  await reachGlass(page);
  await terminal(page).back();
  await frameHand(page);
  await page.click('#window-echo [data-echo="capture"]');
  await page.click('#window-echo [data-echo="use"]');
  await settled(page, 'canvas');
  await page.click('#window-canvas [data-canvas="lift"]');
  await page.click('#window-canvas [data-canvas="compose"]');
  await settled(page, 'postman');
  await page.click('#window-postman [data-mail="to-guest"]');
  await page.click('#window-postman [data-mail="send"]');
  await page.locator('#window-postman [data-mail="return"]').waitFor();
}

/** Mean absolute difference (0–255) between two equally sized RGBA arrays sampled every `step` pixels. */
export const pixelDiff = (a, b, step = 4) => {
  let sum = 0, count = 0;
  for (let i = 0; i < a.length; i += 4 * step) { sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); count += 3; }
  return sum / count;
};
