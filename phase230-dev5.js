(() => {
  const VERSION='2.3.0-prod-dev5.2';

  const enableFullUse=()=>{
    // Legacy runtime flags stay available for compatibility, but 2.3.0 is now
    // the single production application on main.
    window.H2H_PHASE230_TEST_READY=true;
    window.H2H_PHASE230_TEST_VERSION=VERSION;
    window.H2H_PHASE230_TEST_CLOUD_READONLY=false;
    window.H2H_PHASE230_FULL_USE=true;
    document.title='Kickbase H2H Coach 2.3.0';

    const upload=document.getElementById('cloudUploadLocal');
    if(upload){
      upload.disabled=false;
      upload.title='Lokalen Stand jetzt in die Cloud schreiben.';
      if(/gesperrt|test/i.test(upload.textContent||''))upload.textContent='Lokalen Stand hochladen';
    }

    const brand=document.querySelector('#sidebar .brand small');
    if(brand)brand.textContent='Version 2.3.0 · Cloud-Schreiben AKTIV · 2026/27';

    // Remove the obsolete test/full-mode badge from older 2.3 runtimes.
    document.getElementById('phase230TestBadge')?.remove();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enableFullUse,{once:true});
  else enableFullUse();
  setTimeout(enableFullUse,800);
  setTimeout(enableFullUse,2500);
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();