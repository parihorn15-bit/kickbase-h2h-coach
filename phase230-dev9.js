(() => {
  const VERSION='2.3.0-dev9.2';
  const LIVE_KEY=typeof LIVE_LINEUP_STORAGE_KEY!=='undefined'?LIVE_LINEUP_STORAGE_KEY:'kickbaseCoachLiveLineupsV1';
  const norm=value=>String(value||'').toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ').trim();
  const compact=value=>norm(value).replace(/\s+/g,'');
  const surnameOf=p=>String(p?.last_name||p?.lastName||p?.name||'').trim().split(/\s+/).pop()||'';
  const playerId=p=>p?.external_id??p?.externalId??p?.id??null;
  const masterRows=()=>Array.isArray(window.BUNDESLIGA_PLAYERS)?window.BUNDESLIGA_PLAYERS:[];

  function unique(rows){
    const seen=new Set();
    return rows.filter(p=>{
      const id=playerId(p),key=id!=null?`id:${id}`:`name:${norm(p?.name)}`;
      if(!key||seen.has(key))return false;
      seen.add(key);return true;
    });
  }

  function editDistance(a,b){
    a=String(a||'');b=String(b||'');
    const prev=Array.from({length:b.length+1},(_,i)=>i),cur=Array(b.length+1).fill(0);
    for(let i=1;i<=a.length;i++){
      cur[0]=i;
      for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
      for(let j=0;j<=b.length;j++)prev[j]=cur[j];
    }
    return prev[b.length];
  }

  function resolveCanonical(input,{externalPlayerId=null,team=''}={}){
    const rows=unique(masterRows());
    if(!rows.length)return null;
    if(externalPlayerId!=null){
      const byId=rows.filter(p=>String(playerId(p))===String(externalPlayerId));
      if(byId.length===1)return {row:byId[0],confidence:1,reason:'master-id'};
    }

    const key=norm(input),ck=compact(input),teamKey=norm(team);
    if(!key)return null;
    const exact=rows.filter(p=>norm(p.name)===key||compact(p.name)===ck);
    if(exact.length===1)return {row:exact[0],confidence:.999,reason:'exact-name'};

    const surnameExact=rows.filter(p=>norm(surnameOf(p))===key||compact(surnameOf(p))===ck);
    if(surnameExact.length===1)return {row:surnameExact[0],confidence:.985,reason:'unique-surname'};
    if(surnameExact.length>1&&teamKey){
      const sameTeam=surnameExact.filter(p=>norm(p.team)===teamKey);
      if(sameTeam.length===1)return {row:sameTeam[0],confidence:.99,reason:'surname+team'};
    }

    if(ck.length>=5){
      const prefix=rows.filter(p=>{
        const sc=compact(surnameOf(p)),fc=compact(p.name);
        return sc.startsWith(ck)||ck.startsWith(sc)||fc.startsWith(ck)||fc.endsWith(ck);
      });
      if(prefix.length===1)return {row:prefix[0],confidence:.96,reason:'unique-prefix'};
      if(prefix.length>1&&teamKey){
        const sameTeam=prefix.filter(p=>norm(p.team)===teamKey);
        if(sameTeam.length===1)return {row:sameTeam[0],confidence:.97,reason:'prefix+team'};
      }
    }

    if(ck.length>=5){
      const fuzzy=rows.map(p=>{
        const sc=compact(surnameOf(p)),fc=compact(p.name);
        const d=Math.min(editDistance(ck,sc),editDistance(ck,fc));
        const base=Math.max(ck.length,Math.min(sc.length||99,fc.length||99),1);
        return {p,d,ratio:1-d/base};
      }).filter(x=>x.d<=1&&x.ratio>=.8);
      if(fuzzy.length===1)return {row:fuzzy[0].p,confidence:.93,reason:'unique-ocr-1char'};
      if(fuzzy.length>1&&teamKey){
        const sameTeam=fuzzy.filter(x=>norm(x.p.team)===teamKey);
        if(sameTeam.length===1)return {row:sameTeam[0].p,confidence:.94,reason:'ocr+team'};
      }
    }
    return null;
  }

  function kickbasePos(row,raw){
    try{
      const learned=window.h2h230KickbasePositionFor?.(row?.name||raw,playerId(row));
      if(learned?.position)return learned.position;
    }catch{}
    return row?.kickbase_position||row?.kickbasePosition||row?.kb_position||row?.position||'';
  }

  function canonicalIdentity(raw,context={}){
    const hit=resolveCanonical(raw,context);
    if(!hit)return null;
    const row=hit.row;
    return {
      name:String(row.name||raw),
      team:String(row.team||''),
      position:kickbasePos(row,raw),
      externalPlayerId:playerId(row),
      source:`bundesliga-master:${hit.reason}`,
      confidence:hit.confidence
    };
  }

  function patchSnapshot(snap){
    if(!snap)return false;
    const raw=String(snap.rawName||snap.name||'').trim();
    const hit=canonicalIdentity(raw,{externalPlayerId:snap.externalPlayerId,team:snap.teamAtImport||snap.team||''});
    if(!hit)return false;
    const before=JSON.stringify([snap.name,snap.team,snap.position,snap.externalPlayerId,snap.state]);
    snap.name=hit.name;
    snap.team=hit.team||snap.team||'';
    snap.kickbasePosition=hit.position||snap.kickbasePosition||'';
    snap.position=hit.position||snap.position||'';
    snap.positionSource=hit.position?'kickbase-canonical-dev9.2':(snap.positionSource||'');
    snap.externalPlayerId=hit.externalPlayerId??snap.externalPlayerId??null;
    snap.state=Number(hit.confidence||0)>=.93?'secure':(snap.state||'review');
    snap.reason=`2.3 dev9.2: kanonische Spieleridentität (${hit.source})`;
    snap.linkedAt=new Date().toISOString();
    const after=JSON.stringify([snap.name,snap.team,snap.position,snap.externalPlayerId,snap.state]);
    return before!==after;
  }

  function patchNameList(list,snapshots){
    if(!Array.isArray(list))return list;
    return list.map(name=>{
      const snap=(snapshots||[]).find(s=>norm(s.rawName||s.name)===norm(name)||norm(s.name)===norm(name));
      return snap?.name||canonicalIdentity(name)?.name||name;
    });
  }

  function migrateAll(){
    let changed=0;
    let liveStore={};
    try{liveStore=typeof liveLineupsV1==='function'?liveLineupsV1():JSON.parse(localStorage.getItem(LIVE_KEY)||'{}')}catch{}
    for(const live of Object.values(liveStore||{})){
      const snaps=Array.isArray(live?.playerSnapshots)?live.playerSnapshots:[];
      for(const snap of snaps)if(patchSnapshot(snap))changed++;
      if(snaps.length){live.players=snaps.map(s=>s.name).filter(Boolean).slice(0,11);live.count=live.players.length}
    }

    const managerData=data?.league?.managerData||data?.competition?.managerData||data?.managerData||null;
    if(managerData&&typeof managerData==='object'){
      for(const row of Object.values(managerData)){
        for(const entry of Object.values(row?.matchdays||{})){
          const snaps=Array.isArray(entry?.lineupSnapshot)?entry.lineupSnapshot:[];
          for(const snap of snaps)if(patchSnapshot(snap))changed++;
          if(snaps.length)entry.lineup=snaps.map(s=>s.name).filter(Boolean).slice(0,11);
          else entry.lineup=patchNameList(entry.lineup,[]);
          entry.bank=patchNameList(entry.bank,snaps);
        }
      }
    }

    try{localStorage.setItem(LIVE_KEY,JSON.stringify(liveStore))}catch{}
    if(changed){
      try{localStorage.setItem('kickbaseCoachV07',JSON.stringify(data))}catch{}
      try{resetOpponentRosterCache?.()}catch{}
      try{resetOpponentAnalysisCache?.()}catch{}
      try{window.cloudQueueSave?.()}catch{}
    }
    return changed;
  }

  if(typeof resolveScreenshotPlayerV216==='function'){
    const prior=resolveScreenshotPlayerV216;
    resolveScreenshotPlayerV216=function(input,context={}){
      const base=prior.apply(this,arguments);
      if(base?.matched&&base?.externalPlayerId!=null)return base;
      const hit=canonicalIdentity(input,{externalPlayerId:base?.externalPlayerId??context.externalPlayerId??null,team:context.team||context.club||base?.team||''});
      if(!hit)return base;
      return {matched:true,name:hit.name,team:hit.team,position:hit.position,externalPlayerId:hit.externalPlayerId,external_id:hit.externalPlayerId,confidence:hit.confidence,reason:hit.source,source:'phase230-general-canonical'};
    };
  }

  if(typeof opponentRoster==='function'){
    const prior=opponentRoster;
    opponentRoster=function(...args){
      const roster=(prior.apply(this,args)||[]).map(player=>{
        const hit=canonicalIdentity(player?.name,{externalPlayerId:player?.externalPlayerId??player?.external_id??null,team:player?.team||''});
        if(!hit)return player;
        return {...player,name:hit.name,team:hit.team||player.team||'',position:hit.position||player.position||'',kickbasePosition:hit.position||player.kickbasePosition||'',externalPlayerId:hit.externalPlayerId??player.externalPlayerId??player.external_id??null,canonicalized230:true};
      });
      const dedup=[];
      for(const p of roster){
        const id=p.externalPlayerId??p.external_id??null,key=id!=null?`id:${id}`:`name:${norm(p.name)}`;
        if(!dedup.some(x=>{const xid=x.externalPlayerId??x.external_id??null;return (xid!=null?`id:${xid}`:`name:${norm(x.name)}`)===key}))dedup.push(p);
      }
      return dedup;
    };
  }

  const priorRelink=window.h2h230RelinkAllStoredLineups;
  window.h2h230RelinkAllStoredLineups=function(...args){
    let changed=0;
    try{changed=Number(priorRelink?.apply(this,args)||0)}catch{}
    return changed+migrateAll();
  };

  window.h2h230ResolveCanonicalPlayer=resolveCanonical;
  window.h2h230CanonicalIdentity=canonicalIdentity;
  window.h2h230CanonicalizeStoredOpponents=migrateAll;
  setTimeout(()=>{try{migrateAll();window.h2h230RebuildOpponentPitch?.()}catch(e){console.warn('[H2H] dev9.2 migration skipped',e)}},1200);
  window.addEventListener('focus',()=>{try{migrateAll()}catch{}});
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
