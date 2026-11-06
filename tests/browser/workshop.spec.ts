import { expect, test, type Page } from '@playwright/test';

async function keyboardConstruction(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter the workshop', exact: true }).click();
  const cutout = page.getByRole('slider', { name: 'Paper pivot', exact: true });
  await cutout.focus(); await page.keyboard.press('Home');
  const lamp = page.getByRole('slider', { name: 'Lamp carriage', exact: true });
  await lamp.focus();
  for (let n = 0; n < 15; n++) await page.keyboard.press('ArrowRight');
  await expect(lamp).toBeFocused();
  await expect(lamp).toHaveAttribute('aria-valuenow', '650');
  const frame = page.getByRole('button', { name: /^Movable frame/ });
  await frame.focus(); await page.keyboard.press('Enter');
  for (let n = 0; n < 105; n++) await page.keyboard.press('ArrowRight');
  for (let n = 0; n < 16; n++) await page.keyboard.press('ArrowUp');
  await expect(frame).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Try the route', exact: true })).toBeEnabled();
}

async function svgPoint(page: Page, selector: string, x: number, y: number): Promise<{ x: number; y: number }> {
  return page.locator(selector).evaluate((element, point) => {
    const matrix = (element as SVGSVGElement).getScreenCTM();
    if (!matrix) throw new Error('SVG is not visible');
    const converted = new DOMPoint(point.x, point.y).matrixTransform(matrix);
    return { x: converted.x, y: converted.y };
  }, { x, y });
}

test('keyboard construction, safe rejection, final reload and review', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await keyboardConstruction(page);
  await page.getByRole('button', { name: 'Try the route', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The way was yours to make.' })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-frame]')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/workshop-final.png', fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The way was yours to make.' })).toBeVisible();
  await page.getByRole('button', { name: 'Look at your construction' }).click();
  const lamp = page.getByRole('slider', { name: 'Lamp carriage', exact: true });
  await lamp.focus(); await page.keyboard.press('End');
  await expect(lamp).toHaveAttribute('aria-valuenow', '650');
  await expect(page.getByRole('status')).toContainText('lost its support');
  expect(errors).toEqual([]);
});

test('mouse and click placement produce a working route without a preset', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Enter the workshop', exact: true }).click();
  const cutout = await svgPoint(page, '[data-cutout-svg]', 190, 124);
  await page.mouse.click(cutout.x, cutout.y);
  const lamp = await svgPoint(page, '[data-lamp-svg]', 260, 134); // lamp 700
  await page.mouse.click(lamp.x, lamp.y);
  await page.getByRole('button', { name: 'Place frame', exact: true }).click();
  const target = await svgPoint(page, '[data-stage]', 985, 660 - 250);
  await page.mouse.move(target.x, target.y); await page.mouse.click(target.x, target.y);
  await page.getByRole('button', { name: 'Try the route', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The way was yours to make.' })).toBeVisible({ timeout: 10000 });
});

test('pause and help do not resume the route automatically', async ({ page }) => {
  await keyboardConstruction(page);
  await page.getByRole('button', { name: 'Try the route', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const pose = await page.locator('[data-figure]').getAttribute('transform');
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await page.getByRole('button', { name: 'Back to the workshop', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continue walking', exact: true })).toBeVisible();
  await page.waitForTimeout(150);
  await expect(page.locator('[data-figure]')).toHaveAttribute('transform', pose!);
});

test('Spanish cover and a narrow viewport keep controls usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/'); await page.getByRole('button', { name: 'ES', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'La ventana equivocada', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Entrar al taller', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Colocar el marco', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/workshop-mobile.png', fullPage: true });
});
