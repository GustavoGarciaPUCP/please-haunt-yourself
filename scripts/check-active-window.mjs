import assert from 'node:assert/strict';
import { PC_SIZES, settled, start } from './haunt-helpers.mjs';
// The active frame (.kiro/specs/fluid-typing-v9 R5): at every step, the window the taskbar shows pressed (the model's
// active window) has the active frame, and no other window has it. Closing or minimizing the active window gives the frame
// to the window that becomes active, at once, without moving focus into it; window order, geometry and the case stay.

const { browser, outcomes, open, finish } = await start('active-window');
const state = page => page.evaluate(() => {
  const focus = document.activeElement;
  return {
    focus: focus ? `${focus.tagName.toLowerCase()}${focus.id ? `#${focus.id}` : ''}` : null,
    phase: document.getElementById('btn-phase')?.dataset.phase ?? null,
    windows: Object.fromEntries([...document.querySelectorAll('.window')].map(win => {
      const id = win.id.replace('window-', ''), style = getComputedStyle(win);
      return [id, { active: win.classList.contains('is-active'), pressed: document.getElementById(`btn-${id}`)?.getAttribute('aria-pressed') === 'true',
        shown: style.display !== 'none' && !win.inert, border: style.borderColor, titlebar: getComputedStyle(win.querySelector('.window-titlebar')).backgroundColor,
        z: Number(win.style.zIndex), box: [win.style.left, win.style.top, win.style.width, win.style.height].join(' ') }];
    })),
  };
});
const steps = [];
/** Exactly the pressed, shown window has the active frame; the frame looks like the first active frame seen. */
async function consistent(page, label, look) {
  const s = await state(page);
  steps.push(label);
  for (const [id, win] of Object.entries(s.windows)) {
    assert.equal(win.active, win.pressed && win.shown, `${label}: ${id} has the active frame exactly when it is the active window (${JSON.stringify(win)})`);
    if (look && win.active) assert.deepEqual([win.border, win.titlebar], look.active, `${label}: ${id} looks active`);
    if (look && win.shown && !win.active) assert.deepEqual([win.border, win.titlebar], look.inactive, `${label}: ${id} looks inactive`);
  }
  assert.ok(Object.values(s.windows).filter(win => win.active).length <= 1, `${label}: at most one active frame`);
  return s;
}
const closed = (page, id) => page.locator(`#window-${id}`).waitFor({ state: 'detached' });
const hidden = (page, id) => page.waitForFunction(id => { const win = document.getElementById(`window-${id}`); return win && getComputedStyle(win).display === 'none'; }, id);

