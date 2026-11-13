// Typing profile for .kiro/specs/fluid-typing-v9: the same real route, the same keys and the same instruments on any
// build. It measures what a keystroke makes the page do; it does not measure how a person perceives it.
// Usage:
//   HAUNT_BASE_URL=http://127.0.0.1:5175 HAUNT_PROFILE_LABEL=v8-a node scripts/v9-typing-profile.mjs
// Writes output/playwright/v9-profile-<label>.json. Run it alone: no other browser check at the same time.
//
// Per condition: the keys typed one by one with Playwright's pressSequentially (real key events), the wall time of that
// typing, the synchronous work of each input event (from a capture listener on window to a bubble listener on window,
// so every app listener in between is inside it), the DOM mutation records and canvas drawing calls during the event
// and in total during the typing window (by window: terminal, echo, canvas, postman; desktop; detached; offscreen
// canvases), the case-save writes, and Chrome's Event Timing durations for keydown (to the next frame; only entries of
// 16 ms or more exist; headless Chrome; 8 ms steps). An idle window before each condition shows background work.
// Page "light" repeats two conditions with only the event timer and the save counter, to show the instruments' cost.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { PC_SIZES, caseSave, frameHand, glassIdle, reachGlass, settled, start, terminal, url } from './haunt-helpers.mjs';

const label = process.env.HAUNT_PROFILE_LABEL ?? 'run';
const SAMPLE = 'abcdefghij'.repeat(6); // 60 keys, the sample of review 30
const IDLE_MS = 800;

/** Every instrument: event timing, saves, mutations, drawing calls, Event Timing. */
const fullInstrument = () => {
  const bump = (bag, id, n = 1) => { bag[id] = (bag[id] ?? 0) + n; };
  const where = el => {
    if (!el || !el.isConnected) return 'detached';
    const win = el.closest?.('.window');
    return win ? win.id.replace('window-', '') : 'desktop';
  };
  const state = window.__profile = { mode: 'full', samples: [], active: null, saves: 0, total: { draws: {}, mutations: {} }, events: [] };
  const setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) { if (key === 'haunt.case.v4') state.saves++; return setItem.call(this, key, value); };
  for (const name of ['drawImage', 'putImageData', 'fillRect', 'clearRect', 'fillText', 'strokeText', 'fill', 'stroke']) {
    const original = CanvasRenderingContext2D.prototype[name];
    CanvasRenderingContext2D.prototype[name] = function (...args) {
      const id = this.canvas.isConnected ? where(this.canvas) : 'offscreen';
      bump(state.total.draws, id);
      if (state.active) bump(state.active.draws, id);
      return original.apply(this, args);
    };
  }
  const collect = records => {
    for (const record of records) {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      const id = where(target);
      bump(state.total.mutations, id);
      if (state.active) bump(state.active.mutations, id);
    }
  };
  const observer = new MutationObserver(collect);
  const observe = () => observer.observe(document, { childList: true, subtree: true, attributes: true, characterData: true });
  if (document.documentElement) observe(); else document.addEventListener('readystatechange', observe, { once: true });
  const watched = event => event.target?.id === 'v9-plain' || ['message', 'subject', 'to'].includes(event.target?.dataset?.field);
  window.addEventListener('input', event => {
    if (!watched(event)) return;
    collect(observer.takeRecords());
    state.active = { target: event.target, t0: performance.now(), saves: state.saves, draws: {}, mutations: {} };
  }, true);
  window.addEventListener('input', event => {
    const active = state.active;
    if (!active || active.target !== event.target) return;
    state.active = null;
    const ms = performance.now() - active.t0;
    const records = observer.takeRecords();
    for (const record of records) {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      const id = where(target);
      bump(state.total.mutations, id);
      bump(active.mutations, id);
    }
    state.samples.push({ ms, saves: state.saves - active.saves, mutations: active.mutations, draws: active.draws });
  });
  try {
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (entry.name === 'keydown') state.events.push({ start: entry.startTime, duration: entry.duration });
    }).observe({ type: 'event', durationThreshold: 16 });
  } catch { state.events = null; }
};

