(() => {
  const VERSION='2.3.0-test-dev5.1';

  const enableFullUse=()=>{
    window.H2H_PHASE230_TEST_READY=true;
    window.H2H_PHASE230_TEST_VERSION=VERSION;
    window.H2H_PHASE230_TEST_CLOUD_READONLY=false;
    window.H2H_PHASE230_FULL_USE=true;
    document.title='Kickbase H2H Coach 2.3.0 TEST';

    const upload=document.getElementById('cloudUploadLocal');
    if(upload){
      upload.disabled=false;
      upload.title='Lokalen Stand jetzt in die Cloud schreiben.';
      if(/gesperrt|test/i.test(upload.textContent||''))upload.textContent='Lokalen Stand hochladen';
    }

    const brand=document.querySelector('#sidebar .brand small');
    if(brand)brand.textContent='Version 2.3.0 TEST · Vollmodus · Cloud-Schreiben AKTIV · 2026/27';

    let badge=document.getElementById('phase230TestBadge');
    if(!badge){
      badge=document.createElement('div');
      badge.id='phase230TestBadge';
      badge.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;padding:7px 10px;border-radius:999px;background:#0f5132;color:#fff;font:700 12px/1.2 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.25);opacity:.94';
      document.body.appendChild(badge);
    }
    badge.style.background='#0f5132';
    badge.textContent='2.3.0 TEST · Vollmodus · Cloud AKTIV';
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enableFullUse,{once:true});
  else enableFullUse();
  setTimeout(enableFullUse,800);
  setTimeout(enableFullUse,2500);
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
