import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('output/playwright', { recursive: true });
const url = new URL('/haunt.html', process.env.HAUNT_BASE_URL ?? 'http://127.0.0.1:5174').href;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const outcomes = [], errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 }, reducedMotion: 'no-preference' });
  await page.addInitScript(() => localStorage.setItem('haunt.guide.v1', 'dismissed'));
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('#btn-echo').click();
  const scene = page.locator('.echo-scene-container');
  const prop = scene.locator('.farewell-prop');
  const action = name => scene.locator(`[data-action="${name}"]`);
  const state = expected => page.waitForFunction(value => document.querySelector('.echo-scene-container')?.dataset.state === value, expected);
  const phase = expected => page.waitForFunction(value => document.querySelector('.echo-scene-container')?.dataset.phase === value, expected);
  const position = () => prop.evaluate(el => ({ x: parseFloat(el.style.left) * 6.4, y: parseFloat(el.style.top) * 4.1 }));
  const place = async (x, y) => {
    await scene.locator('.prop-header').scrollIntoViewIfNeeded();
    const header = await scene.locator('.prop-header').boundingBox();
    const board = await scene.locator('.echo-board-wrap').boundingBox();
    const panel = await prop.boundingBox();
    const offsetX = header.x + header.width / 2 - panel.x;
    const offsetY = header.y + header.height / 2 - panel.y;
    await page.mouse.move(panel.x + offsetX, panel.y + offsetY);
    await page.mouse.down();
    await page.mouse.move(board.x + x * board.width / 640 + offsetX, board.y + y * board.height / 410 + offsetY, { steps: 5 });
    await page.mouse.up();
  };
  const aligned = async () => {
    if (await scene.locator('#echo-help').isHidden()) await action('help').click();
    await action('align').click();
    await action('help').click();
  };
  const actorPose = () => scene.locator('.public-footage .actor').evaluateAll(elements => elements.map(el => ({ transform: getComputedStyle(el).transform, opacity: getComputedStyle(el).opacity })));

  await state('editing');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'output/playwright/echo-edit-desktop.png' });
  await action('rehearse').click();
  await state('failed');
  assert.match(await scene.locator('.echo-status').textContent(), /self-view is still exposed/);
  assert.equal(await scene.locator('#echo').evaluate(el => getComputedStyle(el).opacity), '0');
  assert.ok(await action('rehearse').isDisabled());
  await action('edit').click();
  outcomes.push('exposed self-view: explicit failure, no appearance, Edit required');

  await place(451, 70);
  assert.ok(Math.abs((await position()).x - 451) < .01);
  await action('rehearse').click();
  await state('failed');
  assert.match(await scene.locator('[data-private]').textContent(), /exposed/);
  await action('edit').click();
  await place(440, 60);
  assert.match(await scene.locator('[data-private]').textContent(), /covered/);
  const geometry = await scene.evaluate(el => {
    const p = el.querySelector('.farewell-prop').getBoundingClientRect();
    const v = el.querySelector('.private-footage').getBoundingClientRect();
    const s = el.querySelector('.public-footage').getBoundingClientRect();
    return { covered: p.left <= v.left && p.top <= v.top && p.right >= v.right && p.bottom >= v.bottom, clear: p.left >= s.right || p.right <= s.left || p.top >= s.bottom || p.bottom <= s.top };
  });
  assert.deepEqual(geometry, { covered: true, clear: true });
  await prop.focus();
  await page.keyboard.press('Shift+ArrowRight');
  assert.ok(Math.abs((await position()).x - 442) < .01);
  await scene.getByRole('button', { name: 'Move left', exact: true }).click();
  assert.ok(Math.abs((await position()).x - 432) < .01);
  outcomes.push('real pointer drag, fine keyboard and click controls share geometry; one-unit gap rejected');

  await place(200, 100);
  await action('rehearse').click();
  await state('failed');
  assert.match(await scene.locator('.echo-status').textContent(), /blocks the public stage/);
  await action('edit').click();
  await aligned();
  await action('rehearse').click();
  await state('performing');
  assert.ok(await scene.locator('select').isDisabled());
  assert.ok(await scene.getByRole('button', { name: 'Move left', exact: true }).isDisabled());
  await state('complete');
  const collapse = await actorPose();
  assert.equal(collapse[1].opacity, '1');
  assert.match(await scene.locator('.echo-caption').textContent(), /That worked/);
  await page.screenshot({ path: 'output/playwright/echo-collapse-desktop.png' });
  await action('edit').click();
  await scene.locator('select').selectOption('scare');
  await action('rehearse').click();
  await state('complete');
  const scare = await actorPose();
  assert.match(await page.locator('.desktop-task').textContent(), /Both host reactions rehearsed/);
  assert.notDeepEqual(scare, collapse);
  assert.match(await scene.locator('.echo-caption').textContent(), /supposed to be scared/);
  await page.screenshot({ path: 'output/playwright/echo-scare-desktop.png' });
  outcomes.push('public obstruction rejected; both host choices produce distinct actor poses and narrative responses');

  for (const checkpoint of ['appearance', 'host-reaction', 'echo-response']) {
    await action('edit').click();
    await action('rehearse').click();
    await phase(checkpoint);
    await action('leave').evaluate(el => el.click());
    await state('left');
    await page.waitForTimeout(750);
    assert.equal(await scene.getAttribute('data-state'), 'left');
    assert.equal(await scene.locator('#echo').evaluate(el => getComputedStyle(el).opacity), '0');
  }
  outcomes.push('Leave interrupts each of the three phases; no delayed appearance or completion');

  await action('edit').click();
  const preserved = await position();
  await action('rehearse').click();
  await phase('host-reaction');
  await page.locator('#window-echo [aria-label="Minimize"]').evaluate(el => el.click());
  await state('paused');
  await page.locator('#btn-echo').click();
  await page.waitForTimeout(800);
  assert.equal(await scene.getAttribute('data-state'), 'paused');
  assert.deepEqual(await position(), preserved);
  await action('resume').click();
  await state('complete');
  outcomes.push('minimize pauses at checkpoint; restoring does not silently resume; explicit Resume completes');

  await action('edit').click();
  await action('rehearse').click();
  await page.locator('#window-echo [aria-label="Close"]').evaluate(el => el.click());
  await page.locator('#window-echo').waitFor({ state: 'detached' });
  await page.locator('#btn-echo').click();
  await state('editing');
  const fresh = await position();
  assert.ok(Math.abs(fresh.x - 430) < .01 && Math.abs(fresh.y - 240) < .01);
  await page.waitForTimeout(750);
  assert.equal(await scene.getAttribute('data-state'), 'editing');
  outcomes.push('close disposes the old scene; reopen starts fresh with no stale completion');

  await aligned();
  await action('rehearse').click();
  // Deterministic handler test: headless Chrome keeps pages visible despite tab focus.
  // This does not claim an observed operating-system background-tab transition.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await state('paused');
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(750);
  assert.equal(await scene.getAttribute('data-state'), 'paused');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(200);
  assert.equal(await scene.getAttribute('data-state'), 'paused');
  await action('edit').click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  outcomes.push('simulated visibility event pauses; visible return and live reduced motion cannot silently complete a paused run');

  await aligned();
  await action('rehearse').click();
  await phase('host-reaction');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await state('complete');
  assert.equal(await scene.locator('#host').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
  await action('edit').click();
  await action('rehearse').click();
  await action('leave').evaluate(el => el.click());
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(750);
  assert.equal(await scene.getAttribute('data-state'), 'left');
  outcomes.push('live reduced-motion uses stable poses and cannot revive a departed run');

  await action('edit').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await place(440, 60);
  assert.match(await scene.locator('[data-private]').textContent(), /covered/);
  const mobile = await position();
  assert.ok(Math.abs(mobile.x - 440) < .01 && Math.abs(mobile.y - 60) < .01);
  await action('rehearse').click();
  await state('complete');
  await page.screenshot({ path: 'output/playwright/echo-mobile.png' });
  await page.setViewportSize({ width: 800, height: 450 });
  await action('edit').click();
  await scene.locator('select').selectOption('scare');
  await action('rehearse').click();
  await state('complete');
  assert.equal(await scene.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
  outcomes.push('390px pointer placement retains logical coordinates; controls reachable on mobile and short screens');
  assert.deepEqual(errors, []);
  const report = { url, passed: outcomes.length, outcomes, pageErrors: errors, limitations: ['Visibility coverage uses a simulated document.hidden event, not an observed real background-tab transition.', 'Automated checks do not validate enjoyment or competition quality.'] };
  await writeFile('output/playwright/echo-results.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) { console.error(error); process.exitCode = 1; }
finally { await browser.close(); }
