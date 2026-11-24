const N = 'v5', F = ['./', 'app.css', 'app.js', 'manifest.webmanifest', 'brand.png', 'fi-192.png', 'fi-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(N).then(c => c.addAll(F)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { if(r.ok){ const k = r.clone(); e.waitUntil(caches.open(N).then(c => c.put(e.request, k))); } return r; }).catch(() => caches.open(N).then(c => c.match(e.request, {ignoreSearch: true}))));
});
