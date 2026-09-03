(() => {
  const VERSION='3.0.0-ownership-reconciliation27';
  const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const model=()=>window.H2H_CANONICAL_MODEL||null;

  function teamIdByName(name,m){
    const needle=norm(name);
    if(!needle||needle==='kickbase')return null;
    for(const [id,t] of Object.entries(m?.entities?.teams||{}))if(norm(t?.name)===needle)return id;
    return null;
  }

  function eventMoment(e,m){
    const absolute=Date.parse(e?.absolute_time||'');
    if(Number.isFinite(absolute))return absolute;
    const days=Number(e?.relative_time?.days_ago);
    const base=Date.parse(m?.generated_at||'');
    if(Number.isFinite(days)&&Number.isFinite(base))return base-days*86400000;
    return null;
  }

  function resolvePlayerId(e,m){
    if(e?.player_id&&m?.entities?.players?.[e.player_id])return {playerId:e.player_id,confidence:'exact-id'};
    const key=norm(e?.player_name||e?.player_id||'');
    const ids=[...(m?.indexes?.player_ids_by_normalized_name?.[key]||[])];
    if(ids.length===1)return {playerId:ids[0],confidence:'unique-name'};
    if(ids.length>1){
      const manager=e?.manager_team_id;
      const current=ids.filter(id=>m?.state?.current_ownership?.[id]?.team_id===manager);
      if(current.length===1)return {playerId:current[0],confidence:'name+current-team'};
      return {playerId:null,confidence:'ambiguous-name',candidates:ids};
    }
    return {playerId:null,confidence:'unresolved-name',candidates:[]};
  }

  function dedupeEvents(events,m){
    const seenIds=new Set(),seenSemantic=new Set(),out=[];
    for(const e of events){
      if(e?.event_id&&seenIds.has(e.event_id))continue;
      const r=resolvePlayerId(e,m);
      const moment=eventMoment(e,m);
      const day=Number.isFinite(moment)?new Date(moment).toISOString().slice(0,10):String(e?.relative_time?.days_ago??'');
      const semantic=[r.playerId||norm(e?.player_name),e?.manager_team_id,e?.direction,Number(e?.price)||0,day,norm(e?.counterparty_name)].join('|');
      if(seenSemantic.has(semantic))continue;
      if(e?.event_id)seenIds.add(e.event_id);
      seenSemantic.add(semantic);out.push({...e,__resolved:r,__moment:moment});
    }
    return out;
  }

  function replayPlayer(playerId,events,m){
    const rows=events.filter(e=>e.__resolved?.playerId===playerId).sort((a,b)=>{
      const ta=Number.isFinite(a.__moment)?a.__moment:-Infinity,tb=Number.isFinite(b.__moment)?b.__moment:-Infinity;
      if(ta!==tb)return ta-tb;
      const da=Number(a?.relative_time?.days_ago),db=Number(b?.relative_time?.days_ago);
      if(Number.isFinite(da)&&Number.isFinite(db)&&da!==db)return db-da;
      return String(b?.event_id||'').localeCompare(String(a?.event_id||''));
    });
    let owner=null,ownerKnown=false,ambiguous=false,lastMoment=null,lastEvents=[];
    const groups=new Map();
    for(const e of rows){
      const k=Number.isFinite(e.__moment)?String(e.__moment):`days:${e?.relative_time?.days_ago??'unknown'}`;
      if(!groups.has(k))groups.set(k,[]);groups.get(k).push(e);
    }
    for(const group of groups.values()){
      const buys=[...new Set(group.filter(e=>e.direction==='BUY').map(e=>e.manager_team_id).filter(Boolean))];
      const sells=group.filter(e=>e.direction==='SELL');
      if(buys.length===1){owner=buys[0];ownerKnown=true;ambiguous=false}
      else if(buys.length>1){owner=null;ownerKnown=false;ambiguous=true}
      else if(sells.length){
        const knownCounterparties=[...new Set(sells.map(e=>e.counterparty_team_id||teamIdByName(e.counterparty_name,m)).filter(Boolean))];
        if(knownCounterparties.length===1){owner=knownCounterparties[0];ownerKnown=true;ambiguous=false}
        else if(knownCounterparties.length>1){owner=null;ownerKnown=false;ambiguous=true}
        else {owner=null;ownerKnown=true;ambiguous=false}
      }
      lastMoment=group[0]?.__moment??lastMoment;lastEvents=group;
    }
    return {playerId,ownerTeamId:owner,ownerKnown,ambiguous,lastMoment,eventCount:rows.length,lastEvents:lastEvents.map(e=>e.event_id||null).filter(Boolean)};
  }

  function reconcile({write=true}={}){
    const m=model();if(!m)return {ok:false,reason:'canonical-model-missing'};
    const raw=Array.isArray(m?.events?.transfers)?m.events.transfers:[];
    const events=dedupeEvents(raw,m);
    const unresolved=events.filter(e=>!e.__resolved?.playerId).map(e=>({eventId:e.event_id||null,player:e.player_name||e.player_id||'',reason:e.__resolved?.confidence,candidates:e.__resolved?.candidates||[]}));
    const playerIds=[...new Set(events.map(e=>e.__resolved?.playerId).filter(Boolean))];
    const reconstructed=Object.fromEntries(playerIds.map(id=>[id,replayPlayer(id,events,m)]));

    const snapshotOwners=m?.state?.current_ownership||{};
    const squads=m?.state?.current_squads||{};
    const duplicateSquadOwnership=[];
    const squadOwners=new Map();
    for(const [teamId,ids] of Object.entries(squads))for(const id of ids||[]){
      if(!squadOwners.has(id))squadOwners.set(id,[]);squadOwners.get(id).push(teamId);
    }
    for(const [playerId,owners] of squadOwners)if(new Set(owners).size>1)duplicateSquadOwnership.push({playerId,teamIds:[...new Set(owners)]});

    const comparisons=[];
    for(const [playerId,r] of Object.entries(reconstructed)){
      const snapshotTeamId=snapshotOwners?.[playerId]?.team_id||null;
      let status='unverifiable';
      if(r.ambiguous||!r.ownerKnown)status='ambiguous-transfer-order';
      else if(r.ownerTeamId===snapshotTeamId)status='confirmed';
      else if(r.ownerTeamId&&!snapshotTeamId)status='bought-but-missing-from-snapshot';
      else if(!r.ownerTeamId&&snapshotTeamId)status='sold-but-still-in-snapshot';
      else if(r.ownerTeamId&&snapshotTeamId&&r.ownerTeamId!==snapshotTeamId)status='owner-conflict';
      else status='confirmed-free-agent';
      comparisons.push({playerId,playerName:m?.entities?.players?.[playerId]?.display_name||playerId,reconstructedTeamId:r.ownerTeamId,snapshotTeamId,status,eventCount:r.eventCount,lastMoment:r.lastMoment,lastEvents:r.lastEvents});
    }

    const teamIds=m?.league?.team_ids||Object.keys(m?.entities?.teams||{});
    const perTeam={};
    for(const teamId of teamIds){
      const snapshotIds=new Set(squads?.[teamId]||[]);
      const reconstructedIds=comparisons.filter(x=>x.reconstructedTeamId===teamId).map(x=>x.playerId);
      perTeam[teamId]={
        teamName:m?.entities?.teams?.[teamId]?.name||teamId,
        snapshotSquadCount:snapshotIds.size,
        declaredSquadCount:Number(m?.entities?.teams?.[teamId]?.current_squad_size)||null,
        reconstructedOwnedCount:reconstructedIds.length,
        confirmed:comparisons.filter(x=>x.status==='confirmed'&&x.snapshotTeamId===teamId).length,
        boughtButMissing:comparisons.filter(x=>x.status==='bought-but-missing-from-snapshot'&&x.reconstructedTeamId===teamId).map(x=>x.playerName),
        soldButStillPresent:comparisons.filter(x=>x.status==='sold-but-still-in-snapshot'&&x.snapshotTeamId===teamId).map(x=>x.playerName),
        ownerConflicts:comparisons.filter(x=>x.status==='owner-conflict'&&(x.snapshotTeamId===teamId||x.reconstructedTeamId===teamId)).map(x=>({player:x.playerName,reconstructedTeamId:x.reconstructedTeamId,snapshotTeamId:x.snapshotTeamId})),
        declaredSizeMatchesSnapshot:(Number(m?.entities?.teams?.[teamId]?.current_squad_size)||0)===snapshotIds.size
      };
    }

    const hardIssues=comparisons.filter(x=>['bought-but-missing-from-snapshot','sold-but-still-in-snapshot','owner-conflict'].includes(x.status));
    const report={
      version:VERSION,checkedAt:new Date().toISOString(),ok:hardIssues.length===0&&duplicateSquadOwnership.length===0,
      sourceEventCount:raw.length,dedupedEventCount:events.length,resolvedEventCount:events.length-unresolved.length,
      unresolvedEvents:unresolved,duplicateSquadOwnership,hardIssues,
      ambiguousPlayers:comparisons.filter(x=>x.status==='ambiguous-transfer-order'),
      confirmedPlayers:comparisons.filter(x=>x.status==='confirmed').length,
      comparisons,perTeam,
      note:'Transfer history is a visible screenshot window, so reconstructed ownership validates covered players only; it never overwrites observed current squads automatically.'
    };
    if(write){
      m.data_quality=m.data_quality||{};
      m.data_quality.ownership_reconciliation=report;
      m.state=m.state||{};m.state.reconstructed_ownership_from_transfers=reconstructed;
      window.H2H_OWNERSHIP_RECONCILIATION=report;
    }
    if(report.ok)console.info('[H2H] Transfer→Ownership reconciliation OK',report);
    else console.warn('[H2H] Transfer→Ownership reconciliation found inconsistencies',report);
    return report;
  }

  window.h2h300ReconcileOwnership=reconcile;
  let attempts=0,t=setInterval(()=>{attempts++;const m=model();if(m&&Array.isArray(m?.events?.transfers)&&m.events.transfers.length){reconcile();if(attempts>8)clearInterval(t)}else if(attempts>40)clearInterval(t)},300);
  setTimeout(reconcile,1800);
  console.info(`[H2H] ${VERSION} loaded`);
})();
