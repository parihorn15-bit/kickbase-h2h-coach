(() => {
  const VERSION='2.3.0-dev3';
  const LIVE_KEY=typeof LIVE_LINEUP_STORAGE_KEY!=='undefined'?LIVE_LINEUP_STORAGE_KEY:'kickbaseCoachLiveLineupsV1';
  const norm=value=>String(value||'').toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ').trim();

  function liveStore230(){
    try{return typeof liveLineupsV1==='function'?liveLineupsV1():JSON.parse(localStorage.getItem(LIVE_KEY)||'{}')}catch{return {}}
  }
  function transferId230(t){
    return t?.externalPlayerId??t?.external_player_id??t?.external_id??t?.playerExternalId??null;
  }
  function matchTransfer230(snap,t){
    if(!snap||!t)return false;
    const sid=snap.externalPlayerId??null,tid=transferId230(t);
    if(sid!=null&&tid!=null&&String(sid)===String(tid))return true;
    return Boolean(norm(snap.name)&&norm(snap.name)===norm(t.player||t.name));
  }

  function snapshotSources230(managerId,md){
    let entry=null,live=null;
    try{entry=typeof managerMatchdayData==='function'?managerMatchdayData(managerId,md):null}catch{}
    try{live=typeof readLiveLineupV1==='function'?readLiveLineupV1(managerId):null}catch{}
    const entrySnaps=Array.isArray(entry?.lineupSnapshot)?entry.lineupSnapshot:[];
    const liveSnaps=Number(live?.snapshotMd||0)===Number(md)&&Array.isArray(live?.playerSnapshots)?live.playerSnapshots:[];
    return {entry,live,snaps:entrySnaps.length?entrySnaps:liveSnaps};
  }

  function reconcileManagerSnapshots230(managerId,md=Number(data?.settings?.currentMd)||1){
    if(!managerId||managerId==='me')return {managerId,md,changed:0,count:0,linked:0};
    const {entry,live,snaps}=snapshotSources230(managerId,md);
    if(!snaps.length)return {managerId,md,changed:0,count:0,linked:0};

    let transfers=[];
    try{
      transfers=(managerLeagueData(managerId)?.transfers||[])
        .filter(t=>!t?.md||Number(t.md)<=Number(md));
    }catch{}

    let changed=0,linked=0;
    for(const snap of snaps){
      const t=transfers.find(x=>matchTransfer230(snap,x));
      const before=JSON.stringify({
        externalPlayerId:snap.externalPlayerId??null,
        transferLinked:snap.transferLinked||false,
        transferId:snap.transferId||null,
        position:snap.position||'',team:snap.team||''
      });
      if(t){
        linked++;
        const tid=transferId230(t);
        if(snap.externalPlayerId==null&&tid!=null)snap.externalPlayerId=tid;
        snap.transferLinked=true;
        snap.transferId=t.id||null;
        snap.transferLinkedAt=snap.transferLinkedAt||new Date().toISOString();
        snap.transferPlayer=String(t.player||snap.name||'');
        // Historical screenshot team remains authoritative. Transfer/master data only fills gaps.
        snap.team=snap.team||t.club||'';
        snap.position=snap.position||t.position||'';
      }else{
        snap.transferLinked=false;
      }
      const after=JSON.stringify({
        externalPlayerId:snap.externalPlayerId??null,
        transferLinked:snap.transferLinked||false,
        transferId:snap.transferId||null,
        position:snap.position||'',team:snap.team||''
      });
      if(before!==after)changed++;
    }

    const names=snaps.map(s=>String(s.name||'').trim()).filter(Boolean).slice(0,11);
    if(entry){
      entry.lineup=[...names];
      entry.lineupSnapshot=snaps.map(s=>({...s}));
      entry.lineupComplete=names.length===11;
      entry.lineupSource=entry.lineupSource||'screenshot-snapshot-2.3';
      entry.lineupReconciledAt=new Date().toISOString();
    }
    if(live&&Number(live.snapshotMd||0)===Number(md)){
      live.players=[...names];
      live.playerSnapshots=snaps.map(s=>({...s}));
      live.count=names.length;
      live.complete=names.length===11;
    }

    if(changed){
      const store=liveStore230();
      if(live&&Number(live.snapshotMd||0)===Number(md))store[managerId]=live;
      try{localStorage.setItem(LIVE_KEY,JSON.stringify(store))}catch{}
      try{localStorage.setItem('kickbaseCoachV07',JSON.stringify(data))}catch{}
      if(typeof resetOpponentRosterCache==='function')resetOpponentRosterCache();
      if(typeof resetOpponentAnalysisCache==='function')resetOpponentAnalysisCache();
      if(window.cloudQueueSave)window.cloudQueueSave();
    }
    return {managerId,md,changed,count:names.length,linked,unlinked:names.length-linked};
  }

  function reconcileAll230(){
    const md=Number(data?.settings?.currentMd)||1;
    const ids=[];
    try{
      for(const m of (typeof LEAGUE_MANAGERS!=='undefined'?LEAGUE_MANAGERS:[]))if(m?.id&&m.id!=='me')ids.push(m.id);
    }catch{}
    const store=liveStore230();
    for(const id of Object.keys(store||{}))if(id!=='me'&&!ids.includes(id))ids.push(id);
    return ids.map(id=>reconcileManagerSnapshots230(id,md));
  }

  // Transfer imports eventually pass through this central synchronizer. Reconcile snapshots afterwards,
  // but never let reconciliation break the existing transfer workflow.
  if(typeof syncTransferSingleSource==='function'){
    const priorSync=syncTransferSingleSource;
    let reconciling=false;
    syncTransferSingleSource=function(...args){
      const result=priorSync.apply(this,args);
      if(!reconciling){
        reconciling=true;
        try{reconcileAll230()}catch(e){console.warn('2.3 snapshot/transfer reconciliation skipped',e)}
        finally{reconciling=false}
      }
      return result;
    };
  }

  function regressionStatus230(managerId,md=Number(data?.settings?.currentMd)||1){
    const {entry,live,snaps}=snapshotSources230(managerId,md);
    let roster=[];
    try{roster=typeof opponentRoster==='function'?opponentRoster(managerId,md):[]}catch{}
    const lineupNames=(Array.isArray(entry?.lineup)&&entry.lineup.length)
      ? entry.lineup
      : (Number(live?.snapshotMd||0)===Number(md)&&Array.isArray(live?.players)?live.players:[]);
    const lineupKeys=new Set(lineupNames.map(norm).filter(Boolean));
    const rosterKeys=new Set((roster||[]).map(p=>norm(p?.name)).filter(Boolean));
    const visible=[...lineupKeys].filter(k=>rosterKeys.has(k)).length;
    const secure=snaps.filter(s=>s.state==='secure').length;
    const transferLinked=snaps.filter(s=>s.transferLinked).length;
    return {
      version:VERSION,managerId,md,
      snapshotCount:snaps.length,
      lineupCount:lineupNames.length,
      rosterCount:roster.length,
      visibleStarterCount:visible,
      secureCount:secure,
      transferLinkedCount:transferLinked,
      passSnapshotPersistence:snaps.length===lineupNames.length,
      passRenderer:lineupNames.length===visible,
      passNineOfNine:lineupNames.length!==9||visible===9,
      unresolved:snaps.filter(s=>s.state!=='secure').map(s=>s.rawName||s.name),
      unlinkedTransfers:snaps.filter(s=>!s.transferLinked).map(s=>s.name)
    };
  }

  window.h2h230ReconcileManagerSnapshots=reconcileManagerSnapshots230;
  window.h2h230ReconcileAllSnapshots=reconcileAll230;
  window.h2h230RegressionStatus=regressionStatus230;
  setTimeout(()=>{try{reconcileAll230()}catch{}},2500);
  window.addEventListener('focus',()=>{try{reconcileAll230()}catch{}});
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
