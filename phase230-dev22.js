(() => {
  const VERSION='3.0.0-integration22';
  const TEAM_MANAGER={
    'team::horn-capital-fc':'me',
    'team::faps-ham-united':'fabi',
    'team::al-elshani':'elias',
    'team::calcio-rom-fc':'manu',
    'team::cello-football-club':'marci',
    'team::fapse-fc':'fabio'
  };
  const MANAGER_TEAM=Object.fromEntries(Object.entries(TEAM_MANAGER).map(([team,manager])=>[manager,team]));
  const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const position=p=>({TW:'Tor',ABW:'Abwehr',MF:'Mittelfeld',ANG:'Sturm'}[String(p||'').toUpperCase()]||String(p||''));
  const state=()=>{try{return typeof data!=='undefined'&&data?data:(window.data||{})}catch{return window.data||{}}};
  const currentMd=()=>Number(state()?.settings?.currentMd)||1;
  const model=()=>window.H2H_CANONICAL_MODEL||null;
  const service=()=>window.h2h230LeagueData||null;
  const canonicalTeam=managerId=>{const id=MANAGER_TEAM[String(managerId||'')];return id?model()?.entities?.teams?.[id]||null:null};
  const roster=managerId=>{
    const team=canonicalTeam(managerId),api=service();if(!team||!api?.squad)return [];
    try{return (api.squad(team.name)?.players||[]).map(p=>({id:p.player_id||norm(p.display_name),player_id:p.player_id||null,name:p.display_name||p.name||'',team:p.club||p.bundesliga_team||'',position:position((p.positions_seen||[])[0]||p.position||''),buyPrice:Number(p.buy_price||p.price)||0,marketValue:Number(p.market_value)||0,canonical:true})).filter(p=>p.name)}catch{return []}
  };

  function repatch(){
    // Re-wrap the original/legacy function, not dev21's wrapper, where possible.
    if(typeof opponentRoster==='function'){
      const legacy=opponentRoster.__phase300legacy||opponentRoster;
      const base=legacy.__phase300integration&&legacy.__phase300prior?legacy.__phase300prior:legacy;
      const wrapped=function(managerId,md=currentMd()){
        const requested=Number(md)||currentMd();
        if(requested===currentMd()){
          const rows=roster(managerId);if(rows.length)return rows;
        }
        return base.call(this,managerId,md);
      };
      wrapped.__phase300integration=true;wrapped.__phase300statefix=true;wrapped.__phase300prior=base;wrapped.__phase300legacy=base;
      opponentRoster=wrapped;
      try{resetOpponentRosterCache?.()}catch{}
    }
    if(typeof managerCurrentRoster==='function'){
      const base=managerCurrentRoster.__phase300prior||managerCurrentRoster;
      const wrapped=function(managerId,md=currentMd()){
        if(String(managerId)!=='me'&&(Number(md)||currentMd())===currentMd()){
          const rows=roster(managerId);if(rows.length)return rows;
        }
        return base.call(this,managerId,md);
      };
      wrapped.__phase300integration=true;wrapped.__phase300statefix=true;wrapped.__phase300prior=base;
      managerCurrentRoster=wrapped;
    }
    if(typeof opponentRosterPlayer==='function'){
      const base=opponentRosterPlayer.__phase300prior||opponentRosterPlayer;
      const wrapped=function(managerId,name,md=currentMd()){
        if((Number(md)||currentMd())===currentMd()){
          const hit=roster(managerId).find(p=>norm(p.name)===norm(name));if(hit)return hit;
        }
        return base.call(this,managerId,name,md);
      };
      wrapped.__phase300integration=true;wrapped.__phase300statefix=true;wrapped.__phase300prior=base;
      opponentRosterPlayer=wrapped;
    }
  }

  // Keep manager-profile selection tied to the actual app state, including on PWA.
  function patchManagerPanelSelection(){
    if(typeof competition!=='function'||competition.__phase300statefix)return;
    const prior=competition;
    competition=function(...args){
      let html=prior.apply(this,args);if(typeof html!=='string')return html;
      const managerId=String(state()?.ui?.selectedLeagueManager||'fabi');
      const team=canonicalTeam(managerId),api=service();
      if(!team||!api||html.includes('phase300-state-manager'))return html;
      let sq=null;try{sq=api.squad(team.name)}catch{}
      const profile=team.manager_profile||{},tags=(profile.style_tags||[]).slice(0,4);
      const card=`<section class="phase300-state-manager" style="margin:10px 0;padding:10px;border-radius:12px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.10)"><small>AKTUELLER 3.0 KADER</small><div style="display:flex;justify-content:space-between;gap:8px;margin-top:4px"><b>${typeof esc==='function'?esc(team.name):team.name}</b><span>${sq?.players?.length||0} Spieler</span></div>${tags.length?`<div style="margin-top:6px;font-size:11px;opacity:.75">${tags.map(x=>typeof esc==='function'?esc(x):x).join(' · ')}</div>`:''}</section>`;
      const marker='<div class="manager-current-md">';if(html.includes(marker))html=html.replace(marker,card+marker);
      return html;
    };
    competition.__phase300statefix=true;
  }

  function hook(){repatch();patchManagerPanelSelection();window.H2H_PHASE300_STATE_FIX=true;window.h2h300CurrentMd=currentMd;}
  hook();setTimeout(hook,300);setTimeout(hook,1200);
  console.info(`[H2H] ${VERSION} loaded; current MD`,currentMd());
})();