// Probe for prompt07 (.kiro/specs/confirmation-flow-v7): reproduces review 28's combined-confirmation defect and the
// combinations around it on the served build, with real pointer and keyboard input only (no case state is injected).
// It records what POSTMAN asks and what is committed; it is a probe, not a pass/fail check. It writes
// output/playwright/v7-baseline.json and screenshots in output/playwright/v7-baseline/.
// HAUNT_PROBE_DIR=output/playwright/v7-after reruns the same probe on a later build, with the same file names.
import { mkdir, writeFile } from 'node:fs/promises';
import { caseSave, deliverLetter, glassIdle, phase, settled, start } from './haunt-helpers.mjs';

const dir = process.env.HAUNT_PROBE_DIR ?? 'output/playwright/v7-baseline';
await mkdir(dir, { recursive: true });
const { browser, open, errors } = await start('v7-probe');
const report = { dir, sections: [] };
const section = async (name, run) => {
  try { report.sections.push({ name, ...await run() }); }
  catch (error) { report.sections.push({ name, failed: String(error?.stack ?? error).split('\n').slice(0, 6).join('\n') }); }
};

const MAX_STEPS = 6;
/** Any button of the confirmation that goes ahead (not Keep editing, Cancel or Open CANVAS). */
const ACCEPT = '#window-postman .mail-confirm .confirm-buttons button:not([data-mail="keep-editing"]):not([data-mail="open-canvas"])';
const bringForward = async (page, id) => { if (!await page.locator(`#window-${id}.is-active`).count()) await page.click(`#btn-${id}`); await settled(page, id); };
const dialog = page => page.evaluate(() => {
  const box = document.querySelector('#window-postman .mail-confirm');
  const visible = !!box && !box.hidden && box.getBoundingClientRect().height > 0;
  const notice = document.querySelector('#window-postman .mail-notice');
  return {
    visible, text: visible ? box.querySelector('p').textContent : null,
    buttons: visible ? [...box.querySelectorAll('.confirm-buttons button')].map(b => `${b.textContent} [${b.dataset.mail}]`) : [],
    notice: notice && !notice.hidden ? notice.textContent : null,
  };
});
/** The data that matters: how many deliveries, which one the job relies on, the phase, and whether A is byte-for-byte A. */
const facts = async (page, a) => {
  const save = await caseSave(page);
  const last = save.mail.deliveries.at(-1);
  return {
    phase: await phase(page), deliveries: save.mail.deliveries.length, intended: save.mail.intended, accepted: save.ack?.deliveryId ?? null,
    aUnchanged: a ? JSON.stringify(save.mail.deliveries.find(item => item.id === a.id)) === JSON.stringify(a) : null,
    last: last ? { id: last.id, to: last.to, complete: last.complete, missing: last.missing, kind: last.letter?.kind ?? null, lines: last.letter?.lines ?? null } : null,
    draft: save.mail.draft ? { to: save.mail.draft.to, attached: save.mail.draft.attached } : null,
  };
};
/** Accepts every question POSTMAN asks, up to MAX_STEPS, by pointer or by natural keys; records each question. */
async function acceptAll(page, a, via = 'pointer') {
  const steps = [];
  for (let i = 0; i < MAX_STEPS; i++) {
    const d = await dialog(page);
    if (!d.visible) break;
    const step = { ...d, ...await facts(page, a) };
    if (via === 'pointer') await page.click(ACCEPT);
    else {
      // Natural keys: Tab from where focus is until the button that goes ahead has focus, then Enter.
      const accept = await page.locator(ACCEPT).first().evaluate(b => b.textContent);
      let tabs = 0;
      while (tabs < 8 && await page.evaluate(label => document.activeElement?.textContent !== label || !document.activeElement.closest('.mail-confirm'), accept)) { await page.keyboard.press('Tab'); tabs++; }
      step.keys = `${'Tab '.repeat(tabs)}Enter`.trim();
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(250);
    steps.push(step);
  }
  const end = await dialog(page);
  return { steps, loops: steps.length === MAX_STEPS && end.visible, end: { ...end, ...await facts(page, a) } };
}
/** A complete letter A to guest (not finished), then CANVAS → Letter → Reset to the capture… → Reset: an incomplete B. */
async function aThenResetB(page) {
  await deliverLetter(page);
  const a = (await caseSave(page)).mail.deliveries.at(-1);
  await bringForward(page, 'canvas');
  await page.click('#window-canvas [data-menu="letter"]');
  await page.click('#window-canvas .app-menu [data-item="reset"]');
  await page.click('#window-canvas [data-canvas="reset-confirm"]');
  return a;
}
const composeToGuest = async page => {
  await bringForward(page, 'canvas');
  await page.click('#window-canvas [data-canvas="compose"]');
  await settled(page, 'postman');
  await page.click('#window-postman [data-mail="to-guest"]');
};
async function toMinimum(page, id) {
  const win = page.locator(`#window-${id}`), r = await win.boundingBox(), handle = await win.locator('.window-resize[data-edge="se"]').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + 20, r.y + 60, { steps: 10 });
  await page.mouse.up();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(200);
}

