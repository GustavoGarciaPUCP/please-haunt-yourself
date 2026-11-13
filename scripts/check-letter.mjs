import assert from 'node:assert/strict';
import { PC_SIZES, caseSave, frameHand, phase, pixelDiff, reachGlass, settled, start, terminal } from './haunt-helpers.mjs';
// CANVAS and POSTMAN (.kiro/specs/os-case-v4 R5–R6; requirements §7 scenarios 3, 4, 5, 7, 13).

const { browser, outcomes, open, finish } = await start('letter');
const ready = page => page.locator('#window-canvas .canvas-ready').textContent();
const letterPixels = page => page.locator('#window-postman .reading-pane .mail-letter-canvas').evaluate(canvas => [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data]);
try {
  const p = await open({ viewport: PC_SIZES[1] });
  await reachGlass(p);
  await terminal(p).back();
  await frameHand(p);
  await p.click('#window-echo [data-echo="capture"]');

  // Scenario 3: a narrow frame that misses the presence. The words are all there; only the picture is missing.
  await p.locator('#window-echo .photo-frame').focus();
  for (const key of ['-', '-', '-', '-', '-', '-', 'Shift+ArrowLeft', 'Shift+ArrowLeft', 'Shift+ArrowLeft', 'Shift+ArrowLeft']) await p.keyboard.press(key);
  assert.match(await p.locator('#window-echo .capture-title').textContent(), /Only mist/);
  await p.click('#window-echo [data-echo="use"]');
  await settled(p, 'canvas');
  await p.keyboard.press('Enter');
  let draft = (await caseSave(p)).letter.draft;
  assert.equal(draft.writing, 'paper', 'Lift the writing works from a frame without the hand');
  assert.match(await ready(p), /The picture shows only mist/);
  await p.click('#window-canvas [data-canvas="reframe"]');
  for (const key of ['Shift+ArrowRight', 'Shift+ArrowRight', 'Shift+ArrowRight', '+', '+', '+']) await p.keyboard.press(key);
  await p.click('#window-canvas [data-canvas="reframe-done"]');
  // v5 wording (playability-v5 R5): the line names what the photograph keeps; the fact checked is the same.
  assert.match(await ready(p), /^Ready: the photograph keeps the handprint/);
  assert.equal(await phase(p), 'draft-ready');
  outcomes.push('Scenario 3: a capture framed on writing and mist alone still lifts all five lines; CANVAS names the missing picture; Reframe… on the letter’s own copy (keyboard) makes it complete and the phase becomes Letter draft ready.');

  // The plausible CANVAS error: clearing the mist while the words are still in it. Undo restores them.
  await p.keyboard.press('Control+z');
  await p.keyboard.press('Control+z');
  assert.equal((await caseSave(p)).letter.draft.writing, 'mist', 'two Undos: frame, then Lift');
  await p.locator('#window-canvas input[type="range"]').fill('0');
  await p.waitForTimeout(700);
  assert.match(await p.locator('#window-canvas .letter-ghost').textContent(), /Not the words\./);
  assert.equal((await caseSave(p)).letter.draft.writing, 'lost');
  // v5 (playability-v5 R2): the line names an action that survives a reload, not Undo.
  assert.match(await ready(p), /went with the mist\. Recover it from the capture/);
  assert.equal(await p.locator('#window-canvas [data-canvas="recover"]').isVisible(), true);
  await p.locator('#window-canvas [data-canvas="compose"]').focus();
  await p.keyboard.press('Control+z');
  assert.equal((await caseSave(p)).letter.draft.writing, 'mist');
  assert.equal(await p.locator('#window-canvas .letter-ghost').textContent(), '');
  await p.keyboard.press('Control+y');
  await p.keyboard.press('Control+z');
  await p.click('#window-canvas [data-canvas="lift"]');
  await p.click('#window-canvas [data-canvas="reframe"]');
  for (const key of ['Shift+ArrowRight', 'Shift+ArrowRight', 'Shift+ArrowRight', '+', '+', '+']) await p.keyboard.press(key);
  await p.click('#window-canvas [data-canvas="reframe-done"]');
  assert.match(await ready(p), /^Ready/);
  outcomes.push('Mist to 0 while the writing is in it loses the words in the preview and in the draft: the figure writes “Not the words.” and the readiness line says so. Ctrl+Z restores them, Ctrl+Y redoes, both local to CANVAS.');

  // Scenario 7: discarding the capture in ECHO leaves the letter whole.
  const captureId = (await caseSave(p)).letter.draft.captureId;
  await p.click('#btn-echo');
  await settled(p, 'echo');
  await p.locator(`#window-echo .capture-item[data-capture="${captureId}"]`).click();
  await p.click('#window-echo [data-echo="discard"]');
  assert.equal((await caseSave(p)).echo.captures.some(item => item.id === captureId), false);
  await p.click('#btn-canvas');
  await settled(p, 'canvas');
  assert.match(await ready(p), /^Ready/);
  outcomes.push('Scenario 7: Discard in ECHO removed the capture the letter came from; CANVAS still has its picture and words and is still Ready.');

  // Scenario 13: an incomplete send asks first, arrives marked incomplete, and never readies the job.
  await p.keyboard.press('Control+z');
  await p.keyboard.press('Control+z');
  assert.match(await ready(p), /still in the mist/);
  await p.click('#window-canvas [data-canvas="compose"]');
  await settled(p, 'postman');
  await p.click('#window-postman [data-mail="to-guest"]');
  await p.click('#window-postman [data-mail="send"]');
  // Two Undos took back the reframe and the lift, so both the picture and the words are named.
  assert.match(await p.locator('#window-postman .mail-confirm').textContent(), /This letter is incomplete: the picture shows only mist; the writing is still in the mist/);
  await p.click('#window-postman [data-mail="send-anyway"]');
  assert.match(await p.locator('#window-postman .receipt-state').textContent(), /Incomplete: .*cannot finish the job/);
  assert.notEqual(await phase(p), 'ready-to-finish');
  await p.click('#window-postman [data-mail="return"]');
  await settled(p, 'terminal');
  assert.match(await p.locator('.receipt-card .receipt-detail').textContent(), /incomplete/);
  assert.equal(await p.locator('.receipt-card [data-finish]').isHidden(), true, 'no Finish session for an incomplete letter');
  assert.equal(await p.locator('.receipt-figure[data-figure="glass"]').isHidden(), true, 'a refused receipt shows the letter only, not the glass');
  assert.equal((await caseSave(p)).terminal.retry, false, 'the call stays stopped');
  outcomes.push('Scenario 13: sending the unlifted letter to guest asks “This letter is incomplete…”; Send anyway stores it marked Incomplete; TERMINAL explains it and offers no Finish session; the call stays stopped.');

  // Scenario 4: Reply only addresses a draft; Send to Mara returns; correcting the address delivers the same content.
  await p.click('#btn-canvas');
  await settled(p, 'canvas');
  await p.click('#window-canvas [data-canvas="lift"]');
  await p.click('#window-canvas [data-canvas="reframe"]');
  for (const key of ['Shift+ArrowRight', 'Shift+ArrowRight', 'Shift+ArrowRight', '+', '+', '+']) await p.keyboard.press(key);
  await p.click('#window-canvas [data-canvas="reframe-done"]');
  await p.click('#btn-postman');
  await settled(p, 'postman');
  await p.click('#window-postman [data-box="recovered"]');
  const deliveriesBefore = (await caseSave(p)).mail.deliveries.length;
  await p.click('#window-postman [data-mail="reply"]');
  assert.equal(await p.locator('#window-postman [data-field="to"]').inputValue(), 'mara@haunt');
  assert.equal((await caseSave(p)).mail.deliveries.length, deliveriesBefore, 'Reply sends nothing');
  await p.locator('#window-postman [data-field="message"]').fill('Found this on the desk.');
  await p.click('#window-postman [data-mail="send"]');
  let save = await caseSave(p);
  const returned = save.mail.deliveries.at(-1);
  assert.equal(returned.route, 'returned');
  assert.equal(returned.receipt, null);
  assert.equal(save.terminal.retry, false, 'a returned send does not re-arm the call');
  assert.match(await p.locator('#window-postman .receipt-state').textContent(), /That went back to the sender\./);
  await p.click('#window-postman [data-mail="open-draft"]');
  assert.equal(await p.locator('#window-postman [data-field="message"]').inputValue(), 'Found this on the desk.', 'the draft kept the message');
  await p.click('#window-postman [data-mail="to-guest"]');
  await p.click('#window-postman [data-mail="send"]');
  save = await caseSave(p);
  const deliveredA = save.mail.deliveries.at(-1);
  assert.equal(deliveredA.route, 'guest-inbox');
  assert.equal(deliveredA.complete, true);
  assert.equal(deliveredA.message, 'Found this on the desk.');
  assert.equal(await phase(p), 'ready-to-finish');
  outcomes.push('Scenario 4: Reply addressed a draft to mara@haunt and sent nothing; Send to Mara came back (“That went back to the sender.”) with no receipt and the call still stopped; the draft kept its message; switching to guest delivered that same content, complete.');

  // Scenario 5: A delivered, then draft B edited. A stays A; only an explicit Replace changes what the job relies on.
  const pixelsA = await letterPixels(p);
  await p.click('#btn-canvas');
  await settled(p, 'canvas');
  await p.locator('#window-canvas .choices label:has(input[value="night"])').click();
  assert.match(await ready(p), /Guest Inbox keeps the letter you sent; these changes are a new draft\./);
  await p.click('#btn-postman');
  await settled(p, 'postman');
  await p.click('#window-postman [data-box="guest"]');
  await p.locator(`#window-postman [data-message="d-${deliveredA.id}"]`).click();
  assert.ok(pixelDiff(pixelsA, await letterPixels(p)) < 0.5, 'Guest Inbox shows A exactly as sent');
  assert.equal(JSON.stringify((await caseSave(p)).mail.deliveries.find(item => item.id === deliveredA.id)), JSON.stringify(deliveredA), 'A is unchanged in storage');
  await p.click('#btn-canvas');
  await p.click('#window-canvas [data-canvas="compose"]');
  await settled(p, 'postman');
  await p.click('#window-postman [data-mail="to-guest"]');
  await p.click('#window-postman [data-mail="send"]');
  assert.match(await p.locator('#window-postman .mail-confirm').textContent(), /already has a complete letter from this job\. Replace it\?/);
  await p.click('#window-postman [data-mail="keep-editing"]');
  assert.equal((await caseSave(p)).mail.deliveries.length, save.mail.deliveries.length, 'Cancel sends nothing');
  await p.click('#window-postman [data-mail="send"]');
  await p.click('#window-postman [data-mail="replace"]');
  save = await caseSave(p);
  const deliveredB = save.mail.deliveries.at(-1);
  assert.equal(deliveredB.letter.paper, 'night');
  await p.locator(`#window-postman [data-message="d-${deliveredA.id}"]`).click();
  assert.match(await p.locator('#window-postman .receipt-state').textContent(), /Replaced by a newer letter/);
  await p.click('#window-postman [data-mail="return"]');
  await settled(p, 'terminal');
  assert.match(await p.locator('.receipt-card .receipt-detail').textContent(), /letter you replaced/);
  await p.click('.receipt-card [data-dismiss-receipt]');
  assert.equal(await p.locator('.receipt-card [data-finish]').isVisible(), true, 'TERMINAL now offers the newer letter');
  await p.click('.receipt-card [data-finish]');
  await p.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
  assert.equal((await caseSave(p)).ack.deliveryId, deliveredB.id);
  assert.equal(JSON.stringify((await caseSave(p)).mail.deliveries.find(item => item.id === deliveredA.id)), JSON.stringify(deliveredA), 'A is still exactly A');
  outcomes.push('Scenario 5: after A was delivered, editing B (Night paper) left A identical in storage and on screen, and CANVAS said so; sending B asked to Replace (Cancel sent nothing); after Replace, A is marked Replaced and its receipt is refused by TERMINAL, while B finishes the job.');

  // After finishing, editing a copy changes nothing about the closed case.
  await p.click('#btn-canvas');
  await settled(p, 'canvas');
  await p.locator('#window-canvas input[type="range"]').fill('0');
  assert.equal(await phase(p), 'finished');
  assert.equal((await caseSave(p)).terminal.presence, 'released');
  outcomes.push('Scenario 6: after Finish session, editing the draft in CANVAS leaves the case finished and the glass released.');
  await p.close();

  // v5 regressions (playability-v5 R2, R5), at 1366×768.
  const q = await open({ viewport: PC_SIZES[0] });
  const previewPixels = () => q.locator('#window-canvas .letter-preview').evaluate(canvas => [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data]);
  await reachGlass(q);
  await terminal(q).back();
  await frameHand(q);
  await q.click('#window-echo [data-echo="capture"]');
  await q.click('#window-echo [data-echo="use"]');
  await settled(q, 'canvas');
  // Pointing at Lift shows what it moves and where it goes; the letter itself does not change.
  await q.mouse.move(2, 2);
  await q.waitForTimeout(150);
  const plain = await previewPixels(), revision = (await caseSave(q)).letter.draft.revision;
  await q.locator('#window-canvas [data-canvas="lift"]').hover();
  await q.waitForTimeout(150);
  assert.ok(pixelDiff(plain, await previewPixels()) > 0.3, 'pointing at Lift outlines the captured lines and the place for them');
  assert.equal((await caseSave(q)).letter.draft.revision, revision, 'pointing changes nothing in the letter');
  await q.mouse.move(2, 2);
  // The options are described from this capture; pointing at one previews it in the letter without choosing it.
  assert.deepEqual((await q.locator('#window-canvas .keep-label').allTextContents()), ['Handprint', 'Handprint and figure', 'Figure']);
  await q.waitForTimeout(150);
  const unpointed = await previewPixels();
  await q.locator('#window-canvas .keep-option').nth(1).hover();
  await q.waitForTimeout(150);
  assert.ok(pixelDiff(unpointed, await previewPixels()) > 0.3, 'pointing at Handprint and figure previews it');
  assert.equal((await caseSave(q)).letter.draft.mist, 1, 'pointing chooses nothing');
  await q.mouse.move(2, 2);
  await q.waitForTimeout(150);
  assert.ok(pixelDiff(unpointed, await previewPixels()) < 0.3, 'moving away shows the letter as it is');
  assert.equal(await q.locator('#window-canvas .keep-warning').isVisible(), true, 'while the words are in the mist, No mist warns that it takes them');
  // Scenario B (review 26): choosing No mist with the words still in it loses them; after a reload Undo is empty, Recover still works.
  await q.locator('#window-canvas .keep-option').nth(2).click();
  await q.waitForTimeout(700);
  assert.equal((await caseSave(q)).letter.draft.writing, 'lost');
  await q.reload();
  await q.locator('#window-terminal').waitFor();
  await settled(q, 'terminal');
  await q.click('#btn-canvas');
  await settled(q, 'canvas');
  assert.equal(await q.locator('#window-canvas [data-canvas="undo"]').isDisabled(), true, 'a reload empties Undo');
  assert.match(await ready(q), /Recover it from the capture/);
  assert.doesNotMatch(await ready(q), /Undo/);
  await q.click('#window-canvas [data-canvas="recover"]');
  let letter = (await caseSave(q)).letter.draft;
  assert.equal(letter.writing, 'paper');
  assert.equal(letter.mist, 0, 'Recover keeps the photograph as chosen');
  assert.match(await ready(q), /^Ready: the photograph keeps the figure, and Mara’s words are on the paper\./);
  // The decision reaches the delivered letter: Handprint and figure.
  await q.locator('#window-canvas .keep-option').nth(1).click();
  assert.equal((await caseSave(q)).letter.draft.mist, 0.4);
  await q.click('#window-canvas [data-canvas="compose"]');
  await settled(q, 'postman');
  await q.click('#window-postman [data-mail="to-guest"]');
  await q.click('#window-postman [data-mail="send"]');
  const sent = (await caseSave(q)).mail.deliveries.at(-1);
  assert.equal(sent.complete, true);
  assert.equal(sent.letter.mist, 0.4);
  assert.equal(sent.letter.subject, 'Handprint and figure');
  assert.deepEqual(sent.letter.lines, ['FOR THE NEXT PERSON', 'AT THIS DESK', 'This picture is yours.', 'Keep what matters.', '— Mara, 31 October 1987']);
  outcomes.push('v5 CANVAS (1366×768): pointing at Lift outlines the captured lines without editing the letter; pointing at an option previews it in the letter without choosing it; the three options are named from the capture and No mist warns while the words are in the mist. Scenario B: No mist lost the words, a reload emptied Undo, and Recover the writing put the five lines back verbatim without changing the photograph. Handprint and figure reached the delivered letter (mist 40 %, subject “Handprint and figure”).');
  await q.close();

  // v5 (R2.1): a letter from a capture of the session window names only actions it has.
  const s = await open({ viewport: PC_SIZES[0] });
  await s.click('#window-terminal [data-open="echo"]');
  await settled(s, 'echo');
  await s.click('#window-echo [data-echo="capture"]');
  await s.click('#window-echo [data-echo="use"]');
  await settled(s, 'canvas');
  assert.equal(await s.locator('#window-canvas .keep-options').isHidden(), true, 'no mist to keep in a picture of the session window');
  assert.equal(await s.locator('#window-canvas [data-canvas="reframe"]').isDisabled(), true);
  // v6 (visual-precision-v6 R4): the session window shows Mara's unfinished note, so CANVAS no longer says it has no writing.
  assert.match(await ready(s), /^This capture is TERMINAL’s session window: its note stops at “PER—”, and there is no handprint\. Use a capture of the glass from ECHO\.$/);
  assert.match(await s.locator('#window-canvas [data-layer="writing"] .layer-state').textContent(), /^Only the unfinished note, as TERMINAL shows it\./);
  assert.equal(await s.locator('#window-canvas [data-canvas="open-echo-writing"]').isVisible(), true, 'the action it names is on screen');
  outcomes.push('v5 CANVAS: a letter made from the session window hides the mist choice, and its readiness line points to ECHO’s captures (shown) rather than to a frame it cannot move. v6: it says the note stops at “PER—” (not “no writing”), and the Writing layer reads “Only the unfinished note, as TERMINAL shows it.”');
  await s.close();
} finally {
  await browser.close();
  await finish();
}
