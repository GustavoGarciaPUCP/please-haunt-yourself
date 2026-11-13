// Baseline for prompt05 (.kiro/specs/playability-v5): reproduces review 26's findings on the current build with real
// pointer and keyboard actions only. No case state is injected. Writes output/playwright/v5-baseline.json and
// before-screenshots in output/playwright/v5-baseline/. This is a probe, not a pass/fail check.
import { mkdir, writeFile } from 'node:fs/promises';
import { auditLayout, caseSave, deliverLetter, frameHand, handPoint, phase, reachGlass, settled, start, terminal } from './haunt-helpers.mjs';

const dir = process.env.HAUNT_PROBE_DIR ?? 'output/playwright/v5-baseline';
await mkdir(dir, { recursive: true });
const { browser, open, errors } = await start('v5-baseline');
const report = { probes: [] };
const shot = (page, name) => page.screenshot({ path: `${dir}/${name}.png` });

/** Drags a window's south-east corner far up and left: the window stops at its minimum size. */
async function toMinimum(page, id) {
  const win = page.locator(`#window-${id}`), r = await win.boundingBox(), handle = await win.locator('.window-resize[data-edge="se"]').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + 20, r.y + 60, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  return win.boundingBox();
}
const own = (problems, id) => problems.filter(problem => problem.el.includes(id) || true);

/** Sends `count` returned attempts to Mara from a fresh draft, changing the message each time. */
async function flood(page, count) {
  await page.click('#btn-canvas');
  await settled(page, 'canvas');
  await page.click('#window-canvas [data-canvas="compose"]');
  await settled(page, 'postman');
  await page.click('#window-postman [data-mail="to-mara"]');
  for (let i = 0; i < count; i++) {
    if (i) await page.click('#window-postman [data-box="drafts"]');
    await page.locator('#window-postman [data-field="message"]').fill(`Attempt ${i + 1}`);
    await page.click('#window-postman [data-mail="send"]');
    await page.locator('#window-postman [data-box="returned"][aria-current="true"]').waitFor();
  }
}

