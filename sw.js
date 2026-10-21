// Offline support: open instantly from the phone's cache, fetch the newest version in the background,
// and tell the page when a new version has arrived so it can offer a reload.
const CACHE = 'liftbook-v5';
const FILES = ['./', 'index.html', 'keep-seed.json', 'physio-seed.json', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache, which may still hold the previous version for 10 minutes
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// tapping the rest notification opens the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // the page itself: a real page load, or the app asking for './' to check for a new version
  const isPage = req.mode === 'navigate' || /\/(index\.html)?$/.test(new URL(req.url).pathname);
  const fresh = caches.open(CACHE).then(async cache => {
    try {
      // a page-load request can't be re-issued with options (Chrome throws), so fetch its URL instead
      const res = await fetch(req.mode === 'navigate' ? req.url : req, {cache: 'no-cache'});
      if (res.ok && !res.redirected) {   // a cached redirect would break that URL for good
        const old = isPage ? await cache.match(req, {ignoreSearch: true}) : null;
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
