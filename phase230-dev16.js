(() => {
  const VERSION='2.3.0-dev16.0';
  const LIVE_KEY=typeof LIVE_LINEUP_STORAGE_KEY!=='undefined'?LIVE_LINEUP_STORAGE_KEY:'kickbaseCoachLiveLineupsV1';
  const STORE_KEY='phase230LiveLineups';
  const clone=value=>{try{return structuredClone(value)}catch{return JSON.parse(JSON.stringify(value))}};

  function settingsOf(target=data){
    if(!target.settings||typeof target.settings!=='object')target.settings={};
    return target.settings;
  }
  function cloudStore(target=data){
    const settings=settingsOf(target);
    if(!settings[STORE_KEY]||typeof settings[STORE_KEY]!=='object')settings[STORE_KEY]={};
    return settings[STORE_KEY];
  }
  function localStore(){
    try{return JSON.parse(localStorage.getItem(LIVE_KEY)||'{}')||{}}catch{return {}}
  }
  function stamp(lineup){
    return Date.parse(lineup?.updatedAt||lineup?.capturedAt||lineup?.currentLineupUpdatedAt230||0)||0;
  }
  function mergeStores(primary,secondary){
    const out=primary;
    for(const [id,row] of Object.entries(secondary||{})){
      if(!row||typeof row!=='object')continue;
      if(!out[id]||stamp(row)>stamp(out[id]))out[id]=clone(row);
    }
    return out;
  }
  function mirror(target=data){
    try{localStorage.setItem(LIVE_KEY,JSON.stringify(cloudStore(target)))}catch{}
  }
  function migrate(){
    const store=cloudStore();
    mergeStores(store,localStore());
    mirror();
    try{localStorage.setItem('kickbaseCoachV07',JSON.stringify(data))}catch{}
    return store;
  }

  const priorLiveLineups=typeof liveLineupsV1==='function'?liveLineupsV1:null;
  liveLineupsV1=function(){return cloudStore()};

  const priorRead=typeof readLiveLineupV1==='function'?readLiveLineupV1:null;
  readLiveLineupV1=function(managerId='me'){
    const row=cloudStore()?.[String(managerId||'me')]||null;
    if(row)return row;
    try{return priorRead?.call(this,managerId)||null}catch{return null}
  };

  const priorWrite=typeof writeLiveLineupV1==='function'?writeLiveLineupV1:null;
  writeLiveLineupV1=function(managerId='me',players=[],meta={}){
    const id=String(managerId||'me');
    let base=null;
    try{base=priorWrite?.call(this,id,players,meta)||null}catch(error){console.warn('[H2H] dev16 legacy live write skipped',error)}
    const old=cloudStore()[id]||{};
    const now=new Date().toISOString();
    const next={
      ...old,...(base&&typeof base==='object'?base:{}),...meta,
      players:Array.isArray(players)?[...players].filter(Boolean).slice(0,30):[],
      count:Array.isArray(players)?players.filter(Boolean).length:0,
      updatedAt:now,
      source:String(meta?.source||base?.source||old.source||'phase230-current')
    };
    if(Array.isArray(meta?.playerSnapshots))next.playerSnapshots=clone(meta.playerSnapshots);
    if(Array.isArray(meta?.bank))next.bank=[...meta.bank];
    cloudStore()[id]=next;
    mirror();
    try{localStorage.setItem('kickbaseCoachV07',JSON.stringify(data))}catch{}
    try{window.cloudQueueSave?.()}catch{}
    return next;
  };

  // Cloud merge may replace the global data object. Mirror the remote canonical
  // lineup store back to the legacy localStorage store before renderers read it.
  if(typeof mergeData==='function'){
    const priorMerge=mergeData;
    mergeData=function(...args){
      const merged=priorMerge.apply(this,args);
      try{
        const remote=cloudStore(merged);
        mergeStores(remote,localStore());
        localStorage.setItem(LIVE_KEY,JSON.stringify(remote));
      }catch(error){console.warn('[H2H] dev16 cloud lineup merge skipped',error)}
      return merged;
    };
  }

  // Ensure screenshot commits and manual edits become cloud-backed even when an
  // older layer mutates the store object directly instead of calling writeLiveLineupV1.
  function persistCanonicalStore({queue=true}={}){
    const store=cloudStore();
    const legacy=localStore();
    mergeStores(store,legacy);
    mirror();
    try{localStorage.setItem('kickbaseCoachV07',JSON.stringify(data))}catch{}
    if(queue)try{window.cloudQueueSave?.()}catch{}
    return store;
  }
  document.addEventListener('click',event=>{
    if(event.target?.closest?.('#aiCommit,#saveOpponentMd,#viewOpponentLineupAnalysis,#saveLineup,#saveOwnLineup')){
      setTimeout(()=>persistCanonicalStore({queue:true}),40);
    }
  },true);
  document.addEventListener('change',event=>{
    if(event.target?.matches?.('[data-opponent-player-state],[data-lineup-player],#oppMdFormation'))setTimeout(()=>persistCanonicalStore({queue:false}),60);
  });

  function health(){
    const store=cloudStore();
    const managers=Object.entries(store).map(([managerId,row])=>({managerId,count:Array.isArray(row?.players)?row.players.length:0,bank:Array.isArray(row?.bank)?row.bank.length:0,updatedAt:row?.updatedAt||'',source:row?.source||''}));
    return {
      version:VERSION,
      cloudBacked:true,
      currentLineupManagers:managers,
      screenshotResolver:typeof resolveScreenshotPlayerV216==='function',
      screenshotCommit:typeof commitScreenshotLineupCoreV224==='function'||typeof commitAiReview==='function',
      opponentRoster:typeof opponentRoster==='function',
      opponentEditor:typeof editOpponentMatchday==='function',
      historicalModel:window.H2H_PHASE230_OPPONENT_LINEUP_MODEL||'',
      cloudSave:typeof window.cloudQueueSave==='function'
    };
  }

  migrate();
  setTimeout(()=>persistCanonicalStore({queue:false}),1200);
  window.addEventListener('focus',()=>persistCanonicalStore({queue:false}));
  window.h2h230PersistCurrentLineups=persistCanonicalStore;
  window.h2h230CoreHealth=health;
  window.H2H_PHASE230_CURRENT_LINEUP_STORE='data.settings.phase230LiveLineups';
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
