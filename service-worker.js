const CACHE_NAME = 'h2h-coach-cloud-v206';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './cloud.js',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(async () => {
        const clients = await self.clients.matchAll({type:'window', includeUncontrolled:true});
        for (const client of clients) client.postMessage({type:'APP_UPDATED', version:'2.0.6'});
      })
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (req.mode === 'navigate' || (sameOrigin && url.pathname.endsWith('/index.html'))) {
    event.respondWith(
      fetch(req, {cache:'no-store'})
        .then(response => {
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
          return response;
        })
        .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  if (sameOrigin && /\.(?:js|css|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(cached=>{
        const network=fetch(req,{cache:'no-store'}).then(response=>{
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
          return response;
        }).catch(()=>cached);
        return cached||network;
      })
    );
    return;
  }

  if (sameOrigin) {
    event.respondWith(
      caches.match(req).then(cached=>cached||fetch(req).then(response=>{
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
        return response;
      }))
    );
  }
});
