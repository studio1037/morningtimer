const { test, expect } = require('@playwright/test');
const timer = (page, stage) => page.locator('[data-timer]').nth(stage);
const task = (page, index) => page.locator('.icon-item').nth(index);
async function complete(page, stage) {
  for (let i = stage * 3; i < stage * 3 + 3; i++) await task(page, i).click();
}
// Use the supported service prompt rather than altering application state.
async function enableTurbo(page) {
  const handler = d => d.accept(d.type() === 'prompt' ? '684100' : undefined);
  page.on('dialog', handler);
  await page.locator('#resetButton').click();
  page.off('dialog', handler);
  await expect(timer(page, 0)).toHaveText('00:09');
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-01T08:00:00Z') });
  await page.goto('/');
});

test('checkboxes complete a stage and accumulate savings once', async ({ page }) => {
  await task(page, 0).click();
  await expect(task(page, 0)).toHaveClass(/checked/);
  await task(page, 0).click();
  await expect(task(page, 0)).not.toHaveClass(/checked/);
  await complete(page, 0);
  await expect(page.locator('.stage').nth(0)).toHaveClass(/completed-stage/);
  await expect(page.locator('.stage').nth(1)).toHaveClass(/active/);
  await expect(page.locator('#savingsPill')).toHaveText('🏆 Копилка +15:00');
  await complete(page, 1);
  await expect(page.locator('#savingsPill')).toHaveText('🏆 Копилка +30:00');
});

test('completed-stage checkbox can reopen without duplicate savings', async ({ page }) => {
  await complete(page, 0);
  await task(page, 0).click();
  await expect(task(page, 0)).not.toHaveClass(/checked/);
  await expect(page.locator('.stage').nth(1)).toHaveClass(/active/);
  await task(page, 0).click();
  await expect(page.locator('#savingsPill')).toHaveText('🏆 Копилка +15:00');
});

test('automatic timeout advances without checking unfinished tasks', async ({ page }) => {
  await enableTurbo(page);
  await task(page, 0).click();
  await page.clock.runFor(9000);
  await expect(timer(page, 0)).toHaveText('00:00');
  await expect(page.locator('.stage').nth(1)).toHaveClass(/active/);
  await expect(page.locator('.icon-item.checked')).toHaveCount(1);
  await expect(page.locator('#exitScreen')).not.toHaveClass(/visible/);
});

test('Bank depletes after final timeout and becomes Late', async ({ page }) => {
  await enableTurbo(page);
  await complete(page, 0);
  await complete(page, 1);
  await complete(page, 2);
  await expect(page.locator('#savingsPill')).toHaveText(/00:27/);
  await page.clock.runFor(9000);
  await page.clock.runFor(1000);
  await expect(page.locator('#savingsPill')).toHaveText(/00:26/);
  await page.clock.runFor(27000);
  await expect(page.locator('#savingsPill')).toHaveClass(/late/);
  await expect(page.locator('#exitScreen')).not.toHaveClass(/visible/);
});

for (const [language, direction] of [['en', 'ltr'], ['ru', 'ltr'], ['he', 'rtl']]) {
  test(`language ${language} persists with ${direction} direction`, async ({ page }) => {
    page.on('dialog', d => d.accept());
    await page.locator('#settingsButton').click();
    await page.locator(`[data-lang="${language}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('html')).toHaveAttribute('dir', direction);
    await expect(page.locator('#settingsScreen [data-i="settings"]')).toHaveText(
      { en: 'Settings', ru: 'Настройки', he: 'הגדרות' }[language]);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('html')).toHaveAttribute('dir', direction);
  });
}

test('reload preserves checkbox and current timer snapshot', async ({ page }) => {
  await task(page, 0).click();
  await page.clock.runFor(5000);
  await expect(timer(page, 0)).toHaveText('14:55');
  await page.reload();
  await expect(task(page, 0)).toHaveClass(/checked/);
  await expect(timer(page, 0)).toHaveText('14:55');
});

test('installed PWA reloads offline with cached assets', async ({ page, context }) => {
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const assets = await page.evaluate(async () => {
    const cache = await caches.open('funbots-morning-timer-v24a8-visible-bank-countdown');
    return (await cache.keys()).map(r => new URL(r.url).pathname);
  });
  expect(assets).toContain('/index.html');
  expect(assets).toContain('/icon-192.png');
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.icon-item')).toHaveCount(12);
  await task(page, 0).click();
  await expect(task(page, 0)).toHaveClass(/checked/);
  const image = await page.evaluate(async () => {
    const response = await fetch('./icon-192.png');
    return { ok: response.ok, type: response.headers.get('content-type') };
  });
  expect(image).toEqual({ ok: true, type: 'image/png' });
});

// Expected failures assert desired recovery, not the current defective output.
// Playwright reports unexpected passes as failures, so fixes require review.
test('suspension consumes elapsed time across stages @known-defect', async ({ page }) => {
  await enableTurbo(page);
  await task(page, 0).click();
  await page.clock.fastForward(20000);
  test.fail(true, 'sync() discards elapsed overflow after one stage');
  await expect(timer(page, 1)).toHaveText('00:00', { timeout: 1000 });
  await expect(timer(page, 2)).toHaveText('00:07');
});

test('visibility resume accounts for suspended time @known-defect', async ({ page }) => {
  await task(page, 0).click();
  await page.clock.setSystemTime(new Date('2026-11-01T08:01:00Z'));
  // Deterministic lifecycle-handler regression; not a real OS suspension.
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  test.fail(true, 'visibilitychange resets lastTime before syncing');
  await expect(timer(page, 0)).toHaveText('14:00', { timeout: 1000 });
});

test('reload recovers time elapsed since saved snapshot @known-defect', async ({ page }) => {
  await task(page, 0).click();
  await page.clock.runFor(5000);
  await page.clock.setSystemTime(new Date('2026-11-01T08:01:05Z'));
  await page.reload();
  test.fail(true, 'load() restores remaining time without elapsed recovery');
  await expect(timer(page, 0)).toHaveText('13:55', { timeout: 1000 });
});
