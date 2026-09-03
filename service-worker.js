// 3.0.0 legacy-worker recovery bridge. Fresh pages never register this worker.
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => /^(h2h-coach-|kickbase)/i.test(k)).map(k => caches.delete(k)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    await self.registration.unregister();
    for (const client of clients) {
      try {
        const url = new URL(client.url);
        if (url.searchParams.get('h2hFresh') === '300statecore4') continue;
        url.searchParams.set('h2hFresh', '300statecore4');
        await client.navigate(url.href);
      } catch (_) {}
    }
  })());
});
// No fetch handler. No APP_UPDATED messages. No recurring reloads.
