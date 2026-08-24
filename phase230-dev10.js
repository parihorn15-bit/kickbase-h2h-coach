(() => {
  const VERSION='2.3.0-dev10.1';
  const norm=value=>String(value||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

  function identity(name){
    try{const hit=window.h2h230CanonicalIdentity?.(name);if(hit)return hit}catch{}
    try{
      const roster=typeof opponentRoster==='function'?opponentRoster():[];
      const hit=roster.find(p=>norm(p?.name)===norm(name));
      if(hit)return {name:hit.name||name,team:hit.team||'',position:hit.kickbasePosition||hit.position||''};
    }catch{}
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
        const raw=el.dataset.phase230OppDrag||el.querySelector('b')?.textContent||'';
        const hit=identity(raw); if(!hit)return;
        const full=String(hit.name||raw).trim();
        const nextBold=full.split(/\s+/).pop();
        const nextSmall=`${hit.team||'Verein unbekannt'} · ${hit.position||'Unbekannt'}`;
        const bold=el.querySelector('b'),small=el.querySelector('small');
        // Important: only mutate the DOM when the value actually differs. This prevents
        // MutationObserver feedback loops that can freeze the page.
        if(bold&&bold.textContent!==nextBold)bold.textContent=nextBold;
        if(small&&small.textContent!==nextSmall)small.textContent=nextSmall;
        if(el.dataset.phase230CanonicalName!==full)el.dataset.phase230CanonicalName=full;
      });
      return true;
    }finally{patching=false}
  }

  const priorRebuild=window.h2h230RebuildOpponentPitch;
  if(typeof priorRebuild==='function'){
    window.h2h230RebuildOpponentPitch=function(...args){
      const result=priorRebuild.apply(this,args);
      patchPitch();
      return result;
    };
  }

  let scheduled=false;
  const observer=new MutationObserver(mutations=>{
    if(patching||scheduled)return;
    const relevant=mutations.some(m=>m.addedNodes?.length&&(
      [...m.addedNodes].some(n=>n.nodeType===1&&(n.id==='phase230OpponentPitch'||n.querySelector?.('#phase230OpponentPitch')))
    ));
    if(!relevant)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;patchPitch()});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  setTimeout(()=>{try{window.h2h230CanonicalizeStoredOpponents?.();window.h2h230RebuildOpponentPitch?.();patchPitch()}catch(e){console.warn('[H2H] dev10.1 pitch sync skipped',e)}},1400);
  window.addEventListener('focus',()=>setTimeout(patchPitch,50));
  window.h2h230PatchOpponentPitchCanonical=patchPitch;
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
