(() => {
  const VERSION='2.3.0-dev14.1';
  const LIVE_KEY=typeof LIVE_LINEUP_STORAGE_KEY!=='undefined'?LIVE_LINEUP_STORAGE_KEY:'kickbaseCoachLiveLineupsV1';
  let editContext=null;

  const clone=value=>{try{return structuredClone(value)}catch{return JSON.parse(JSON.stringify(value))}};

  function rawLive(managerId){
    try{
      const store=JSON.parse(localStorage.getItem(LIVE_KEY)||'{}');
      return store?.[String(managerId||'me')]||null;
    }catch{return null}
  }

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
  function historical(row){const h=row?.historicalLineup230;return h&&Array.isArray(h.lineup)?h:null}
  function currentFormation(managerId){return String(rawLive(managerId)?.formation||'')}
  function currentBankFromModal(){return [...document.querySelectorAll('[data-opponent-player-state]')].filter(s=>s.value==='bank').map(s=>String(s.dataset.opponentPlayerState||'').trim()).filter(Boolean)}
  function currentLineupFromModal(){return [...document.querySelectorAll('[data-opponent-player-state]')].filter(s=>s.value==='lineup').map(s=>String(s.dataset.opponentPlayerState||'').trim()).filter(Boolean).slice(0,11)}

  function writeCurrent(managerId,lineup,{bank=[],formation=''}={}){
    try{
      const result=writeLiveLineupV1?.(managerId,lineup,{source:'manual-opponent-current',formation,snapshotMd:Number(data?.settings?.currentMd)||1});
      const store=JSON.parse(localStorage.getItem(LIVE_KEY)||'{}');
      if(store?.[String(managerId)]){
        store[String(managerId)].bank=[...bank];
        store[String(managerId)].formation=String(formation||store[String(managerId)].formation||'');
        localStorage.setItem(LIVE_KEY,JSON.stringify(store));
      }
      return result||rawLive(managerId);
    }catch(error){console.warn('[H2H] dev14.1 current opponent save failed',error);return null}
  }

  function fixtureKickoffMs(fixture){
    if(!fixture)return null;
    const direct=['kickoffAt','kickoff_at','dateTime','datetime','matchDateTime','match_date_time','dateTimeUTC','matchDateTimeUTC','startTime','start_time'];
    for(const key of direct){
      const value=fixture[key];
      if(value==null||value==='')continue;
      if(typeof value==='number'&&Number.isFinite(value))return value<1e12?value*1000:value;
      const parsed=Date.parse(String(value));
      if(Number.isFinite(parsed))return parsed;
    }
    const date=String(fixture.date||'').match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    const time=String(fixture.time||fixture.kickoff||fixture.matchTime||'').match(/(\d{1,2}):(\d{2})/);
    if(date&&time){
      const [,d,m,y]=date,[,hh,mm]=time;
      return new Date(Number(y),Number(m)-1,Number(d),Number(hh),Number(mm),0,0).getTime();
    }
    return null;
  }

  function firstKickoffMs(md){
    const fixtures=Array.isArray(window.FIXTURES)?window.FIXTURES:[];
    const values=fixtures.filter(f=>Number(f?.md)===Number(md)).map(fixtureKickoffMs).filter(Number.isFinite);
    return values.length?Math.min(...values):null;
  }
  function matchdayStarted(md){const first=firstKickoffMs(md);return Number.isFinite(first)&&Date.now()>=first}
  function hasPoints(row){return row?.points!==null&&row?.points!==undefined&&String(row.points).trim()!==''&&Number.isFinite(Number(row.points))}

  function captureHistory(managerId,md,{lineup=null,bank=null,formation=null,source='kickoff-lock'}={}){
    const row=rowFor(managerId,md);if(!row)return null;
    const existing=historical(row);if(existing)return existing;
    const live=rawLive(managerId)||{};
    const snap={
      lineup:Array.isArray(lineup)?[...lineup]:Array.isArray(live.players)?[...live.players]:[],
      bank:Array.isArray(bank)?[...bank]:Array.isArray(live.bank)?[...live.bank]:[],
      formation:String(formation??live.formation??row.formation??''),
      capturedAt:new Date().toISOString(),
      source,
      lockReason:source,
      firstKickoffAt:Number.isFinite(firstKickoffMs(md))?new Date(firstKickoffMs(md)).toISOString():null
    };
    row.historicalLineup230=snap;
    row.historicalLineupLocked230=true;
    row.historicalLineupLockedAt230=snap.capturedAt;
    row.historicalLineupLockReason230=source;
    try{save()}catch{}
    return snap;
  }

  function ensureHistoryIfLocked(managerId,md){
    const row=rowFor(managerId,md);if(!row||historical(row))return historical(row);
    if(matchdayStarted(md))return captureHistory(managerId,md,{source:'first-kickoff'});
    if(hasPoints(row))return captureHistory(managerId,md,{source:'points-fallback'});
    return null;
  }

  function withLineup(row,lineup,bank,formation,fn){
    if(!row)return fn();
    const prev={lineup:clone(row.lineup||[]),bank:clone(row.bank||[]),formation:row.formation};
    row.lineup=[...(lineup||[])];row.bank=[...(bank||[])];if(formation!==undefined)row.formation=String(formation||'');
    try{return fn()}finally{row.lineup=prev.lineup;row.bank=prev.bank;row.formation=prev.formation}
  }

  if(typeof editOpponentMatchday==='function'){
    const priorEdit=editOpponentMatchday;
    editOpponentMatchday=function(managerId,md,...rest){
      const id=String(managerId||''),day=Number(md)||Number(data?.settings?.currentMd)||1,row=rowFor(id,day);
      editContext={managerId:id,md:day};
      ensureHistoryIfLocked(id,day);
      const live=rawLive(id);
      if(!live)return priorEdit.call(this,id,day,...rest);
      return withLineup(row,live.players||[],live.bank||[],live.formation||'',()=>priorEdit.call(this,id,day,...rest));
    };
  }

  if(typeof opponentSquadPage==='function'){
    const priorPage=opponentSquadPage;
    opponentSquadPage=function(managerId,...rest){
      const id=String(managerId||''),md=Number(data?.settings?.currentMd)||1,row=rowFor(id,md),live=rawLive(id);
      ensureHistoryIfLocked(id,md);
      if(!live)return priorPage.call(this,id,...rest);
      return withLineup(row,live.players||[],live.bank||[],live.formation||'',()=>priorPage.call(this,id,...rest));
    };
  }

  if(typeof showOpponentLineupAnalysis==='function'){
    const priorShowAnalysis=showOpponentLineupAnalysis;
    showOpponentLineupAnalysis=function(managerId,md,...rest){
      const id=String(managerId||''),day=Number(md)||Number(data?.settings?.currentMd)||1,row=rowFor(id,day);
      const snap=ensureHistoryIfLocked(id,day)||historical(row);
      if(snap)return withLineup(row,snap.lineup,snap.bank,snap.formation,()=>priorShowAnalysis.call(this,id,day,...rest));
      const live=rawLive(id);
      if(live)return withLineup(row,live.players||[],live.bank||[],live.formation||'',()=>priorShowAnalysis.call(this,id,day,...rest));
      return priorShowAnalysis.call(this,id,day,...rest);
    };
  }

  document.addEventListener('click',event=>{
    const button=event.target?.closest?.('#saveOpponentMd,#viewOpponentLineupAnalysis,#clearOpponentMd');
    if(!button||!editContext?.managerId)return;
    const ctx={...editContext},row=rowFor(ctx.managerId,ctx.md);if(!row)return;
    const old={lineup:clone(row.lineup||[]),bank:clone(row.bank||[]),formation:row.formation};
    const lineup=button.id==='clearOpponentMd'?[]:currentLineupFromModal();
    const bank=button.id==='clearOpponentMd'?[]:currentBankFromModal();
    const formation=button.id==='clearOpponentMd'?'':String(document.getElementById('oppMdFormation')?.value||currentFormation(ctx.managerId)||'');
    const pointsValue=document.getElementById('oppMdPoints')?.value;

    if(!historical(row)&&pointsValue!==undefined&&pointsValue!==''&&Number.isFinite(Number(pointsValue))){
      captureHistory(ctx.managerId,ctx.md,{lineup,bank,formation,source:'points-fallback'});
    }else if(!historical(row)&&matchdayStarted(ctx.md)){
      captureHistory(ctx.managerId,ctx.md,{source:'first-kickoff'});
    }

    setTimeout(()=>{
      writeCurrent(ctx.managerId,lineup,{bank,formation});
      const snap=historical(row);
      if(snap){row.lineup=[...snap.lineup];row.bank=[...snap.bank];row.formation=snap.formation||row.formation||''}
      else{row.lineup=old.lineup;row.bank=old.bank;row.formation=old.formation}
      row.currentLineupUpdatedAt230=new Date().toISOString();
      try{save()}catch{}
    },0);
  },true);

  function sweepLocks(){
    const managers=typeof LEAGUE_MANAGERS!=='undefined'?LEAGUE_MANAGERS.filter(m=>!m.isMe):[];
    const maxMd=Math.max(Number(data?.settings?.currentMd)||1,...(Array.isArray(window.FIXTURES)?window.FIXTURES.map(f=>Number(f?.md)||0):[]));
    for(const manager of managers)for(let md=1;md<=maxMd;md++)ensureHistoryIfLocked(manager.id,md);
  }
  setTimeout(sweepLocks,1200);
  window.addEventListener('focus',sweepLocks);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)sweepLocks()});

  window.h2h230OpponentCurrentLineup=managerId=>rawLive(managerId);
  window.h2h230OpponentHistoricalLineup=(managerId,md)=>historical(rowFor(managerId,md));
  window.h2h230CaptureOpponentHistory=captureHistory;
  window.h2h230OpponentMatchdayStarted=matchdayStarted;
  window.h2h230OpponentFirstKickoffMs=firstKickoffMs;
  window.H2H_PHASE230_OPPONENT_LINEUP_MODEL='current-live+kickoff-locked-history';
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