try {
  report.bundle = null;
  // 1. Review 28's route, by pointer, at three PC sizes (screenshots of the first question and after one acceptance).
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await section(`A complete, then incomplete B to guest: accept every question by pointer (${viewport.width}×${viewport.height})`, async () => {
      const p = await open({ viewport });
      report.bundle ??= await p.locator('script[src*="haunt-"]').getAttribute('src');
      const a = await aThenResetB(p);
      await composeToGuest(p);
      await p.click('#window-postman [data-mail="send"]');
      await p.waitForTimeout(200);
      await p.screenshot({ path: `${dir}/${viewport.width}-01-after-send.png` });
      await p.locator('#window-postman .reading-pane').screenshot({ path: `${dir}/${viewport.width}-01-after-send-pane.png` });
      const first = await dialog(p);
      if (first.visible) await p.click(ACCEPT);
      await p.waitForTimeout(250);
      await p.screenshot({ path: `${dir}/${viewport.width}-02-after-one-acceptance.png` });
      const second = await dialog(p);
      const rest = await acceptAll(p, a);
      await p.close();
      return { a: { id: a.id, complete: a.complete }, first, second, rest };
    });
  }

  // 2. The same by natural keys: Ctrl+Enter sends, Tab reaches the button that goes ahead, Enter presses it.
  await section('A complete, then incomplete B: accept every question by keyboard (1366×768)', async () => {
    const p = await open({ viewport: { width: 1366, height: 768 } });
    const a = await aThenResetB(p);
    await bringForward(p, 'canvas');
    await p.click('#window-canvas [data-canvas="compose"]');
    await settled(p, 'postman');
    // Compose leaves focus in To.
    await p.keyboard.type('guest@haunt');
    await p.keyboard.press('Control+Enter');
    await p.waitForTimeout(200);
    const run = await acceptAll(p, a, 'keys');
    await p.close();
    return run;
  });

  // 3. Cancel at the first question: A is intact, a reload keeps a valid case, and A still finishes it.
  await section('Cancel, reload, then finish with A (1366×768)', async () => {
    const p = await open({ viewport: { width: 1366, height: 768 } });
    const a = await aThenResetB(p);
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    const asked = await dialog(p);
    await p.click('#window-postman [data-mail="keep-editing"]');
    const cancelled = await facts(p, a);
    await p.reload();
    await p.locator('#window-terminal').waitFor();
    await settled(p, 'terminal');
    const reloaded = { ...await facts(p, a), saveReadable: (await caseSave(p)) !== null };
    await bringForward(p, 'postman');
    await p.click('#window-postman [data-box="guest"]');
    await p.click(`#window-postman [data-message="d-${a.id}"]`);
    await p.click('#window-postman [data-mail="return"]');
    await settled(p, 'terminal');
    await p.click('#window-terminal [data-finish]');
    await p.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
    await glassIdle(p);
    const finished = await facts(p, a);
    await p.close();
    return { asked, cancelled, reloaded, finished };
  });

  // 4. B without its attachment.
  await section('A complete, then B with the letter unattached: accept every question (1366×768)', async () => {
    const p = await open({ viewport: { width: 1366, height: 768 } });
    await deliverLetter(p);
    const a = (await caseSave(p)).mail.deliveries.at(-1);
    await composeToGuest(p);
    await p.click('#window-postman [data-field="attached"]');
    await p.click('#window-postman [data-mail="send"]');
    const run = await acceptAll(p, a);
    await p.close();
    return run;
  });

  // 5. B made from a capture of TERMINAL's session window.
  await section('A complete, then B from a session-window capture: accept every question (1366×768)', async () => {
    const p = await open({ viewport: { width: 1366, height: 768 } });
    await deliverLetter(p);
    const a = (await caseSave(p)).mail.deliveries.at(-1);
    await bringForward(p, 'echo');
    await p.click('#window-echo [role="tab"][data-tab="live"]');
    await p.locator('#window-echo .echo-sources label:has(input[value="session"])').click();
    await p.click('#window-echo [data-echo="capture"]');
    await p.click('#window-echo [data-echo="use"]');
    await p.click('#window-echo [data-echo="confirm-use"]');
    await settled(p, 'canvas');
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    const run = await acceptAll(p, a);
    await p.close();
    return run;
  });

  // 6. The question outlives the content: an incomplete B is asked about, then completed in CANVAS before answering.
  await section('Incomplete B asked about, then completed in CANVAS before the answer (1366×768)', async () => {
    const p = await open({ viewport: { width: 1366, height: 768 } });
    const a = await aThenResetB(p);
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    const asked = await dialog(p);
    await bringForward(p, 'canvas');
    await p.click('#window-canvas [data-canvas="lift"]');
    const canvasNow = await p.locator('#window-canvas .canvas-ready').textContent();
    await bringForward(p, 'postman');
    const back = await dialog(p);
    await p.screenshot({ path: `${dir}/1366-03-after-canvas-change.png` });
    const run = await acceptAll(p, a);
    await p.close();
    return { asked, canvasNow, back, run };
  });

  // 7. The other order: a complete B asked to Replace, then made incomplete in CANVAS before the answer.
  await section('Complete B asked to Replace, then made incomplete in CANVAS before the answer (1366×768)', async () => {
    const p = await open({ viewport: { width: 1366, height: 768 } });
    await deliverLetter(p);
    const a = (await caseSave(p)).mail.deliveries.at(-1);
    await bringForward(p, 'canvas');
    await p.click('#window-canvas [data-choice="paper"] label:has(input[value="night"])');
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    const asked = await dialog(p);
    await bringForward(p, 'canvas');
    await p.click('#window-canvas [data-menu="letter"]');
    await p.click('#window-canvas .app-menu [data-item="reset"]');
    await p.click('#window-canvas [data-canvas="reset-confirm"]');
    await bringForward(p, 'postman');
    const back = await dialog(p);
    const run = await acceptAll(p, a);
    await p.close();
    return { asked, back, run };
  });

  // 8. Changing the attachment while a question is open.
  await section('Incomplete B asked about, then the attachment toggled off and on (1366×768)', async () => {
    const p = await open({ viewport: { width: 1366, height: 768 } });
    const a = await aThenResetB(p);
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    const asked = await dialog(p);
    await p.click('#window-postman [data-field="attached"]');
    const off = await dialog(p);
    await p.click('#window-postman [data-field="attached"]');
    const on = await dialog(p);
    const run = await acceptAll(p, a);
    await p.close();
    return { asked, off, on, run };
  });

  // 9. After Finish session: an incomplete copy and a complete copy; the accepted letter stays.
  await section('After Finish session: an incomplete copy, then a complete copy (1366×768)', async () => {
    const p = await open({ viewport: { width: 1366, height: 768 } });
    await deliverLetter(p);
    const a = (await caseSave(p)).mail.deliveries.at(-1);
    await p.click('#window-postman [data-mail="return"]');
    await settled(p, 'terminal');
    await p.click('#window-terminal [data-finish]');
    await p.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
    await glassIdle(p);
    await bringForward(p, 'canvas');
    await p.click('#window-canvas [data-menu="letter"]');
    await p.click('#window-canvas .app-menu [data-item="reset"]');
    await p.click('#window-canvas [data-canvas="reset-confirm"]');
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    const incomplete = await acceptAll(p, a);
    const incompleteState = await p.locator('#window-postman .receipt-state').textContent().catch(() => null);
    await bringForward(p, 'canvas');
    await p.click('#window-canvas [data-canvas="lift"]');
    await composeToGuest(p);
    await p.click('#window-postman [data-mail="send"]');
    const complete = await acceptAll(p, a);
    const completeState = await p.locator('#window-postman .receipt-state').textContent().catch(() => null);
    await p.close();
    return { incomplete, incompleteState, complete, completeState };
  });

  // 10. POSTMAN at its minimum size: the first question.
  await section('The first question with POSTMAN at its minimum (1366×768)', async () => {
    const p = await open({ viewport: { width: 1366, height: 768 } });
    await aThenResetB(p);
    await composeToGuest(p);
    await toMinimum(p, 'postman');
    await p.click('#window-postman [data-mail="send"]');
    await p.waitForTimeout(200);
    const asked = await dialog(p);
    await p.screenshot({ path: `${dir}/1366-04-postman-minimum-after-send.png` });
    await p.close();
    return { asked };
  });
} finally {
  report.pageErrors = errors;
  await browser.close();
  await writeFile(`${dir}.json`, JSON.stringify(report, null, 2));
  for (const s of report.sections) console.log(`${s.name}: ${s.failed ? `FAILED ${s.failed.split('\n')[0]}` : 'ok'}`);
  console.log(`page errors: ${errors.length}`);
}
