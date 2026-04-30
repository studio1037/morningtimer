const CACHE_NAME="funbots-morning-timer-v24a8-visible-bank-countdown";
const ASSETS=["./","./index.html","./manifest.json","./apple-touch-icon.png","./icon-192.png","./icon-512.png","./maskable-icon-512.png","./og-preview-1200x630.png","./install-card-ru-1080.png","./install-card-en-1080.png","./install-card-he-1080.png"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(key=>key===CACHE_NAME?null:caches.delete(key)))));self.clients.claim();});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match("./index.html"))));});
