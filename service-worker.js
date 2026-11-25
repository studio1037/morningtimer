// Bump the release whenever the offline package changes, including on rollback.
const CACHE_PREFIX = 'funbots-morning-timer:' + self.registration.scope + ':';
const CACHE_NAME = CACHE_PREFIX + 'v2.9.1';
const ASSETS = [
  './', './index.html', './manifest.json', './apple-touch-icon.png',
  './icon-192.png', './icon-512.png', './maskable-icon-512.png',
  './og-preview-1200x630.png', './install-card-ru-1080.png',
  './install-card-en-1080.png', './install-card-he-1080.png'
];
const assetUrls = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache =>
    cache.addAll(ASSETS.map(path => new Request(new URL(path, self.registration.scope), {
      cache: 'reload'
    })))
  ));
  // The browser activates the complete package after the previous clients close.
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key))
  )));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  const url = new URL(request.url);
  url.search = '';
  const navigation = request.mode === 'navigate';
  if (!navigation && !assetUrls.has(url.href)) return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const cached = await cache.match(url.href);
    if (cached) return cached;
    try {
      return await fetch(request);
    } catch (error) {
      if (navigation) {
        const fallback = await cache.match(new URL('./index.html', self.registration.scope));
        if (fallback) return fallback;
      }
      throw error;
    }
  }));
});
