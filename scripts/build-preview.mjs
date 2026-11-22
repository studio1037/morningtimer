// Static preview package for Cloudflare Pages.
// Intentionally copies only user-facing assets; never publishes repo docs, QA, or ZIP archives.
import { mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const out = 'dist';
const assets = [
  'index.html',
  'service-worker.js',
  'manifest.json',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'maskable-icon-512.png',
  'og-preview-1200x630.png',
  'install-card-ru-1080.png',
  'install-card-en-1080.png',
  'install-card-he-1080.png'
];
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const file of assets) copyFileSync(file, join(out, file));
writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
writeFileSync(join(out, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n');
console.log('Prepared isolated static preview dist/ with ' + assets.length + ' application assets.');
