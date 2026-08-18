(() => {
  const VERSION='2.3.0-dev1';
  const LIVE_KEY=typeof LIVE_LINEUP_STORAGE_KEY!=='undefined'?LIVE_LINEUP_STORAGE_KEY:'kickbaseCoachLiveLineupsV1';
  const norm=value=>String(value||'').toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ').trim();
  const parts=value=>norm(value).split(/\s+/).filter(Boolean);
  const surname=value=>parts(value).at(-1)||'';
  const uniqueById=rows=>{
    const seen=new Set();
    return rows.filter(p=>{
      const key=p?.external_id!=null?`id:${p.external_id}`:`n:${norm(p?.name)}`;
      if(!key||seen.has(key))return false;
      seen.add(key);return true;
    });
  };
  const editDistance=(a,b)=>{
    a=String(a||'');b=String(b||'');
    const dp=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
    for(let i=0;i<=a.length;i++)dp[i][0]=i;
    for(let j=0;j<=b.length;j++)dp[0][j]=j;
    for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
      dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    }
    return dp[a.length][b.length];
  };

  function masterResolve230(input,context={}){
    const raw=String(input||'').trim();
    const needle=norm(raw.replace(/\.{2,}$/,''));
    if(!needle)return {matched:false,confidence:0,reason:'Kein Spielername'};
    const rows=uniqueById(Array.isArray(window.BUNDESLIGA_PLAYERS)?window.BUNDESLIGA_PLAYERS:[]);
    const teamHint=norm(context.team||context.club||'');
    const token=parts(needle).at(-1)||needle;
    const score=p=>{
      const full=norm(p.name),last=norm(p.last_name||'')||surname(p.name);
      let s=0,reason='';
      if(full===needle){s=1;reason='exakter Mastername'}
      else if(last===token){s=.985;reason='exakter Nachname'}
      else if(token.length>=4&&last.startsWith(token)){s=.955;reason='abgeschnittener Nachname'}
      else if(token.length>=5){
        const d=editDistance(token,last),ratio=1-d/Math.max(token.length,last.length,1);
        if(d===1&&ratio>=.75){s=.93;reason='OCR-Toleranz 1 Zeichen'}
        else if(d===2&&token.length>=7&&ratio>=.76){s=.86;reason='OCR-Toleranz 2 Zeichen'}
      }
      if(!s&&needle.includes(' ')){
        const ns=parts(needle),fs=parts(full);
        const compatible=ns.every((x,i)=>fs[i]&&(fs[i]===x||fs[i].startsWith(x)||x.startsWith(fs[i])));
        if(compatible){s=.94;reason='Teil-/Präfixname'}
      }
      if(s&&teamHint&&norm(p.team)===teamHint)s=Math.min(1,s+.03);
      return {p,s,reason};
    };
    const ranked=rows.map(score).filter(x=>x.s>=.82).sort((a,b)=>b.s-a.s);
    if(!ranked.length)return {matched:false,confidence:0,reason:'kein Mastertreffer'};
    const best=ranked[0],second=ranked[1];
    const tied=second&&Math.abs(best.s-second.s)<.035;
    if(tied){
      const teamBest=teamHint?ranked.filter(x=>norm(x.p.team)===teamHint):[];
      if(teamBest.length===1){
        const p=teamBest[0].p;
        return {...p,matched:true,confidence:Math.max(.91,teamBest[0].s),reason:`${teamBest[0].reason} + Verein`};
      }
      return {matched:false,ambiguous:true,confidence:best.s,reason:`${ranked.slice(0,4).length} ähnliche Master-Kandidaten`,candidates:ranked.slice(0,6).map(x=>({external_id:x.p.external_id,name:x.p.name,team:x.p.team,position:x.p.position,confidence:x.s}))};
    }
    const p=best.p;
    return {...p,matched:true,confidence:best.s,reason:best.reason};
  }

  if(typeof inferScreenshotManagerV221==='function'){
    const baseInfer=inferScreenshotManagerV221;
    inferScreenshotManagerV221=function(d){
      const visible=typeof resolveScreenshotManagerV216b==='function'?resolveScreenshotManagerV216b(d?.manager||''):'';
      if(visible){
        let fallback=null;
        try{fallback=baseInfer(d)}catch{}
        return {managerId:visible,method:'sichtbarer Teamname',confidence:.995,aiManagerId:visible,rosterMatch:fallback?.ranked?.find?.(x=>x.managerId===visible)||null,ranked:fallback?.ranked||[]};
      }
      return baseInfer(d);
    };
  }

  if(typeof resolveScreenshotPlayerV216==='function'){
    const baseResolve=resolveScreenshotPlayerV216;
    resolveScreenshotPlayerV216=function(input,context={}){
      const master=masterResolve230(input,context);
      if(master.matched&&master.confidence>=.93)return master;
      let local=null;
      try{local=baseResolve(input,context)}catch(e){console.warn('2.3 resolver fallback',e)}
      if(local?.matched)return local;
      if(master.matched)return master;
      if(master.ambiguous)return master;
      return local||master;
    };
  }

  function snapshotFromReview230(r,targetManagerId){
    const rows=[];
    for(const x of r?.lineupReview||[]){
      const visible=String(document.querySelector(`[data-ai-lineup-name="${x.index}"]`)?.value||x.resolved||x.raw||'').trim();
      if(!visible)continue;
      const manualPos=String(document.querySelector(`[data-ai-lineup-pos="${x.index}"]`)?.value||'').trim();
      const resolved=resolveScreenshotPlayerV216(visible,{managerId:targetManagerId,team:x.team||'',position:manualPos||x.position||''});
      const matched=Boolean(resolved?.matched);
      const confidence=Number(resolved?.confidence||0);
      const name=String(matched?resolved.name:visible).trim();
      if(!name||rows.some(row=>norm(row.name)===norm(name)))continue;
      rows.push({
        index:x.index,
        rawName:String(x.raw||visible),
        name,
        externalPlayerId:resolved?.external_id??resolved?.id??null,
        team:String(resolved?.team||x.team||''),
        teamAtImport:String(x.team||resolved?.team||''),
        position:String(manualPos||(typeof canonicalLineupPosition==='function'?canonicalLineupPosition(resolved?.position):resolved?.position)||x.position||''),
        confidence,
        state:matched&&confidence>=.93?'secure':matched?'review':'open',
        reason:String(resolved?.reason||''),
        visualIndex:Number(x.index),
        linkedAt:matched?new Date().toISOString():null
      });
      if(rows.length>=11)break;
    }
    return rows;
  }

  if(typeof commitScreenshotLineupCoreV224==='function'){
    const baseCommit=commitScreenshotLineupCoreV224;
    commitScreenshotLineupCoreV224=async function(){
      const review=typeof screenshotImportReview!=='undefined'?screenshotImportReview:null;
      const target=document.querySelector('#aiTargetManager')?.value||review?.managerId||'';
      const snapshots=review&&document.querySelector('#aiLineup')?.checked?snapshotFromReview230(review,target):[];
      const result=await baseCommit();
      if(result?.ok&&target&&snapshots.length){
        try{
          const store=typeof liveLineupsV1==='function'?liveLineupsV1():JSON.parse(localStorage.getItem(LIVE_KEY)||'{}');
          const live=store[target]||{};
          live.players=snapshots.map(x=>x.name);
          live.playerSnapshots=snapshots;
          live.count=snapshots.length;
          live.complete=snapshots.length===11;
          live.snapshotVersion=230;
          live.masterUpdatedAt=Math.max(0,...(window.BUNDESLIGA_PLAYERS||[]).map(p=>Date.parse(p.source_updated_at||p.updated_at||0)||0))||null;
          store[target]=live;
          localStorage.setItem(LIVE_KEY,JSON.stringify(store));
          if(target!=='me'&&typeof managerMatchdayData==='function'){
            const md=Number(data.settings.currentMd)||1;
            const row=managerMatchdayData(target,md);
            row.lineup=snapshots.map(x=>x.name);
            row.lineupSnapshot=snapshots;
            row.lineupComplete=snapshots.length===11;
            row.lineupSource='screenshot-snapshot-2.3';
            row.lineupUpdatedAt=new Date().toISOString();
          }
          if(typeof resetOpponentRosterCache==='function')resetOpponentRosterCache();
          localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
          if(window.cloudQueueSave)window.cloudQueueSave();
          if(typeof render==='function')render();
        }catch(e){console.error('2.3 lineup snapshot enrich failed',e)}
      }
      return result;
    };
  }

  if(typeof opponentRoster==='function'){
    const baseOpponentRoster=opponentRoster;
    opponentRoster=function(managerId,md=data.settings.currentMd){
      const base=[...(baseOpponentRoster(managerId,md)||[])];
      const live=typeof readLiveLineupV1==='function'?readLiveLineupV1(managerId):null;
      const snaps=Array.isArray(live?.playerSnapshots)?live.playerSnapshots:[];
      const names=Array.isArray(live?.players)?live.players:[];
      for(let i=0;i<names.length;i++){
        const name=names[i];
        if(base.some(p=>norm(p.name)===norm(name)))continue;
        const snap=snaps.find(s=>norm(s.name)===norm(name))||snaps[i]||{};
        const master=masterResolve230(name,{team:snap.team||snap.teamAtImport||''});
        base.push({
          name:String(master.matched?master.name:(snap.name||name)),
          team:String(snap.teamAtImport||snap.team||master.team||''),
          position:String(snap.position||(typeof mapLivePosition==='function'?mapLivePosition(master.position):master.position)||''),
          externalPlayerId:snap.externalPlayerId??master.external_id??null,
          inferredFromLineup:true,
          source:'lineup-snapshot-2.3'
        });
      }
      return base;
    };
  }

  function relinkOpenSnapshots230(){
    let store;
    try{store=typeof liveLineupsV1==='function'?liveLineupsV1():JSON.parse(localStorage.getItem(LIVE_KEY)||'{}')}catch{return 0}
    let changed=0;
    for(const [managerId,live] of Object.entries(store||{})){
      const snaps=Array.isArray(live.playerSnapshots)?live.playerSnapshots:[];
      if(!snaps.length)continue;
      for(const snap of snaps){
        if(snap.state==='secure'&&snap.externalPlayerId!=null)continue;
        const r=masterResolve230(snap.rawName||snap.name,{team:snap.teamAtImport||snap.team||''});
        if(!r.matched||Number(r.confidence||0)<.93)continue;
        snap.name=r.name;
        snap.externalPlayerId=r.external_id??r.id??null;
        snap.team=snap.team||r.team||'';
        snap.position=snap.position||(typeof mapLivePosition==='function'?mapLivePosition(r.position):r.position)||'';
        snap.confidence=r.confidence;
        snap.state='secure';
        snap.reason=`nach Master-Update: ${r.reason||'eindeutig'}`;
        snap.linkedAt=new Date().toISOString();
        changed++;
      }
      live.players=snaps.map(s=>s.name);
      if(managerId!=='me'&&typeof managerMatchdayData==='function'){
        const row=managerMatchdayData(managerId,Number(live.snapshotMd||data.settings.currentMd)||1);
        row.lineup=[...live.players];row.lineupSnapshot=structuredClone(snaps);
      }
    }
    if(changed){
      localStorage.setItem(LIVE_KEY,JSON.stringify(store));
      localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
      if(typeof resetOpponentRosterCache==='function')resetOpponentRosterCache();
      if(window.cloudQueueSave)window.cloudQueueSave();
      if(typeof render==='function'&&!window.h2hEditingInProgress?.())render();
    }
    return changed;
  }

  let lastMasterStamp='';
  function checkMasterRefresh230(){
    const rows=window.BUNDESLIGA_PLAYERS||[];
    const stamp=String(Math.max(0,...rows.map(p=>Date.parse(p.source_updated_at||p.updated_at||0)||0)));
    if(!rows.length||stamp===lastMasterStamp)return;
    lastMasterStamp=stamp;
    const relinked=relinkOpenSnapshots230();
    window.H2H_PHASE230={version:VERSION,masterPlayers:rows.length,masterStamp:stamp,relinked,lastCheckedAt:new Date().toISOString()};
  }

  window.h2h230MasterResolve=masterResolve230;
  window.h2h230RelinkOpenSnapshots=relinkOpenSnapshots230;
  window.addEventListener('focus',checkMasterRefresh230);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkMasterRefresh230()});
  setInterval(checkMasterRefresh230,60000);
  setTimeout(checkMasterRefresh230,1200);
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
