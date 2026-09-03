(() => {
  if(window.__H2H_PHASE230_BOOTSTRAPPED__)return;
  window.__H2H_PHASE230_BOOTSTRAPPED__=true;
  const release=window.H2H_RELEASE;
  const APP_VERSION=release?.version;
  const ASSET_KEY=release?.assetKey;
  if(!APP_VERSION||!ASSET_KEY){console.error('Canonical H2H release metadata missing; runtime bootstrap aborted.');return;}
  const brandVersion=()=>{const small=document.querySelector('#sidebar .brand small');if(small)small.textContent='Version '+APP_VERSION+' · Cloud-Schreiben AKTIV · 2026/27';document.title='Kickbase H2H Coach '+APP_VERSION;};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',brandVersion,{once:true});else brandVersion();
  const css=document.createElement('link');css.rel='stylesheet';css.href=`phase230-mobile.css?v=${encodeURIComponent(ASSET_KEY)}`;css.dataset.phase230mobile='1';if(!document.querySelector('link[data-phase230mobile]'))document.head.appendChild(css);
  const load=(src,tag)=>new Promise((resolve,reject)=>{if(document.querySelector(`script[data-${tag}]`)){resolve();return}const s=document.createElement('script');s.src=`${src}?v=${encodeURIComponent(ASSET_KEY)}`;s.async=false;s.dataset[tag]='1';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  const modules=['phase230-dev1.js','phase230-dev2.js','phase230-dev3.js','phase230-dev4.js','phase230-dev5.js','phase230-dev6.js','phase230-dev7.js','phase230-dev8.js','phase230-dev9.js','phase230-dev10.js','phase230-dev11.js','phase230-dev12.js','phase230-dev13.js','phase230-dev14.js','phase230-dev15.js','phase230-dev16.js','phase230-dev17.js','phase230-dev18.js','phase230-league-anchor.js','phase230-dev19.js','phase230-st1-anchor.js','phase230-st1-corrections.js','phase230-dev20.js','phase230-dev21.js','phase230-dev22.js','phase230-dev24.js','phase230-transfer-anchor-core.js','phase230-transfer-al.js','phase230-transfer-cello.js','phase230-transfer-calcio.js','phase230-transfer-horn.js','phase230-dev23.js','phase230-dev26.js','phase230-dev27.js','phase230-dev28.js','phase230-dev29.js','phase230-dev30.js','phase230-dev31.js'];
  modules.reduce((p,src)=>p.then(()=>load(src,src.replace(/[^a-z0-9]/gi,'').toLowerCase())),Promise.resolve()).then(brandVersion).catch(error=>console.error(`${APP_VERSION} runtime load failed`,error));
})();
