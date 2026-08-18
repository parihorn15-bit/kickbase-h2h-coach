(() => {
  const VERSION='2.3.0-test-dev5';
  const markReady=()=>{
    window.H2H_PHASE230_TEST_READY=true;
    window.H2H_PHASE230_TEST_VERSION=VERSION;
    document.title='Kickbase H2H Coach 2.3.0 TEST';
    const brand=document.querySelector('#sidebar .brand small');
    if(brand&&!brand.dataset.phase230Marked){
      brand.textContent='Version 2.3.0 TEST · Dev5 · Bundesliga Master Player IDs · 2026/27';
      brand.dataset.phase230Marked='1';
    }
    if(!document.getElementById('phase230TestBadge')){
      const badge=document.createElement('div');
      badge.id='phase230TestBadge';
      badge.textContent='2.3.0 TEST · Dev5';
      badge.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;padding:7px 10px;border-radius:999px;background:#111827;color:#fff;font:700 12px/1.2 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.25);opacity:.92';
      document.body.appendChild(badge);
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',markReady,{once:true});
  else markReady();
  setTimeout(markReady,800);
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
