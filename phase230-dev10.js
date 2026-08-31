(() => {
  const VERSION='2.3.0-dev10.4';
  const norm=value=>String(value||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const canonicalPos=value=>{
    const raw=String(value||'').trim();
    if(!raw)return '';
    try{const mapped=window.h2h230CanonicalPosition?.(raw)||canonicalLineupPosition(raw);if(mapped)return mapped}catch{}
    const k=norm(raw);
    if(/tor|goal|keeper|gk/.test(k))return 'Tor';
    if(/abwehr|defence|defender|verteid|back/.test(k))return 'Abwehr';
    if(/mittel|midfield|midfielder|mid/.test(k))return 'Mittelfeld';
    if(/sturm|angriff|offence|forward|striker|attack/.test(k))return 'Sturm';
    return '';
  };

  function pickerIdentity(name){
    try{return window.h2h230OpponentPickerIdentity?.(name)||null}catch{return null}
  }
  function identity(name){
    const picker=pickerIdentity(name)||{};
    try{
      const hit=window.h2h230CanonicalIdentity?.(name,{team:picker.team||''});
      if(hit&&(hit.team||hit.position||hit.externalPlayerId!=null))return {...picker,...hit,position:canonicalPos(hit.position)||hit.position||picker.position||''};
    }catch{}
    if(picker.team||picker.position)return {...picker,name,position:canonicalPos(picker.position)||picker.position||''};
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
        const hit=identity(raw);
        const full=String(hit?.name||raw).trim();
        const bold=el.querySelector('b'),small=el.querySelector('small');
        if(bold&&full){const nextBold=full.split(/\s+/).pop();if(bold.textContent!==nextBold)bold.textContent=nextBold}
        const current=String(small?.textContent||'');
        const currentParts=current.split('·').map(x=>x.trim());
        const currentTeam=currentParts[0]&&currentParts[0]!=='Verein unbekannt'?currentParts[0]:'';
        const currentPos=canonicalPos(currentParts.at(-1))||'';
        const team=hit?.team||currentTeam;
        const pos=canonicalPos(hit?.position)||hit?.position||currentPos;
        if(small&&(team||pos)){
          const nextSmall=`${team||'Verein unbekannt'} · ${pos||'Unbekannt'}`;
          if(small.textContent!==nextSmall)small.textContent=nextSmall;
        }
        if(full&&el.dataset.phase230CanonicalName!==full)el.dataset.phase230CanonicalName=full;
        if(hit?.externalPlayerId!=null&&el.dataset.phase230PlayerId!==String(hit.externalPlayerId))el.dataset.phase230PlayerId=String(hit.externalPlayerId);
      });
      try{window.h2h230PolishOpponentAnalysis?.()}catch{}
      return true;
    }finally{patching=false}
  }

  const priorRebuild=window.h2h230RebuildOpponentPitch;
  if(typeof priorRebuild==='function'){
    window.h2h230RebuildOpponentPitch=function(...args){const result=priorRebuild.apply(this,args);setTimeout(patchPitch,0);return result};
  }

  document.addEventListener('change',event=>{if(event.target?.matches?.('[data-opponent-player-state]'))setTimeout(patchPitch,0)});
  setTimeout(()=>{try{window.h2h230CanonicalizeStoredOpponents?.();window.h2h230RebuildOpponentPitch?.();patchPitch()}catch(e){console.warn('[H2H] dev10.4 pitch sync skipped',e)}},900);
  window.addEventListener('focus',()=>setTimeout(patchPitch,80));
  window.h2h230PatchOpponentPitchCanonical=patchPitch;
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
