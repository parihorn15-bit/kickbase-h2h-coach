(() => {
  const VERSION='3.0.0-import20';
  const KEY='h2h230CanonicalOverlayV1';
  const MANAGER_TEAM={
    me:'team::horn-capital-fc',fabi:'team::faps-ham-united',elias:'team::al-elshani',
    manu:'team::calcio-rom-fc',marci:'team::cello-football-club',fabio:'team::fapse-fc'
  };
  const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const slug=v=>norm(v).replace(/\s+/g,'-')||'unknown';
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  function loadOverlay(){
    try{return JSON.parse(localStorage.getItem(KEY)||'null')||{schema:'phase230-overlay-v1',updated_at:null,players:{},ownership:{},events:[],lineups:{}}}
    catch{return {schema:'phase230-overlay-v1',updated_at:null,players:{},ownership:{},events:[],lineups:{}}}
  }
  function saveOverlay(o){o.updated_at=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(o));try{window.cloudQueueSave?.()}catch{}return o}
  function teamIdForManager(id){return MANAGER_TEAM[String(id||'')]||null}
  function baseModel(){return window.H2H_CANONICAL_MODEL||null}
  function basePlayer(name){
    const api=window.h2h230LeagueData; if(!api?.resolvePlayer)return null;
    try{const r=api.resolvePlayer(name);return r&&!r.ambiguous?r:null}catch{return null}
  }
  function ensurePlayer(o,name,item={}){
    const base=basePlayer(name); if(base)return base;
    const key=`overlay::${slug(name)}`;
    if(!o.players[key])o.players[key]={player_id:key,display_name:String(name||'').trim(),normalized_name:norm(name),positions_seen:[],identity_basis:'screenshot-import',identity_confidence:Number(item?.t?.identityConfidence)||Number(item?.t?.confidence)||0.5,notes:['Added by 3.0.0 screenshot bridge']};
    return o.players[key];
  }
  function directionOf(item){
    const raw=norm(item?.t?.type||item?.type||'');
    if(/verkauf|sell|sold|abgang/.test(raw))return'SELL';
    if(/kauf|buy|bought|zugang/.test(raw))return'BUY';
    return'UNKNOWN';
  }
  function selectedIdsNow(){try{return new Set([...[...document.querySelectorAll('[data-ai]:checked')].map(x=>x.dataset.ai)])}catch{return new Set()}}
  function canonicalizeReview(review,targetManagerId,selectedIds){
    if(!review||!targetManagerId)return null;
    const teamId=teamIdForManager(targetManagerId);if(!teamId)return null;
    const selected=(review.items||[]).filter(x=>selectedIds.has(String(x.id)));
    return {
      manager_id:targetManagerId,team_id:teamId,screenshot_type:review.screenshotType||null,
      imported_at:new Date().toISOString(),
      transfers:selected.map(item=>({
        source_id:String(item.id),player:String(item?.t?.player||'').trim(),direction:directionOf(item),price:Number(item?.t?.price)||null,
        transfer_date:item?.derivedDate||null,relative_time:item?.t?.relative_time||null,confidence:Number(item?.t?.confidence)||null,
        identity_confidence:Number(item?.t?.identityConfidence)||null,raw_type:item?.t?.type||null
      })).filter(x=>x.player),
      lineup:(review.lineupReview||[]).filter(x=>x?.matched&&x?.resolved).map(x=>String(x.resolved)),
      md:Number(window?.data?.settings?.currentMd)||null
    };
  }
  function applyImport(payload){
    if(!payload)return null;const o=loadOverlay();let buys=0,sells=0,unknown=0;
    for(const tx of payload.transfers){
      const p=ensurePlayer(o,tx.player,{t:{identityConfidence:tx.identity_confidence,confidence:tx.confidence}}),pid=p.player_id;
      const event={event_id:`${payload.imported_at}::${pid}::${tx.direction}::${tx.price||0}`,player_id:pid,player_name:p.display_name,manager_team_id:payload.team_id,direction:tx.direction,price:tx.price,transfer_date:tx.transfer_date,relative_time:tx.relative_time,confidence:tx.confidence,identity_confidence:tx.identity_confidence,source:'screenshot-import-3.0.0',imported_at:payload.imported_at};
      if(!o.events.some(e=>e.event_id===event.event_id))o.events.unshift(event);
      if(tx.direction==='BUY'){o.ownership[pid]={team_id:payload.team_id,source:'screenshot-import-3.0.0',updated_at:payload.imported_at};buys++}
      else if(tx.direction==='SELL'){if(o.ownership[pid]?.team_id===payload.team_id)delete o.ownership[pid];else o.ownership[pid]={team_id:null,source:'screenshot-import-3.0.0-sale',updated_at:payload.imported_at};sells++}
      else unknown++;
    }
    if(payload.lineup.length){o.lineups[`${payload.team_id}::md${payload.md||'current'}`]={team_id:payload.team_id,md:payload.md,lineup:[...payload.lineup],source:'screenshot-import-3.0.0',updated_at:payload.imported_at}}
    saveOverlay(o);return {buys,sells,unknown,lineup:payload.lineup.length,events:o.events.length,updated_at:o.updated_at};
  }
  function patchService(){
    const api=window.h2h230LeagueData;if(!api||api.__phase8)return false;
    const base={resolvePlayer:api.resolvePlayer.bind(api),ownerOf:api.ownerOf.bind(api),squad:api.squad.bind(api),transfers:api.transfers.bind(api),playerTransfers:api.playerTransfers.bind(api),teamTimeline:api.teamTimeline.bind(api)};
    function overlayPlayer(ref){const o=loadOverlay(),q=norm(ref);return Object.values(o.players).find(p=>p.player_id===ref||p.normalized_name===q)||null}
    api.resolvePlayer=function(ref,opts={}){const op=overlayPlayer(ref);return op||base.resolvePlayer(ref,opts)};
    api.ownerOf=function(ref,opts={}){const o=loadOverlay(),p=api.resolvePlayer(ref,opts);if(!p||p.ambiguous)return p;const own=o.ownership[p.player_id];if(own){const team=own.team_id?baseModel()?.entities?.teams?.[own.team_id]||null:null;return{player:clone(p),ownership:clone(own),team:clone(team)}}return base.ownerOf(ref,opts)};
    api.squad=function(teamRef){const result=base.squad(teamRef);if(!result)return result;const o=loadOverlay(),tid=result.team.team_id,byId=new Map((result.players||[]).map(p=>[p.player_id,p]));for(const [pid,own] of Object.entries(o.ownership)){if(own.team_id===tid){const p=o.players[pid]||baseModel()?.entities?.players?.[pid];if(p)byId.set(pid,{...clone(p),...clone(own)})}else byId.delete(pid)}return{team:result.team,players:[...byId.values()]}}
    api.transfers=function(teamRef,opts={}){const baseRows=base.transfers(teamRef,{...opts,limit:10000}),t=api.resolveTeam(teamRef);if(!t)return baseRows;const o=loadOverlay(),rows=o.events.filter(e=>e.manager_team_id===t.team_id&&(!opts.direction||e.direction===opts.direction));return[...rows,...baseRows].slice(0,Math.max(0,Number(opts.limit)||100))}
    api.playerTransfers=function(ref,opts={}){const p=api.resolvePlayer(ref,opts);if(!p||p.ambiguous)return p;const o=loadOverlay();return{player:clone(p),events:[...o.events.filter(e=>e.player_id===p.player_id),...(base.playerTransfers(ref,opts)?.events||[])]}}
    api.teamTimeline=function(teamRef){const r=base.teamTimeline(teamRef);if(!r)return r;return{...r,transfers:api.transfers(teamRef,{limit:10000})}}
    api.overlay=()=>clone(loadOverlay()); api.__phase8=true;return true;
  }
  function importStatusBox(){
    const target=document.getElementById('screenshotImportResult');if(!target||document.getElementById('phase230CanonicalImportBox'))return;
    const box=document.createElement('div');box.id='phase230CanonicalImportBox';box.className='notice phase230-canonical-import';box.innerHTML='<b>3.0.0 Liga-Datenbasis</b><small>Bestätigte Transfers und Aufstellungen werden zusätzlich kanonisch verknüpft. Historische Spieltage bleiben unverändert.</small>';target.prepend(box);
  }
  function resultStatus(summary){const host=document.getElementById('screenshotImportStatus');if(!host||!summary)return;let el=document.getElementById('phase230CanonicalCommitStatus');if(!el){el=document.createElement('div');el.id='phase230CanonicalCommitStatus';el.className='notice';host.insertAdjacentElement('afterend',el)}el.textContent=`Liga-Datenbasis aktualisiert · ${summary.buys} Käufe · ${summary.sells} Verkäufe${summary.lineup?` · ${summary.lineup} Aufstellungsplätze`:''}`;el.dataset.kind='good'}
  function canonicalOpponentPanel(managerId,md){
    const teamId=teamIdForManager(managerId),api=window.h2h230LeagueData;if(!teamId||!api)return;
    const team=baseModel()?.entities?.teams?.[teamId];if(!team)return;const sq=api.squad(team.name);if(!sq)return;
    const anchor=document.querySelector('.opponent-roster-picker')||document.getElementById('oppMdFormation')?.closest?.('label')?.parentElement;if(!anchor||document.getElementById('phase230CanonicalOpponentPanel'))return;
    const box=document.createElement('section');box.id='phase230CanonicalOpponentPanel';box.className='phase230-canonical-opponent';box.innerHTML=`<b>Kanonischer Kader · ${team.name}</b><small>${sq.players.length} aktuell zugeordnete Spieler · Basis + bestätigte Screenshot-Updates</small><div>${sq.players.slice(0,18).map(p=>`<span>${String(p.display_name||p.name||'')}</span>`).join('')}</div>`;anchor.parentNode.insertBefore(box,anchor);
  }
  function hook(){
    patchService();
    if(typeof renderScreenshotAiResult==='function'&&!renderScreenshotAiResult.__phase8){const prior=renderScreenshotAiResult;renderScreenshotAiResult=function(...args){const out=prior.apply(this,args);setTimeout(importStatusBox,0);return out};renderScreenshotAiResult.__phase8=true}
    if(typeof commitAiReview==='function'&&!commitAiReview.__phase8){const prior=commitAiReview;commitAiReview=async function(...args){let review=null;try{review=screenshotImportReview?clone(screenshotImportReview):null}catch{}const target=document.getElementById('aiTargetManager')?.value||review?.managerId||'';const ids=selectedIdsNow();const payload=canonicalizeReview(review,target,ids);const out=await prior.apply(this,args);if(payload){const summary=applyImport(payload);patchService();setTimeout(()=>resultStatus(summary),0)}return out};commitAiReview.__phase8=true}
    if(typeof editOpponentMatchday==='function'&&!editOpponentMatchday.__phase8){const prior=editOpponentMatchday;editOpponentMatchday=function(managerId,md,...rest){const out=prior.call(this,managerId,md,...rest);setTimeout(()=>canonicalOpponentPanel(String(managerId),Number(md)),80);return out};editOpponentMatchday.__phase8=true}
  }
  hook();setTimeout(hook,250);setTimeout(hook,1000);
  if(!document.getElementById('phase230CanonicalBridgeStyle')){const s=document.createElement('style');s.id='phase230CanonicalBridgeStyle';s.textContent=`.phase230-canonical-import{margin-bottom:10px;display:grid;gap:4px}.phase230-canonical-import small{opacity:.75}.phase230-canonical-opponent{margin:10px 0;padding:11px;border:1px solid rgba(255,255,255,.13);border-radius:13px;background:rgba(10,20,36,.72);display:grid;gap:6px}.phase230-canonical-opponent small{opacity:.7}.phase230-canonical-opponent>div{display:flex;flex-wrap:wrap;gap:6px}.phase230-canonical-opponent span{padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.07);font-size:12px}@media(max-width:760px){.phase230-canonical-opponent{padding:10px}.phase230-canonical-opponent span{font-size:11px}}`;document.head.appendChild(s)}
  window.h2h230CanonicalOverlay=()=>clone(loadOverlay());window.h2h230ApplyCanonicalImport=applyImport;window.H2H_PHASE230_CANONICAL_IMPORT_BRIDGE=true;console.info(`[H2H] ${VERSION} loaded`);
})();