/** Only the event timer and the save counter. */
const lightInstrument = () => {
  const state = window.__profile = { mode: 'light', samples: [], active: null, saves: 0, total: null, events: null };
  const setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) { if (key === 'haunt.case.v4') state.saves++; return setItem.call(this, key, value); };
  const watched = event => event.target?.id === 'v9-plain' || ['message', 'subject', 'to'].includes(event.target?.dataset?.field);
  window.addEventListener('input', event => { if (watched(event)) state.active = { target: event.target, t0: performance.now(), saves: state.saves }; }, true);
  window.addEventListener('input', event => {
    const active = state.active;
    if (!active || active.target !== event.target) return;
    state.active = null;
    state.samples.push({ ms: performance.now() - active.t0, saves: state.saves - active.saves, mutations: null, draws: null });
  });
};

const { browser, open, errors } = await start(`v9-profile-${label}`);
const report = { label, url, sample: { keys: SAMPLE.length, text: 'abcdefghij × 6' }, conditions: [], notes: [] };
const median = values => { const sorted = values.slice().sort((a, b) => a - b); return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null; };
const percentile = (values, p) => { const sorted = values.slice().sort((a, b) => a - b); return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : null; };
const round = value => value === null ? null : Math.round(value * 100) / 100;
const sum = bags => bags.reduce((all, bag) => { for (const [id, n] of Object.entries(bag ?? {})) all[id] = (all[id] ?? 0) + n; return all; }, {});
const diff = (after, before) => { const out = {}; for (const [id, n] of Object.entries(after ?? {})) { const d = n - (before?.[id] ?? 0); if (d) out[id] = d; } return out; };
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
/** The taskbar says which window the model treats as active (aria-pressed); the frame's class is not relied on here. */
const forward = async (page, id) => {
  if (await page.locator(`#btn-${id}`).getAttribute('aria-pressed') !== 'true') await page.click(`#btn-${id}`);
  await settled(page, id);
};
const windows = page => page.evaluate(() => [...document.querySelectorAll('.window')].filter(win => getComputedStyle(win).display !== 'none' && !win.inert)
  .map(win => ({ id: win.id.replace('window-', ''), view: win.querySelector('.window-content')?.dataset.view ?? null, active: win.classList.contains('is-active') })));

