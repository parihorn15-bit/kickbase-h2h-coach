(() => {
  const VERSION='2.3.0-dev8.2';
  const norm=value=>String(value||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const compact=value=>norm(value).replace(/\s+/g,'');

  if(!document.getElementById('phase230OpponentPitchStyle')){
    const style=document.createElement('style');
    style.id='phase230OpponentPitchStyle';
    style.textContent=`
      .phase230-opponent-pitch-wrap{margin:18px 0;padding:16px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(13,22,28,.72)}
      .phase230-opponent-pitch-head{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:12px}.phase230-opponent-pitch-head span{font-size:11px;letter-spacing:.12em;opacity:.65}.phase230-opponent-pitch-head h3{margin:3px 0 0}.phase230-opponent-pitch-head small{opacity:.7}
      .phase230-opponent-pitch{min-height:430px;padding:24px 18px;border-radius:20px;background:linear-gradient(180deg,rgba(24,118,74,.88),rgba(13,83,52,.94));display:flex;flex-direction:column;justify-content:space-between;gap:16px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.12)}
      .phase230-pitch-row{min-height:72px;display:flex;justify-content:center;align-items:center;gap:12px;flex-wrap:wrap;position:relative}.phase230-row-label{position:absolute;left:4px;top:4px;font-size:10px;text-transform:uppercase;opacity:.55}.phase230-pitch-row em{opacity:.45}
      .phase230-opp-player{min-width:118px;max-width:160px;border:1px solid rgba(255,255,255,.2);border-radius:14px;padding:10px 12px;background:rgba(6,20,15,.78);color:inherit;display:flex;flex-direction:column;gap:3px;cursor:grab;box-shadow:0 8px 22px rgba(0,0,0,.18)}.phase230-opp-player:active{cursor:grabbing}.phase230-opp-player small{font-size:10px;opacity:.72;white-space:normal}.phase230-opp-player b{font-size:13px}
      .phase230-opponent-bank{margin-top:12px;min-height:76px;border:1px dashed rgba(255,255,255,.2);border-radius:14px;padding:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.phase230-opponent-bank>b{margin-right:4px}.phase230-bank-player{background:rgba(35,47,53,.92)}
      @media(max-width:720px){.phase230-opponent-pitch{min-height:360px;padding:18px 8px}.phase230-opp-player{min-width:92px;max-width:120px;padding:8px}.phase230-opponent-pitch-head{align-items:start;flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  function masterPlayers(){return Array.isArray(window.BUNDESLIGA_PLAYERS)?window.BUNDESLIGA_PLAYERS:[]}
  function surnameOf(player){const last=String(player?.last_name||player?.lastName||'').trim();return last||String(player?.name||'').trim().split(/\s+/).pop()||''}
  function masterCandidateForRaw(raw){
    const key=norm(raw),ck=compact(raw); if(!key)return null; const rows=masterPlayers();
    let matches=rows.filter(p=>{const full=norm(p.name),surname=norm(surnameOf(p)),fc=compact(p.name),sc=compact(surnameOf(p));return full===key||surname===key||fc===ck||sc===ck});
    if(matches.length===1)return matches[0];
    if(!matches.length&&ck.length>=5){matches=rows.filter(p=>{const s=compact(surnameOf(p)),f=compact(p.name);return s.startsWith(ck)||ck.startsWith(s)||f.endsWith(ck)||f.startsWith(ck)});if(matches.length===1)return matches[0]}
    if(ck==='becker'){const becker=rows.find(p=>compact(p.name)==='sheraldobecker');if(becker)return becker}
    return null;
  }

  if(typeof resolveScreenshotPlayerV216==='function'){
    const prior=resolveScreenshotPlayerV216;
    resolveScreenshotPlayerV216=function(input,context={}){
      const base=prior.apply(this,arguments); if(base?.matched)return base;
      const candidate=masterCandidateForRaw(input); if(!candidate)return base;
      return {matched:true,name:candidate.name,team:candidate.team||'',position:candidate.kickbase_position||candidate.kickbasePosition||candidate.position||'',externalPlayerId:candidate.external_id??candidate.id??null,confidence:.97,reason:'Eindeutiger aktueller Bundesliga-Mastertreffer (Nachname/Präfix)',source:'phase230-dev8-master-surname'};
    };
  }

  function positionOf(name){try{const kb=window.h2h230KickbasePositionFor?.(name);if(kb?.position)return kb.position}catch{} const master=masterCandidateForRaw(name);const raw=master?.kickbase_position||master?.kickbasePosition||master?.position||'';if(typeof canonicalLineupPosition==='function')return canonicalLineupPosition(raw)||raw||'Unbekannt';return raw||'Unbekannt'}
  function teamOf(name){return masterCandidateForRaw(name)?.team||''}
  function escHtml(value){if(typeof esc==='function')return esc(value);return String(value??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}

  let dragName='';
  let rebuilding=false;
  let lastStateSignature='';
  function selectedNames(value){return [...document.querySelectorAll('[data-opponent-player-state]')].filter(el=>el.value===value).map(el=>el.dataset.opponentPlayerState).filter(Boolean)}
  function stateSignature(){return [...document.querySelectorAll('[data-opponent-player-state]')].map(el=>`${el.dataset.opponentPlayerState||''}:${el.value||''}`).join('|')}
  function setState(name,state){const select=[...document.querySelectorAll('[data-opponent-player-state]')].find(el=>el.dataset.opponentPlayerState===name);if(!select)return;select.value=state;select.dispatchEvent(new Event('change',{bubbles:true}))}
  function card(name,state){const pos=positionOf(name),team=teamOf(name)||'Verein unbekannt';return `<button type="button" class="phase230-opp-player ${state==='bank'?'phase230-bank-player':'phase230-field-player'}" draggable="true" data-phase230-opp-drag="${escHtml(name)}"><b>${escHtml(name.split(/\s+/).pop())}</b><small>${escHtml(team)} · ${escHtml(pos)}</small></button>`}
  function rebuildInteractiveOpponentField(){
    if(rebuilding)return false;
    const picker=document.querySelector('.opponent-roster-picker'); if(!picker)return false;
    let box=document.getElementById('phase230OpponentPitch');
    const signature=stateSignature();
    if(box&&signature===lastStateSignature)return false;
    rebuilding=true;
    try{
      if(!box){box=document.createElement('section');box.id='phase230OpponentPitch';box.className='phase230-opponent-pitch-wrap';picker.parentNode.insertBefore(box,picker)}
      const lineup=selectedNames('lineup'),bank=selectedNames('bank'),groups={Tor:[],Abwehr:[],Mittelfeld:[],Sturm:[],Unbekannt:[]};
      lineup.forEach(name=>{const pos=positionOf(name);(groups[pos]||groups.Unbekannt).push(name)});
      const outfield=['Abwehr','Mittelfeld','Sturm'].map(p=>groups[p].length).join('-');
      box.innerHTML=`<div class="phase230-opponent-pitch-head"><div><span>INTERAKTIVE GEGNER-AUFSTELLUNG</span><h3>${lineup.length}/11 Startelf · ${outfield}</h3></div><small>Spieler per Drag & Drop zwischen Feld und Bank verschieben.</small></div><div class="phase230-opponent-pitch" data-phase230-drop="lineup">${['Sturm','Mittelfeld','Abwehr','Tor','Unbekannt'].map(pos=>`<div class="phase230-pitch-row" data-phase230-position="${pos}"><span class="phase230-row-label">${pos}</span>${groups[pos].map(n=>card(n,'lineup')).join('')||'<em>–</em>'}</div>`).join('')}</div><div class="phase230-opponent-bank" data-phase230-drop="bank"><b>Bank</b>${bank.map(n=>card(n,'bank')).join('')||'<span>Keine Spieler auf der Bank</span>'}</div>`;
      lastStateSignature=signature;
      box.querySelectorAll('[data-phase230-opp-drag]').forEach(el=>{el.addEventListener('dragstart',()=>{dragName=el.dataset.phase230OppDrag||''});el.addEventListener('click',()=>{const current=[...document.querySelectorAll('[data-opponent-player-state]')].find(s=>s.dataset.opponentPlayerState===el.dataset.phase230OppDrag)?.value;setState(el.dataset.phase230OppDrag,current==='lineup'?'bank':'lineup')})});
      box.querySelectorAll('[data-phase230-drop]').forEach(zone=>{zone.addEventListener('dragover',e=>e.preventDefault());zone.addEventListener('drop',e=>{e.preventDefault();if(!dragName)return;const target=zone.dataset.phase230Drop;if(target==='lineup'&&selectedNames('lineup').length>=11&&!selectedNames('lineup').includes(dragName)){if(typeof toast==='function')toast('Maximal 11 Spieler in der Startelf');return}setState(dragName,target);dragName=''})});
      try{window.h2h230PatchOpponentPitchCanonical?.();window.h2h230PolishOpponentAnalysis?.()}catch{}
      return true;
    }finally{
      rebuilding=false;
    }
  }

  // Freeze-safe lifecycle: no document-wide MutationObserver. Rebuild only after relevant user/UI events.
  // State deduplication prevents a synthetic change event plus follow-up hooks from rebuilding the same pitch repeatedly.
  let scheduled=false;
  function scheduleRebuild(delay=40){
    if(scheduled)return;
    scheduled=true;
    setTimeout(()=>{scheduled=false;rebuildInteractiveOpponentField()},delay);
  }
  document.addEventListener('change',event=>{
    if(event.target?.matches?.('[data-opponent-player-state]'))scheduleRebuild(0);
  });
  document.addEventListener('click',event=>{
    const target=event.target;
    if(target?.closest?.('.opponent-roster-picker,[data-opponent-player-state]')||/bearbeiten|aufstellung|spieltag/i.test(target?.textContent||''))scheduleRebuild(80);
  });
  window.addEventListener('focus',()=>scheduleRebuild(100));
  setTimeout(()=>scheduleRebuild(0),500);

  window.h2h230ResolveMasterSurname=masterCandidateForRaw;
  window.h2h230RebuildOpponentPitch=rebuildInteractiveOpponentField;
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
