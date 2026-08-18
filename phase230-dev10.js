(() => {
  const VERSION='2.3.0-dev10';
  const norm=value=>String(value||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

  function pickerPlayer(name){
    const select=[...document.querySelectorAll('[data-opponent-player-state]')].find(el=>norm(el.dataset.opponentPlayerState)===norm(name));
    const card=select?.closest('.opponent-roster-player,.opponent-roster-row,.opponent-player-row,.form-card,.card');
    if(!card)return null;
    const text=card.innerText||'';
    return {select,card,text};
  }
  function identity(name){
    try{
      const hit=window.h2h230CanonicalIdentity?.(name);
      if(hit)return hit;
    }catch{}
    try{
      const roster=typeof opponentRoster==='function'?opponentRoster():[];
      const hit=roster.find(p=>norm(p?.name)===norm(name));
      if(hit)return {name:hit.name||name,team:hit.team||'',position:hit.kickbasePosition||hit.position||''};
    }catch{}
    return {name,team:'',position:''};
  }
  function escHtml(value){if(typeof esc==='function')return esc(value);return String(value??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}

  // Dev8 builds the pitch from names. Replace its metadata lookup with the same canonical identity
  // used by Dev9/the lower roster picker, eliminating e.g. Hashioka = "Verein unbekannt" on the pitch.
  function canonicalCard(name,state){
    const hit=identity(name);
    const team=hit.team||'Verein unbekannt';
    const pos=hit.position||'Unbekannt';
    const label=String(hit.name||name).trim();
    return `<button type="button" class="phase230-opp-player ${state==='bank'?'phase230-bank-player':'phase230-field-player'}" draggable="true" data-phase230-opp-drag="${escHtml(label)}"><b>${escHtml(label.split(/\s+/).pop())}</b><small>${escHtml(team)} · ${escHtml(pos)}</small></button>`;
  }

  function patchPitch(){
    const box=document.getElementById('phase230OpponentPitch');
    if(!box)return false;
    box.querySelectorAll('[data-phase230-opp-drag]').forEach(el=>{
      const raw=el.dataset.phase230OppDrag||el.querySelector('b')?.textContent||'';
      const hit=identity(raw);
      if(!hit)return;
      const full=String(hit.name||raw).trim();
      const small=el.querySelector('small');
      const bold=el.querySelector('b');
      if(bold)bold.textContent=full.split(/\s+/).pop();
      if(small)small.textContent=`${hit.team||'Verein unbekannt'} · ${hit.position||'Unbekannt'}`;
      // Keep the select's stored key intact when it differs; only display canonical metadata here.
      el.dataset.phase230CanonicalName=full;
    });
    return true;
  }

  const priorRebuild=window.h2h230RebuildOpponentPitch;
  if(typeof priorRebuild==='function'){
    window.h2h230RebuildOpponentPitch=function(...args){
      const result=priorRebuild.apply(this,args);
      patchPitch();
      return result;
    };
  }

  const observer=new MutationObserver(()=>patchPitch());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>{try{window.h2h230CanonicalizeStoredOpponents?.();window.h2h230RebuildOpponentPitch?.();patchPitch()}catch(e){console.warn('[H2H] dev10 pitch sync skipped',e)}},1400);
  window.addEventListener('focus',()=>setTimeout(patchPitch,50));
  window.h2h230PatchOpponentPitchCanonical=patchPitch;
  window.h2h230CanonicalOpponentCard=canonicalCard;
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