try {
  // A1. History eviction after Finish session.
  let p = await open({ viewport: { width: 1366, height: 768 } });
  report.bundle = await p.locator('script[type="module"][src]').getAttribute('src');
  await deliverLetter(p);
  const a = (await caseSave(p)).mail.deliveries[0];
  await p.click('#window-postman [data-mail="return"]');
  await settled(p, 'terminal');
  await p.click('[data-finish]');
  await p.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
  await flood(p, 13);
  let save = await caseSave(p);
  const finishedBefore = { deliveries: save.mail.deliveries.length, acceptedRetained: save.mail.deliveries.some(item => item.id === a.id), ackDelivery: save.ack?.deliveryId };
  await p.reload();
  await p.locator('#window-terminal').waitFor();
  await settled(p, 'terminal');
  save = await caseSave(p);
  report.probes.push({ name: 'A1 eviction after finish', acceptedId: a.id, before: finishedBefore,
    afterReload: { phase: await phase(p), sameRun: save?.run === a.run, presence: save?.terminal.presence, deliveries: save?.mail.deliveries.length, transcript: await terminal(p).lines(6) } });
  await shot(p, 'A1-after-reload');
  await p.close();

  // A2. The same flood before Finish session: the intended delivery.
  p = await open({ viewport: { width: 1366, height: 768 } });
  await deliverLetter(p);
  const intended = (await caseSave(p)).mail.intended;
  await flood(p, 13);
  save = await caseSave(p);
  const pendingBefore = { phase: await phase(p), intendedRetained: save.mail.deliveries.some(item => item.id === intended), intended: save.mail.intended };
  await p.reload();
  await p.locator('#window-terminal').waitFor();
  await settled(p, 'terminal');
  save = await caseSave(p);
  report.probes.push({ name: 'A2 eviction before finish', intendedId: intended, before: pendingBefore, afterReload: { phase: await phase(p), deliveries: save?.mail.deliveries.length } });
  await p.close();

  // B. Lost writing, reload: what CANVAS says and what it allows.
  p = await open({ viewport: { width: 1366, height: 768 } });
  await reachGlass(p);
  await terminal(p).back();
  await frameHand(p);
  await p.click('#window-echo [data-echo="capture"]');
  await p.click('#window-echo [data-echo="use"]');
  await settled(p, 'canvas');
  await p.locator('#window-canvas input[type="range"]').focus();
  await p.keyboard.press('Home');
  const readCanvas = async () => ({
    writing: (await caseSave(p)).letter.draft.writing,
    readiness: await p.locator('#window-canvas .canvas-ready').innerText(),
    writingPanel: await p.locator('#window-canvas [data-layer="writing"]').innerText(),
    undoDisabled: await p.locator('#window-canvas [data-canvas="undo"]').isDisabled(),
    liftDisabled: await p.locator('#window-canvas [data-canvas="lift"]').isDisabled(),
    // v5 only (absent in v4): the recovery action that survives a reload.
    recoverShown: await p.locator('#window-canvas [data-canvas="recover"]').count() ? await p.locator('#window-canvas [data-canvas="recover"]').isVisible() : null,
  });
  const lostBefore = await readCanvas();
  await p.reload();
  await settled(p, 'terminal');
  await p.click('#btn-canvas');
  await settled(p, 'canvas');
  report.probes.push({ name: 'B lost writing after reload', before: lostBefore, after: await readCanvas() });
  await shot(p, 'B-canvas-after-reload');
  await p.close();

  // C. Minimum window sizes, several pages.
  p = await open({ viewport: { width: 1366, height: 768 } });
  const t = terminal(p);
  await t.enter();
  await t.object('bell');
  const terminalMin = await toMinimum(p, 'terminal');
  const minimum = [];
  minimum.push({ app: 'terminal', page: 'bell', bounds: terminalMin, problems: (await auditLayout(p, 'terminal-bell')).problems });
  await shot(p, 'C-terminal-min-bell');
  // A person can only press what they can reach: a short timeout records an unreachable control as such.
  const tryClick = async (selector, label) => {
    try { await p.locator(selector).click({ timeout: 2500 }); return true; }
    catch { minimum.push({ app: 'terminal', page: label, unreachable: selector }); return false; }
  };
  if (await tryClick('.session-pane button[data-hint]', 'hint')) minimum.push({ app: 'terminal', page: 'hint', problems: (await auditLayout(p, 'terminal-hint')).problems });
  if (await tryClick('.session-pane button[data-hood]', 'hood')) minimum.push({ app: 'terminal', page: 'hood', problems: (await auditLayout(p, 'terminal-hood')).problems });
  await shot(p, 'C-terminal-min-hood');
  await p.close();
  p = await open({ viewport: { width: 1366, height: 768 } });
  await reachGlass(p);
  await terminal(p).back();
  await frameHand(p);
  await p.click('#window-echo [data-echo="capture"]');
  minimum.push({ app: 'echo', page: 'captures', bounds: await toMinimum(p, 'echo'), problems: (await auditLayout(p, 'echo-captures')).problems });
  await shot(p, 'C-echo-min-captures');
  await p.click('#window-echo [role="tab"][data-tab="live"]');
  minimum.push({ app: 'echo', page: 'live', problems: (await auditLayout(p, 'echo-live')).problems });
  await p.click('#window-echo [role="tab"][data-tab="captures"]');
  await p.click('#window-echo [data-echo="use"]');
  await settled(p, 'canvas');
  minimum.push({ app: 'echo', page: 'after handoff (behind CANVAS)', problems: (await auditLayout(p, 'echo-after-use')).problems });
  minimum.push({ app: 'canvas', page: 'draft', bounds: await toMinimum(p, 'canvas'), problems: (await auditLayout(p, 'canvas-draft')).problems });
  await shot(p, 'C-canvas-min');
  await p.click('#window-canvas [data-canvas="lift"]');
  await p.click('#window-canvas [data-canvas="compose"]');
  await settled(p, 'postman');
  minimum.push({ app: 'postman', page: 'draft', bounds: await toMinimum(p, 'postman'), problems: (await auditLayout(p, 'postman-draft')).problems });
  await shot(p, 'C-postman-min');
  report.probes.push({ name: 'C minimum sizes at 1366x768', minimum });

  // D. What the default surfaces say before any investigation or help.
  await p.close();
  p = await open({ viewport: { width: 1366, height: 768 } });
  const fresh = { jobNext: await p.locator('.job-next').innerText(), phaseButton: await p.locator('#btn-phase').innerText() };
  await p.click('[data-ask-status]');
  fresh.areYouOkay = await terminal(p).lines(2);
  await deliverLetter(p).catch(() => {});
  report.probes.push({ name: 'D default guidance', fresh });
  await p.close();
  p = await open({ viewport: { width: 1366, height: 768 } });
  await reachGlass(p);
  await terminal(p).back();
  await frameHand(p);
  await p.click('#window-echo [data-echo="capture"]');
  await p.click('#window-echo [data-echo="use"]');
  await settled(p, 'canvas');
  await p.click('#window-canvas [data-canvas="lift"]');
  await p.click('#window-canvas [data-canvas="compose"]');
  await settled(p, 'postman');
  report.probes.push({ name: 'D recipient labels before the choice', suggestions: await p.locator('#window-postman .to-suggestions').innerText() });

  // E. Where the hand is at the final action, and what covers it.
  await p.click('#window-postman [data-mail="to-guest"]');
  await p.click('#window-postman [data-mail="send"]');
  await p.click('#window-postman [data-mail="return"]');
  await settled(p, 'terminal');
  const hand = await handPoint(p);
  const topAtHand = await p.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.window')?.id ?? document.elementFromPoint(x, y)?.id ?? null, hand);
  // v5 only: whether TERMINAL shows the glass where the hand is, and in which state, during and after the release.
  const receiptGlass = () => p.evaluate(() => { const f = document.querySelector('.receipt-figure[data-figure="glass"]'); return f && !f.hidden && f.getBoundingClientRect().width > 0 ? f.dataset.glass ?? 'shown' : null; });
  const before = await receiptGlass();
  await p.click('[data-finish]');
  await p.waitForTimeout(1150);
  const midway = await receiptGlass();
  await shot(p, 'E-release-midway');
  await p.waitForTimeout(1200);
  report.probes.push({ name: 'E final release visibility', hand, topAtHand, receiptGlass: { before, midway, after: await receiptGlass() } });
  await p.close();
} finally {
  report.pageErrors = errors;
  await browser.close();
  await writeFile(`${dir}.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
