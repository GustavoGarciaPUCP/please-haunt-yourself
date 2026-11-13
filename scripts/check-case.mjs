import assert from 'node:assert/strict';
import { PC_SIZES, auditLayout, box, caseSave, cueDone, deliverLetter, glassIdle, handPoint, phase, pixelDiff, settled, start, terminal } from './haunt-helpers.mjs';
// The whole case (.kiro/specs/os-case-v4 requirements §7: scenarios 1, 9–12): TERMINAL → ECHO → CANVAS → POSTMAN →
// TERMINAL, by pointer and by keyboard alone; reload, replay and a browser that keeps nothing.

const { browser, outcomes, open, finish } = await start('case');
const finished = async page => {
  await page.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
  await glassIdle(page);
};
try {
  // 1. Pointer route at 1440×900.
  let p = await open({ viewport: PC_SIZES[1] });
  await deliverLetter(p);
  assert.equal(await phase(p), 'ready-to-finish');
  const delivered = (await caseSave(p)).mail.deliveries;
  assert.equal(delivered.length, 1);
  assert.deepEqual(delivered[0].letter.lines, ['FOR THE NEXT PERSON', 'AT THIS DESK', 'This picture is yours.', 'Keep what matters.', '— Mara, 31 October 1987']);
  await p.click('#window-postman [data-mail="return"]');
  await settled(p, 'terminal');
  assert.equal(await p.evaluate(() => document.activeElement?.hasAttribute('data-finish')), true, 'Return to the request brings TERMINAL forward with Finish session focused');
  await p.click('[data-finish]');
  await finished(p);
  const lines = await terminal(p).lines(4);
  assert.match(lines, /You were the next person\. You can close the window now\./);
  const save = await caseSave(p);
  assert.equal(save.terminal.presence, 'released');
  assert.equal(save.glass.released, true);
  assert.equal(save.ack.deliveryId, delivered[0].id);
  assert.equal(await p.locator('.receipt-card').getAttribute('data-state'), 'finished');
  assert.equal(await p.locator('#window-postman [data-mail="return"]').count(), 0, 'a closed job offers no Return to the request');
  assert.deepEqual((await auditLayout(p, 'finished')).problems, []);
  await p.screenshot({ path: 'output/playwright/v4-case-finished-1440x900.png' });
  outcomes.push('Pointer route (1440×900): the bell, the glass, a capture of the hand, Lift the writing, Send to guest, Return to the request, Finish session. The delivery holds Mara’s five lines verbatim; the job is released once; the layout audit is clean.');

  // 2. Reload after finishing: still finished, nothing replays, normal commands work.
  await p.reload();
  await p.locator('#window-terminal').waitFor();
  await settled(p, 'terminal');
  assert.equal(await phase(p), 'finished');
  assert.equal(await p.locator('#desktop-glass').getAttribute('data-glass'), 'released');
  assert.equal(await p.locator('#boot:not([hidden])').count(), 0, 'no boot entry on a reload');
  assert.equal((await caseSave(p)).mail.deliveries.length, 1, 'no duplicate delivery after a reload');
  await terminal(p).command('help');
  assert.match(await terminal(p).lines(3), /ArrowUp \/ ArrowDown/);
  await terminal(p).command('finish');
  assert.match(await terminal(p).lines(1), /already finished/);
  outcomes.push('Reload after Finish session: the case stays finished, the glass stays released, no boot, no second delivery; help and finish answer normally.');

  // 3. Start the case over: a new run; the earlier delivery is archived and its receipt cannot finish the new one.
  const oldRun = (await caseSave(p)).run;
  await p.click('#btn-launcher');
  await p.click('[data-start-over]');
  await p.click('#start-over-dialog [data-confirm]');
  await p.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'repeating');
  const replay = await caseSave(p);
  assert.notEqual(replay.run, oldRun);
  assert.equal(replay.mail.archive.length, 1);
  assert.equal(replay.mail.deliveries.length, 0);
  await terminal(p).command('finish');
  assert.match(await terminal(p).lines(1), /No receipt has arrived for this job yet/);
  await p.click('#btn-postman');
  await settled(p, 'postman');
  await p.click('#window-postman [data-box="archive"]');
  assert.match(await p.locator('#window-postman .receipt-state').textContent(), /earlier session/);
  assert.equal(await p.locator('#window-postman [data-mail="return"]').count(), 0);
  outcomes.push('Start the case over: a new run id; the earlier letter is in Archive, labelled as an earlier session, with no Return to the request; finish refuses to close the new job.');
  await p.close();

  // 4. Keyboard alone, at 1366×768: focus moves with Tab/arrows or is placed where the previous action leaves it.
  p = await open({ viewport: PC_SIZES[0] });
  const press = async (selector, key = 'Enter') => { await p.locator(selector).first().focus(); await p.keyboard.press(key); };
  await press('[data-enter-session]');
  assert.equal(await p.evaluate(() => document.activeElement?.hasAttribute('data-main-action')), true, 'Look inside leaves focus on the pane’s main action');
  await p.keyboard.press('Enter');
  await cueDone(p);
  await press('.session-pane [data-object="bell"]');
  await press('.session-pane [data-room="call"]');
  await press('.session-pane [data-main-action]');
  await terminal(p).presence('glass');
  await cueDone(p);
  await glassIdle(p);
  await press('.session-pane [data-main-action]');
  assert.equal(await p.evaluate(() => document.activeElement?.id), 'haunt-command', 'Back to the prompt returns focus to the command line');
  await p.keyboard.type('open echo');
  await p.keyboard.press('Enter');
  await settled(p, 'echo');
  await p.locator('#window-echo .echo-sources input:checked').focus();
  await p.keyboard.press('ArrowRight');
  assert.equal(await p.locator('#window-echo .echo-sources input:checked').getAttribute('value'), 'glass', 'arrow keys move the source radio');
  // Move ECHO with its window menu until the monitor covers the hand.
  const hand = await handPoint(p), monitor = await box(p, '#window-echo .echo-screen');
  const dx = Math.round((hand.x - monitor.x - monitor.w / 2) / 20), dy = Math.round((hand.y - monitor.y - monitor.h / 2) / 20);
  await press('#window-echo .window-icon');
  assert.equal(await p.evaluate(() => document.activeElement?.dataset.menu), 'move', 'the window menu opens on Move');
  await p.keyboard.press('Enter');
  for (let i = 0; i < Math.abs(dx); i++) await p.keyboard.press(dx < 0 ? 'ArrowLeft' : 'ArrowRight');
  for (let i = 0; i < Math.abs(dy); i++) await p.keyboard.press(dy < 0 ? 'ArrowUp' : 'ArrowDown');
  await p.keyboard.press('Enter');
  // Wipe a little mist with the cursor (Space held while moving), then capture.
  await p.locator('#window-echo .wipe-cursor').focus();
  await p.keyboard.down(' ');
  for (const key of ['ArrowRight', 'ArrowRight', 'ArrowDown']) await p.keyboard.press(key);
  await p.keyboard.up(' ');
  await press('#window-echo [data-echo="capture"]');
  assert.equal(await p.evaluate(() => document.activeElement?.dataset.echo), 'use', 'after Capture, focus is on Use this capture');
  await p.locator('#window-echo .photo-frame').focus();
  await p.keyboard.press('+');
  await p.keyboard.press('ArrowLeft');
  await press('#window-echo [data-echo="use"]');
  await settled(p, 'canvas');
  assert.equal(await p.evaluate(() => document.activeElement?.dataset.canvas), 'lift', 'CANVAS opens with Lift the writing focused');
  await p.keyboard.press('Enter');
  await press('#window-canvas [data-canvas="compose"]');
  await settled(p, 'postman');
  assert.equal(await p.evaluate(() => document.activeElement?.dataset.field), 'to', 'POSTMAN opens the draft with the recipient field focused');
  await p.keyboard.type('guest');
  await p.keyboard.press('Control+Enter');
  await p.locator('#window-postman [data-mail="return"]').waitFor();
  assert.equal(await p.evaluate(() => document.activeElement?.dataset.mail), 'return', 'after Send, focus is on Return to the request');
  await p.keyboard.press('Enter');
  await settled(p, 'terminal');
  await p.keyboard.press('Enter');
  await finished(p);
  const keyboardSave = await caseSave(p);
  assert.equal(keyboardSave.terminal.presence, 'released');
  assert.equal(keyboardSave.mail.deliveries[0].complete, true);
  outcomes.push('Keyboard alone (1366×768): Enter/Space/arrows only, with the window menu’s Move to frame the hand, the wipe cursor, the photo frame keys, Ctrl+Enter to send. Each handoff leaves focus on the next action. Same outcome as the pointer route.');
  await p.close();

  // 5. A browser that keeps nothing: Session only, and the case still finishes in memory.
  p = await open({ viewport: PC_SIZES[2], init: [() => { Storage.prototype.setItem = function () { throw new Error('blocked'); }; }] });
  assert.equal(await p.locator('.tray-session-only').isVisible(), true);
  await deliverLetter(p);
  await p.click('#window-postman [data-mail="return"]');
  await settled(p, 'terminal');
  await p.click('[data-finish]');
  await finished(p);
  await p.click('#btn-launcher');
  await p.click('[data-about]');
  assert.match(await p.locator('[data-about="storage"]').textContent(), /Session only/);
  outcomes.push('Storage blocked (1920×1080): the tray shows Session only, About explains it, and the case still finishes in this tab.');
  await p.close();

  // 6. v5 (playability-v5 R1): more sends than the history keeps, before and after Finish session, then a reload.
  const flood = async (page, count) => {
    for (let i = 0; i < count; i++) {
      if (!await page.locator('#window-postman [data-field="to"]').isVisible()) {
        if (!await page.locator('#window-canvas.is-active').count()) await page.click('#btn-canvas');
        await settled(page, 'canvas');
        await page.click('#window-canvas [data-canvas="compose"]');
        await settled(page, 'postman');
      }
      await page.click('#window-postman [data-mail="to-mara"]');
      await page.locator('#window-postman [data-field="message"]').fill(`Attempt ${i + 1}`);
      await page.click('#window-postman [data-mail="send"]');
      await page.locator('#window-postman [data-box="returned"][aria-current="true"]').waitFor();
      await page.click('#window-postman [data-box="drafts"]');
    }
  };
  p = await open({ viewport: PC_SIZES[0] });
  await deliverLetter(p);
  const intended = (await caseSave(p)).mail.intended;
  await flood(p, 13);
  let saved = await caseSave(p);
  assert.equal(saved.mail.deliveries.length, 12, 'the history stays bounded');
  assert.ok(saved.mail.deliveries.some(item => item.id === intended), 'the delivery the job relies on is kept');
  await p.reload();
  await p.locator('#window-terminal').waitFor();
  await settled(p, 'terminal');
  assert.equal(await phase(p), 'ready-to-finish', 'a reload keeps the case (v4 reset it here)');
  await p.click('#btn-postman');
  await settled(p, 'postman');
  await p.click('#window-postman [data-box="guest"]');
  await p.locator(`#window-postman [data-message="d-${intended}"]`).click();
  await p.click('#window-postman [data-mail="return"]');
  await settled(p, 'terminal');
  await p.click('[data-finish]');
  await finished(p);
  const accepted = (await caseSave(p)).ack.deliveryId;
  assert.equal(accepted, intended);
  await flood(p, 13);
  saved = await caseSave(p);
  assert.equal(saved.mail.deliveries.length, 12);
  assert.ok(saved.mail.deliveries.some(item => item.id === accepted), 'the accepted delivery is kept');
  await p.reload();
  await p.locator('#window-terminal').waitFor();
  await settled(p, 'terminal');
  assert.equal(await phase(p), 'finished', 'a reload keeps the finished case (v4 reset it here)');
  assert.equal((await caseSave(p)).run, saved.run);
  assert.equal(await p.locator('.receipt-card').getAttribute('data-state'), 'finished');
  assert.match(await terminal(p).lines(6), /closed · delivered to guest/);
  await p.click('#btn-postman');
  await settled(p, 'postman');
  await p.click('#window-postman [data-box="guest"]');
  await p.locator(`#window-postman [data-message="d-${accepted}"]`).click();
  assert.match(await p.locator('#window-postman .receipt-state').textContent(), /Accepted by last\.session/);
  outcomes.push('v5 retention (1366×768): 13 returned sends before Finish session kept the intended delivery, and a reload stayed Delivered · ready to finish; 13 more after Finish kept the accepted delivery, and a reload stayed finished in the same run, with POSTMAN marking it Accepted. In v4 both reloads reset the case.');
  await p.close();

  // 7. v5 (playability-v5 R6): TERMINAL's receipt shows the same glass where the hand is, and the hand lets go there.
  const views = async page => page.evaluate(() => {
    const glass = document.getElementById('desktop-glass'), view = document.querySelector('.receipt-figure[data-figure="glass"] canvas');
    const save = JSON.parse(localStorage.getItem('haunt.case.v4'));
    const stage = { w: glass.clientWidth, h: glass.clientHeight }, ratio = glass.width / stage.w;
    // The same region the product shows (glass-model handRegion: 0.5 h wide, 16:10, 0.12 h outward, 0.03 h up).
    const w = 0.5 * stage.h, h = w / 1.6, out = save.glass.side === 'right' ? 1 : -1;
    const x = Math.max(0, Math.min(stage.w - w, save.glass.hand[0] * stage.w + out * 0.12 * stage.h - w / 2));
    const y = Math.max(0, Math.min(stage.h - h, save.glass.hand[1] * stage.h - 0.03 * stage.h - h / 2));
    const probe = document.createElement('canvas');
    probe.width = view.width; probe.height = view.height;
    const ctx = probe.getContext('2d');
    ctx.drawImage(glass, x * ratio, y * ratio, w * ratio, h * ratio, 0, 0, view.width, view.height);
    const a = ctx.getImageData(0, 0, view.width, view.height).data, b = view.getContext('2d').getImageData(0, 0, view.width, view.height).data;
    let diff = 0, light = 0;
    for (let i = 0; i < a.length; i += 16) { diff += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); light += b[i] + b[i + 1] + b[i + 2]; }
    const samples = a.length / 16;
    return { state: view.closest('figure').dataset.glass, diff: diff / samples / 3, light: light / samples / 3, pixels: [...b.filter((_, i) => i % 64 === 0)] };
  });
  p = await open({ viewport: PC_SIZES[0] });
  await deliverLetter(p);
  await p.click('#window-postman [data-mail="return"]');
  await settled(p, 'terminal');
  const pressed = await handPoint(p);
  assert.equal(await p.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.window')?.id, pressed), 'window-terminal', 'TERMINAL covers the hand, as in review 26');
  const before = await views(p);
  assert.equal(before.state, 'impressed');
  assert.ok(before.diff < 10, `the receipt's view matches the desktop glass at the hand (difference ${before.diff.toFixed(2)})`);
  await p.click('[data-finish]');
  await p.waitForFunction(() => document.querySelector('.receipt-figure[data-figure="glass"]')?.dataset.glass === 'releasing');
  // Sample the view while it releases (however fast this machine draws), until it reports the clear glass.
  const during = [];
  for (let i = 0; i < 60; i++) {
    const sample = await views(p);
    if (sample.state !== 'releasing') break;
    during.push(sample);
    await p.waitForTimeout(80);
  }
  await glassIdle(p);
  await p.waitForTimeout(100);
  const after = await views(p);
  assert.equal(after.state, 'clear');
  assert.match(await p.locator('.receipt-figure[data-figure="glass"] figcaption').textContent(), /The glass is clear\./);
  assert.match(await p.locator('.receipt-card .receipt-detail').textContent(), /Its photograph keeps the handprint\./);
  assert.ok(during.length > 0 && during.every(sample => sample.diff < 10) && after.diff < 10, 'during and after the release the view matches the desktop glass');
  assert.ok(during.some(sample => pixelDiff(before.pixels, sample.pixels, 1) > 1 && pixelDiff(sample.pixels, after.pixels, 1) > 0.5), 'an intermediate frame of the release is shown');
  assert.ok(after.light < before.light, 'the mist is gone from the view');
  outcomes.push(`v5 ending (1366×768): with TERMINAL covering the hand, the receipt shows the desktop glass at the hand (mean difference ${before.diff.toFixed(1)}/255 against the desktop canvas), changes through the release and ends on “The glass is clear.” (difference ${after.diff.toFixed(1)}).`);
  // Reload in the middle of the release: finished at once, the final state, nothing plays again.
  await p.close();
  p = await open({ viewport: PC_SIZES[0] });
  await deliverLetter(p);
  await p.click('#window-postman [data-mail="return"]');
  await settled(p, 'terminal');
  await p.click('[data-finish]');
  await p.waitForTimeout(700);
  await p.reload();
  await p.locator('#window-terminal').waitFor();
  await settled(p, 'terminal');
  assert.equal(await phase(p), 'finished');
  assert.equal(await p.locator('#desktop-glass').getAttribute('data-release'), null, 'no release replays after a reload');
  assert.equal(await p.locator('.receipt-figure[data-figure="glass"]').getAttribute('data-glass'), 'clear');
  assert.equal((await caseSave(p)).mail.deliveries.length, 1);
  outcomes.push('v5 ending: a reload in the middle of the release lands finished, with the receipt showing the clear glass and no second release or delivery.');
  await p.close();
  // Reduced motion: the same final state, without the animation.
  p = await open({ viewport: PC_SIZES[0], reducedMotion: 'reduce' });
  await deliverLetter(p);
  await p.click('#window-postman [data-mail="return"]');
  await settled(p, 'terminal');
  await p.click('[data-finish]');
  await finished(p);
  assert.equal(await p.locator('.receipt-figure[data-figure="glass"]').getAttribute('data-glass'), 'clear');
  assert.equal(await p.locator('#desktop-glass').getAttribute('data-release'), null);
  outcomes.push('v5 ending with reduced motion: Finish session shows the clear glass and the letter at once; nothing animates.');
  await p.close();
} finally {
  await browser.close();
  await finish();
}
