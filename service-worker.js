importScripts('./version.js?v=canonical2');

const RELEASE=self.H2H_RELEASE;
if(!RELEASE?.version||!RELEASE?.assetKey||!RELEASE?.cacheName){
  throw new Error('Canonical H2H release metadata missing in service worker.');
}
const APP_VERSION=RELEASE.version;
const ASSET_KEY=RELEASE.assetKey;
const CACHE_NAME=RELEASE.cacheName;
const CORE=[
  './','./index.html',`./styles.css?v=${ASSET_KEY}`,`./phase230-mobile.css?v=${ASSET_KEY}`,
  `./config.js?v=${ASSET_KEY}`,`./app.js?v=${ASSET_KEY}`,`./cloud.js?v=${ASSET_KEY}`,
  `./phase230.js?v=${ASSET_KEY}`,'./manifest.webmanifest'
];

function upgradeHtml(html){
  html=html.replace(/<title>[^<]*<\/title>/,`<title>Kickbase H2H Coach ${APP_VERSION}</title>`);
  html=html.replace(/<small>Version [^<]*<\/small>/,`<small>Version ${APP_VERSION} · Cloud-Schreiben AKTIV · 2026/27</small>`);
  html=html.replace(/styles\.css\?v=[^"']+/,`styles.css?v=${ASSET_KEY}`);
  html=html.replace(/config\.js\?v=[^"']+/,`config.js?v=${ASSET_KEY}`);
  html=html.replace(/app\.js\?v=[^"']+/,`app.js?v=${ASSET_KEY}`);
  html=html.replace(/cloud\.js\?v=[^"']+/,`cloud.js?v=${ASSET_KEY}`);
  // Runtime scripts are deliberately NOT injected here. config.js is the only
  // production bootstrap and phase230.js loads its modules exactly once.
  return html;
}

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING') self.skipWaiting();
  if(event.data?.type==='CHECK_VERSION') event.source?.postMessage({type:'APP_VERSION',version:APP_VERSION,assetKey:ASSET_KEY});
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  const navigation=req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/');
  if(navigation){
    event.respondWith(fetch(req,{cache:'no-store'}).then(async resp=>{
      if(!resp||!resp.ok) return resp;
      const html=upgradeHtml(await resp.text());
      const out=new Response(html,{status:resp.status,statusText:resp.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
      const cache=await caches.open(CACHE_NAME);await cache.put(req,out.clone());
      return out;
    }).catch(async()=>{
      const r=(await caches.match(req))||(await caches.match('./index.html'));
      if(!r)return new Response('Offline',{status:503});
      return new Response(upgradeHtml(await r.text()),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
    }));
    return;
  }
  const coreText=/\.(?:js|css|webmanifest)$/.test(url.pathname);
  if(coreText){
    event.respondWith(fetch(req,{cache:'no-store'}).then(async resp=>{
      if(resp&&resp.ok){const cache=await caches.open(CACHE_NAME);await cache.put(req,resp.clone())}
      return resp;
    }).catch(()=>caches.match(req)));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(async resp=>{
    if(resp&&resp.ok){const cache=await caches.open(CACHE_NAME);await cache.put(req,resp.clone())}
    return resp;
  })));
});
