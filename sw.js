// Offline support: open instantly from the phone's cache, fetch the newest version in the background,
// and tell the page when a new version has arrived so it can offer a reload.
const CACHE = 'liftbook-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const fresh = caches.open(CACHE).then(async cache => {
    try {
      const res = await fetch(req, {cache: 'no-cache'});
      if (res.ok) {
        const old = req.mode === 'navigate' ? await cache.match(req, {ignoreSearch: true}) : null;
        const changed = old && (await old.text()) !== (await res.clone().text());
        await cache.put(req, res.clone());
        if (changed) (await self.clients.matchAll({type: 'window'})).forEach(c => c.postMessage('updated'));
      }
      return res;
    } catch (err) { return null; }
  });
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fresh.then(r => r || Response.error())));
  e.waitUntil(fresh);
});
