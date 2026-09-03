const CACHE_NAME='h2h-coach-v300-bootstrap4';
const APP_VERSION='3.0.0';
const CORE=[
  './','./index.html','./styles.css?v=215n','./phase230-mobile.css?v=230mobile1',
  './config.js?v=300release1','./app.js?v=215n','./cloud.js?v=230dev7',
  './phase230.js?v=300release1','./phase230-dev1.js?v=230dev1','./phase230-dev2.js?v=230dev2',
  './phase230-dev3.js?v=230dev3','./phase230-dev4.js?v=230dev4','./phase230-dev5.js?v=230dev5_2',
  './phase230-dev6.js?v=230dev6','./phase230-dev7.js?v=230dev7','./phase230-dev8.js?v=230dev8_3',
  './phase230-dev9.js?v=230dev9_3','./phase230-dev10.js?v=230dev10_4','./phase230-dev11.js?v=230dev11_14',
  './phase230-dev12.js?v=230dev12_2','./phase230-dev13.js?v=230dev13_0','./phase230-dev14.js?v=230dev14_2',
  './phase230-dev15.js?v=230dev15_1','./phase230-dev16.js?v=230dev16_1','./phase230-dev17.js?v=230dev17_0',
  './phase230-dev18.js?v=230dev18_0','./phase230-league-anchor.js?v=300release1','./phase230-dev19.js?v=300release1',
  './phase230-dev20.js?v=300release1','./phase230-dev21.js?v=300release2','./phase230-dev22.js?v=300release3','./phase230-st1-anchor.js?v=300release1','./manifest.webmanifest'
];
const V3_SCRIPTS=[
  'phase230.js?v=300release1','phase230-dev1.js?v=230dev1','phase230-dev2.js?v=230dev2','phase230-dev3.js?v=230dev3',
  'phase230-dev4.js?v=230dev4','phase230-dev5.js?v=230dev5_2','phase230-dev6.js?v=230dev6','phase230-dev7.js?v=230dev7',
  'phase230-dev8.js?v=230dev8_3','phase230-dev9.js?v=230dev9_3','phase230-dev10.js?v=230dev10_4','phase230-dev11.js?v=230dev11_14',
  'phase230-dev12.js?v=230dev12_2','phase230-dev13.js?v=230dev13_0','phase230-dev14.js?v=230dev14_2','phase230-dev15.js?v=230dev15_1',
  'phase230-dev16.js?v=230dev16_1','phase230-dev17.js?v=230dev17_0','phase230-dev18.js?v=230dev18_0','phase230-league-anchor.js?v=300release1',
  'phase230-dev19.js?v=300release1','phase230-dev20.js?v=300release1','phase230-dev21.js?v=300release2','phase230-dev22.js?v=300release3','phase230-st1-anchor.js?v=300release1'
];
function upgradeHtml(html){
  html=html.replace(/<title>[^<]*<\/title>/,'<title>Kickbase H2H Coach 3.0.0</title>');
  html=html.replace(/<small>Version [^<]*<\/small>/,'<small>Version 3.0.0 · Cloud-Schreiben AKTIV · 2026/27</small>');
  if(!html.includes('phase230-mobile.css')) html=html.replace('</head>','<link rel="stylesheet" href="phase230-mobile.css?v=230mobile1"></head>');
  if(!html.includes('phase230.js?v=300release1')){
    const tags=V3_SCRIPTS.map(src=>'<script src="'+src+'"></script>').join('');
    html=html.replace('</body>',tags+'</body>');
  }
  return html;
}
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()).then(async()=>{const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clients)client.postMessage({type:'APP_UPDATED',version:APP_VERSION});}));});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  const navigation=req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/');
  if(navigation){event.respondWith(fetch(req,{cache:'no-store'}).then(async resp=>{if(!resp||!resp.ok)return resp;const html=upgradeHtml(await resp.text());const out=new Response(html,{status:resp.status,statusText:resp.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});caches.open(CACHE_NAME).then(cache=>cache.put(req,out.clone()));return out;}).catch(()=>caches.match(req).then(async r=>{if(!r)return caches.match('./index.html');const html=upgradeHtml(await r.text());return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}});})));return;}
  const coreText=/\.(?:js|css|webmanifest)$/.test(url.pathname);
  if(coreText){event.respondWith(fetch(req,{cache:'no-store'}).then(resp=>{if(resp&&resp.ok){const copy=resp.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));}return resp;}).catch(()=>caches.match(req)));return;}
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(resp=>{if(resp&&resp.ok){const copy=resp.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));}return resp;})));
});
