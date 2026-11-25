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

test('completed-stage reopening removes savings and recompletes without duplication', async ({ page }) => {
  await complete(page, 0);
  await task(page, 0).click();
  await expect(task(page, 0)).not.toHaveClass(/checked/);
  await expect(page.locator('.stage').nth(0)).toHaveClass(/active/);
  await expect(page.locator('#savingsTotal')).not.toHaveClass(/visible/);
  await page.clock.runFor(1000);
  await expect(timer(page, 0)).toHaveText('14:59');
  await task(page, 0).click();
  await expect(page.locator('#savingsPill')).toHaveText('🏆 Копилка +14:59');
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
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const assets = await page.evaluate(async () => {
    const cache = await caches.open('funbots-morning-timer:' + location.origin + '/:v2.9.1');
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

test('suspension consumes elapsed time across stages @recovery', async ({ page }) => {
  await enableTurbo(page);
  await task(page, 0).click();
  await page.clock.fastForward(20000);
  await expect(timer(page, 1)).toHaveText('00:00', { timeout: 1000 });
  await expect(timer(page, 2)).toHaveText('00:07');
});

test('visibility resume accounts for suspended time @recovery', async ({ page }) => {
  await task(page, 0).click();
  await page.clock.setSystemTime(new Date('2026-11-01T08:01:00Z'));
  // Deterministic lifecycle-handler regression; not a real OS suspension.
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(timer(page, 0)).toHaveText('14:00', { timeout: 1000 });
});

test('reload recovers time elapsed since saved snapshot @recovery', async ({ page }) => {
  await task(page, 0).click();
  await page.clock.runFor(5000);
  await page.clock.setSystemTime(new Date('2026-11-01T08:01:05Z'));
  await page.reload();
  await expect(timer(page, 0)).toHaveText('13:55', { timeout: 1000 });
});

// Confirmed against the exact user-supplied v2.9 Stable artifact.
test('unchecking a completed stage resumes its timer @v29-contract', async ({ page }) => {
  await complete(page, 0);
  await expect(page.locator('.stage').nth(1)).toHaveClass(/active/);
  await task(page, 0).click();
  await expect(task(page, 0)).not.toHaveClass(/checked/);
  await expect(page.locator('.stage').nth(0)).toHaveClass(/active/, { timeout: 1000 });
  await page.clock.runFor(1000);
  await expect(timer(page, 0)).toHaveText('14:59');
});

const stateKey = 'funbots_morning_timer_v29_stable';
const legacyKey = 'funbots_morning_timer_v24a8_flat';

for (const [name, legacy, language, checked, time] of [
  ['valid', { language: 'he', tasks: { 'task-0': true }, active: 0, stages: [{ remaining: 600 }] }, 'he', true, '10:00'],
  ['partial', { language: 'en', tasks: { 'task-0': 42 }, stages: [null], active: 99 }, 'en', false, '15:00'],
  ['corrupt', '{broken', 'ru', false, '15:00'],
]) {
  test(`legacy migration handles ${name} state and preserves the source`, async ({ page }) => {
    const raw = typeof legacy === 'string' ? legacy : JSON.stringify(legacy);
    await page.addInitScript(({ stateKey, legacyKey, raw }) => {
      if (sessionStorage.getItem("migration-fixture")) return;
      sessionStorage.setItem("migration-fixture", "seeded");
      localStorage.removeItem(stateKey);
      localStorage.setItem(legacyKey, raw);
    }, { stateKey, legacyKey, raw });
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(timer(page, 0)).toHaveText(time);
    expect(await task(page, 0).evaluate(el => el.classList.contains('checked'))).toBe(checked);
    expect(await page.evaluate(key => localStorage.getItem(key), legacyKey)).toBe(raw);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).stateVersion, stateKey)).toBe(1);
    await page.evaluate(key => {
      localStorage.setItem(key, JSON.stringify({ language: 'ru', tasks: {} }));
    }, legacyKey);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    expect(await task(page, 0).evaluate(el => el.classList.contains('checked'))).toBe(checked);
  });
}

test('clock rollback does not recredit time and counting resumes immediately @recovery', async ({ page }) => {
  await task(page, 0).click();
  await page.clock.runFor(5000);
  await expect(timer(page, 0)).toHaveText('14:55');
  await page.clock.setSystemTime(new Date('2026-11-01T07:55:00Z'));
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
  await expect(timer(page, 0)).toHaveText('14:55');
  await page.clock.runFor(2000);
  await expect(timer(page, 0)).toHaveText('14:53');
});

test('final timeout during suspension includes the overflow in Bank and Late @recovery', async ({ page }) => {
  await enableTurbo(page);
  await complete(page, 0);
  await complete(page, 1);
  await complete(page, 2);
  await page.clock.fastForward(40000);
  const snapshot = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), stateKey);
  const before = await snapshot();
  const bank = before.stageSaved.reduce((total, value) => total + value, 0);
  const late = (before.syncedAt - before.finalStageEndedAt) / 1000 - bank;
  expect(late).toBeGreaterThanOrEqual(4);
  expect(late).toBeLessThan(5);
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
  expect((await snapshot()).finalStageEndedAt).toBe(before.finalStageEndedAt);
});
