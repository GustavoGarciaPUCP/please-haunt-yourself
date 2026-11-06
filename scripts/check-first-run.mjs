import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('output/playwright', { recursive: true });
const url = new URL('/haunt.html', process.env.HAUNT_BASE_URL ?? 'http://127.0.0.1:5174').href;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const outcomes = [], errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  const guide = page.locator('#guide-layer');
  const next = guide.locator('[data-guide="next"]');
  const step = value => page.waitForFunction(expected => document.querySelector('#guide-layer')?.dataset.step === expected, String(value));
  const echoState = value => page.waitForFunction(expected => document.querySelector('.echo-scene-container')?.dataset.state === expected, value);
  const bounds = async () => {
    const card = await guide.locator('.guide-card').boundingBox();
    const viewport = page.viewportSize();
    assert.ok(card.x >= 0 && card.y >= 0 && card.x + card.width <= viewport.width + 1 && card.y + card.height <= viewport.height + 1, JSON.stringify(card));
  };
  await guide.waitFor({ state: 'visible' });
  await step(0);
  assert.ok(await next.evaluate(el => document.activeElement === el));
  assert.equal(await guide.locator('.guide-shade').first().evaluate(el => getComputedStyle(el).backdropFilter), 'blur(3px)');
  await bounds();
  await page.screenshot({ path: 'output/playwright/guide-welcome-desktop.png' });
  // The real highlighted dock control is usable, not a painted copy.
  await page.locator('#btn-echo').click();
  await step(1);
  await page.waitForFunction(() => {
    const spot = document.querySelector('.guide-spot').getBoundingClientRect();
    const target = document.querySelector('.echo-board-wrap').getBoundingClientRect();
    return spot.left <= target.left && spot.right >= target.right && spot.top <= target.top && spot.bottom >= target.bottom;
  });
  const spotlight = await guide.locator('.guide-spot').boundingBox();
  const monitor = await page.locator('.private-footage').boundingBox();
  assert.ok(spotlight.x <= monitor.x && spotlight.x + spotlight.width >= monitor.x + monitor.width);
  await bounds();
  await page.screenshot({ path: 'output/playwright/guide-private-monitor.png' });
  await next.click();
  await step(2);
  await guide.locator('[data-guide="query"]').click();
  assert.match(await page.locator('.console-output').textContent(), /PID\s+PPID\s+STATE/);
  assert.match(await page.locator('.echo-feed-state').textContent(), /\[410\].*live/);
  const untouched = await page.locator('.farewell-prop').evaluate(el => ({ x: parseFloat(el.style.left) * 6.4, y: parseFloat(el.style.top) * 4.1 }));
  assert.ok(Math.abs(untouched.x - 430) < .01 && Math.abs(untouched.y - 240) < .01);
  await next.click();
  await step(3);
  await next.click();
  await guide.waitFor({ state: 'hidden' });
  assert.ok(await page.locator('[data-action="rehearse"]').evaluate(el => document.activeElement === el));
  assert.equal(await page.locator('.echo-scene-container').getAttribute('data-state'), 'editing');
  outcomes.push('first-run spotlight follows real targets; optional ps reads data without solving, moving scenery or performing');

  await page.locator('#btn-guide').click();
  for (let i = 0; i < 3; i++) await next.click();
  await page.locator('[data-action="rehearse"]').click();
  await guide.waitFor({ state: 'hidden' });
  await echoState('failed');
  assert.match(await page.locator('.echo-status').textContent(), /self-view is still exposed/);
  assert.ok(await page.locator('#window-echo').evaluate(el => el.contains(document.activeElement)));
  outcomes.push('trying the actual rehearsal dismisses guidance and keeps failure feedback and repair controls readable');

  await page.reload();
  await guide.waitFor({ state: 'hidden' });
  await page.locator('#btn-guide').click();
  await guide.waitFor({ state: 'visible' });
  await guide.getByRole('combobox', { name: 'Guide topic' }).selectOption('2');
  await step(2);
  await guide.getByRole('combobox', { name: 'Guide topic' }).selectOption('0');
  await step(0);
  await page.keyboard.press('Escape');
  await guide.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#window-terminal').count(), 1);
  assert.ok(await page.locator('#btn-guide').evaluate(el => document.activeElement === el));
  await page.locator('#btn-guide').click();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => !!document.activeElement.closest('#guide-layer, #btn-echo')));
  }
  await guide.locator('[data-guide="skip"]').click();
  await guide.waitFor({ state: 'hidden' });
  outcomes.push('dismissal persists; Guide reopens; Skip and Escape restore focus without closing an app; Tab stays in the intended controls');

  await page.locator('.desktop-shortcuts [data-launch="echo"]').click();
  assert.equal(await page.locator('#os-app-context').textContent(), 'Echo Studio');
  await page.locator('.os-session-menu summary').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.os-session-menu').getAttribute('open'), null);
  assert.equal(await page.locator('#window-echo').count(), 1);
  await page.locator('.os-session-menu summary').click();
  await page.locator('.os-menu-panel [data-launch="terminal"]').click();
  assert.equal(await page.locator('#os-app-context').textContent(), 'Terminal');
  await page.locator('.console-shortcuts [data-command="ps"]').click();
  assert.match(await page.locator('.console-output').textContent(), /observing\s+mirror.watch/);
  assert.equal(await page.locator('input[name="command"]').inputValue(), '');
  assert.match(await page.locator('.os-clock').textContent(), /\d/);
  await page.screenshot({ path: 'output/playwright/desktop-shell.png' });
  outcomes.push('desktop icons, session menu, app context and clock work; read-only shortcuts execute immediately');

  await page.locator('#btn-echo').click();
  await page.locator('[data-action="help"]').click();
  await page.locator('[data-action="align"]').click();
  await page.locator('[data-action="help"]').click();
  // Exercise pause inside the 680ms take without actionability timing hiding a race.
  await page.evaluate(() => {
    document.querySelector('[data-action="rehearse"]').click();
    document.getElementById('btn-guide').click();
  });
  await echoState('paused');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  await echoState('paused');
  await page.locator('#btn-echo').click();
  await page.locator('[data-action="resume"]').click();
  await echoState('complete');
  assert.match(await page.locator('.desktop-task').textContent(), /ECHO made an entrance/);
  await page.locator('[data-action="leave"]').click();
  outcomes.push('opening guidance pauses an active take; dismissal never silently resumes, explicit Resume works');

  for (const viewport of [{ width: 390, height: 844 }, { width: 800, height: 450 }]) {
    await page.setViewportSize(viewport);
    await page.locator('#btn-guide').click();
    for (let i = 0; i < 4; i++) {
      await step(i);
      await page.waitForTimeout(300);
      await bounds();
      if (i === 2 && viewport.width === 390) {
        const card = await guide.locator('.guide-card').boundingBox();
        const consoleWindow = await page.locator('#window-terminal').boundingBox();
        assert.ok(card.y + card.height <= consoleWindow.y, 'Mobile coach must not cover terminal output or input');
        await guide.locator('[data-guide="query"]').click();
        const transcript = await page.locator('.console-output').boundingBox();
        const tableHeader = await page.locator('.console-output .console-line').filter({ hasText: /^PID\s+PPID\s+STATE/ }).last().boundingBox();
        assert.ok(tableHeader.y >= transcript.y && tableHeader.y + tableHeader.height <= transcript.y + transcript.height, 'The mobile ps table header must actually be visible');
        await page.screenshot({ path: 'output/playwright/guide-console-mobile.png' });
      }
      if (i === 1 && viewport.width === 390) await page.screenshot({ path: 'output/playwright/guide-mobile.png' });
      await next.click();
    }
    await guide.waitFor({ state: 'hidden' });
    await echoState('left');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#btn-guide').click();
  await page.keyboard.press('Escape');
  await guide.waitFor({ state: 'hidden' });
  outcomes.push('all guide cards remain within mobile and short viewports; reduced motion preserves navigation');

  const privatePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  privatePage.on('pageerror', error => errors.push(error.message));
  await privatePage.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', { value: () => { throw new DOMException('Unavailable', 'SecurityError'); } });
    Object.defineProperty(Storage.prototype, 'setItem', { value: () => { throw new DOMException('Unavailable', 'SecurityError'); } });
  });
  await privatePage.goto(url);
  await privatePage.locator('#guide-layer').waitFor({ state: 'visible' });
  await privatePage.locator('[data-guide="skip"]').click();
  await privatePage.locator('#guide-layer').waitFor({ state: 'hidden' });
  await privatePage.locator('#btn-guide').click();
  await privatePage.locator('#guide-layer').waitFor({ state: 'visible' });
  await privatePage.close();
  outcomes.push('unavailable browser storage does not prevent skipping or reopening the guide');
  assert.deepEqual(errors, []);
  const report = { url, passed: outcomes.length, outcomes, pageErrors: errors, limitations: ['Agent and browser walkthroughs are not human enjoyment testing.'] };
  await writeFile('output/playwright/first-run-results.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) { console.error(error); process.exitCode = 1; }
finally { await browser.close(); }
