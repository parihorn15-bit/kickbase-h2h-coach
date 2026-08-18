(() => {
  const VERSION='2.3.0-dev7';
  const REGISTRY_KEY='kickbaseCoachKickbasePositionsV1';
  const norm=value=>String(value||'').toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ').trim();
  const validPosition=value=>['Tor','Abwehr','Mittelfeld','Sturm'].includes(String(value||''))?String(value):'';
  const canonical=value=>{
    const raw=String(value||'').trim();
    if(!raw)return '';
    if(typeof canonicalLineupPosition==='function')return validPosition(canonicalLineupPosition(raw));
    const k=norm(raw);
    if(/tor|goal|keeper|gk/.test(k))return 'Tor';
    if(/abwehr|defen|back|verteid/.test(k))return 'Abwehr';
    if(/mittel|midfield|mid/.test(k))return 'Mittelfeld';
    if(/sturm|offen|attack|forward|striker/.test(k))return 'Sturm';
    return validPosition(raw);
  };

  function readRegistry(){
    try{return JSON.parse(localStorage.getItem(REGISTRY_KEY)||'{}')||{}}catch{return {}}
  }
  function writeRegistry(reg){
    try{localStorage.setItem(REGISTRY_KEY,JSON.stringify(reg||{}))}catch{}
  }
  function learn(name,position,source='kickbase-screenshot',confidence=1){
    const key=norm(name),pos=canonical(position);
    if(!key||!pos)return false;
    const reg=readRegistry();
    const prior=reg[key];
    if(prior&&Number(prior.confidence||0)>Number(confidence||0))return false;
    reg[key]={position:pos,source,confidence:Number(confidence||1),updatedAt:new Date().toISOString()};
    writeRegistry(reg);
    return true;
  }

  // Verified directly from the Kickbase lineup screenshot used for the 2.3.0 regression test.
  // This is stored through the same registry mechanism as future learned screenshot positions,
  // not as an application-wide official-position override.
  learn('Ritsu Doan','Mittelfeld','verified-kickbase-lineup-screenshot-2026-08-18',1);

  function registryPosition(name){
    const row=readRegistry()[norm(name)];
    return row&&canonical(row.position)?{position:canonical(row.position),source:row.source||'kickbase-registry',confidence:Number(row.confidence||1)}:null;
  }
  function masterKickbasePosition(name,externalId){
    const rows=Array.isArray(window.BUNDESLIGA_PLAYERS)?window.BUNDESLIGA_PLAYERS:[];
    const player=rows.find(p=>
      (externalId!=null&&(String(p.external_id??p.id??'')===String(externalId))) ||
      norm(p.name)===norm(name)
    );
    if(!player)return null;
    const pos=canonical(player.kickbase_position||player.kickbasePosition||player.kb_position||'');
    return pos?{position:pos,source:'master-kickbase-position',confidence:1}:null;
  }
  function localKickbaseMetadata(name){
    try{
      if(typeof v219bKickbaseMetadata!=='function')return null;
      const row=v219bKickbaseMetadata(name);
      const pos=canonical(row?.kickbase_position||row?.kickbasePosition||row?.position||'');
      return pos?{position:pos,source:'legacy-kickbase-metadata',confidence:.98}:null;
    }catch{return null}
  }
  function preferredKickbasePosition({name,externalId,explicitPosition,explicitSource}={}){
    const learned=registryPosition(name);
    if(learned)return learned;
    const explicit=canonical(explicitPosition);
    if(explicit&&String(explicitSource||'').toLowerCase().includes('kickbase'))return {position:explicit,source:explicitSource,confidence:1};
    const master=masterKickbasePosition(name,externalId);
    if(master)return master;
    const legacy=localKickbaseMetadata(name);
    if(legacy)return legacy;
    return null;
  }

  // Preserve raw screenshot positional evidence before the legacy resolver enriches from club/master data.
  if(typeof resolveLineupV216==='function'){
    const priorResolveLineup=resolveLineupV216;
    resolveLineupV216=function(lineup,managerId=''){
      const input=Array.isArray(lineup)?lineup:[];
      const result=priorResolveLineup.apply(this,arguments)||[];
      return result.map((row,i)=>{
        const entry=input[i];
        const explicit=entry&&typeof entry==='object'
          ? canonical(entry.kickbase_position||entry.kickbasePosition||entry.position||'')
          : '';
        const explicitSource=entry&&typeof entry==='object'
          ? String(entry.positionSource||entry.position_source||entry.source||'kickbase-lineup-screenshot')
          : '';
        if(explicit)learn(row?.resolved||row?.raw||'',explicit,explicitSource||'kickbase-lineup-screenshot',.99);
        const kb=preferredKickbasePosition({
          name:row?.resolved||row?.raw||'',
          externalId:row?.externalPlayerId??row?.external_id??null,
          explicitPosition:explicit,
          explicitSource:explicitSource||'kickbase-lineup-screenshot'
        });
        if(!kb)return row;
        return {
          ...row,
          officialPosition:row?.officialPosition||row?.position||'',
          kickbasePosition:kb.position,
          position:kb.position,
          positionSource:kb.source,
          kickbasePositionConfidence:kb.confidence
        };
      });
    };
  }

  function applyToSnapshot(snap){
    if(!snap?.name)return false;
    const kb=preferredKickbasePosition({name:snap.name,externalId:snap.externalPlayerId});
    if(!kb)return false;
    const before=`${snap.position||''}|${snap.kickbasePosition||''}|${snap.positionSource||''}`;
    if(!snap.officialPosition&&snap.position&&snap.position!==kb.position)snap.officialPosition=snap.position;
    snap.kickbasePosition=kb.position;
    snap.position=kb.position;
    snap.positionSource=kb.source;
    snap.kickbasePositionConfidence=kb.confidence;
    const after=`${snap.position||''}|${snap.kickbasePosition||''}|${snap.positionSource||''}`;
    return before!==after;
  }
  function migrateStoredSnapshots(){
    let changed=0;
    const LIVE_KEY=typeof LIVE_LINEUP_STORAGE_KEY!=='undefined'?LIVE_LINEUP_STORAGE_KEY:'kickbaseCoachLiveLineupsV1';
    let liveStore={};
    try{liveStore=typeof liveLineupsV1==='function'?liveLineupsV1():JSON.parse(localStorage.getItem(LIVE_KEY)||'{}')}catch{}
    for(const live of Object.values(liveStore||{})){
      for(const snap of (Array.isArray(live?.playerSnapshots)?live.playerSnapshots:[]))if(applyToSnapshot(snap))changed++;
    }
    try{localStorage.setItem(LIVE_KEY,JSON.stringify(liveStore))}catch{}

    const managerData=data?.league?.managerData||data?.competition?.managerData||data?.managerData||null;
    if(managerData&&typeof managerData==='object'){
      for(const row of Object.values(managerData)){
        for(const entry of Object.values(row?.matchdays||{})){
          for(const snap of (Array.isArray(entry?.lineupSnapshot)?entry.lineupSnapshot:[]))if(applyToSnapshot(snap))changed++;
        }
      }
    }
    if(changed){
      try{localStorage.setItem('kickbaseCoachV07',JSON.stringify(data))}catch{}
      if(typeof resetOpponentRosterCache==='function')resetOpponentRosterCache();
      if(typeof resetOpponentAnalysisCache==='function')resetOpponentAnalysisCache();
      if(typeof render==='function'&&!window.h2hEditingInProgress?.())render();
    }
    return changed;
  }

  window.h2h230LearnKickbasePosition=learn;
  window.h2h230KickbasePositionFor=(name,externalId=null)=>preferredKickbasePosition({name,externalId});
  window.h2h230MigrateKickbasePositions=migrateStoredSnapshots;
  setTimeout(()=>{try{migrateStoredSnapshots()}catch(e){console.warn('2.3 Kickbase-position migration skipped',e)}},1800);
  window.addEventListener('focus',()=>{try{migrateStoredSnapshots()}catch{}});
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
