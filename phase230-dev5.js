(() => {
  const VERSION='2.3.0-test-dev5';
  const disableCloudWrites=()=>{
    window.cloudQueueSave=()=>console.info('[H2H 2.3 TEST] Cloud save suppressed');
    window.cloudFlushSave=async()=>{
      console.info('[H2H 2.3 TEST] Cloud flush suppressed');
      return true;
    };
    const upload=document.getElementById('cloudUploadLocal');
    if(upload){
      upload.disabled=true;
      upload.title='Im 2.3.0-Testmodus deaktiviert, damit der produktive Cloud-Stand unverändert bleibt.';
      upload.textContent='Lokalen Stand hochladen · im Test gesperrt';
    }
  };
  const markReady=()=>{
    disableCloudWrites();
    window.H2H_PHASE230_TEST_READY=true;
    window.H2H_PHASE230_TEST_VERSION=VERSION;
    window.H2H_PHASE230_TEST_CLOUD_READONLY=true;
    document.title='Kickbase H2H Coach 2.3.0 TEST';
    const brand=document.querySelector('#sidebar .brand small');
    if(brand&&!brand.dataset.phase230Marked){
      brand.textContent='Version 2.3.0 TEST · Dev5 · Cloud-Schreiben AUS · 2026/27';
      brand.dataset.phase230Marked='1';
    }
    let badge=document.getElementById('phase230TestBadge');
    if(!badge){
      badge=document.createElement('div');
      badge.id='phase230TestBadge';
      badge.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;padding:7px 10px;border-radius:999px;background:#111827;color:#fff;font:700 12px/1.2 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.25);opacity:.92';
      document.body.appendChild(badge);
    }
    badge.textContent='2.3.0 TEST · Cloud-Schreiben AUS';
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',markReady,{once:true});
  else markReady();
  setTimeout(markReady,800);
  setTimeout(markReady,2500);
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
