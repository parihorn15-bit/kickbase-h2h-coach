(() => {
  const VERSION='2.3.0-dev9';
  const LIVE_KEY=typeof LIVE_LINEUP_STORAGE_KEY!=='undefined'?LIVE_LINEUP_STORAGE_KEY:'kickbaseCoachLiveLineupsV1';
  const norm=value=>String(value||'').toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ').trim();
  const compact=value=>norm(value).replace(/\s+/g,'');

  // Verified current Bundesliga identity + Kickbase positional evidence from the supplied lineup screenshot.
  const VERIFIED_ALIASES=[
    {prefixes:['hashio','hashioka'],name:'Daiki Hashioka',team:'Borussia Mönchengladbach',kickbasePosition:'Abwehr'},
    {prefixes:['becker','sheraldobecker'],name:'Sheraldo Becker',team:'1. FSV Mainz 05',kickbasePosition:'Sturm'}
  ];

  function masterRows(){return Array.isArray(window.BUNDESLIGA_PLAYERS)?window.BUNDESLIGA_PLAYERS:[]}
  function surnameOf(p){return String(p?.last_name||p?.lastName||p?.name||'').trim().split(/\s+/).pop()||''}
  function aliasFor(raw){
    const ck=compact(raw);
    return VERIFIED_ALIASES.find(a=>a.prefixes.some(prefix=>ck===prefix||ck.startsWith(prefix)||prefix.startsWith(ck)))||null;
  }
  function candidate(raw){
    const key=norm(raw),ck=compact(raw);
    if(!key)return null;
    let rows=masterRows().filter(p=>{
      const full=norm(p.name),sur=norm(surnameOf(p));
      const fc=compact(p.name),sc=compact(surnameOf(p));
      return full===key||sur===key||fc===ck||sc===ck||
        (ck.length>=5&&(sc.startsWith(ck)||ck.startsWith(sc)||fc.endsWith(ck)));
    });
    if(rows.length===1)return rows[0];
    const alias=aliasFor(raw);
    if(!alias)return null;
    const current=masterRows().find(p=>compact(p.name)===compact(alias.name));
    return current||{name:alias.name,team:alias.team,kickbase_position:alias.kickbasePosition,source:'verified-phase230-alias'};
  }
  function kickbasePos(row,raw){
    try{
      const learned=window.h2h230KickbasePositionFor?.(row?.name||raw,row?.external_id??row?.id??null);
      if(learned?.position)return learned.position;
    }catch{}
    const alias=aliasFor(raw)||aliasFor(row?.name);
    return alias?.kickbasePosition||row?.kickbase_position||row?.kickbasePosition||row?.position||'';
  }
  function canonicalIdentity(raw){
    const row=candidate(raw);
    if(!row)return null;
    const alias=aliasFor(raw)||aliasFor(row.name);
    return {
      name:String(row.name||alias?.name||raw),
      team:String(row.team||alias?.team||''),
      position:kickbasePos(row,raw),
      externalPlayerId:row.external_id??row.id??null,
      source:row.source||'bundesliga-master'
    };
  }

  // Teach Dev7 the verified Kickbase position without overwriting official club position semantics.
  for(const a of VERIFIED_ALIASES){
    try{window.h2h230LearnKickbasePosition?.(a.name,a.kickbasePosition,'verified-kickbase-lineup-screenshot-2026-08-18',1)}catch{}
  }

  function patchSnapshot(snap){
    if(!snap)return false;
    const raw=String(snap.rawName||snap.name||'').trim();
    const hit=canonicalIdentity(raw);
    if(!hit)return false;
    const before=JSON.stringify([snap.name,snap.team,snap.position,snap.externalPlayerId,snap.state]);
    snap.name=hit.name;
    snap.team=hit.team||snap.team||'';
    snap.kickbasePosition=hit.position||snap.kickbasePosition||'';
    snap.position=hit.position||snap.position||'';
    snap.positionSource=hit.position?'kickbase-canonical-dev9':(snap.positionSource||'');
    snap.externalPlayerId=hit.externalPlayerId??snap.externalPlayerId??null;
    snap.state='secure';
    snap.reason='2.3 dev9: kanonische Spieleridentität nachgezogen';
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
      if(snaps.length){
        live.players=snaps.map(s=>s.name).filter(Boolean).slice(0,11);
        live.count=live.players.length;
      }
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

  // Make roster rendering canonical as well, so the lower picker and the pitch never disagree again.
  if(typeof opponentRoster==='function'){
    const prior=opponentRoster;
    opponentRoster=function(...args){
      const roster=(prior.apply(this,args)||[]).map(player=>{
        const hit=canonicalIdentity(player?.name);
        if(!hit)return player;
        return {
          ...player,
          name:hit.name,
          team:hit.team||player.team||'',
          position:hit.position||player.position||'',
          kickbasePosition:hit.position||player.kickbasePosition||'',
          externalPlayerId:hit.externalPlayerId??player.externalPlayerId??player.external_id??null,
          canonicalized230:true
        };
      });
      const dedup=[];
      for(const p of roster){
        const key=p.externalPlayerId!=null?`id:${p.externalPlayerId}`:`name:${norm(p.name)}`;
        if(!dedup.some(x=>(x.externalPlayerId!=null?`id:${x.externalPlayerId}`:`name:${norm(x.name)}`)===key))dedup.push(p);
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

  window.h2h230CanonicalIdentity=canonicalIdentity;
  window.h2h230CanonicalizeStoredOpponents=migrateAll;
  setTimeout(()=>{try{migrateAll();window.h2h230RebuildOpponentPitch?.()}catch(e){console.warn('[H2H] dev9 migration skipped',e)}},1200);
  window.addEventListener('focus',()=>{try{migrateAll()}catch{}});
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