async function measure(page, name, selector, { cpu = 1, typed = SAMPLE, delay = 0 } = {}) {
  const field = page.locator(selector);
  await field.fill('');
  await frames(page);
  await page.waitForTimeout(200);
  const idle = await page.evaluate(async ms => {
    const s = window.__profile;
    if (!s.total) { await new Promise(resolve => setTimeout(resolve, ms)); return null; }
    const draws = { ...s.total.draws }, mutations = { ...s.total.mutations };
    await new Promise(resolve => setTimeout(resolve, ms));
    return { draws, mutations, after: { draws: { ...s.total.draws }, mutations: { ...s.total.mutations } } };
  }, IDLE_MS);
  const cdp = cpu === 1 ? null : await page.context().newCDPSession(page);
  if (cdp) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const mark = await page.evaluate(() => { const s = window.__profile; s.samples = []; s.mark = { t: performance.now(), saves: s.saves, total: s.total ? { draws: { ...s.total.draws }, mutations: { ...s.total.mutations } } : null }; return s.mark.t; });
  const t0 = Date.now();
  await field.pressSequentially(typed, { timeout: 600_000, delay });
  const wall = Date.now() - t0;
  await frames(page);
  await page.waitForTimeout(300);
  if (cdp) { await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); await cdp.detach(); }
  const data = await page.evaluate(() => {
    const s = window.__profile;
    return { samples: s.samples, saves: s.saves - s.mark.saves, mark: s.mark, total: s.total ? { draws: { ...s.total.draws }, mutations: { ...s.total.mutations } } : null,
      events: s.events ? s.events.filter(entry => entry.start >= s.mark.t) : null };
  });
  assert.equal(await field.inputValue(), typed, `${name}: the field holds exactly what was typed`);
  assert.equal(data.samples.length, typed.length, `${name}: one input event per key`);
  const ms = data.samples.map(sample => sample.ms);
  const condition = {
    name, cpu, delay, keys: typed.length, windows: await windows(page),
    // With a delay between keys, Playwright waits that long after each key: the wall time includes it.
    wallMsPerKey: round(wall / typed.length),
    syncMs: { median: round(median(ms)), p95: round(percentile(ms, 0.95)), mean: round(ms.reduce((a, b) => a + b, 0) / ms.length), max: round(Math.max(...ms)) },
    saveWrites: data.saves,
    duringEvents: data.samples[0].mutations === null ? null : { mutations: sum(data.samples.map(sample => sample.mutations)), draws: sum(data.samples.map(sample => sample.draws)) },
    wholeWindow: data.total ? { mutations: diff(data.total.mutations, data.mark.total.mutations), draws: diff(data.total.draws, data.mark.total.draws) } : null,
    idleBefore: idle ? { ms: IDLE_MS, mutations: diff(idle.after.mutations, idle.mutations), draws: diff(idle.after.draws, idle.draws) } : null,
    // Chrome reports only keydowns of 16 ms or more; in headless Chrome every key of the control already takes a frame,
    // so this is the duration to the next frame for (almost) every key, in 8 ms steps.
    keydownToNextFrame: data.events ? (() => { const d = data.events.map(entry => entry.duration); return { reported: d.length, median: median(d), p95: percentile(d, 0.95), max: d.length ? Math.max(...d) : null }; })() : null,
  };
  report.conditions.push(condition);
  console.log(`${label} · ${name}: ${condition.wallMsPerKey} ms/key wall, sync median ${condition.syncMs.median} p95 ${condition.syncMs.p95}, saves ${condition.saveWrites}, `
    + `mutations ${JSON.stringify(condition.duringEvents?.mutations ?? null)}, draws ${JSON.stringify(condition.duringEvents?.draws ?? null)}`);
  return condition;
}

/** The main route to a POSTMAN draft with the letter attached; all four programs open; ECHO on its Captures tab. */
async function toDraft(page) {
  await reachGlass(page);
  await terminal(page).back();
  await frameHand(page);
  await page.click('#window-echo [data-echo="capture"]');
  await page.click('#window-echo [data-echo="use"]');
  await settled(page, 'canvas');
  await page.click('#window-canvas [data-canvas="lift"]');
  await page.click('#window-canvas [data-canvas="compose"]');
  await settled(page, 'postman');
  await page.evaluate(() => {
    const plain = document.createElement('textarea');
    plain.id = 'v9-plain';
    plain.setAttribute('aria-label', 'Profile control field');
    plain.style.cssText = 'position:fixed;left:6px;top:6px;width:120px;height:40px;z-index:2147483647';
    document.body.append(plain);
  });
}
const echoTab = async (page, tab) => {
  await forward(page, 'echo');
  await page.click(`#window-echo [role="tab"][data-tab="${tab}"]`);
  await forward(page, 'postman');
};

