import assert from 'node:assert/strict';
import { PC_SIZES, box, caseSave, dragWindow, settled, start, titlebarPoint, workspace } from './haunt-helpers.mjs';
// HAUNT OS windows (.kiro/specs/os-case-v4 R2): lifecycle and taskbar, focus, maximize/restore, bounded resize,
// the keyboard window menu, Escape, remembered bounds, Arrange windows and viewport changes.

const { browser, outcomes, open, finish } = await start('haunt-windows');
const state = (page, id) => page.locator(`#btn-${id}`).evaluate(button => ({ running: button.dataset.running, minimized: button.dataset.minimized, pressed: button.getAttribute('aria-pressed') }));
const near = (a, b, message) => assert.ok(Math.abs(a - b) <= 1, `${message}: ${a} vs ${b}`);
try {
  const p = await open({ viewport: PC_SIZES[1] });

  // 1. Lifecycle through the taskbar and the titlebar.
  assert.deepEqual(await state(p, 'terminal'), { running: 'true', minimized: 'false', pressed: 'true' });
  await p.click('#btn-terminal');
  await p.waitForFunction(() => document.getElementById('window-terminal').style.display === 'none');
  assert.deepEqual(await state(p, 'terminal'), { running: 'true', minimized: 'true', pressed: 'false' });
  await p.click('#btn-terminal');
  await settled(p, 'terminal');
  await p.click('#btn-echo');
  await settled(p, 'echo');
  assert.equal(await p.locator('#window-echo').evaluate(el => el.classList.contains('is-active')), true);
  await p.locator('#window-terminal .window-titlebar').click({ position: { x: 300, y: 20 } });
  assert.equal(await p.locator('#window-terminal').evaluate(el => el.classList.contains('is-active')), true, 'a click raises and activates');
  await p.click('#window-echo [data-window="close"]');
  await p.waitForFunction(() => !document.getElementById('window-echo'));
  assert.deepEqual(await state(p, 'echo'), { running: 'false', minimized: 'false', pressed: 'false' });
  outcomes.push('Taskbar: an active app’s button minimizes it and restores it; running and active states show on the buttons; a titlebar click raises a window; Close removes ECHO and clears its running state.');

  // 2. Maximize and restore (button and double-click); normal bounds survive.
  const normal = await box(p, '#window-terminal');
  await p.click('#window-terminal [data-window="maximize"]');
  const area = await workspace(p), maxed = await box(p, '#window-terminal');
  assert.deepEqual([maxed.x, maxed.y, maxed.w, maxed.h], [area.x, area.y, area.w, area.h], 'maximized fills the workspace above the taskbar');
  assert.equal(await p.locator('#window-terminal [data-window="maximize"]').getAttribute('aria-label'), 'Restore');
  assert.equal(await p.locator('#window-terminal .window-resize').first().isHidden(), true);
  const point = await titlebarPoint(p)('terminal');
  await p.mouse.dblclick(point.x, point.y);
  assert.deepEqual(await box(p, '#window-terminal'), normal, 'double-click restores the same bounds');
  outcomes.push('Maximize fills the workspace above the taskbar and hides the resize handles; the button becomes Restore; double-clicking the titlebar restores the exact earlier bounds.');

  // 3. Pointer resize, bounded by the minimum size.
  const se = await box(p, '#window-terminal .window-resize[data-edge="se"]');
  await p.mouse.move(se.x + se.w / 2, se.y + se.h / 2);
  await p.mouse.down();
  await p.mouse.move(se.x + se.w / 2 - 400, se.y + se.h / 2 - 400, { steps: 6 });
  await p.mouse.up();
  const shrunk = await box(p, '#window-terminal');
  assert.deepEqual([shrunk.w, shrunk.h], [480, 420], 'resize stops at TERMINAL’s minimum size');
  const w = await box(p, '#window-terminal .window-resize[data-edge="w"]');
  await p.mouse.move(w.x + w.w / 2, w.y + w.h / 2);
  await p.mouse.down();
  await p.mouse.move(w.x + w.w / 2 - 60, w.y + w.h / 2, { steps: 4 });
  await p.mouse.up();
  const wider = await box(p, '#window-terminal');
  near(wider.x, shrunk.x - 60, 'the west edge follows the pointer');
  near(wider.x + wider.w, shrunk.x + shrunk.w, 'the east edge stays put');
  outcomes.push('Resizing from the south-east corner stops at TERMINAL’s 480×420 minimum; resizing from the west edge moves that edge only.');

  // 4. The window menu by keyboard: Size grows the window; Move then Escape puts it back; Escape never closes it.
  await p.locator('#window-terminal .window-icon').focus();
  await p.keyboard.press('Enter');
  await p.keyboard.press('ArrowDown');
  assert.equal(await p.evaluate(() => document.activeElement?.dataset.menu), 'size');
  await p.keyboard.press('Enter');
  assert.match(await p.locator('.window-mode-hint').textContent(), /Sizing TERMINAL/);
  for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowRight');
  await p.keyboard.press('Shift+ArrowDown');
  await p.keyboard.press('Enter');
  const sized = await box(p, '#window-terminal');
  assert.deepEqual([sized.w - wider.w, sized.h - wider.h], [60, 80]);
  await p.locator('#window-terminal .window-icon').focus();
  await p.keyboard.press('Enter');
  await p.keyboard.press('Enter');
  for (let i = 0; i < 4; i++) await p.keyboard.press('ArrowRight');
  await p.keyboard.press('Escape');
  assert.deepEqual(await box(p, '#window-terminal'), sized, 'Escape cancels a keyboard move');
  await p.locator('#haunt-command').focus();
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#window-terminal').isVisible(), true, 'Escape does not close a window');
  outcomes.push('Window menu by keyboard: Size with arrows (Shift for 80 px) resized by exactly 60×80; Move followed by Escape returned the window to where it was; Escape with focus in TERMINAL left the window open.');

  // 5. Close and reopen in the same page: the same bounds. Arrange windows: defaults, case untouched.
  await p.click('#window-terminal [data-window="close"]');
  await p.waitForFunction(() => !document.getElementById('window-terminal'));
  await p.click('#btn-terminal');
  await settled(p, 'terminal');
  assert.deepEqual(await box(p, '#window-terminal'), sized, 'reopened where it was closed');
  const before = JSON.stringify(await caseSave(p));
  await dragWindow(p, 'terminal', 140, 30);
  await p.click('#btn-launcher');
  await p.click('[data-arrange]');
  const arranged = await box(p, '#window-terminal');
  assert.notDeepEqual(arranged, sized);
  assert.equal(JSON.stringify(await caseSave(p)), before, 'Arrange windows does not touch the case');
  outcomes.push('Closing and reopening TERMINAL in the same page restored its last bounds; Arrange windows put it back to the default layout without changing the saved case.');

  // 6. A smaller screen clamps windows inside the workspace; nothing is left off screen.
  await dragWindow(p, 'terminal', 600, 0);
  await p.setViewportSize(PC_SIZES[0]);
  await p.waitForTimeout(200);
  const small = await workspace(p), clamped = await box(p, '#window-terminal');
  assert.ok(clamped.x >= small.x && clamped.x + clamped.w <= small.x + small.w + 1 && clamped.y + clamped.h <= small.dock + 1, `clamped: ${JSON.stringify({ clamped, small })}`);
  outcomes.push('Shrinking the viewport from 1440×900 to 1366×768 kept a moved TERMINAL entirely inside the workspace.');

  // 7. Interrupting motion: open, close and reopen quickly lands on one open window.
  await p.click('#btn-canvas');
  await p.click('#window-canvas [data-window="close"]');
  await p.click('#btn-canvas');
  await settled(p, 'canvas');
  assert.equal(await p.locator('.window[data-app="canvas"]').count(), 1);
  assert.equal(await p.locator('#window-canvas').getAttribute('aria-hidden'), null);
  outcomes.push('Opening, closing and reopening CANVAS within its animations ends with exactly one open, interactive window.');
  await p.close();
} finally {
  await browser.close();
  await finish();
}
