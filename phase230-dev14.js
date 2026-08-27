(() => {
  const VERSION='2.3.0-dev14.0';
  const LIVE_KEY=typeof LIVE_LINEUP_STORAGE_KEY!=='undefined'?LIVE_LINEUP_STORAGE_KEY:'kickbaseCoachLiveLineupsV1';
  let editContext=null;

  const norm=value=>String(value||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const clone=value=>{try{return structuredClone(value)}catch{return JSON.parse(JSON.stringify(value))}};

  function rawLive(managerId){
    try{
      const store=JSON.parse(localStorage.getItem(LIVE_KEY)||'{}');
      return store?.[String(managerId||'me')]||null;
    }catch{return null}
  }

  // dev13 intentionally hid manager-wide LIVE state once a matchday had stored
  // data. dev14 replaces that rule: opponent LIVE is always the editable current
  // lineup; historical matchday analysis is stored separately below.
  const priorReadLive=typeof readLiveLineupV1==='function'?readLiveLineupV1:null;
  if(priorReadLive){
    readLiveLineupV1=function(managerId='me'){
      const id=String(managerId||'me');
      if(id==='me')return priorReadLive.call(this,id);
      return rawLive(id);
    };
  }

  function rowFor(managerId,md){
    try{return managerMatchdayData(String(managerId||''),Number(md)||Number(data?.settings?.currentMd)||1)}catch{return null}
  }

  function historical(row){
    const h=row?.historicalLineup230;
    return h&&Array.isArray(h.lineup)?h:null;
  }

  function currentPlayers(managerId){
    const live=rawLive(managerId);
    return Array.isArray(live?.players)?[...live.players]:[];
  }

  function currentFormation(managerId){
    return String(rawLive(managerId)?.formation||'');
  }

  function currentBankFromModal(){
    return [...document.querySelectorAll('[data-opponent-player-state]')]
      .filter(select=>select.value==='bank')
      .map(select=>String(select.dataset.opponentPlayerState||'').trim())
      .filter(Boolean);
  }

  function currentLineupFromModal(){
    return [...document.querySelectorAll('[data-opponent-player-state]')]
      .filter(select=>select.value==='lineup')
      .map(select=>String(select.dataset.opponentPlayerState||'').trim())
      .filter(Boolean)
      .slice(0,11);
  }

  function writeCurrent(managerId,lineup,{bank=[],formation=''}={}){
    try{
      const result=writeLiveLineupV1?.(managerId,lineup,{source:'manual-opponent-current',formation,snapshotMd:Number(data?.settings?.currentMd)||1});
      // Bank is not part of the old LIVE schema. Keep it alongside the manager-wide
      // current state so editor reopen can preserve explicit bank choices too.
      const store=JSON.parse(localStorage.getItem(LIVE_KEY)||'{}');
      if(store?.[String(managerId)]){
        store[String(managerId)].bank=[...bank];
        store[String(managerId)].formation=String(formation||store[String(managerId)].formation||'');
        localStorage.setItem(LIVE_KEY,JSON.stringify(store));
      }
      return result||rawLive(managerId);
    }catch(error){console.warn('[H2H] dev14 current opponent save failed',error);return null}
  }

  function snapshotForAnalysis(managerId,md,{force=false}={}){
    const row=rowFor(managerId,md);if(!row)return null;
    const existing=historical(row);
    if(existing&&!force)return existing;
    const live=rawLive(managerId);
    const lineup=Array.isArray(live?.players)?[...live.players]:[];
    const bank=Array.isArray(live?.bank)?[...live.bank]:[];
    const snap={
      lineup,bank,
      formation:String(live?.formation||row.formation||''),
      capturedAt:new Date().toISOString(),
      source:String(live?.source||'manual-opponent-current')
    };
    row.historicalLineup230=snap;
    row.historicalLineupLocked230=true;
    try{save()}catch{}
    return snap;
  }

  function withLineup(row,lineup,bank,formation,fn){
    if(!row)return fn();
    const prev={lineup:clone(row.lineup||[]),bank:clone(row.bank||[]),formation:row.formation};
    row.lineup=[...(lineup||[])];
    row.bank=[...(bank||[])];
    if(formation!==undefined)row.formation=String(formation||'');
    try{return fn()}finally{
      row.lineup=prev.lineup;row.bank=prev.bank;row.formation=prev.formation;
    }
  }

  // Current opponent editor always opens from manager-wide LIVE state. The
  // matchday row is only borrowed during synchronous HTML construction and is
  // restored immediately so historical data cannot become the editable source.
  if(typeof editOpponentMatchday==='function'){
    const priorEdit=editOpponentMatchday;
    editOpponentMatchday=function(managerId,md,...rest){
      const id=String(managerId||''),day=Number(md)||Number(data?.settings?.currentMd)||1,row=rowFor(id,day);
      editContext={managerId:id,md:day};
      const live=rawLive(id);
      if(!live)return priorEdit.call(this,id,day,...rest);
      return withLineup(row,live.players||[],live.bank||[],live.formation||'',()=>priorEdit.call(this,id,day,...rest));
    };
  }

  // The normal opponent squad page is also a CURRENT view. Prevent its old
  // implementation from copying manager-wide LIVE data permanently into the
  // selected matchday row.
  if(typeof opponentSquadPage==='function'){
    const priorPage=opponentSquadPage;
    opponentSquadPage=function(managerId,...rest){
      const id=String(managerId||''),md=Number(data?.settings?.currentMd)||1,row=rowFor(id,md),live=rawLive(id);
      if(!live)return priorPage.call(this,id,...rest);
      return withLineup(row,live.players||[],live.bank||[],live.formation||'',()=>priorPage.call(this,id,...rest));
    };
  }

  // Historical analysis reads an immutable per-matchday snapshot once one has
  // been captured. Changing the manager's CURRENT lineup afterwards cannot alter
  // that past analysis.
  if(typeof showOpponentLineupAnalysis==='function'){
    const priorShowAnalysis=showOpponentLineupAnalysis;
    showOpponentLineupAnalysis=function(managerId,md,...rest){
      const id=String(managerId||''),day=Number(md)||Number(data?.settings?.currentMd)||1,row=rowFor(id,day);
      const snap=historical(row)||snapshotForAnalysis(id,day);
      if(!snap)return priorShowAnalysis.call(this,id,day,...rest);
      return withLineup(row,snap.lineup,snap.bank,snap.formation,()=>priorShowAnalysis.call(this,id,day,...rest));
    };
  }

  // Capture current modal state before legacy click handlers mutate matchday data.
  // After those handlers finish, persist CURRENT to LIVE and restore the historical
  // fields. Non-lineup matchday information (points/note/date) remains untouched.
  document.addEventListener('click',event=>{
    const button=event.target?.closest?.('#saveOpponentMd,#viewOpponentLineupAnalysis,#clearOpponentMd');
    if(!button||!editContext?.managerId)return;
    const ctx={...editContext};
    const row=rowFor(ctx.managerId,ctx.md);if(!row)return;
    const old={lineup:clone(row.lineup||[]),bank:clone(row.bank||[]),formation:row.formation};
    const lineup=button.id==='clearOpponentMd'?[]:currentLineupFromModal();
    const bank=button.id==='clearOpponentMd'?[]:currentBankFromModal();
    const formation=button.id==='clearOpponentMd'?'':String(document.getElementById('oppMdFormation')?.value||currentFormation(ctx.managerId)||'');

    if(button.id==='viewOpponentLineupAnalysis'&&!historical(row)){
      row.historicalLineup230={lineup:[...lineup],bank:[...bank],formation,capturedAt:new Date().toISOString(),source:'analysis-capture'};
      row.historicalLineupLocked230=true;
    }

    setTimeout(()=>{
      writeCurrent(ctx.managerId,lineup,{bank,formation});
      // Legacy row.lineup/row.bank are no longer the current editor source.
      // Keep a historical snapshot authoritative if present; otherwise restore
      // what was there before this edit rather than storing the mutable current XI.
      const snap=historical(row);
      if(snap){row.lineup=[...snap.lineup];row.bank=[...snap.bank];row.formation=snap.formation||row.formation||''}
      else{row.lineup=old.lineup;row.bank=old.bank;row.formation=old.formation}
      row.currentLineupUpdatedAt230=new Date().toISOString();
      try{save()}catch{}
    },0);
  },true);

  window.h2h230OpponentCurrentLineup=managerId=>rawLive(managerId);
  window.h2h230OpponentHistoricalLineup=(managerId,md)=>historical(rowFor(managerId,md));
  window.h2h230CaptureOpponentHistory=snapshotForAnalysis;
  window.H2H_PHASE230_OPPONENT_LINEUP_MODEL='current-live+immutable-matchday-snapshot';
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
