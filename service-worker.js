const CACHE_NAME='h2h-coach-cloud-v215h';
const CORE=['./','./index.html','./styles.css?v=215h','./config.js?v=215h','./app.js?v=215h','./cloud.js?v=215h','./manifest.webmanifest'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
      .then(async()=>{
        const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
        for(const client of clients) client.postMessage({type:'APP_UPDATED',version:'2.1.5h'});
      })
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  const same=url.origin===self.location.origin;

  if(!same)return;

  const coreText=req.mode==='navigate' ||
    url.pathname.endsWith('/index.html') ||
    /\.(?:js|css|webmanifest)$/.test(url.pathname);

  if(coreText){
    event.respondWith(
      fetch(req,{cache:'no-store'}).then(resp=>{
        if(resp && resp.ok){
          const copy=resp.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
        }
        return resp;
      }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>cached||fetch(req).then(resp=>{
      if(resp && resp.ok){
        const copy=resp.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
      }
      return resp;
    }))
  );
});
