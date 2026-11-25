const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');

test('interrupted update, open-tab refresh, offline activation and rollback preserve state', async ({ page, context }) => {
  const worker = await readFile('service-worker.js', 'utf8');
  const app = await readFile('index.html', 'utf8');
  const base = 'b32cb3a9599120179fd5dd08fd716bacc616b397';
  const baseWorker = execFileSync('git', ['show', base + ':service-worker.js'], { encoding: 'utf8' });
  const baseApp = execFileSync('git', ['show', base + ':index.html'], { encoding: 'utf8' });
  let release = 'baseline';
  let interrupted = false;
  let disconnected = false;
  const server = createServer(async (req, res) => {
    if (disconnected) {
      req.socket.destroy();
      return;
    }
    const path = new URL(req.url, 'http://localhost').pathname;
    try {
      if (interrupted && path === '/icon-192.png') {
        res.writeHead(503).end();
      } else if (path === '/service-worker.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-store' })
          .end(release === 'baseline' ? baseWorker : worker.replace(" + 'v2.9.1'", " + '" + release + "'"));
      } else if (path === '/' || path === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' })
          .end((release === 'candidate' ? app : baseApp).replace('</head>', '<meta name="test-release" content="' + release + '"></head>'));
      } else {
        const mime = path.endsWith('.json') ? 'application/json' : 'image/png';
        const bytes = await readFile(resolve('.' + path));
        res.writeHead(200, { 'Content-Type': mime }).end(bytes);
      }
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;
  const stateKey = 'funbots_morning_timer_v29_stable';
  const version = p => p.locator('meta[name="test-release"]');
  const update = p => p.evaluate(async () => (await navigator.serviceWorker.ready).update().then(() => undefined));
  try {
    await page.goto(url);
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.locator('.icon-item').first().click();
    await page.evaluate(() => caches.open('unrelated-app-cache').then(() => undefined));

    release = 'candidate';
    interrupted = true;
    await update(page);
    await page.waitForFunction(async () => {
      const reg = await navigator.serviceWorker.ready;
      return !reg.installing && !reg.waiting;
    });
    await page.reload();
    await expect(version(page)).toHaveAttribute('content', 'baseline');
    await expect(page.locator('.icon-item').first()).toHaveClass(/checked/);

    interrupted = false;
    await update(page);
    await page.waitForFunction(async () => !!(await navigator.serviceWorker.ready).waiting);
    const second = await context.newPage();
    await second.goto(url);
    await expect(version(second)).toHaveAttribute('content', 'baseline');
    await page.reload();
    await expect(version(page)).toHaveAttribute('content', 'baseline');
    await second.close();
    await page.close();

    const candidate = await context.newPage();
    await candidate.goto(url);
    await expect(version(candidate)).toHaveAttribute('content', 'candidate');
    await candidate.waitForFunction(() => !!navigator.serviceWorker.controller);
    disconnected = true;
    await candidate.reload();
    await expect(version(candidate)).toHaveAttribute('content', 'candidate');
    await expect(candidate.locator('.icon-item').first()).toHaveClass(/checked/);
    expect(await candidate.evaluate(() => caches.has('unrelated-app-cache'))).toBe(true);

    disconnected = false;
    release = 'rollback';
    await update(candidate);
    await candidate.waitForFunction(async () => !!(await navigator.serviceWorker.ready).waiting);
    await candidate.close();
    const rollback = await context.newPage();
    await rollback.goto(url);
    await expect(version(rollback)).toHaveAttribute('content', 'rollback');
    expect(await rollback.evaluate(key => JSON.parse(localStorage.getItem(key)).tasks['task-0'], stateKey)).toBe(true);
    expect(await rollback.evaluate(() => caches.has('unrelated-app-cache'))).toBe(true);
    await rollback.close();
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