try {
  const p = await open({ viewport: PC_SIZES[0] });
  let s = await consistent(p, 'a fresh case');
  const look = { active: [s.windows.terminal.border, s.windows.terminal.titlebar] };
  await p.click('#btn-echo');
  await settled(p, 'echo');
  s = await consistent(p, 'ECHO opened');
  look.inactive = [s.windows.terminal.border, s.windows.terminal.titlebar];
  assert.notDeepEqual(look.active, look.inactive, 'the active and inactive frames differ');
  await consistent(p, 'ECHO opened (look)', look);

  // 1. The active window closed with X, another behind it: the frame moves at once, focus does not go into it.
  const terminalBox = s.windows.terminal.box, lines = await p.locator('#window-terminal .console-output .console-line').count(), phase = s.phase;
  await p.click('#window-echo [data-window="close"]');
  await closed(p, 'echo');
  s = await consistent(p, 'ECHO closed with X', look);
  assert.equal(s.windows.terminal.active, true, 'TERMINAL has the active frame at once, before any click');
  assert.equal(s.focus, 'button#btn-echo', 'focus goes back to the taskbar button that opened ECHO (v4 policy), not into TERMINAL');
  assert.equal(s.windows.terminal.box, terminalBox, 'TERMINAL did not move');
  await p.click('#haunt-command');
  await p.keyboard.type('help');
  assert.equal(await p.locator('#haunt-command').inputValue(), 'help', 'a click in TERMINAL\'s field and typing work');
  await consistent(p, 'a click in TERMINAL and typing', look);
  await p.keyboard.press('Enter');
  assert.ok(await p.locator('#window-terminal .console-output .console-line').count() > lines, 'the command ran in the same transcript');
  outcomes.push('ECHO closed with X over TERMINAL: TERMINAL has the active frame at once (border and titlebar as on a fresh case), focus returns to ECHO\'s taskbar button (v4), TERMINAL did not move; a click in its field, typing and Enter work in the same transcript.');

  // 2. The active window minimized (its button, then the taskbar), another behind it; restored.
  await p.click('#btn-echo');
  await settled(p, 'echo');
  await p.click('#window-echo [data-window="minimize"]');
  await hidden(p, 'echo');
  s = await consistent(p, 'ECHO minimized with its button', look);
  assert.equal(s.windows.echo.active, false, 'a minimized window has no active frame');
  assert.equal(s.windows.terminal.active, true);
  assert.equal(s.focus, 'button#btn-echo');
  await p.click('#btn-echo');
  await settled(p, 'echo');
  await consistent(p, 'ECHO restored from the taskbar', look);
  await p.click('#btn-echo');
  await hidden(p, 'echo');
  s = await consistent(p, 'the active ECHO\'s taskbar button pressed: it minimizes', look);
  assert.equal(s.windows.terminal.active, true);
  outcomes.push('ECHO minimized by its button and by its taskbar button: it has no active frame while minimized, TERMINAL has it at once; restored, ECHO has it again.');

  // 3. Three windows: closing the top one gives the frame to the next in z-order; the order of the others is kept.
  await p.click('#btn-echo');
  await settled(p, 'echo');
  await p.click('#btn-canvas');
  await settled(p, 'canvas');
  s = await consistent(p, 'three windows', look);
  const order = Object.entries(s.windows).filter(([id]) => id !== 'canvas').sort((x, y) => x[1].z - y[1].z).map(([id]) => id);
  await p.click('#window-canvas [data-window="close"]');
  await closed(p, 'canvas');
  s = await consistent(p, 'CANVAS closed: ECHO and TERMINAL remain', look);
  assert.deepEqual(Object.entries(s.windows).sort((x, y) => x[1].z - y[1].z).map(([id]) => id), order, 'the remaining windows keep their order');
  assert.equal(s.windows.echo.active, true, 'the next window in the order (ECHO) has the frame');
  outcomes.push(`Three windows, the top one (CANVAS) closed: the next in z-order (ECHO) has the active frame, and the others keep their order (${order.join(' under ')}).`);

  // 4. Keyboard: the window menu's Minimize and Close; the last window closed; a window opened again.
  await p.locator('#window-echo .window-icon').focus();
  await p.keyboard.press('Enter');
  await p.locator('.window-menu [data-menu="minimize"]').focus();
  await p.keyboard.press('Enter');
  await hidden(p, 'echo');
  s = await consistent(p, 'ECHO minimized from its window menu with the keyboard', look);
  assert.equal(s.windows.terminal.active, true);
  await p.locator('#window-terminal .window-icon').focus();
  await p.keyboard.press('Enter');
  await p.locator('.window-menu [data-menu="close"]').focus();
  await p.keyboard.press('Enter');
  await closed(p, 'terminal');
  s = await consistent(p, 'TERMINAL closed from its window menu: only a minimized ECHO is left', look);
  assert.equal(Object.values(s.windows).some(win => win.active || win.pressed), false, 'no window is active when none is open');
  await p.click('#btn-echo');
  await settled(p, 'echo');
  await consistent(p, 'ECHO restored, alone', look);
  await p.click('#btn-terminal');
  await settled(p, 'terminal');
  s = await consistent(p, 'TERMINAL opened again', look);
  assert.equal(s.phase, phase, 'the case did not change');
  outcomes.push('By keyboard, the window menu\'s Minimize and Close: the frame follows the active window; with only a minimized window left, no window is active; restored and reopened windows have it; the case phase is unchanged.');
  outcomes.push(`Every step checked: exactly the window the taskbar shows pressed has the active frame, and it looks active (${steps.length} states).`);
  await p.close();
} finally {
  await browser.close();
  await finish({ browser: process.env.HAUNT_CHANNEL ?? 'chrome' });
}
