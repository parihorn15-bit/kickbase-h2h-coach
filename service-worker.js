// 3.0.0: legacy service worker retired.
// The app now uses normal browser HTTP caching plus explicit asset keys.
// This worker exists only to replace older registered workers, clear their
// caches and unregister itself without forcing a page reload.
self.addEventListener('install',event=>{
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>/^h2h-coach-|^kickbase/i.test(key)).map(key=>caches.delete(key)));
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
// Intentionally no fetch interception and no APP_UPDATED/version messages.
