(() => {
  if(window.__H2H_PHASE230_BOOTSTRAPPED__)return;
  window.__H2H_PHASE230_BOOTSTRAPPED__=true;
  const release=window.H2H_RELEASE;
  const APP_VERSION=release?.version;
  const ASSET_KEY=release?.assetKey;
  if(!APP_VERSION||!ASSET_KEY){console.error('Canonical H2H release metadata missing; runtime bootstrap aborted.');return;}

  window.__H2H_RUNTIME_BOOTING__=true;
  let renderQueued=false;
  const originalRender=typeof window.render==='function'?window.render:null;
  if(originalRender){
    window.render=function(...args){
      if(window.__H2H_RUNTIME_BOOTING__){renderQueued=true;return;}
      return originalRender.apply(this,args);
    };
  }

  const brandVersion=()=>{
    const small=document.querySelector('#sidebar .brand small');
    if(small)small.textContent='Version '+APP_VERSION+' · Cloud-Schreiben AKTIV · 2026/27';
    document.title='Kickbase H2H Coach '+APP_VERSION;
  };
  const brandObserver=new MutationObserver(()=>{
    if(!window.__H2H_RUNTIME_BOOTING__)return;
    const small=document.querySelector('#sidebar .brand small');
    const wanted='Version '+APP_VERSION+' · Cloud-Schreiben AKTIV · 2026/27';
    if(small&&small.textContent!==wanted)small.textContent=wanted;
    const title='Kickbase H2H Coach '+APP_VERSION;
    if(document.title!==title)document.title=title;
  });
  const observeBrand=()=>{
    const small=document.querySelector('#sidebar .brand small');
    if(small)brandObserver.observe(small,{childList:true,characterData:true,subtree:true});
    brandVersion();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeBrand,{once:true});else observeBrand();

  const css=document.createElement('link');css.rel='stylesheet';css.href=`phase230-mobile.css?v=${encodeURIComponent(ASSET_KEY)}`;css.dataset.phase230mobile='1';if(!document.querySelector('link[data-phase230mobile]'))document.head.appendChild(css);
  const modules=['phase230-dev1.js','phase230-dev2.js','phase230-dev3.js','phase230-dev4.js','phase230-dev5.js','phase230-dev6.js','phase230-dev7.js','phase230-dev8.js','phase230-dev9.js','phase230-dev10.js','phase230-dev11.js','phase230-dev12.js','phase230-dev13.js','phase230-dev14.js','phase230-dev15.js','phase230-dev16.js','phase230-dev17.js','phase230-dev18.js','phase230-league-anchor.js','phase230-dev19.js','phase230-st1-anchor.js','phase230-st1-corrections.js','phase230-dev20.js','phase230-dev21.js','phase230-dev22.js','phase230-dev24.js','phase230-transfer-anchor-core.js','phase230-transfer-al.js','phase230-transfer-cello.js','phase230-transfer-calcio.js','phase230-transfer-horn.js','phase230-dev23.js','phase230-dev26.js','phase230-dev27.js','phase230-dev28.js','phase230-dev31.js','phase230-dev29.js','phase230-dev30.js'];
  const href=src=>`${src}?v=${encodeURIComponent(ASSET_KEY)}`;
  for(const src of modules){const link=document.createElement('link');link.rel='preload';link.as='script';link.href=href(src);link.dataset.h2hRuntimePreload='1';document.head.appendChild(link);}
  const load=(src,tag)=>new Promise((resolve,reject)=>{if(document.querySelector(`script[data-${tag}]`)){resolve();return}const s=document.createElement('script');s.src=href(src);s.async=false;s.dataset[tag]='1';s.onload=()=>{brandVersion();resolve()};s.onerror=reject;document.head.appendChild(s)});
  modules.reduce((p,src)=>p.then(()=>load(src,src.replace(/[^a-z0-9]/gi,'').toLowerCase())),Promise.resolve()).then(()=>{
    window.__H2H_RUNTIME_BOOTING__=false;
    brandObserver.disconnect();
    brandVersion();
    document.querySelectorAll('link[data-h2h-runtime-preload]').forEach(n=>n.remove());
    if(originalRender&&(renderQueued||document.getElementById('content')))originalRender();
    window.dispatchEvent(new CustomEvent('h2h:runtime-ready',{detail:{version:APP_VERSION,assetKey:ASSET_KEY}}));
  }).catch(error=>{
    window.__H2H_RUNTIME_BOOTING__=false;
    brandObserver.disconnect();
    brandVersion();
    console.error(`${APP_VERSION} runtime load failed`,error);
  });
})();
