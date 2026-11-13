import assert from 'node:assert/strict';
import { PC_SIZES, auditLayout, caseSave, cueDone, fakeAudio, frameHand, glassIdle, phase, reachGlass, settled, start, terminal } from './haunt-helpers.mjs';
import { auditDrawnText, installTextProbe } from './drawn-text-audit.mjs';
// Paths around the main route (.kiro/specs/visual-precision-v6 R5): the early correct action, programs opened out of
// order, Force it out with the call on and off, a paused preview while TERMINAL keeps running, a wrong source replaced
// only when confirmed, lost writing recovered after a reload with the letter's other choices kept, recipient errors,
// and a copy after the end. Real pointer and keyboard input. Every state named in an outcome is also audited: no DOM
// layout problem and no drawn-text problem (drawn-text-audit.mjs).

const { browser, outcomes, open, finish } = await start('paths');
const LINES = ['FOR THE NEXT PERSON', 'AT THIS DESK', 'This picture is yours.', 'Keep what matters.', '— Mara, 31 October 1987'];
const audited = [];
async function clean(page, label) {
  const dom = (await auditLayout(page, label)).problems, drawn = (await auditDrawnText(page, label)).problems;
  assert.deepEqual(dom, [], `${label}: layout — ${JSON.stringify(dom.slice(0, 3))}`);
  assert.deepEqual(drawn, [], `${label}: drawn text — ${JSON.stringify(drawn.slice(0, 3))}`);
  audited.push(label);
}
/** The words ECHO's monitor draws right now, read from the canvas calls themselves. */
const monitorText = async page => (await auditDrawnText(page, 'monitor')).canvases.find(entry => entry.where.startsWith('window-echo canvas.echo-screen'))?.runs.map(run => run.text) ?? [];
const voices = page => page.evaluate(() => window.__voices.length);
const returns = async page => (await page.locator('.job-bell').isHidden()) ? 0 : Number(await page.locator('.job-bell-count').textContent());
const text = (page, selector) => page.locator(selector).textContent();
const chips = page => page.locator('#window-echo .echo-readout .subject-chip').allTextContents();
const draft = async page => (await caseSave(page)).letter.draft;
const finished = async page => {
  await page.click('[data-finish]');
  await page.waitForFunction(() => document.getElementById('btn-phase')?.dataset.phase === 'finished');
  await glassIdle(page);
};

