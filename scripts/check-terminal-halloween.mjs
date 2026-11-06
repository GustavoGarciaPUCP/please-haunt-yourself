import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
// Task17 browser journeys: the player uses only plain buttons; assertions read rendered state (computed styles,
// animations, focus, text) rather than trusting a success class.
await mkdir('output/playwright', { recursive: true });
const url = new URL('/haunt.html', process.env.HAUNT_BASE_URL ?? 'http://127.0.0.1:5174').href;
const LAST = "I'll finish in a minute.";
const TECHNICAL = /\b(PID|stdout|BASIC|TERM|KILL|SIGTERM|callback|on_exit)\b/;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const outcomes = [], errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 }, reducedMotion: 'no-preference' });
  await page.addInitScript(() => localStorage.setItem('haunt.guide.v2', 'dismissed'));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  const terminal = page.locator('.terminal-console');
  const banner = terminal.locator('.terminal-anomaly');
  const room = terminal.locator('.legacy-interior');
  const input = terminal.locator('input[name="command"]');
  const output = terminal.locator('.console-output');
  const press = (scope, name) => scope.getByRole('button', { name, exact: true }).click();
  const cmd = async value => { await input.fill(value); await input.press('Enter'); };
  const health = value => page.waitForFunction(expected => document.querySelector('.terminal-console')?.dataset.terminalHealth === expected, value);
  const css = (locator, property) => locator.evaluate((el, name) => getComputedStyle(el)[name], property);
  const waitCss = (selector, property, expected, timeout = 2500) => page.waitForFunction(([s, p, e]) => {
    const el = document.querySelector(s);
    return !!el && getComputedStyle(el)[p] === e;
  }, [selector, property, expected], { timeout });
  const lastLines = async count => (await output.locator('.console-line').allTextContents()).slice(-count).join('\n');
  const narration = () => room.locator('.haunt-narration').textContent();
  const writingDone = selector => page.waitForFunction(s => document.querySelector(s)?.getAnimations({ subtree: true }).length === 0, selector, { timeout: 2500 });

  // 1. The presence writes behind the banner; the reveal is bounded and never takes the prompt.
  await health('haunted');
  assert.equal(await banner.locator('.ghost-letter').count(), LAST.replace(/\s/g, '').length);
  assert.ok(Number(await css(banner.locator('.shell-ghost'), 'opacity')) > 0.5);
  assert.equal(await css(banner.locator('.shell-ghost'), 'visibility'), 'visible');
  const ghostBox = await banner.locator('.shell-ghost').boundingBox(), bannerBox = await banner.boundingBox();
  assert.ok(ghostBox.x > bannerBox.x && ghostBox.y < bannerBox.y + bannerBox.height, 'the ghost sits inside the banner, behind its text');
  assert.equal(await banner.locator('.ghost-line-sr').textContent(), `The ghost writes: ${LAST}`);
  await input.focus();
  await page.keyboard.type('ec');
  await writingDone('.terminal-anomaly .ghost-hand');
  assert.equal(await input.inputValue(), 'ec');
  assert.ok(await input.evaluate(el => document.activeElement === el));
  const idleLines = await output.locator('.console-line').count();
  await page.waitForTimeout(1500);
  assert.equal(await output.locator('.console-line').count(), idleLines);
  assert.equal(await banner.locator('.ghost-hand').evaluate(el => el.getAnimations({ subtree: true }).length), 0);
  assert.ok(await input.evaluate(el => document.activeElement === el));
  assert.doesNotMatch(await banner.innerText(), TECHNICAL);
  for (const name of ['Follow the ghost', 'Are you okay?', 'Read the note']) assert.ok(await banner.getByRole('button', { name, exact: true }).isVisible());
  await input.fill('');
  await page.screenshot({ path: 'output/playwright/halloween-shell-haunted.png' });
  outcomes.push('a ghost behind the banner writes the farewell once; typing and focus survive the bounded reveal; no idle output; plain default words');

  // 2. Follow the ghost: the same window becomes its room; technical detail is optional.
  await page.locator('#window-terminal').evaluate(el => { el.dataset.instanceProbe = 'same-terminal'; });
  await press(banner, 'Follow the ghost');
  await room.waitFor({ state: 'visible' });
  assert.equal(await page.locator('.window').count(), 1);
  assert.equal(await page.locator('#window-terminal').getAttribute('data-instance-probe'), 'same-terminal');
  assert.ok(await room.locator('[data-legacy="step"]').evaluate(el => document.activeElement === el));
  for (const part of ['.scene-ghost', '.scene-note', '.scene-door', '.scene-bell']) assert.ok(await room.locator(part).isVisible(), part);
  assert.equal(await room.locator('.scene-note-line').textContent(), LAST);
  await writingDone('.scene-whisper');
  assert.equal(await room.locator('.scene-whisper').textContent(), LAST);
  assert.equal(await room.locator('details.under-hood').evaluate(el => el.open), false);
  assert.equal(await room.locator('.legacy-execution').isVisible(), false);
  assert.doesNotMatch(await room.innerText(), TECHNICAL);
  await room.locator('.under-hood summary').click();
  assert.match(await room.locator('.legacy-execution').innerText(), /PID 3087 \/ cycles 0 \/ haunted/);
  assert.match(await room.locator('.under-hood').innerText(), /on_exit[\s\S]*kill -TERM/);
  await room.locator('.under-hood summary').click();
  await page.screenshot({ path: 'output/playwright/halloween-room.png' });
  outcomes.push('Follow the ghost turns the same window into a room with note, ghost, whisper, bell and way out; Under the hood is closed until asked');

  // 3. Watching: memory, whisper, then the bell answers the departure and pulls the ghost back.
  await press(room, 'Watch the next moment');
  assert.equal(await room.getAttribute('data-moment'), 'memory');
  assert.match(await narration(), /reads it again/);
  assert.notEqual(await css(room.locator('.scene-note'), 'boxShadow'), 'none');
  await press(room, 'Watch the next moment');
  assert.equal(await room.getAttribute('data-moment'), 'voice');
  assert.ok(await room.locator('.scene-whisper .ghost-letter').count() > 0, 'the whisper is written again when it speaks');
  assert.match(await narration(), /whispers the note aloud/);
  assert.equal(await css(room.locator('.specter-mouth'), 'opacity'), '1');
  assert.equal(await css(room.locator('.bell-waves'), 'opacity'), '0');
  assert.equal(await room.locator('.scene-bell-count').textContent(), '');
  await press(room, 'Watch the next moment');
  assert.ok(await room.locator('.bell-swing').evaluate(el => el.getAnimations().length) > 0, 'the bell swings');
  assert.ok(await room.locator('.scene-ghost').evaluate(el => el.getAnimations().length) > 0, 'the ghost is pulled back');
  await page.waitForTimeout(650);
  await page.screenshot({ path: 'output/playwright/halloween-bell-rings.png' });
  await waitCss('.legacy-interior .bell-waves', 'opacity', '1');
  assert.equal(await room.locator('.scene-bell-count').textContent(), 'rang once');
  assert.match(await narration(), /bell rings.*pulled back.*once/);
  await health('haunted');
  outcomes.push('Watch the next moment shows the note being read, the whisper being written, then the bell swinging as it pulls the ghost back (tally: once)');

  // 4. Wrong interventions: hush keeps the ghost; guiding while the bell can ring brings it back.
  await press(room, 'Hush the whisper');
  assert.equal(await room.locator('.scene-whisper').textContent(), '');
  await waitCss('.legacy-interior .specter-mouth', 'opacity', '0');
  await waitCss('.legacy-interior .specter-lips', 'opacity', '1');
  assert.ok(Number(await css(room.locator('.scene-ghost'), 'opacity')) > 0.5);
  assert.match(await narration(), /hushed the whisper.*still here/);
  await press(room, 'Guide it out');
  assert.match(await narration(), /^You guided it.*bell rang.*twice/);
  assert.equal(await room.locator('.scene-bell-count').textContent(), 'rang twice');
  await health('haunted');
  const hauntedBackground = await css(page.locator('#window-terminal'), 'backgroundColor');
  await press(room, 'Back to the prompt');
  assert.equal(await terminal.getAttribute('data-ghost'), 'hushed');
  assert.ok(Number(await css(banner.locator('.shell-ghost'), 'opacity')) > 0.3);
  assert.equal(await banner.locator('.ghost-letter').count(), 0, 'a hushed ghost writes nothing');
  assert.ok(await terminal.locator('.console-bell').isVisible());
  assert.equal(await terminal.locator('.console-bell-count').textContent(), '2');
  await press(banner, 'Are you okay?');
  assert.match(await lastLines(2), /hushed the whisper[\s\S]*Quiet is not the same as free/);
  assert.doesNotMatch(await page.locator('.desktop-task').textContent(), /recovered/);
  outcomes.push('hushing removes the words but the ghost stays in the room and behind the prompt; guiding while the bell can ring rings it again (twice); check-in says quiet is not free');

  // 5. Quiet the bell: the next departure is not answered, and the ghost waits at the way out.
  await press(banner, 'Follow the ghost');
  await press(room, 'Let it whisper');
  assert.ok(await room.locator('.scene-whisper .ghost-letter').count() > 0);
  await press(room, 'Quiet the bell');
  assert.equal(await room.getAttribute('data-bell'), 'quiet');
  await waitCss('.legacy-interior .bell-tie', 'opacity', '1');
  assert.match(await narration(), /quieted the bell/);
  for (let i = 0; i < 3; i++) await press(room, 'Watch the next moment');
  assert.equal(await room.getAttribute('data-pose'), 'leaving');
  await page.waitForTimeout(700);
  const scene = await room.locator('.spectral-scene').boundingBox(), ghost = await room.locator('.scene-ghost').boundingBox();
  assert.ok(ghost.x + ghost.width / 2 > scene.x + scene.width * 0.6, 'the ghost waits by the way out');
  assert.equal(await css(room.locator('.bell-waves'), 'opacity'), '0');
  assert.equal(await room.locator('.scene-bell-count').textContent(), 'rang twice');
  assert.match(await narration(), /stays quiet.*guide it out now/);
  await page.screenshot({ path: 'output/playwright/halloween-waiting-at-door.png' });
  outcomes.push('quieting the bell (shown tied) means the next departure is not answered; the ghost waits at the way out and the tally stays at twice');

  // 6. Ending A: Guide it out frees the ghost; the kept note stays and the shell changes.
  await press(room, 'Guide it out');
  await health('remembered');
  assert.ok(await room.locator('[data-legacy="return"]').evaluate(el => document.activeElement === el), 'focus moves to Back to the prompt');
  await waitCss('.legacy-interior .scene-ghost', 'visibility', 'hidden');
  assert.equal(await css(room.locator('.scene-note-line'), 'opacity'), '1');
  assert.match(await narration(), /memory, not a loop/);
  await page.screenshot({ path: 'output/playwright/halloween-released-kept.png' });
  await press(room, 'Back to the prompt');
  await waitCss('.terminal-anomaly .shell-ghost', 'visibility', 'hidden');
  assert.equal(await terminal.getAttribute('data-line'), 'kept');
  const endingA = await banner.innerText();
  assert.match(endingA, /At peace[\s\S]*Kept note[\s\S]*I'll finish in a minute/i);
  await press(banner, 'Are you okay?');
  assert.match(await lastLines(2), /remember her line/);
  await press(banner, 'Read the note');
  assert.match(await lastLines(3), /I'll finish in a minute\.[\s\S]*no longer executable/);
  await cmd('echo the prompt is mine');
  assert.equal(await lastLines(1), 'the prompt is mine');
  assert.match(await page.locator('.desktop-task').textContent(), /TERMINAL recovered\.[\s\S]*kept as a memory/);
  assert.notEqual(await css(page.locator('#window-terminal'), 'backgroundColor'), hauntedBackground);
  await page.screenshot({ path: 'output/playwright/halloween-shell-kept.png' });
  outcomes.push('ending A: the ghost passes through the way out, the presence clears from room and prompt, the note is kept, echo is repaired and the check-in remembers');

  // 7. Ending B: fading the note alone fails; with the bell quiet it ends on a blank page.
  await cmd('restore terminal');
  await health('haunted');
  await waitCss('.terminal-anomaly .shell-ghost', 'visibility', 'visible');
  await press(banner, 'Follow the ghost');
  await press(room, 'Let the note fade');
  await waitCss('.legacy-interior .scene-note-line', 'opacity', '0');
  assert.match(await narration(), /let the note fade.*does not free it/);
  await press(room, 'Guide it out');
  await health('haunted');
  assert.equal(await room.locator('.scene-bell-count').textContent(), 'rang once');
  await press(room, 'Quiet the bell');
  await press(room, 'Guide it out');
  await health('blank');
  await waitCss('.legacy-interior .scene-ghost', 'visibility', 'hidden');
  assert.match(await narration(), /nothing stays behind/);
  await press(room, 'Back to the prompt');
  assert.equal(await terminal.getAttribute('data-line'), 'blank');
  const endingB = await banner.innerText();
  assert.match(endingB, /a blank page/);
  assert.notEqual(endingA, endingB);
  await press(banner, 'Are you okay?');
  assert.match(await lastLines(2), /cannot remember the line/);
  await press(banner, 'Read the note');
  assert.match(await lastLines(1), /archive is blank/);
  assert.match(await page.locator('.desktop-task').textContent(), /TERMINAL recovered\.[\s\S]*page is blank/);
  await page.screenshot({ path: 'output/playwright/halloween-shell-blank.png' });
  outcomes.push('ending B: a faded note alone is recalled by the bell; with the bell quiet the ghost leaves a blank page, a different banner, reply and note');

  // 8. Force it out: a shadow, not a recovery; calling it back and Undo both work.
  await cmd('restore terminal');
  await press(banner, 'Follow the ghost');
  await press(room, 'Quiet the bell');
  await press(room, 'Force it out');
  await health('residue');
  assert.equal(await room.getAttribute('data-pose'), 'shadow');
  await waitCss('.legacy-interior .scene-ghost', 'color', 'rgb(5, 9, 9)');
  assert.equal(await css(room.locator('.scene-ghost'), 'visibility'), 'visible');
  assert.equal(await css(room.locator('.specter-eyes'), 'opacity'), '0');
  assert.ok(await room.getByRole('button', { name: 'Call the shadow back', exact: true }).evaluate(el => document.activeElement === el));
  await page.screenshot({ path: 'output/playwright/halloween-shadow.png' });
  await press(room, 'Back to the prompt');
  assert.equal(await terminal.getAttribute('data-ghost'), 'shadow');
  await press(banner, 'Are you okay?');
  assert.match(await lastLines(2), /shadow is still on my screen/);
  assert.doesNotMatch(await page.locator('.desktop-task').textContent(), /recovered/);
  await press(banner, 'Follow the shadow');
  await press(room, 'Call the shadow back');
  await health('haunted');
  assert.equal(await room.getAttribute('data-pose'), 'present');
  await press(room, 'Undo');
  await health('residue');
  assert.match(await narration(), /^Undone\. You forced it out/);
  await press(room, 'Call the shadow back');
  await press(room, 'Guide it out');
  await health('remembered');
  outcomes.push('forcing with the bell quiet leaves a dark, eyeless shadow and no recovery; Call the shadow back, Undo and a gentler farewell all work');

  // 9. Reduced motion: complete words and still poses, with the same evidence.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await press(room, 'Back to the prompt');
  await cmd('restore terminal');
  assert.equal(await banner.locator('.ghost-letter').count(), 0);
  assert.equal(await banner.locator('.ghost-hand').textContent(), LAST);
  assert.equal(await banner.locator('.shell-ghost .specter-art').evaluate(el => el.getAnimations().length), 0);
  await press(banner, 'Follow the ghost');
  assert.equal(await room.locator('.scene-whisper .ghost-letter').count(), 0);
  assert.equal(await room.locator('.scene-whisper').textContent(), LAST);
  for (let i = 0; i < 3; i++) await press(room, 'Watch the next moment');
  assert.equal(await css(room.locator('.bell-waves'), 'opacity'), '1');
  assert.equal(await room.locator('.bell-swing').evaluate(el => el.getAnimations().length), 0);
  assert.equal(await room.locator('.scene-ghost').evaluate(el => el.getAnimations({ subtree: true }).length), 0);
  assert.equal(await room.locator('.scene-bell-count').textContent(), 'rang once');
  await press(room, 'Quiet the bell');
  assert.equal(await css(room.locator('.bell-tie'), 'opacity'), '1');
  await press(room, 'Guide it out');
  assert.equal(await css(room.locator('.scene-ghost'), 'visibility'), 'hidden');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  outcomes.push('reduced motion: words appear complete, nothing swings or drifts, ring marks/tally/tie still show cause, and release clears the ghost at once');

  // 10. Sound is optional, off by default, and nothing depends on it.
  const sound = room.locator('[data-bell-sound]');
  assert.equal(await sound.getAttribute('aria-pressed'), 'false');
  await sound.click();
  assert.equal(await sound.getAttribute('aria-pressed'), 'true');
  assert.equal(await sound.locator('.bell-sound-state').textContent(), 'on');
  await sound.click();
  assert.equal(await sound.getAttribute('aria-pressed'), 'false');
  outcomes.push('the audible bell is an opt-in toggle (aria-pressed), off by default; every cue above was visual');

  // 11. Phone and short screens: the room, its objects and every control stay reachable without sideways overflow.
  await press(room, 'Back to the prompt');
  for (const viewport of [{ width: 390, height: 844 }, { width: 800, height: 450 }]) {
    await page.setViewportSize(viewport);
    await cmd('restore terminal');
    assert.equal(await terminal.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
    await press(banner, 'Follow the ghost');
    assert.equal(await room.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
    const win = await page.locator('#window-terminal').boundingBox();
    assert.ok(win.y >= 0 && win.y + win.height <= viewport.height + 1, JSON.stringify(win));
    for (const button of await room.locator('button:visible').all()) {
      await button.scrollIntoViewIfNeeded();
      const box = await button.boundingBox();
      assert.ok(box.x >= win.x - 1 && box.x + box.width <= win.x + win.width + 1, `${await button.textContent()} stays inside the window`);
    }
    await room.locator('.spectral-scene').scrollIntoViewIfNeeded();
    const stage = await room.locator('.spectral-scene').boundingBox(), figure = await room.locator('.scene-ghost').boundingBox();
    assert.ok(figure.x >= stage.x - 1 && figure.x + figure.width <= stage.x + stage.width + 1);
    await page.screenshot({ path: `output/playwright/halloween-room-${viewport.width}x${viewport.height}.png` });
    await press(room, 'Hush the whisper');
    await press(room, 'Quiet the bell');
    await press(room, 'Back to the prompt');
    // The longest banner copy (hushed, bell quiet) must still leave the shell above the taskbar.
    const shell = await page.locator('#window-terminal').boundingBox(), dock = await page.locator('#taskbar').boundingBox();
    assert.ok(shell.y >= 0 && shell.y + shell.height <= dock.y + 1, JSON.stringify({ shell, dock }));
    assert.ok(await input.isVisible());
    await press(banner, 'Follow the ghost');
    await press(room, 'Guide it out');
    await health('remembered');
    await press(room, 'Back to the prompt');
    assert.ok(await input.isVisible());
    assert.equal(await terminal.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
    await page.screenshot({ path: `output/playwright/halloween-shell-${viewport.width}x${viewport.height}.png` });
  }
  outcomes.push('at 390x844 and 800x450 the room scrolls vertically only, every control stays inside the window, and both views remain usable');

  assert.deepEqual(errors, []);
  const report = { url, passed: outcomes.length, outcomes, pageErrors: errors, limitations: [
    'Automated browser journeys, not observation of people who do not program.',
    'Audio output is not verified; only the opt-in toggle and absence of errors are checked.',
    'A bounded fictional session model; page reload resets the encounter.',
  ] };
  await writeFile('output/playwright/terminal-halloween-results.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) { console.error(error); process.exitCode = 1; }
finally { await browser.close(); }
