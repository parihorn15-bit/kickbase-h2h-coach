(() => {
  const VERSION='3.0.0-integration21';
  const TEAM_MANAGER={
    'team::horn-capital-fc':'me',
    'team::faps-ham-united':'fabi',
    'team::al-elshani':'elias',
    'team::calcio-rom-fc':'manu',
    'team::cello-football-club':'marci',
    'team::fapse-fc':'fabio'
  };
  const MANAGER_TEAM=Object.fromEntries(Object.entries(TEAM_MANAGER).map(([team,manager])=>[manager,team]));
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const position=p=>({TW:'Tor',ABW:'Abwehr',MF:'Mittelfeld',ANG:'Sturm'}[String(p||'').toUpperCase()]||String(p||''));
  const api=()=>window.h2h230LeagueData||null;
  const model=()=>window.H2H_CANONICAL_MODEL||null;
  const currentMd=()=>Number(window?.data?.settings?.currentMd)||1;

  function canonicalTeamForManager(managerId){
    const teamId=MANAGER_TEAM[String(managerId||'')];
    return teamId?model()?.entities?.teams?.[teamId]||null:null;
  }
  function canonicalRoster(managerId){
    const team=canonicalTeamForManager(managerId),service=api();
    if(!team||!service?.squad)return [];
    try{
      const row=service.squad(team.name);
      return (row?.players||[]).map(p=>({
        id:p.player_id||norm(p.display_name),
        player_id:p.player_id||null,
        name:p.display_name||p.name||'',
        team:p.club||p.bundesliga_team||'',
        position:position((p.positions_seen||[])[0]||p.position||''),
        buyPrice:Number(p.buy_price||p.price)||0,
        marketValue:Number(p.market_value)||0,
        canonical:true
      })).filter(p=>p.name);
    }catch{return []}
  }
  function integrationStatus(){
    const service=api(),m=model();
    let validation={ok:false,counts:{teams:0,players:0,owned:0,transfers:0},issues:[{type:'service_not_ready'}]};
    try{if(service?.validate)validation=service.validate()}catch{}
    let overlay={events:[],ownership:{},lineups:{}};
    try{overlay=service?.overlay?.()||window.h2h230CanonicalOverlay?.()||overlay}catch{}
    return {
      version:VERSION,
      ready:!!(service&&m&&validation.ok),
      service_version:service?.version||null,
      teams:validation.counts?.teams||0,
      players:validation.counts?.players||0,
      owned:validation.counts?.owned||0,
      base_transfers:validation.counts?.transfers||0,
      imported_events:(overlay.events||[]).length,
      imported_lineups:Object.keys(overlay.lineups||{}).length,
      issues:validation.issues||[]
    };
  }

  function patchRosterFlows(){
    if(typeof opponentRoster==='function'&&!opponentRoster.__phase300integration){
      const prior=opponentRoster;
      opponentRoster=function(managerId,md=window?.data?.settings?.currentMd){
        const requested=Number(md)||currentMd();
        // Historical matchdays keep their frozen legacy reconstruction. Only the
        // live/current squad is resolved from the canonical 3.0 ownership model.
        if(requested===currentMd()){
          const rows=canonicalRoster(managerId);
          if(rows.length)return rows;
        }
        return prior.call(this,managerId,md);
      };
      opponentRoster.__phase300integration=true;
      try{resetOpponentRosterCache?.()}catch{}
    }
    if(typeof managerCurrentRoster==='function'&&!managerCurrentRoster.__phase300integration){
      const prior=managerCurrentRoster;
      managerCurrentRoster=function(managerId,md=window?.data?.settings?.currentMd){
        if(String(managerId)!=='me'&&Number(md)===currentMd()){
          const rows=canonicalRoster(managerId);if(rows.length)return rows;
        }
        return prior.call(this,managerId,md);
      };
      managerCurrentRoster.__phase300integration=true;
    }
    if(typeof opponentRosterPlayer==='function'&&!opponentRosterPlayer.__phase300integration){
      const prior=opponentRosterPlayer;
      opponentRosterPlayer=function(managerId,name,md=window?.data?.settings?.currentMd){
        if(Number(md)===currentMd()){
          const hit=canonicalRoster(managerId).find(p=>norm(p.name)===norm(name));
          if(hit)return hit;
        }
        return prior.call(this,managerId,name,md);
      };
      opponentRosterPlayer.__phase300integration=true;
    }
  }

  function patchTimeline(){
    if(typeof leagueIntelTimeline!=='function'||leagueIntelTimeline.__phase300integration)return;
    const prior=leagueIntelTimeline;
    leagueIntelTimeline=function(){
      const rows=prior.call(this)||[],service=api();
      let overlay={events:[]};try{overlay=service?.overlay?.()||window.h2h230CanonicalOverlay?.()||overlay}catch{}
      const known=new Set(rows.map(x=>`${norm(x.title)}|${x.date||''}|${x.md||0}`));
      for(const event of overlay.events||[]){
        const managerId=TEAM_MANAGER[event.manager_team_id]||null;
        const manager=typeof managerById==='function'?managerById(managerId):null;
        const type=event.direction==='BUY'?'Kauf':event.direction==='SELL'?'Verkauf':'Transfer';
        const title=`${manager?.team||canonicalTeamForManager(managerId)?.name||'Liga'}: ${type} ${event.player_name||event.player_id}`;
        const date=event.transfer_date||event.imported_at||'';
        const item={date,md:0,type:'canonical-transfer',icon:event.direction==='BUY'?'🟦':event.direction==='SELL'?'🟥':'🔄',title,text:[event.price&&typeof euro==='function'?euro(event.price):'', 'Screenshot · 3.0 Datenbasis'].filter(Boolean).join(' · ')};
        const key=`${norm(item.title)}|${item.date||''}|0`;if(!known.has(key)){known.add(key);rows.push(item)}
      }
      return rows.sort((a,b)=>{const da=a.date?new Date(a.date).getTime():0,db=b.date?new Date(b.date).getTime():0;return db-da||(+b.md||0)-(+a.md||0)});
    };
    leagueIntelTimeline.__phase300integration=true;
  }

  function managerPanelHtml(managerId){
    const team=canonicalTeamForManager(managerId),service=api();if(!team||!service)return '';
    let sq=null;try{sq=service.squad(team.name)}catch{}
    const profile=team.manager_profile||{};
    const tags=(profile.style_tags||[]).slice(0,4);
    const strengths=(profile.strengths||[]).slice(0,2);
    const risks=(profile.risks||[]).slice(0,2);
    return `<section class="phase300-manager-intel">
      <div class="phase300-manager-head"><div><span>3.0 DATENBASIS</span><h4>${typeof esc==='function'?esc(team.name):team.name}</h4></div><b>${sq?.players?.length||0} Spieler</b></div>
      <div class="phase300-manager-metrics"><span>ST1 <b>${team.md1_total??'–'}</b></span><span>Rang <b>${team.md1_rank??'–'}</b></span><span>Kaderwert <b>${typeof euro==='function'?euro(team.current_squad_market_value):team.current_squad_market_value}</b></span></div>
      ${tags.length?`<div class="phase300-tags">${tags.map(x=>`<span>${typeof esc==='function'?esc(x):x}</span>`).join('')}</div>`:''}
      ${(strengths.length||risks.length)?`<div class="phase300-profile-grid"><div><b>Stärken</b>${strengths.map(x=>`<small>+ ${typeof esc==='function'?esc(x):x}</small>`).join('')}</div><div><b>Risiken</b>${risks.map(x=>`<small>− ${typeof esc==='function'?esc(x):x}</small>`).join('')}</div></div>`:''}
    </section>`;
  }

  function statusPanelHtml(){
    const s=integrationStatus();
    return `<section class="phase300-integration-status ${s.ready?'good':'warn'}">
      <div><span>KICKBASE COACH 3.0</span><h3>${s.ready?'Liga-Datenbasis verbunden':'Liga-Datenbasis wird geladen'}</h3><small>Kanonische Spieler · Besitz · Historie · Screenshot-Overlay</small></div>
      <div class="phase300-status-numbers"><span><b>${s.teams}</b> Teams</span><span><b>${s.players}</b> Spieler</span><span><b>${s.imported_events}</b> neue Imports</span></div>
    </section>`;
  }

  function patchCompetitionView(){
    if(typeof competition!=='function'||competition.__phase300integration)return;
    const prior=competition;
    competition=function(...args){
      let html=prior.apply(this,args);
      if(typeof html!=='string')return html;
      if(!html.includes('phase300-integration-status')){
        const marker='<header class="league-page-header">';
        html=html.includes(marker)?html.replace(marker,statusPanelHtml()+marker):statusPanelHtml()+html;
      }
      let managerId='';try{managerId=String(window?.data?.ui?.selectedLeagueManager||'fabi')}catch{managerId='fabi'}
      if(html.includes('manager-profile-panel')&&!html.includes('phase300-manager-intel')){
        const marker='<div class="manager-current-md">';
        if(html.includes(marker))html=html.replace(marker,managerPanelHtml(managerId)+marker);
      }
      return html;
    };
    competition.__phase300integration=true;
  }

  function hook(){
    patchRosterFlows();patchTimeline();patchCompetitionView();
    window.H2H_PHASE300_INTEGRATION=true;
  }
  hook();setTimeout(hook,250);setTimeout(hook,1000);

  if(!document.getElementById('phase300IntegrationStyle')){
    const style=document.createElement('style');style.id='phase300IntegrationStyle';style.textContent=`
      .phase300-integration-status{margin:0 0 14px;padding:14px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:rgba(9,19,34,.82);display:flex;align-items:center;justify-content:space-between;gap:14px}.phase300-integration-status>div:first-child{display:grid;gap:3px}.phase300-integration-status span{font-size:11px;opacity:.7}.phase300-integration-status h3{margin:0}.phase300-status-numbers{display:flex;gap:8px;flex-wrap:wrap}.phase300-status-numbers span{padding:7px 9px;border-radius:10px;background:rgba(255,255,255,.07);opacity:1}.phase300-status-numbers b{font-size:14px}.phase300-manager-intel{margin:12px 0;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(8,18,32,.62);display:grid;gap:10px}.phase300-manager-head{display:flex;justify-content:space-between;align-items:center}.phase300-manager-head span{font-size:10px;letter-spacing:.08em;opacity:.65}.phase300-manager-head h4{margin:2px 0 0}.phase300-manager-metrics,.phase300-tags{display:flex;gap:7px;flex-wrap:wrap}.phase300-manager-metrics span,.phase300-tags span{padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.07);font-size:11px}.phase300-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.phase300-profile-grid>div{padding:9px;border-radius:10px;background:rgba(255,255,255,.045);display:grid;gap:4px}.phase300-profile-grid small{font-size:11px;line-height:1.35;opacity:.78}@media(max-width:760px){.phase300-integration-status{align-items:flex-start;flex-direction:column}.phase300-profile-grid{grid-template-columns:1fr}.phase300-status-numbers{width:100%}.phase300-status-numbers span{flex:1;text-align:center}}`;
    document.head.appendChild(style);
  }
  window.h2h300IntegrationStatus=integrationStatus;
  console.info(`[H2H] ${VERSION} loaded`,integrationStatus());
})();