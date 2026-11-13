import assert from 'node:assert/strict';
import { PC_SIZES, box, caseSave, frameHand, glassIdle, pixelDiff, reachGlass, settled, start, terminal } from './haunt-helpers.mjs';
// ECHO v4 (.kiro/specs/os-case-v4 R4): native source radios, the full negative plus a separate photo frame, the
// subjects in words, captures that never change, the wipe cursor, Discard with Undo and the eight-capture limit.

const { browser, outcomes, open, finish } = await start('echo-scene');
const pixels = page => page.locator('#window-echo .capture-picture').evaluate(canvas => [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data]);
try {
  const p = await open({ viewport: PC_SIZES[1] });
  await p.click('#btn-echo');
  await settled(p, 'echo');

  // 1. The review-24 defect: arrow keys did not move between the two sources. Native radios now do.
  const checked = () => p.locator('#window-echo .echo-sources input:checked').getAttribute('value');
  await p.locator('#window-echo .echo-sources input:checked').focus();
  await p.keyboard.press('ArrowRight');
  assert.equal(await checked(), 'glass');
  assert.equal(await p.evaluate(() => document.activeElement?.value), 'glass', 'focus moves with the selection');
  await p.keyboard.press('ArrowLeft');
  assert.equal(await checked(), 'session');
  assert.equal(await p.locator('#window-echo .echo-sources input').evaluateAll(inputs => inputs.filter(input => input.tabIndex >= 0 && !input.checked).length === 1 && inputs.every(input => input.type === 'radio')), true);
  outcomes.push('Source selection uses native radios: ArrowRight/ArrowLeft move focus and selection between Session window and Desktop glass (the v3 buttons left both at tabIndex 0 and ignored arrows).');

  // 2. Before the milestone: the session window shows the figure, a glass capture is bare glass.
  await p.click('#window-echo [data-echo="capture"]');
  assert.match(await p.locator('#window-echo .capture-title').textContent(), /The same minute/);
  // visual-precision-v6 R4: the window shows Mara's unfinished note, so the words say so (v4/v5 said "no writing").
  assert.match(await p.locator('#window-echo .capture-verdict').textContent(), /its note stops at “PER—”\. No handprint\./);
  assert.deepEqual(await p.locator('#window-echo .capture-head .subject-chip').allTextContents(), ['The figure, repeating', 'Unfinished note', 'No handprint']);
  const sessionNegative = (await caseSave(p)).echo.captures.at(-1).negative;
  assert.equal(sessionNegative.kind, 'session');
  assert.equal('writing' in sessionNegative, false, 'a session capture still keeps no writing layer');
  await p.click('#window-echo [role="tab"][data-tab="live"]');
  await p.locator('#window-echo .echo-sources label:has(input[value="glass"])').click();
  await p.click('#window-echo [data-echo="capture"]');
  assert.match(await p.locator('#window-echo .capture-title').textContent(), /Bare glass/);
  outcomes.push('Before the milestone: a session-window capture is “The same minute”, says where its note stops (“PER—”) and that it has no handprint, and keeps no writing layer; a glass capture is Bare glass.');

  // 3. After the milestone: a wrong source holds no writing; the glass holds the full note wherever the frame is.
  await p.click('#btn-terminal');
  await settled(p, 'terminal');
  await reachGlass(p);
  await terminal(p).back();
  await p.click('#btn-echo');
  await settled(p, 'echo');
  await p.click('#window-echo [role="tab"][data-tab="live"]');
  await p.locator('#window-echo .echo-sources label:has(input[value="session"])').click();
  await p.click('#window-echo [data-echo="capture"]');
  // visual-precision-v6 R4: the window is not empty — the unfinished note is still there (v4/v5: "The window is empty").
  assert.match(await p.locator('#window-echo .capture-ghost').textContent(), /Only the note is left here\. The mark is on the glass\./);
  assert.match(await p.locator('#window-echo .capture-title').textContent(), /The note left behind/);
  await frameHand(p);
  const chips = await p.locator('#window-echo .echo-readout .subject-chip').allTextContents();
  assert.ok(chips.includes('Handprint'), `live chips name the handprint: ${chips}`);
  await p.click('#window-echo [data-echo="capture"]');
  let save = await caseSave(p);
  const glassCapture = save.echo.captures.at(-1);
  assert.equal(glassCapture.negative.kind, 'glass');
  assert.equal(glassCapture.negative.writing.length, 5, 'the negative keeps the writing layer');
  assert.equal(save.echo.captures.at(-2).negative.kind, 'session');
  assert.match(await p.locator('#window-echo .capture-caption').textContent(), /Full image kept\. This frame becomes the picture\./);
  outcomes.push('After the milestone: a session-window capture is “The note left behind” and says “Only the note is left here. The mark is on the glass.”; it keeps no writing layer. A glass capture framed on the hand keeps the full negative with all five lines, and its caption says “Full image kept. This frame becomes the picture.”');

  // 4. The capture never changes when the glass does: wipe on the monitor, breathe, then compare the stored negative and the picture.
  const before = { negative: JSON.stringify(glassCapture.negative), picture: await pixels(p) };
  await p.click('#window-echo [role="tab"][data-tab="live"]');
  const monitor = await box(p, '#window-echo .echo-screen');
  await p.mouse.move(monitor.x + monitor.w * 0.3, monitor.y + monitor.h * 0.4);
  await p.mouse.down();
  await p.mouse.move(monitor.x + monitor.w * 0.7, monitor.y + monitor.h * 0.6, { steps: 12 });
  await p.mouse.up();
  save = await caseSave(p);
  assert.notEqual(save.glass.fog, JSON.parse(before.negative).fog, 'the wipe changed the live glass (and was saved at the end of the stroke)');
  await p.click('#window-echo [data-echo="breathe"]');
  await p.click('#window-echo [role="tab"][data-tab="captures"]');
  await p.locator(`#window-echo .capture-item[data-capture="${glassCapture.id}"]`).click();
  save = await caseSave(p);
  assert.equal(JSON.stringify(save.echo.captures.find(item => item.id === glassCapture.id).negative), before.negative, 'the stored negative is unchanged');
  assert.ok(pixelDiff(before.picture, await pixels(p)) < 0.5, 'the picture renders the same pixels');
  outcomes.push('Wiping on the monitor and breathing on the glass changed the live glass (saved when the stroke ended) but left the earlier capture’s stored negative and its rendered picture unchanged.');

  // 5. The photo frame moves by keyboard without a new exposure; Discard has one Undo.
  const frameBefore = (await caseSave(p)).echo.captures.find(item => item.id === glassCapture.id).frame;
  await p.locator('#window-echo .photo-frame').focus();
  await p.keyboard.press('ArrowLeft');
  await p.keyboard.press('Shift+ArrowUp');
  await p.keyboard.press('-');
  const frameAfter = (await caseSave(p)).echo.captures.find(item => item.id === glassCapture.id).frame;
  // Left was clamped at the edge of the negative; Shift+Up moved it up; − shrinks it around its centre.
  assert.ok(frameAfter.y < frameBefore.y && frameAfter.w < frameBefore.w, `the frame moved and shrank: ${JSON.stringify({ frameBefore, frameAfter })}`);
  assert.equal((await caseSave(p)).echo.captures.length, 4, 'reframing makes no new capture');
  await p.click('#window-echo [data-echo="discard"]');
  assert.equal((await caseSave(p)).echo.captures.length, 3);
  await p.click('#window-echo .capture-undo');
  assert.equal((await caseSave(p)).echo.captures.length, 4, 'Undo discard brings it back');
  outcomes.push('The photo frame moves and resizes with the arrow keys and − (no new exposure, same capture count); Discard removes a capture and Undo discard restores it.');

  // 6. Eight captures at most; a ninth is explained, not silently dropped.
  await p.click('#window-echo [role="tab"][data-tab="live"]');
  for (let i = 0; i < 4; i++) { await p.click('#window-echo [data-echo="capture"]'); await p.click('#window-echo [role="tab"][data-tab="live"]'); }
  await p.click('#window-echo [data-echo="capture"]');
  assert.match(await p.locator('#window-echo .echo-status').textContent(), /up to 8 captures/);
  assert.equal((await caseSave(p)).echo.captures.length, 8);
  outcomes.push('With eight captures kept, Capture explains the limit (“ECHO keeps up to 8 captures…”) and keeps exactly eight.');

  // 7. Maximize, resize the viewport: the captured data and the picture do not change.
  await p.click('#window-echo [role="tab"][data-tab="captures"]');
  await p.locator(`#window-echo .capture-item[data-capture="${glassCapture.id}"]`).click();
  const kept = JSON.stringify((await caseSave(p)).echo.captures.find(item => item.id === glassCapture.id));
  await p.click('#window-echo [data-window="maximize"]');
  await p.setViewportSize(PC_SIZES[0]);
  await p.waitForTimeout(300);
  assert.equal(JSON.stringify((await caseSave(p)).echo.captures.find(item => item.id === glassCapture.id)), kept, 'maximize and a smaller screen keep the capture as it was');
  await glassIdle(p);
  outcomes.push('Maximizing ECHO and changing the viewport to 1366×768 left the capture’s negative and frame untouched.');
  await p.close();
} finally {
  await browser.close();
  await finish();
}
