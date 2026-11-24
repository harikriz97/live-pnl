const N = 'v8', F = ['./', 'app.css', 'app.js', 'manifest.webmanifest', 'brand.png', 'fi-192.png', 'fi-512.png', 'n-entry.png', 'n-target.png', 'n-stop.png', 'n-exit.png', 'n-info.png', 'n-problem.png', 'badge.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(N).then(c => c.addAll(F)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { if(r.ok){ const k = r.clone(); e.waitUntil(caches.open(N).then(c => c.put(e.request, k))); } return r; }).catch(() => caches.open(N).then(c => c.match(e.request, {ignoreSearch: true}))));
});

self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch(x){}
  const k = ['entry', 'target', 'stop', 'exit', 'info', 'problem'].includes(d.kind) ? d.kind : 'info', t = {kind: k, title: String(d.title || 'Update').slice(0, 90), body: String(d.body || '').slice(0, 160)};
  e.waitUntil(clients.matchAll({type: 'window', includeUncontrolled: true}).then(async l => {
    const open = l.filter(c => c.visibilityState === 'visible'); let played = false;
    if(open.length) played = await Promise.race([Promise.any(open.map(c => new Promise((ok, no) => { const m = new MessageChannel(); m.port1.onmessage = x => x.data ? ok(true) : no(); c.postMessage({alert: t}, [m.port2]); }))).catch(() => false), new Promise(r => setTimeout(() => r(false), 600))]);
    return self.registration.showNotification(t.title, {body: t.body, icon: 'n-' + k + '.png', badge: 'badge.png', tag: String(d.tag || Date.now()), renotify: true, silent: played, timestamp: Date.now(),
      vibrate: played ? undefined : k === 'stop' ? [250, 90, 250] : k === 'target' ? [70, 50, 70, 50, 200] : [150]});
  }));
});
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(clients.matchAll({type: 'window', includeUncontrolled: true}).then(l => l.length ? l[0].focus() : clients.openWindow('./'))); });
