const CACHE_NAME='h2h-coach-cloud-v230dev11_5';
const CORE=[
  './',
  './index.html',
  './styles.css?v=215n',
  './config.js?v=215n',
  './app.js?v=215n',
  './cloud.js?v=230dev6',
  './phase230.js?v=230dev11_5',
  './phase230-dev1.js?v=230dev1',
  './phase230-dev2.js?v=230dev2',
  './phase230-dev3.js?v=230dev3',
  './phase230-dev4.js?v=230dev4',
  './phase230-dev5.js?v=230dev5',
  './phase230-dev6.js?v=230dev6',
  './phase230-dev7.js?v=230dev7',
  './phase230-dev8.js?v=230dev8_2',
  './phase230-dev9.js?v=230dev9',
  './phase230-dev10.js?v=230dev10_3',
  './phase230-dev11.js?v=230dev11_5',
  './manifest.webmanifest'
];

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
        for(const client of clients) client.postMessage({type:'APP_UPDATED',version:'2.3.0-test-dev11.5'});
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
