(() => {
  const VERSION='2.3.0-dev10.3';
  const norm=value=>String(value||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const compact=value=>norm(value).replace(/\s+/g,'');
  const surname=value=>String(value||'').trim().split(/\s+/).pop()||'';

  function rosterIdentity(name){
    try{
      const roster=typeof opponentRoster==='function'?opponentRoster():[];
      const key=norm(name),ck=compact(name);
      const matches=roster.filter(p=>{
        const full=norm(p?.name),sur=norm(surname(p?.name));
        const fc=compact(p?.name),sc=compact(surname(p?.name));
        return full===key||sur===key||fc===ck||sc===ck||
          (ck.length>=5&&(sc.startsWith(ck)||ck.startsWith(sc)));
      });
      if(matches.length!==1)return null;
      const hit=matches[0];
      return {
        name:hit.name||name,
        team:hit.team||'',
        position:hit.kickbasePosition||hit.position||'',
        externalPlayerId:hit.externalPlayerId??hit.external_id??null,
        source:'canonical-opponent-roster-dev10.3'
      };
    }catch{return null}
  }

  function identity(name){
    try{
      const hit=window.h2h230CanonicalIdentity?.(name);
      if(hit&&(hit.team||hit.position||hit.externalPlayerId!=null))return hit;
    }catch{}
    const rosterHit=rosterIdentity(name);
    if(rosterHit)return rosterHit;
    return {name,team:'',position:''};
  }

  let patching=false;
  function patchPitch(){
    if(patching)return false;
    const box=document.getElementById('phase230OpponentPitch');
    if(!box)return false;
    patching=true;
    try{
      box.querySelectorAll('[data-phase230-opp-drag]').forEach(el=>{
        const raw=el.dataset.phase230CanonicalName||el.dataset.phase230OppDrag||el.querySelector('b')?.textContent||'';
        const hit=identity(raw); if(!hit)return;
        const full=String(hit.name||raw).trim();
        const nextBold=full.split(/\s+/).pop();
        const nextSmall=`${hit.team||'Verein unbekannt'} · ${hit.position||'Unbekannt'}`;
        const bold=el.querySelector('b'),small=el.querySelector('small');
        if(bold&&bold.textContent!==nextBold)bold.textContent=nextBold;
        if(small&&small.textContent!==nextSmall)small.textContent=nextSmall;
        if(el.dataset.phase230CanonicalName!==full)el.dataset.phase230CanonicalName=full;
        if(hit.externalPlayerId!=null&&el.dataset.phase230PlayerId!==String(hit.externalPlayerId))el.dataset.phase230PlayerId=String(hit.externalPlayerId);
      });
      try{window.h2h230PolishOpponentAnalysis?.()}catch{}
      return true;
    }finally{patching=false}
  }

  const priorRebuild=window.h2h230RebuildOpponentPitch;
  if(typeof priorRebuild==='function'){
    window.h2h230RebuildOpponentPitch=function(...args){
      const result=priorRebuild.apply(this,args);
      setTimeout(patchPitch,0);
      return result;
    };
  }

  // Targeted UI events replace the former document-wide MutationObserver.
  document.addEventListener('change',event=>{
    if(event.target?.matches?.('[data-opponent-player-state]'))setTimeout(patchPitch,0);
  });

  setTimeout(()=>{
    try{
      window.h2h230CanonicalizeStoredOpponents?.();
      window.h2h230RebuildOpponentPitch?.();
      patchPitch();
    }catch(e){console.warn('[H2H] dev10.3 pitch sync skipped',e)}
  },900);
  window.addEventListener('focus',()=>setTimeout(patchPitch,80));
  window.h2h230PatchOpponentPitchCanonical=patchPitch;
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
