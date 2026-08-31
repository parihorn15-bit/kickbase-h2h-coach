(() => {
  const VERSION='2.3.0-dev2';
  const LIVE_KEY=typeof LIVE_LINEUP_STORAGE_KEY!=='undefined'?LIVE_LINEUP_STORAGE_KEY:'kickbaseCoachLiveLineupsV1';
  const norm=value=>String(value||'').toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ').trim();

  function masterRows230(){
    return Array.isArray(window.BUNDESLIGA_PLAYERS)?window.BUNDESLIGA_PLAYERS:[];
  }
  function masterStamp230(){
    return Math.max(0,...masterRows230().map(p=>Date.parse(p.source_updated_at||p.updated_at||0)||0));
  }
  function masterFreshness230(){
    const stamp=masterStamp230();
    const ageHours=stamp?Math.max(0,(Date.now()-stamp)/3600000):null;
    return {
      players:masterRows230().length,
      stamp,
      updatedAt:stamp?new Date(stamp).toISOString():'',
      ageHours,
      fresh:ageHours!==null&&ageHours<=36,
      stale:ageHours!==null&&ageHours>36
    };
  }

  function resolveSnapshot230(snap){
    if(!snap)return {changed:false,snap};
    const resolver=window.h2h230MasterResolve;
    if(typeof resolver!=='function')return {changed:false,snap};
    const raw=String(snap.rawName||snap.name||'').trim();
    if(!raw)return {changed:false,snap};
    const result=resolver(raw,{team:snap.teamAtImport||snap.team||''});
    if(!result?.matched||Number(result.confidence||0)<.93)return {changed:false,snap};

    const oldKey=`${snap.externalPlayerId??''}|${norm(snap.name)}|${snap.state||''}|${snap.position||''}`;
    snap.name=String(result.name||snap.name||raw);
    snap.externalPlayerId=result.external_id??result.id??snap.externalPlayerId??null;
    // teamAtImport is historical evidence and is deliberately never overwritten.
    snap.team=snap.team||result.team||'';
    snap.position=snap.position||(typeof mapLivePosition==='function'?mapLivePosition(result.position):result.position)||'';
    snap.confidence=Number(result.confidence||snap.confidence||0);
    snap.state='secure';
    snap.reason=`nach Master-Update: ${result.reason||'eindeutig'}`;
    snap.linkedAt=new Date().toISOString();
    const newKey=`${snap.externalPlayerId??''}|${norm(snap.name)}|${snap.state||''}|${snap.position||''}`;
    return {changed:oldKey!==newKey,snap};
  }

  function relinkAllStoredLineups230(){
    let changes=0;

    // 1) Current LIVE snapshots.
    let liveStore={};
    try{liveStore=typeof liveLineupsV1==='function'?liveLineupsV1():JSON.parse(localStorage.getItem(LIVE_KEY)||'{}')}catch{}
    for(const [managerId,live] of Object.entries(liveStore||{})){
      const snaps=Array.isArray(live?.playerSnapshots)?live.playerSnapshots:[];
      if(!snaps.length)continue;
      for(const snap of snaps){if(resolveSnapshot230(snap).changed)changes++}
      live.players=snaps.map(s=>s.name).filter(Boolean).slice(0,11);
      live.count=live.players.length;
      live.complete=live.count===11;
      live.masterUpdatedAt=masterStamp230()||live.masterUpdatedAt||null;
      live.snapshotVersion=230;

      if(managerId!=='me'&&typeof managerMatchdayData==='function'){
        const md=Number(live.snapshotMd||data?.settings?.currentMd)||1;
        const row=managerMatchdayData(managerId,md);
        row.lineup=[...live.players];
        row.lineupSnapshot=snaps.map(s=>({...s}));
        row.lineupComplete=row.lineup.length===11;
      }
    }

    // 2) Historical manager matchday snapshots. These must survive even when LIVE points to another matchday later.
    const managerData=data?.league?.managerData||data?.competition?.managerData||data?.managerData||null;
    if(managerData&&typeof managerData==='object'){
      for(const row of Object.values(managerData)){
        const matchdays=row?.matchdays;
        if(!matchdays||typeof matchdays!=='object')continue;
        for(const entry of Object.values(matchdays)){
          const snaps=Array.isArray(entry?.lineupSnapshot)?entry.lineupSnapshot:[];
          if(!snaps.length)continue;
          for(const snap of snaps){if(resolveSnapshot230(snap).changed)changes++}
          entry.lineup=snaps.map(s=>s.name).filter(Boolean).slice(0,11);
          entry.lineupComplete=entry.lineup.length===11;
          entry.lineupRelinkedAt=new Date().toISOString();
          entry.lineupMasterUpdatedAt=masterStamp230()||null;
        }
      }
    }

    try{localStorage.setItem(LIVE_KEY,JSON.stringify(liveStore))}catch{}
    if(changes){
      localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
      if(typeof resetOpponentRosterCache==='function')resetOpponentRosterCache();
      if(typeof resetOpponentAnalysisCache==='function')resetOpponentAnalysisCache();
      if(window.cloudQueueSave)window.cloudQueueSave();
    }
    return changes;
  }

  // Keep screenshot snapshots authoritative for display. The transfer-derived roster only enriches them.
  if(typeof opponentRoster==='function'){
    const priorOpponentRoster=opponentRoster;
    opponentRoster=function(managerId,md=data.settings.currentMd){
      const roster=[...(priorOpponentRoster(managerId,md)||[])];
      let entry=null;
      try{entry=typeof managerMatchdayData==='function'?managerMatchdayData(managerId,md):null}catch{}
      let live=null;
      try{live=typeof readLiveLineupV1==='function'?readLiveLineupV1(managerId):null}catch{}
      const snapshots=(Array.isArray(entry?.lineupSnapshot)&&entry.lineupSnapshot.length)
        ? entry.lineupSnapshot
        : (Number(live?.snapshotMd||0)===Number(md)&&Array.isArray(live?.playerSnapshots)?live.playerSnapshots:[]);

      for(const snap of snapshots){
        if(!snap?.name)continue;
        const existing=roster.find(p=>norm(p.name)===norm(snap.name)||(
          snap.externalPlayerId!=null&&(p.externalPlayerId===snap.externalPlayerId||p.external_id===snap.externalPlayerId)
        ));
        if(existing){
          existing.name=snap.name||existing.name;
          existing.team=snap.teamAtImport||snap.team||existing.team||'';
          existing.position=snap.position||existing.position||'';
          existing.externalPlayerId=snap.externalPlayerId??existing.externalPlayerId??existing.external_id??null;
          existing.lineupSnapshot=true;
          continue;
        }
        roster.push({
          name:snap.name,
          team:snap.teamAtImport||snap.team||'',
          position:snap.position||'',
          externalPlayerId:snap.externalPlayerId??null,
          inferredFromLineup:true,
          lineupSnapshot:true,
          source:'lineup-snapshot-2.3'
        });
      }
      return roster;
    };
  }

  function refreshState230({renderAfter=false}={}){
    const freshness=masterFreshness230();
    const previous=window.H2H_PHASE230||{};
    const stampChanged=String(previous.masterStamp||'')!==String(freshness.stamp||'');
    let relinked=0;
    if(stampChanged&&freshness.players)relinked=relinkAllStoredLineups230();
    window.H2H_PHASE230={
      ...previous,
      version:VERSION,
      masterPlayers:freshness.players,
      masterStamp:freshness.stamp,
      masterUpdatedAt:freshness.updatedAt,
      masterAgeHours:freshness.ageHours,
      masterFresh:freshness.fresh,
      masterStale:freshness.stale,
      relinked,
      lastCheckedAt:new Date().toISOString()
    };
    if(renderAfter&&stampChanged&&typeof render==='function'&&!window.h2hEditingInProgress?.())render();
    return window.H2H_PHASE230;
  }

  // Small status helper for diagnostics/tests without changing the productive page layout yet.
  window.h2h230MasterStatus=()=>refreshState230({renderAfter:false});
  window.h2h230RelinkAllStoredLineups=relinkAllStoredLineups230;

  // Poll quickly after cloud startup, then cheaply in the background. This catches the daily Supabase refresh
  // without forcing the user to re-upload an old screenshot.
  let tries=0;
  const startup=setInterval(()=>{
    tries++;
    const state=refreshState230({renderAfter:true});
    if(state.masterPlayers||tries>=20)clearInterval(startup);
  },1500);
  setInterval(()=>refreshState230({renderAfter:true}),60000);
  window.addEventListener('focus',()=>refreshState230({renderAfter:true}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshState230({renderAfter:true})});

  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
