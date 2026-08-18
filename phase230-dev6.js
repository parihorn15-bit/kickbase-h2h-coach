(() => {
  const VERSION='2.3.0-dev6';

  const getReview=()=>{
    try{return screenshotImportReview||null}catch{return null}
  };
  const targetManagerId=()=>{
    const r=getReview();
    return document.getElementById('aiTargetManager')?.value||r?.managerId||'';
  };
  const selectedTransferCount=()=>document.querySelectorAll('[data-ai]:checked').length;
  const lineupSelected=()=>{
    const r=getReview();
    return Boolean(document.getElementById('aiLineup')?.checked&&r?.lineupReview?.length);
  };
  const isKnownTransferReview=()=>{
    const r=getReview();
    return Boolean(
      r?.items?.length &&
      r.items.every(item=>item?.action==='unchanged') &&
      targetManagerId() &&
      selectedTransferCount()===0 &&
      !lineupSelected()
    );
  };

  function reconcileKnownReview230(){
    const managerId=targetManagerId();
    if(!managerId)return {ok:false,message:'Kein Ziel-Manager ausgewählt.'};

    let masterRelinked=0;
    let result=null;
    try{
      if(typeof window.h2h230RelinkAllStoredLineups==='function'){
        masterRelinked=Number(window.h2h230RelinkAllStoredLineups()||0);
      }
      if(typeof window.h2h230ReconcileManagerSnapshots==='function'){
        result=window.h2h230ReconcileManagerSnapshots(managerId,Number(data?.settings?.currentMd)||1);
      }
      if(typeof resetOpponentRosterCache==='function')resetOpponentRosterCache();
      if(typeof resetOpponentAnalysisCache==='function')resetOpponentAnalysisCache();
      try{localStorage.setItem('kickbaseCoachV07',JSON.stringify(data))}catch{}
    }catch(error){
      console.warn('[H2H 2.3] unchanged-transfer reconciliation failed',error);
      return {ok:false,message:error?.message||'Abgleich fehlgeschlagen.'};
    }

    const changed=Number(result?.changed||0)+masterRelinked;
    const linked=Number(result?.linked||0);
    const count=Number(result?.count||0);
    const message=`Neu abgeglichen: ${count} Aufstellungsplätze · ${linked} mit Transfers verknüpft · ${changed} Daten aktualisiert.`;
    const status=document.getElementById('screenshotImportStatus');
    if(status)status.textContent=`✓ ${message}`;
    if(typeof toast==='function')toast(`✓ ${message}`,5000);
    if(typeof render==='function'&&!window.h2hEditingInProgress?.()){
      setTimeout(()=>{try{render()}catch{}},120);
    }
    window.H2H_PHASE230={...(window.H2H_PHASE230||{}),lastKnownTransferReconcileAt:new Date().toISOString(),lastKnownTransferReconcile:{managerId,...(result||{}),masterRelinked}};
    return {ok:true,managerId,masterRelinked,...(result||{}),message};
  }

  const priorCommit=typeof commitAiReview==='function'?commitAiReview:null;
  if(priorCommit){
    commitAiReview=function(...args){
      if(isKnownTransferReview())return reconcileKnownReview230();
      return priorCommit.apply(this,args);
    };
  }

  function enhanceKnownTransferReview230(){
    if(!isKnownTransferReview())return false;
    const btn=document.getElementById('aiCommit');
    if(!btn)return false;
    btn.disabled=false;
    btn.textContent='Bekannte Transfers neu abgleichen';
    btn.title='Die Transfers sind bereits gespeichert. Bestehende Aufstellungs-Snapshots werden trotzdem erneut mit Master- und Transferdaten verknüpft.';
    btn.onclick=()=>{
      if(selectedTransferCount()||lineupSelected())return priorCommit?.();
      return reconcileKnownReview230();
    };
    return true;
  }

  if(typeof renderScreenshotAiResult==='function'){
    const priorRenderResult=renderScreenshotAiResult;
    renderScreenshotAiResult=function(...args){
      const value=priorRenderResult.apply(this,args);
      setTimeout(enhanceKnownTransferReview230,0);
      setTimeout(enhanceKnownTransferReview230,80);
      return value;
    };
  }

  document.addEventListener('change',event=>{
    if(event.target?.matches?.('[data-ai],#aiTargetManager,#aiLineup'))setTimeout(enhanceKnownTransferReview230,0);
  });

  // Master refreshes are detected in Dev2. Dev6 also runs transfer reconciliation afterwards,
  // so a newly resolved master identity can immediately attach to an existing manager snapshot.
  const priorRelink=window.h2h230RelinkAllStoredLineups;
  if(typeof priorRelink==='function'){
    window.h2h230RelinkAllStoredLineups=function(...args){
      const changed=priorRelink.apply(this,args);
      try{window.h2h230ReconcileAllSnapshots?.()}catch(error){console.warn('[H2H 2.3] post-master transfer reconcile skipped',error)}
      return changed;
    };
  }

  window.h2h230ReconcileKnownTransferReview=reconcileKnownReview230;
  window.h2h230EnhanceKnownTransferReview=enhanceKnownTransferReview230;
  setTimeout(enhanceKnownTransferReview230,500);
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
