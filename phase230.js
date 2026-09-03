(() => {
  const APP_VERSION='3.0.0';
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'}).then(async reg=>{
      try{await reg.update()}catch(_){ }
      if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
      reg.addEventListener('updatefound',()=>{
        const worker=reg.installing;
        if(!worker)return;
        worker.addEventListener('statechange',()=>{
          if(worker.state==='installed'&&navigator.serviceWorker.controller){worker.postMessage({type:'SKIP_WAITING'});}
        });
      });
    }).catch(error=>console.error('3.0.0 service worker registration failed',error));
    let reloading=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(reloading)return;
      reloading=true;
      location.reload();
    });
  }
  const brandVersion=()=>{
    const small=document.querySelector('#sidebar .brand small');
    if(small)small.textContent='Version '+APP_VERSION+' · Cloud-Schreiben AKTIV · 2026/27';
    document.title='Kickbase H2H Coach '+APP_VERSION;
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',brandVersion,{once:true});else brandVersion();
  const css=document.createElement('link');css.rel='stylesheet';css.href='phase230-mobile.css?v=300release1';css.dataset.phase230mobile='1';if(!document.querySelector('link[data-phase230mobile]'))document.head.appendChild(css);
  const load=(src,tag)=>new Promise((resolve,reject)=>{if(document.querySelector(`script[data-${tag}]`)){resolve();return}const s=document.createElement('script');s.src=src;s.async=false;s.dataset[tag]='1';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  load('phase230-dev1.js?v=230dev1','phase230dev1').then(()=>load('phase230-dev2.js?v=230dev2','phase230dev2')).then(()=>load('phase230-dev3.js?v=230dev3','phase230dev3')).then(()=>load('phase230-dev4.js?v=230dev4','phase230dev4')).then(()=>load('phase230-dev5.js?v=230dev5_2','phase230dev5')).then(()=>load('phase230-dev6.js?v=230dev6','phase230dev6')).then(()=>load('phase230-dev7.js?v=230dev7','phase230dev7')).then(()=>load('phase230-dev8.js?v=230dev8_3','phase230dev8')).then(()=>load('phase230-dev9.js?v=230dev9_3','phase230dev9')).then(()=>load('phase230-dev10.js?v=230dev10_4','phase230dev10')).then(()=>load('phase230-dev11.js?v=230dev11_14','phase230dev11')).then(()=>load('phase230-dev12.js?v=230dev12_2','phase230dev12')).then(()=>load('phase230-dev13.js?v=230dev13_0','phase230dev13')).then(()=>load('phase230-dev14.js?v=230dev14_2','phase230dev14')).then(()=>load('phase230-dev15.js?v=230dev15_1','phase230dev15')).then(()=>load('phase230-dev16.js?v=230dev16_1','phase230dev16')).then(()=>load('phase230-dev17.js?v=230dev17_0','phase230dev17')).then(()=>load('phase230-dev18.js?v=230dev18_0','phase230dev18')).then(()=>load('phase230-league-anchor.js?v=300release1','phase230leagueanchor')).then(()=>load('phase230-dev19.js?v=300release1','phase230dev19')).then(()=>load('phase230-dev20.js?v=300release1','phase230dev20')).then(()=>load('phase230-dev21.js?v=300release2','phase230dev21')).then(()=>load('phase230-dev22.js?v=300release3','phase230dev22')).then(brandVersion).catch(error=>console.error('3.0.0 runtime load failed',error));
})();