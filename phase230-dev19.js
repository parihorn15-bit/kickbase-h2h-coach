(() => {
  const VERSION='2.3.0-dev19.0';
  const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const model=()=>window.H2H_CANONICAL_MODEL||null;
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));

  function requireModel(){
    const m=model();
    if(!m) throw new Error('Canonical league anchor not loaded');
    return m;
  }
  function resolveTeam(ref){
    const m=requireModel(), teams=m.entities?.teams||{};
    if(ref&&teams[ref]) return teams[ref];
    const q=norm(ref);
    return Object.values(teams).find(t=>norm(t.name)===q)||null;
  }
  function resolvePlayer(ref,{team=null,position=null}={}){
    const m=requireModel(), players=m.entities?.players||{};
    if(ref&&players[ref]) return players[ref];
    const q=norm(ref); if(!q)return null;
    const ids=m.indexes?.player_ids_by_normalized_name?.[q]||[];
    let candidates=ids.map(id=>players[id]).filter(Boolean);
    if(team){
      const t=resolveTeam(team), ownership=m.state?.current_ownership||{};
      if(t)candidates=candidates.filter(p=>ownership[p.player_id]?.team_id===t.team_id);
    }
    if(position)candidates=candidates.filter(p=>(p.positions_seen||[]).some(x=>norm(x)===norm(position)));
    if(candidates.length===1)return candidates[0];
    if(!candidates.length){
      candidates=Object.values(players).filter(p=>norm(p.display_name)===q);
      if(candidates.length===1)return candidates[0];
    }
    return candidates.length?{ambiguous:true,query:String(ref),candidates}:null;
  }
  function ownerOf(playerRef,opts={}){
    const m=requireModel(), p=resolvePlayer(playerRef,opts);
    if(!p||p.ambiguous)return p;
    const own=m.state?.current_ownership?.[p.player_id]||null;
    return own?{player:clone(p),ownership:clone(own),team:clone(m.entities?.teams?.[own.team_id]||null)}:{player:clone(p),ownership:null,team:null};
  }
  function squad(teamRef){
    const m=requireModel(), t=resolveTeam(teamRef); if(!t)return null;
    const ids=m.state?.current_squads?.[t.team_id]||[];
    const ownership=m.state?.current_ownership||{}, players=m.entities?.players||{};
    return {team:clone(t),players:ids.map(id=>({...clone(players[id]),...clone(ownership[id])})).filter(Boolean)};
  }
  function transfers(teamRef,{limit=100,direction=null}={}){
    const m=requireModel(), t=resolveTeam(teamRef); if(!t)return [];
    return (m.events?.transfers||[]).filter(e=>e.manager_team_id===t.team_id&&(!direction||e.direction===direction)).slice(0,Math.max(0,Number(limit)||100)).map(clone);
  }
  function playerTransfers(playerRef,opts={}){
    const m=requireModel(), p=resolvePlayer(playerRef,opts); if(!p||p.ambiguous)return p;
    return {player:clone(p),events:(m.events?.transfers||[]).filter(e=>e.player_id===p.player_id).map(clone)};
  }
  function compareTeams(aRef,bRef){
    const m=requireModel(), a=resolveTeam(aRef), b=resolveTeam(bRef); if(!a||!b)return null;
    const fields=['current_squad_size','current_squad_market_value','md1_total','md1_rank'];
    const delta={}; for(const f of fields)delta[f]=(Number(a[f])||0)-(Number(b[f])||0);
    return {a:clone(a),b:clone(b),delta};
  }
  function matchday(md=1){
    const m=requireModel(); return clone(m.matchdays?.[`md${Number(md)}`]||null);
  }
  function searchPlayers(query,{team=null,limit=20}={}){
    const m=requireModel(), q=norm(query), ownership=m.state?.current_ownership||{}, players=m.entities?.players||{};
    const t=team?resolveTeam(team):null;
    return Object.values(players).filter(p=>{
      if(q&&!norm(p.display_name).includes(q))return false;
      if(t&&ownership[p.player_id]?.team_id!==t.team_id)return false;
      return true;
    }).slice(0,Math.max(1,Number(limit)||20)).map(p=>({player:clone(p),ownership:clone(ownership[p.player_id]||null)}));
  }
  function teamTimeline(teamRef){
    const m=requireModel(), t=resolveTeam(teamRef); if(!t)return null;
    const tx=(m.events?.transfers||[]).filter(e=>e.manager_team_id===t.team_id);
    const md=Object.values(m.matchdays||{}).map(x=>clone(x)).filter(Boolean);
    return {team:clone(t),transfers:clone(tx),matchdays:md};
  }
  function validate(){
    const m=requireModel(), issues=[];
    const ownership=m.state?.current_ownership||{}, players=m.entities?.players||{}, teams=m.entities?.teams||{};
    for(const [pid,o] of Object.entries(ownership)){
      if(!players[pid])issues.push({type:'ownership_missing_player',player_id:pid});
      if(o.team_id&&!teams[o.team_id])issues.push({type:'ownership_missing_team',player_id:pid,team_id:o.team_id});
    }
    for(const [tid,ids] of Object.entries(m.state?.current_squads||{})){
      if(!teams[tid])issues.push({type:'squad_missing_team',team_id:tid});
      for(const pid of ids)if(!players[pid])issues.push({type:'squad_missing_player',team_id:tid,player_id:pid});
    }
    return {ok:issues.length===0,issues,counts:{teams:Object.keys(teams).length,players:Object.keys(players).length,owned:Object.keys(ownership).length,transfers:(m.events?.transfers||[]).length}};
  }

  const api={version:VERSION,resolveTeam,resolvePlayer,ownerOf,squad,transfers,playerTransfers,compareTeams,matchday,searchPlayers,teamTimeline,validate};
  window.h2h230LeagueData=api;
  window.h2h230WhoOwns=(name,opts)=>ownerOf(name,opts);
  window.h2h230TeamSquad=team=>squad(team);
  window.h2h230TeamTransfers=(team,opts)=>transfers(team,opts);
  window.h2h230CompareTeams=(a,b)=>compareTeams(a,b);
  window.H2H_PHASE230_SERVICE_LAYER=true;
  console.info(`[H2H] Phase ${VERSION} loaded`,validate());
})();