try {
  // A: the draft before anything is sent, with every instrument.
  {
    const p = await open({ viewport: PC_SIZES[0], init: [fullInstrument] });
    await toDraft(p);
    report.assets = await p.locator('script[src]').evaluateAll(nodes => nodes.map(node => node.getAttribute('src')));
    report.build = await p.locator('meta[name="haunt-build"]').getAttribute('content');
    await measure(p, 'control: plain textarea, four programs open', '#v9-plain');
    await measure(p, 'Message, four programs open, ECHO on Captures', '#window-postman [data-field="message"]');
    // Paced like fast typing (about 8 keys a second) rather than as fast as the page accepts keys: a key's own time to
    // the next frame, without the backlog that machine-speed typing builds up.
    await measure(p, 'control: plain textarea, four programs open, paced (a key every 120 ms)', '#v9-plain', { delay: 120 });
    await measure(p, 'Message, four programs open, ECHO on Captures, paced (a key every 120 ms)', '#window-postman [data-field="message"]', { delay: 120 });
    await measure(p, 'Subject, four programs open, ECHO on Captures', '#window-postman [data-field="subject"]');
    await echoTab(p, 'live');
    await measure(p, 'Message, four programs open, ECHO on Live · Desktop glass', '#window-postman [data-field="message"]');
    await echoTab(p, 'captures');
    for (const id of ['terminal', 'echo', 'canvas']) {
      await forward(p, id);
      await p.click(`#window-${id} [data-window="close"]`);
      await p.locator(`#window-${id}`).waitFor({ state: 'detached' });
    }
    await forward(p, 'postman');
    await measure(p, 'Message, only POSTMAN open', '#window-postman [data-field="message"]');
    for (const id of ['terminal', 'echo', 'canvas']) { await p.click(`#btn-${id}`); await settled(p, id); }
    await echoTab(p, 'captures');
    await measure(p, 'control: plain textarea, four programs open (reopened), 4× CPU simulation', '#v9-plain', { cpu: 4 });
    await measure(p, 'Message, four programs open (reopened), ECHO on Captures, 4× CPU simulation', '#window-postman [data-field="message"]', { cpu: 4 });
    await measure(p, 'Message, four programs open (reopened), ECHO on Captures, paced (a key every 120 ms), 4× CPU simulation', '#window-postman [data-field="message"]', { cpu: 4, delay: 120 });
    const saved = await caseSave(p);
    assert.equal(saved.mail.draft.message, SAMPLE, 'the saved draft holds the last key');
    report.notes.push('A: the saved draft equals the last message typed.');
    await p.close();
  }
  // B: after Finish session, with the accepted letter and two copies; TERMINAL shows the finished receipt and its glass.
  {
    const p = await open({ viewport: PC_SIZES[0], init: [fullInstrument] });
    await toDraft(p);
    await p.click('#window-postman [data-mail="to-guest"]');
    await p.click('#window-postman [data-mail="send"]');
    await p.locator('#window-postman [data-mail="return"]').click();
    await settled(p, 'terminal');
    await p.click('#window-terminal [data-finish]');
    await p.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
    await glassIdle(p);
    for (let i = 0; i < 3; i++) {
      await forward(p, 'canvas');
      await p.click('#window-canvas [data-canvas="compose"]');
      await settled(p, 'postman');
      if (i === 2) break;
      await p.click('#window-postman [data-mail="to-guest"]');
      await p.click('#window-postman [data-mail="send"]');
      await p.locator('#window-postman .reading-pane[data-view="delivery"]').waitFor();
    }
    report.afterEnd = { deliveries: (await caseSave(p)).mail.deliveries.length, receiptShown: await p.locator('#window-terminal .receipt-card:not([hidden])').count() };
    await measure(p, 'control: plain textarea, four programs open, after the end', '#v9-plain');
    await measure(p, 'Message, four programs open, after the end (3 deliveries)', '#window-postman [data-field="message"]');
    await p.close();
  }
  // Light: the cost of the instruments themselves.
  {
    const p = await open({ viewport: PC_SIZES[0], init: [lightInstrument] });
    await toDraft(p);
    await measure(p, 'light instruments · control: plain textarea, four programs open', '#v9-plain');
    await measure(p, 'light instruments · Message, four programs open, ECHO on Captures', '#window-postman [data-field="message"]');
    await p.close();
  }
} finally {
  report.pageErrors = errors;
  report.browserVersion = browser.version();
  await browser.close();
  await writeFile(`output/playwright/v9-profile-${label}.json`, JSON.stringify(report, null, 2));
  console.log(`page errors: ${errors.length}`);
}