try {
  // 1. The early correct action: the call stopped before any return. The glass with no bell at all; the case finishes.
  {
    const p = await open({ viewport: PC_SIZES[0], init: [fakeAudio, installTextProbe] });
    const t = terminal(p);
    await p.click('#btn-sound');
    await t.enter();
    await t.object('bell');
    await p.click('.session-pane [data-room="call"]');
    assert.equal(await phase(p), 'call-stopped');
    assert.equal(await t.primary.textContent(), 'Let it finish this time');
    await t.primary.click();
    await t.presence('glass');
    await cueDone(p);
    await glassIdle(p);
    let save = await caseSave(p);
    assert.equal(save.terminal.attempts, 0, 'no return happened');
    assert.equal(await voices(p), 0, 'no bell was scheduled');
    assert.equal(await returns(p), 0, 'TERMINAL shows no return count');
    assert.ok(save.glass?.hand, 'the impression is on the glass');
    await clean(p, 'early action: on the glass');
    await t.back();
    await frameHand(p);
    await p.click('#window-echo [data-echo="capture"]');
    await p.click('#window-echo [data-echo="use"]');
    await settled(p, 'canvas');
    await p.click('#window-canvas [data-canvas="lift"]');
    await p.click('#window-canvas [data-canvas="compose"]');
    await settled(p, 'postman');
    await p.click('#window-postman [data-mail="to-guest"]');
    await p.click('#window-postman [data-mail="send"]');
    await p.click('#window-postman [data-mail="return"]');
    await settled(p, 'terminal');
    await finished(p);
    save = await caseSave(p);
    assert.equal(save.terminal.presence, 'released');
    assert.deepEqual(save.mail.deliveries.at(-1).letter.lines, LINES);
    assert.equal(save.terminal.attempts, 0);
    assert.equal(await voices(p), 0);
    await clean(p, 'early action: finished');
    outcomes.push('Early correct action (1366×768, sound on, recording AudioContext): Look inside → the Bell → Stop the call before any return → Let it finish this time. The impression reached the glass with 0 returns and no bell scheduled, and TERMINAL shows no return count. The rest of the route finished the case with Mara’s five lines, still with 0 returns.');
    await p.close();
  }

  // 2. Programs opened before they are needed: honest empty states, each with a way on. Nothing advances the case.
  {
    const p = await open({ viewport: PC_SIZES[1], init: [installTextProbe] });
    const t = terminal(p);
    await p.click('#btn-echo');
    await settled(p, 'echo');
    await p.click('#window-echo [role="tab"][data-tab="captures"]');
    assert.equal(await text(p, '#window-echo .capture-empty'), 'No captures yet. Capture keeps a full image of the selected source.');
    await clean(p, 'out of order: ECHO Captures, empty');
    await p.click('#btn-canvas');
    await settled(p, 'canvas');
    assert.match(await text(p, '#window-canvas .canvas-empty'), /No letter yet.*A letter starts from a capture\./s);
    await clean(p, 'out of order: CANVAS, no letter');
    await p.click('#window-canvas [data-canvas="open-echo"]');
    await settled(p, 'echo');
    assert.equal(await p.locator('#window-echo [role="tab"][data-tab="captures"]').getAttribute('aria-selected'), 'true', 'CANVAS’s way on opens ECHO’s captures');
    await p.click('#btn-postman');
    await settled(p, 'postman');
    assert.match(await text(p, '#window-postman .mail-unsent'), /never sent/);
    assert.equal(await text(p, '#window-postman [data-mail="compose-from-canvas"]'), 'Open CANVAS');
    await clean(p, 'out of order: POSTMAN, Mara’s unsent message');
    // Reply and send with nothing attached: POSTMAN asks first, the receipt names what is missing, TERMINAL refuses it.
    await p.click('#window-postman [data-mail="reply"]');
    await p.click('#window-postman [data-mail="to-guest"]');
    await p.click('#window-postman [data-mail="send"]');
    assert.match(await text(p, '#window-postman .mail-confirm p'), /^This letter is incomplete: no letter is attached\. Send it anyway\?/);
    await p.click('#window-postman [data-mail="send-anyway"]');
    assert.equal(await text(p, '#window-postman .receipt-state'), 'Incomplete: no letter is attached. This receipt cannot finish the job.');
    await clean(p, 'out of order: an empty delivery');
    await p.click('#window-postman [data-mail="return"]');
    await settled(p, 'terminal');
    assert.equal(await p.locator('.receipt-card').getAttribute('data-state'), 'refused');
    assert.equal(await text(p, '.receipt-card .receipt-detail'), 'The letter that arrived is incomplete: no letter is attached. Fix it in CANVAS and send it again.');
    assert.equal(await p.locator('.receipt-card [data-finish]').isHidden(), true, 'no Finish session');
    await clean(p, 'out of order: TERMINAL refuses the empty delivery');
    assert.equal(await phase(p), 'repeating');
    assert.equal((await caseSave(p)).terminal.attempts, 0);
    outcomes.push('Programs opened before they are needed (1440×900): ECHO’s Captures says “No captures yet…”, CANVAS “No letter yet” with Open ECHO’s captures (which opens that tab), POSTMAN shows Mara’s unsent message with Open CANVAS. Reply → guest → Send with nothing attached asks first (“no letter is attached”); Send anyway arrives marked incomplete; on Return to the request TERMINAL’s receipt says “The letter that arrived is incomplete: no letter is attached. Fix it in CANVAS and send it again.” and offers no Finish session. The case is still Repeating, with 0 returns.');
    await p.close();
  }

  // 3. Force it out with the call on (one more return), then with the call off (a shadow); Call it back; finish.
  {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    const t = terminal(p);
    await t.enter();
    await t.primary.click();
    await cueDone(p);
    assert.equal(await returns(p), 1);
    await t.object('door');
    await p.click('.session-pane [data-legacy="kill"]');
    await cueDone(p);
    assert.equal(await returns(p), 2, 'with the call on, forcing it out is one more return');
    assert.equal((await caseSave(p)).terminal.presence, 'terminal');
    assert.equal(await phase(p), 'repeating');
    assert.match(await t.lines(4), /started the same minute again · the bell rang · returns: 2/);
    await clean(p, 'force with the call on');
    await t.object('bell');
    await p.click('.session-pane [data-room="call"]');
    await t.object('door');
    await p.click('.session-pane [data-legacy="kill"]');
    await t.presence('shadow');
    assert.equal(await text(p, '.job-next'), 'A shadow is left in the session. Call it back so it can finish.');
    assert.equal(await t.primary.textContent(), 'Call it back');
    await clean(p, 'force with the call off: the shadow');
    // ECHO sees the shadow and names it; its capture says so too.
    await p.click('#btn-echo');
    await settled(p, 'echo');
    assert.deepEqual(await chips(p), ['A shadow', 'Unfinished note', 'No handprint']);
    assert.equal(await text(p, '#window-echo .echo-caption'), 'TERMINAL’s session, live: only a shadow is left in the window.');
    await p.click('#window-echo [data-echo="capture"]');
    assert.match(await text(p, '#window-echo .capture-title'), /^Capture 1 · A shadow in the window$/);
    await clean(p, 'the shadow in ECHO’s captures');
    await p.click('#btn-terminal');
    await settled(p, 'terminal');
    await t.primary.click();
    await t.presence('terminal');
    assert.equal(await t.primary.textContent(), 'Let it finish this time');
    await t.primary.click();
    await t.presence('glass');
    await cueDone(p);
    await glassIdle(p);
    assert.equal(await returns(p), 2, 'calling the shadow back and letting it finish add no return');
    await clean(p, 'after the shadow: on the glass');
    outcomes.push('Force it out (1366×768): with the call on it is one more return (2) and the case stays Repeating; with the call off it leaves a shadow, the job strip says “A shadow is left in the session. Call it back so it can finish.”, ECHO shows A shadow / Unfinished note / No handprint and its capture is “A shadow in the window”; Call it back → Let it finish this time reaches the glass with no further return.');
    await p.close();
  }

  // 4. Pausing ECHO is not stopping TERMINAL. Seen, kept and shown agree. Then a wrong source, replaced only when confirmed.
  {
    const p = await open({ viewport: PC_SIZES[1], init: [installTextProbe] });
    const t = terminal(p);
    await t.enter();
    await p.click('#btn-echo');
    await settled(p, 'echo');
    await p.click('#window-echo [data-echo="pause"]');
    await p.waitForTimeout(300);
    assert.ok((await monitorText(p)).some(line => /recorded 23:59\s+\[3087\]/.test(line)), 'the paused picture is of PID 3087');
    await p.click('#btn-terminal');
    await settled(p, 'terminal');
    await t.primary.click();
    await cueDone(p);
    assert.equal(await returns(p), 1, 'TERMINAL came back while ECHO was paused');
    await p.click('#btn-echo');
    await settled(p, 'echo');
    assert.equal(await text(p, '#window-echo .echo-caption'), 'A paused frame of TERMINAL’s session. TERMINAL keeps running: it has come back once since you paused.');
    assert.ok((await monitorText(p)).some(line => /\[3087\]/.test(line)), 'the paused picture still shows the minute it froze');
    await clean(p, 'paused while TERMINAL came back');
    await p.click('#window-echo [data-echo="capture"]');
    const sessionCapture = (await caseSave(p)).echo.captures.at(-1);
    assert.equal(sessionCapture.negative.session.pid, 3087, 'the capture keeps the paused frame, as it was shown');
    await p.click('#window-echo [role="tab"][data-tab="live"]');
    await p.click('#window-echo [data-echo="pause"]');
    await p.waitForTimeout(300);
    assert.ok((await monitorText(p)).some(line => /\[3088\]/.test(line)), 'Resume live shows the run TERMINAL is on now');
    // A letter from the session window first: CANVAS says what it is.
    await p.click('#window-echo [role="tab"][data-tab="captures"]');
    await p.locator(`#window-echo [data-capture="${sessionCapture.id}"]`).click();
    await p.click('#window-echo [data-echo="use"]');
    await settled(p, 'canvas');
    assert.match(await text(p, '#window-canvas .canvas-ready'), /^This capture is TERMINAL’s session window: its note stops at “PER—”/);
    await clean(p, 'wrong source: CANVAS');
    // The milestone, a capture of the glass, and Use: asked, kept on Keep, replaced on Replace, back with Undo.
    await p.click('#btn-terminal');
    await settled(p, 'terminal');
    await t.enter();
    await t.object('bell');
    await p.click('.session-pane [data-room="call"]');
    await t.primary.click();
    await t.presence('glass');
    await cueDone(p);
    await glassIdle(p);
    await t.back();
    await frameHand(p);
    await p.click('#window-echo [data-echo="capture"]');
    const glassId = (await caseSave(p)).echo.captures.at(-1).id;
    await p.click('#window-echo [data-echo="use"]');
    assert.equal(await p.locator('#window-echo .capture-confirm').isVisible(), true);
    assert.equal(await text(p, '#window-echo .capture-confirm p'), `CANVAS already has a letter made from capture ${sessionCapture.id}. Replace its picture and writing with capture ${glassId}? Undo in CANVAS brings the old one back.`);
    await clean(p, 'replace: asked');
    await p.click('#window-echo [data-echo="cancel-use"]');
    assert.equal((await draft(p)).captureId, sessionCapture.id, 'Keep the letter as it is keeps it');
    await p.click('#window-echo [data-echo="use"]');
    await p.click('#window-echo [data-echo="confirm-use"]');
    await settled(p, 'canvas');
    assert.equal((await draft(p)).captureId, glassId);
    assert.equal(await text(p, '#window-canvas .canvas-ready'), 'The writing is still in the mist. Lift it onto the paper.');
    await p.click('#window-canvas [data-canvas="undo"]');
    assert.equal((await draft(p)).captureId, sessionCapture.id, 'Undo in CANVAS brings the old letter back');
    await p.click('#window-canvas [data-canvas="redo"]');
    assert.equal((await draft(p)).captureId, glassId);
    await p.click('#window-canvas [data-canvas="lift"]');
    assert.match(await text(p, '#window-canvas .canvas-ready'), /^Ready: /);
    await clean(p, 'replaced: Ready');
    outcomes.push('Pause and process (1440×900): with ECHO paused, TERMINAL came back once; the caption says “TERMINAL keeps running: it has come back once since you paused.”, the paused picture still draws PID 3087, a capture made then keeps PID 3087, and Resume live draws 3088. A letter from that session capture is named in CANVAS as TERMINAL’s session window. After the milestone, Use on a glass capture asks “CANVAS already has a letter made from capture 1. Replace…”: Keep the letter as it is keeps it, Replace takes the glass, Undo in CANVAS brings the session letter back and Redo the glass; Lift makes it Ready.');
    await p.close();
  }

  // 5. Lost writing, a reload and Recover: frame, paper and layout stay. Recipient errors, the end, then a copy.
  {
    const p = await open({ viewport: PC_SIZES[0], init: [installTextProbe] });
    await reachGlass(p);
    await terminal(p).back();
    await frameHand(p);
    await p.click('#window-echo [data-echo="capture"]');
    await p.click('#window-echo [data-echo="use"]');
    await settled(p, 'canvas');
    const used = await draft(p);
    await p.click('#window-canvas [data-choice="paper"] label:has(input[value="night"])');
    await p.click('#window-canvas [data-choice="layout"] label:has(input[value="below"])');
    await p.click('#window-canvas [data-canvas="reframe"]');
    for (const key of ['ArrowUp', 'ArrowUp', 'ArrowLeft']) await p.keyboard.press(key);
    await p.click('#window-canvas [data-canvas="reframe-done"]');
    const chosen = await draft(p);
    assert.notDeepEqual(chosen.frame, used.frame, 'the frame was moved');
    assert.equal(chosen.paper, 'night');
    assert.equal(chosen.layout, 'below');
    await p.locator('#window-canvas .keep-option').nth(2).click();
    await p.waitForTimeout(700);
    assert.equal((await draft(p)).writing, 'lost', 'No mist with the words still in it takes them');
    await p.reload();
    await p.locator('#window-terminal').waitFor();
    await settled(p, 'terminal');
    await p.click('#btn-canvas');
    await settled(p, 'canvas');
    assert.equal(await p.locator('#window-canvas [data-canvas="undo"]').isDisabled(), true, 'a reload empties Undo');
    await p.click('#window-canvas [data-canvas="recover"]');
    const recovered = await draft(p);
    assert.equal(recovered.writing, 'paper');
    assert.deepEqual(recovered.frame, chosen.frame, 'Recover keeps the frame');
    assert.equal(recovered.paper, 'night', 'Recover keeps the paper');
    assert.equal(recovered.layout, 'below', 'Recover keeps the layout');
    assert.equal(recovered.mist, 0, 'Recover keeps the photograph as chosen');
    assert.match(await text(p, '#window-canvas .canvas-ready'), /^Ready: /);
    await clean(p, 'recovered: Below, Night, moved frame');
    // POSTMAN: no recipient, an unknown one, then guest.
    await p.click('#window-canvas [data-canvas="compose"]');
    await settled(p, 'postman');
    const to = p.locator('#window-postman [data-field="to"]');
    await to.fill('');
    await p.click('#window-postman [data-mail="send"]');
    assert.equal(await text(p, '#window-postman .mail-notice'), 'Add a recipient: who is this letter for?');
    await clean(p, 'recipient: none');
    await to.fill('admin');
    await p.click('#window-postman [data-mail="send"]');
    assert.equal(await text(p, '#window-postman .mail-notice'), 'There is no mailbox called “admin” at this desk. The two here are mara@haunt and guest@haunt.');
    assert.equal((await caseSave(p)).mail.deliveries.length, 0, 'nothing was sent');
    await clean(p, 'recipient: unknown');
    await p.click('#window-postman [data-mail="to-guest"]');
    await p.click('#window-postman [data-mail="send"]');
    await p.locator('#window-postman [data-mail="return"]').waitFor();
    const delivered = (await caseSave(p)).mail.deliveries.at(-1);
    assert.equal(delivered.complete, true);
    assert.deepEqual(delivered.letter.lines, LINES);
    assert.deepEqual(delivered.letter.frame, chosen.frame);
    assert.equal(delivered.letter.paper, 'night');
    assert.equal(delivered.letter.layout, 'below');
    await clean(p, 'delivered: Below, Night');
    await p.click('#window-postman [data-mail="return"]');
    await settled(p, 'terminal');
    await finished(p);
    await clean(p, 'finished: Below, Night');
    // After the end: sending to guest again is a copy, with no Replace prompt; the accepted letter stays accepted.
    await p.click('#btn-canvas');
    await settled(p, 'canvas');
    await p.click('#window-canvas [data-canvas="compose"]');
    await settled(p, 'postman');
    assert.equal(await p.locator('#window-postman .mail-after-end').isVisible(), true);
    await p.click('#window-postman [data-mail="to-guest"]');
    await p.locator('#window-postman [data-field="message"]').fill('A copy for the desk.');
    await p.click('#window-postman [data-mail="send"]');
    assert.equal(await p.locator('#window-postman .mail-confirm').isVisible(), false, 'no Replace prompt');
    assert.equal(await text(p, '#window-postman .receipt-state'), 'Another copy, sent after the session finished. The job keeps the letter it accepted.');
    await clean(p, 'a copy after the end');
    const save = await caseSave(p);
    assert.equal(save.ack.deliveryId, delivered.id);
    await p.reload();
    await p.locator('#window-terminal').waitFor();
    await settled(p, 'terminal');
    assert.equal(await phase(p), 'finished');
    assert.equal((await caseSave(p)).ack.deliveryId, delivered.id, 'a reload keeps the accepted letter');
    outcomes.push('Lost writing (1366×768): Night paper, Below, a frame moved with the keyboard, then No mist with the words still in the mist lost them; after a reload Undo is empty and Recover the writing puts the five lines on the paper with the same frame, paper, layout and mist 0. POSTMAN: an empty To says “Add a recipient: who is this letter for?”, “admin” says there is no such mailbox and names the two, nothing is sent; guest delivers it complete with that frame, Night and Below. After Finish session, sending again is “Another copy…” with no Replace prompt, and a reload keeps the accepted letter.');
    await p.close();
  }
  outcomes.push(`Audited with no layout or drawn-text problem: ${audited.length} states (${audited.join('; ')}).`);
} finally {
  await browser.close();
  await finish();
}
