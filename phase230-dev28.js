(() => {
  const VERSION='3.0.0-ownership-evidence-corrections28';
  const FAPSE='team::fapse-fc';
  const FAEPS='team::faps-ham-united';
  const RIEDER='player::rieder';
  const FAEPS_SQUAD_VALUE=216978092;
  const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

  function apply(){
    const m=window.H2H_CANONICAL_MODEL;
    if(!m)return false;

    // Fapse FC / Ulrich: the original transfer screenshot shows the SELL row
    // above the BUY row on the same "vor 7 Tagen" screen. Kickbase lists the
    // newest event first, so BUY happened first and SELL happened afterwards.
    const ulrich=(m?.events?.transfers||[]).filter(e=>e?.manager_team_id===FAPSE&&norm(e?.player_name)==='ulrich'&&Number(e?.relative_time?.days_ago)===7);
    const buy=ulrich.find(e=>e.direction==='BUY');
    const sell=ulrich.find(e=>e.direction==='SELL');
    if(buy&&sell){
      const base=Date.parse(m.generated_at||'2026-09-03T13:16:00+02:00');
      const dayBase=(Number.isFinite(base)?base:Date.parse('2026-09-03T13:16:00+02:00'))-7*86400000;
      buy.absolute_time=new Date(dayBase).toISOString();
      sell.absolute_time=new Date(dayBase+1000).toISOString();
      buy.absolute_time_is_ordering_hint=true;
      sell.absolute_time_is_ordering_hint=true;
      buy.ordering_basis='Original screenshot: BUY row below SELL row on same relative day; Kickbase list is newest-first.';
      sell.ordering_basis=buy.ordering_basis;
    }

    // Fäps Ham United: original current-squad screenshots taken after the
    // Rieder sale explicitly show "SPIELER 12" and no Rieder in the roster.
    m.state=m.state||{};
    m.state.current_squads=m.state.current_squads||{};
    if(Array.isArray(m.state.current_squads[FAEPS]))m.state.current_squads[FAEPS]=m.state.current_squads[FAEPS].filter(id=>id!==RIEDER);
    m.state.current_ownership=m.state.current_ownership||{};
    delete m.state.current_ownership[RIEDER];
    const team=m?.entities?.teams?.[FAEPS];
    if(team){
      team.current_squad_size=12;
      team.current_squad_market_value=FAEPS_SQUAD_VALUE;
    }

    m.data_quality=m.data_quality||{};
    m.data_quality.ownership_evidence_corrections={
      version:VERSION,
      appliedAt:new Date().toISOString(),
      corrections:[
        {team_id:FAPSE,player:'Ulrich',type:'same-day-transfer-order',result:'BUY then SELL',evidence:'Original Fapse FC transfer screenshot; SELL row is newer and appears above BUY row, both marked vor 7 Tagen.'},
        {team_id:FAEPS,player:'Rieder',type:'current-snapshot',result:'removed-from-current-squad',squad_size:12,squad_market_value:FAEPS_SQUAD_VALUE,evidence:'Original Fäps Ham United screenshots: Rieder sold vor 2 Tagen; current Kader screen shows SPIELER 12 and no Rieder.'}
      ]
    };
    window.H2H_OWNERSHIP_EVIDENCE_CORRECTIONS=true;
    return true;
  }

  function refresh(){
    if(!apply())return false;
    if(typeof window.h2h300ReconcileOwnership==='function')window.h2h300ReconcileOwnership();
    if(typeof window.h2h300RenderOwnershipStatus==='function')window.h2h300RenderOwnershipStatus();
    return true;
  }

  refresh();
  setTimeout(refresh,350);
  setTimeout(refresh,1200);
  console.info(`[H2H] ${VERSION} loaded`);
})();
