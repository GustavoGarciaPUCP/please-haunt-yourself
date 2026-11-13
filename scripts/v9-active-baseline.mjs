// Active-window probe for .kiro/specs/fluid-typing-v9 (finding G): real pointer and keyboard input on a fresh case, and
// after each step, for every window, what the model shows (the taskbar's aria-pressed), the frame's class and computed
// style, focus and inertness. A probe, not a pass/fail check. Usage:
//   HAUNT_BASE_URL=http://127.0.0.1:5175 HAUNT_PROFILE_LABEL=v8 node scripts/v9-active-baseline.mjs
// Writes output/playwright/v9-active-<label>.json and screenshots in output/playwright/v9-active-<label>/.
import { mkdir, writeFile } from 'node:fs/promises';
import { PC_SIZES, settled, start, url } from './haunt-helpers.mjs';

const label = process.env.HAUNT_PROFILE_LABEL ?? 'run';
const dir = `output/playwright/v9-active-${label}`;
await mkdir(dir, { recursive: true });
const { browser, open, errors } = await start(`v9-active-${label}`);
const report = { label, url, steps: [] };
const state = page => page.evaluate(() => {
  const focus = document.activeElement;
  return {
    focus: focus ? `${focus.tagName.toLowerCase()}${focus.id ? `#${focus.id}` : ''}${focus.dataset?.window ? `[${focus.dataset.window}]` : ''}` : null,
    windows: [...document.querySelectorAll('.window')].map(win => {
      const id = win.id.replace('window-', ''), style = getComputedStyle(win), bar = getComputedStyle(win.querySelector('.window-titlebar'));
      return { id, active: win.classList.contains('is-active'), pressed: document.getElementById(`btn-${id}`)?.getAttribute('aria-pressed') === 'true',
        shown: style.display !== 'none' && !win.inert, inert: win.inert, border: style.borderColor, titlebar: bar.backgroundColor, z: Number(win.style.zIndex) };
    }),
    phase: document.getElementById('btn-phase')?.dataset.phase ?? null,
  };
});
const step = async (page, name, shot = null) => {
  const s = await state(page);
  // Consistent: exactly the pressed (model-active) window has the active frame, and only a shown window can have it.
  s.consistent = s.windows.every(win => win.active === (win.pressed && win.shown));
  report.steps.push({ name, ...s });
  if (shot) await page.screenshot({ path: `${dir}/${shot}.png` });
  console.log(`${label} · ${name}: ${s.windows.map(win => `${win.id}${win.shown ? '' : '(hidden)'} active=${win.active} pressed=${win.pressed}`).join(' · ')} · focus ${s.focus} · consistent ${s.consistent}`);
};
const closed = (page, id) => page.locator(`#window-${id}`).waitFor({ state: 'detached' });
const hidden = (page, id) => page.waitForFunction(id => { const win = document.getElementById(`window-${id}`); return win && getComputedStyle(win).display === 'none'; }, id);

try {
  const p = await open({ viewport: PC_SIZES[0] });
  await step(p, '1 fresh case: TERMINAL open');
  await p.click('#btn-echo');
  await settled(p, 'echo');
  await step(p, '2 ECHO opened from the taskbar');
  await p.click('#window-echo [data-window="close"]');
  await closed(p, 'echo');
  await step(p, '3 ECHO closed with X: TERMINAL remains', 'after-close');
  await p.click('#haunt-command');
  await p.keyboard.type('help');
  report.typed = await p.locator('#haunt-command').inputValue();
  await step(p, '4 a click in TERMINAL\'s command field, then typing', 'after-click');
  await p.keyboard.press('Control+A');
  await p.keyboard.press('Backspace');
  await p.click('#btn-echo');
  await settled(p, 'echo');
  await p.click('#window-echo [data-window="minimize"]');
  await hidden(p, 'echo');
  await step(p, '5 ECHO opened again, then minimized with its button', 'after-minimize');
  await p.click('#btn-echo');
  await settled(p, 'echo');
  await step(p, '6 ECHO restored from the taskbar');
  await p.click('#btn-canvas');
  await settled(p, 'canvas');
  await step(p, '7 CANVAS opened: three windows');
  await p.click('#window-canvas [data-window="close"]');
  await closed(p, 'canvas');
  await step(p, '8 CANVAS closed with X: ECHO and TERMINAL remain');
  await p.click('#btn-echo');
  await hidden(p, 'echo');
  await step(p, '9 the active ECHO\'s taskbar button pressed: ECHO minimizes');
  await p.click('#window-terminal [data-window="close"]');
  await closed(p, 'terminal');
  await step(p, '10 TERMINAL closed: only a minimized ECHO is left');
  await p.click('#btn-echo');
  await settled(p, 'echo');
  await step(p, '11 ECHO restored');
  // Keyboard: the window menu (the icon), then Close.
  await p.locator('#window-echo .window-icon').focus();
  await p.keyboard.press('Enter');
  await p.locator('.window-menu [data-menu="close"]').waitFor();
  await p.locator('.window-menu [data-menu="close"]').focus();
  await p.keyboard.press('Enter');
  await closed(p, 'echo');
  await step(p, '12 ECHO closed from its window menu with the keyboard: no window left');
  await p.click('#btn-terminal');
  await settled(p, 'terminal');
  await step(p, '13 TERMINAL opened again');
  report.transcriptLines = await p.locator('#window-terminal .console-output .console-line').count();
  await p.close();
} finally {
  report.pageErrors = errors;
  await browser.close();
  await writeFile(`${dir}.json`, JSON.stringify(report, null, 2));
  console.log(`page errors: ${errors.length}`);
}
