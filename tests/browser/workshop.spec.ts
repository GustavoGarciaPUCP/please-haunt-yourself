import { expect, test, type Page } from '@playwright/test';

async function dismissOpening(page: Page): Promise<void> {
  const opening = page.locator('[data-opening-overlay]');
  await expect(opening).toBeVisible();
  await opening.getByRole('button', { name: /^(Skip|Continue|Omitir|Continuar)$/ }).click();
}

async function keyboardConstruction(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter the workshop', exact: true }).click();
  await dismissOpening(page);
  await expect(page.locator('[data-home-aperture]')).toBeVisible();
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
  await expect(page.locator('[data-home-aperture]')).not.toBeVisible();
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
  await expect(page.locator('[data-carry-grip]')).toBeVisible();
  await page.screenshot({ path: 'test-results/workshop-final.png', fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The way was yours to make.' })).toBeVisible();
  await page.getByRole('button', { name: 'Look at your construction' }).click();
  const lamp = page.getByRole('slider', { name: 'Lamp carriage', exact: true });
  await lamp.focus(); await page.keyboard.press('End');
  await expect(lamp).toHaveAttribute('aria-valuenow', '650');
  await expect(page.getByRole('status')).toContainText('lost its support');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('[data-home-aperture]')).toBeVisible();
  await expect(page.locator('[data-frame]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('mouse and click placement produce a working route without a preset', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Enter the workshop', exact: true }).click();
  await dismissOpening(page);
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
  await dismissOpening(page);
  await expect(page.getByRole('button', { name: 'Colocar el marco', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/workshop-mobile.png', fullPage: true });
});

test('opening demonstration is skippable, persists introSeen, and focuses lamp', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('checkbox', { name: /reduced motion/i }).uncheck();
  await page.getByRole('button', { name: 'Enter the workshop', exact: true }).click();
  // Opening should be visible
  await expect(page.getByText('Black edges support from above.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip', exact: true })).toBeVisible();
  // Mechanisms should not be interactive during opening
  const lamp = page.getByRole('slider', { name: 'Lamp carriage', exact: true });
  await expect(lamp).toHaveAttribute('tabindex', '-1');
  // Skip the opening
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.getByText('Black edges support from above.')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Try the route', exact: true })).toBeVisible();
  // Lamp should receive focus after skip
  await expect(lamp).toBeFocused();
  // Reload and continue - opening should not replay and lamp should still get focus
  await page.reload();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Black edges support from above.')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Try the route', exact: true })).toBeVisible();
  await expect(lamp).toBeFocused();
});

test('Help during opening finishes safely without replay or auto-trial', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter the workshop', exact: true }).click();
  await expect(page.getByText('Black edges support from above.')).toBeVisible();

  // Open Help during opening
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A few things about this workshop' })).toBeVisible();

  // Close Help - should be in editing phase without opening overlay
  await page.getByRole('button', { name: 'Back to the workshop', exact: true }).click();
  await expect(page.getByText('Black edges support from above.')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Try the route', exact: true })).toBeVisible();

  // Construction should be unchanged
  const lamp = page.getByRole('slider', { name: 'Lamp carriage', exact: true });
  await expect(lamp).toHaveAttribute('aria-valuenow', '500');

  // No auto-trial should have started
  await page.waitForTimeout(300);
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).not.toBeVisible();
});

test('Spanish opening with explicit continue after introSeen does not replay', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ES', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar al taller', exact: true }).click();

  // Should see Spanish opening text
  await expect(page.getByText('Los trazos negros sostienen desde arriba.')).toBeVisible();
  await page.locator('[data-opening-overlay]').getByRole('button', { name: 'Continuar', exact: true }).click();

  // Should complete to editing
  await expect(page.getByRole('button', { name: 'Probar el recorrido', exact: true })).toBeVisible();

  // Reload and continue - no replay
  await page.reload();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByText('Los trazos negros sostienen desde arriba.')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Probar el recorrido', exact: true })).toBeVisible();
});

test('normal motion opening completes naturally with focus transfer', async ({ page }) => {
  await page.goto('/');
  // Ensure reduced motion is off
  await page.getByRole('checkbox', { name: /reduced motion/i }).uncheck();
  await page.getByRole('button', { name: 'Enter the workshop', exact: true }).click();

  // Opening should be visible
  await expect(page.getByText('Black edges support from above.')).toBeVisible();

  // Wait for natural completion (up to 5s)
  await expect(page.getByText('Black edges support from above.')).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Try the route', exact: true })).toBeVisible();

  // Lamp should have focus after natural completion
  const lamp = page.getByRole('slider', { name: 'Lamp carriage', exact: true });
  await expect(lamp).toBeFocused();

  // Configuration unchanged
  await expect(lamp).toHaveAttribute('aria-valuenow', '500');
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
});

test('reduced motion holds contact pose until explicit continue with focus transfer', async ({ page }) => {
  await page.goto('/');
  // Enable reduced motion
  await page.getByRole('checkbox', { name: /reduced motion/i }).check();
  await page.getByRole('button', { name: 'Enter the workshop', exact: true }).click();
  // Opening overlay should appear
  await expect(page.getByText('Black edges support from above.')).toBeVisible();
  // In reduced motion, should see continue button instead of skip
  const opening = page.locator('[data-opening-overlay]');
  const continueButton = opening.getByRole('button', { name: 'Continue', exact: true });
  await expect(continueButton).toBeVisible();
  await expect(opening.getByRole('button', { name: 'Skip', exact: true })).not.toBeVisible();

  // Figure should be at contact pose and stay there well beyond normal duration
  const initialPose = await page.locator('[data-figure]').getAttribute('transform');
  expect(initialPose).toContain('translate(90'); // Should be at x=90 contact position
  const before = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('the-wrong-window.v1')!);
    return { config: save.config, history: save.history };
  });
  await page.screenshot({ path: 'test-results/workshop-opening.png', fullPage: true });

  // Wait 4700ms (beyond normal 4s duration) - pose should NOT change in reduced motion
  await page.waitForTimeout(4700);
  const heldPose = await page.locator('[data-figure]').getAttribute('transform');
  expect(heldPose).toBe(initialPose); // Still at contact pose

  // Continue button should still be visible (no auto-completion)
  await expect(continueButton).toBeVisible();

  // Verify preference control still works
  await page.getByRole('checkbox', { name: /reduced motion/i }).uncheck();
  await expect(page.getByRole('checkbox', { name: /reduced motion/i })).not.toBeChecked();

  // Re-enable and continue
  await page.getByRole('checkbox', { name: /reduced motion/i }).check();
  await continueButton.click();

  // Should complete and transfer focus to lamp
  await expect(page.getByText('Black edges support from above.')).not.toBeVisible();
  const lamp = page.getByRole('slider', { name: 'Lamp carriage', exact: true });
  await expect(lamp).toBeFocused();
  const after = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('the-wrong-window.v1')!);
    return { config: save.config, history: save.history };
  });
  expect(after).toEqual(before);

  // Verify construction and history are unchanged
  await expect(lamp).toHaveAttribute('aria-valuenow', '500'); // Initial lamp position
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled(); // No history
});
