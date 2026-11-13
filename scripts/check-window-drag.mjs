import assert from 'node:assert/strict';
import { PC_SIZES, box, settled, start, titlebarPoint, workspace } from './haunt-helpers.mjs';
// Titlebar dragging (.kiro/specs/os-case-v4 R2.2, keeping the v3 guarantees): the window follows the pointer delta on
// every move, stays in the workspace, ends on release, Escape puts it back, and a maximized window restores under the pointer.

const { browser, outcomes, open, finish } = await start('window-drag');
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) <= 1, `${message}: ${actual} vs ${expected}`);
const inside = async (page, id) => {
  const area = await workspace(page), r = await box(page, `#window-${id}`);
  assert.ok(r.x >= area.x - 1 && r.y >= area.y - 1 && r.x + r.w <= area.x + area.w + 1 && r.y + r.h <= area.dock + 1, `${id} inside the workspace: ${JSON.stringify({ r, area })}`);
};
try {
  for (const viewport of PC_SIZES) {
    const p = await open({ viewport });
    await p.click('#btn-echo');
    await settled(p, 'echo');
    for (const id of ['terminal', 'echo']) {
      await inside(p, id);
      const origin = await box(p, `#window-${id}`), point = await titlebarPoint(p)(id);
      await p.mouse.move(point.x, point.y);
      await p.mouse.down();
      for (const [dx, dy] of [[-17, 4], [-41, 9], [-60, 13], [-23, 6]]) {
        await p.mouse.move(point.x + dx, point.y + dy);
        const now = await box(p, `#window-${id}`);
        near(now.x - origin.x, dx, `${id} x follows the pointer at ${viewport.width}`);
        near(now.y - origin.y, dy, `${id} y follows the pointer at ${viewport.width}`);
      }
      await p.mouse.up();
      assert.equal(await p.locator(`#window-${id}`).evaluate(el => el.classList.contains('is-dragging')), false);
      assert.equal(await p.evaluate(() => document.getSelection().isCollapsed), true, 'dragging selects no text');
    }
    await p.close();
  }
  outcomes.push('1366×768, 1440×900, 1920×1080: TERMINAL and ECHO open inside the workspace and follow the pointer delta on every move event, selecting no text.');

  const p = await open({ viewport: PC_SIZES[0] });
  // Out of the viewport: clamped, and the drag ends on release.
  let point = await titlebarPoint(p)('terminal');
  await p.mouse.move(point.x, point.y);
  await p.mouse.down();
  await p.mouse.move(-300, point.y + 900, { steps: 6 });
  await inside(p, 'terminal');
  await p.mouse.up();
  const parked = await box(p, '#window-terminal');
  await p.mouse.move(600, 300, { steps: 3 });
  assert.deepEqual(await box(p, '#window-terminal'), parked, 'no drag continues after the release');
  outcomes.push('Dragging past the viewport edge keeps TERMINAL in the workspace; nothing moves after the button is released.');

  // Escape during a drag puts the window back where the drag started.
  point = await titlebarPoint(p)('terminal');
  await p.mouse.move(point.x, point.y);
  await p.mouse.down();
  await p.mouse.move(point.x + 200, point.y + 40, { steps: 4 });
  await p.keyboard.press('Escape');
  await p.mouse.up();
  assert.deepEqual(await box(p, '#window-terminal'), parked, 'Escape cancels the drag');
  assert.equal(await p.locator('#window-terminal').isVisible(), true, 'and does not close the window');
  outcomes.push('Escape during a drag returns the window to its starting position and leaves it open.');

  // Losing the window (blur) ends a drag where it is.
  point = await titlebarPoint(p)('terminal');
  await p.mouse.move(point.x, point.y);
  await p.mouse.down();
  await p.mouse.move(point.x + 120, point.y + 10, { steps: 3 });
  await p.evaluate(() => window.dispatchEvent(new Event('blur')));
  const blurred = await box(p, '#window-terminal');
  await p.mouse.move(point.x + 300, point.y + 10, { steps: 3 });
  await p.mouse.up();
  assert.deepEqual(await box(p, '#window-terminal'), blurred, 'blur ended the drag');
  outcomes.push('A window blur during a drag ends it where it is; later pointer moves do not move the window.');

  // A maximized window dragged by its titlebar restores under the pointer, at the same relative point.
  await p.click('#window-terminal [data-window="maximize"]');
  const restoredSize = { w: parked.w, h: parked.h };
  point = { x: 700, y: (await box(p, '#window-terminal .window-titlebar')).y + 20 };
  await p.mouse.move(point.x, point.y);
  await p.mouse.down();
  await p.mouse.move(point.x + 3, point.y + 2);
  assert.equal(await p.locator('#window-terminal').getAttribute('data-maximized'), 'true', 'a few pixels do not restore it');
  await p.mouse.move(point.x + 40, point.y + 120, { steps: 6 });
  await p.mouse.up();
  const restored = await box(p, '#window-terminal');
  assert.equal(await p.locator('#window-terminal').getAttribute('data-maximized'), 'false');
  assert.deepEqual([restored.w, restored.h], [restoredSize.w, restoredSize.h], 'normal size restored');
  assert.ok(restored.x < point.x + 40 && restored.x + restored.w > point.x + 40, 'the pointer is still on the titlebar');
  outcomes.push('Dragging a maximized TERMINAL by its titlebar restores its normal size under the pointer after a 6 px threshold; a smaller movement leaves it maximized.');
  await p.close();
} finally {
  await browser.close();
  await finish();
}
