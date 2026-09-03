(() => {
  const VERSION='3.0.0-faps-transfer-anchor24';
  const TEAM_ID='team::faps-ham-united';
  const TEAM_NAME='Fäps Ham United';
  const events=[
    ['Imeri','BUY',4000029,{hours_ago:6}],
    ['Rieder','SELL',15377888,{days_ago:2}],
    ['Becker','BUY',8888898,{days_ago:3}],
    ['Backhaus','SELL',17404679,{days_ago:5}],
    ['Banks','SELL',6188958,{days_ago:5}],
    ['Santos','SELL',7521854,{days_ago:5}],
    ['Santos','BUY',7769999,{days_ago:6}],
    ['Klaus','SELL',5237059,{days_ago:7}],
    ['Banks','BUY',5750000,{days_ago:8}],
    ['Simpson-Pusey','BUY',12450000,{days_ago:9}],
    ['Zingerle','BUY',500099,{days_ago:9}],
    ['Ebnoutalib','BUY',11999999,{days_ago:9}],
    ['Sticker','SELL',6132677,{days_ago:11}],
    ['Nyland','SELL',5179027,{days_ago:11}],
    ['Marino','SELL',10024081,{days_ago:11}],
    ['Hendriks','SELL',13101042,{days_ago:13}],
    ['Klaus','BUY',1999999,{days_ago:17}],
    ['Kimmich','BUY',63666666,{days_ago:18}],
    ['Mwene','SELL',8326218,{days_ago:18}],
    ['Nyland','BUY',3777777,{days_ago:19}],
    ['Keidel','BUY',4555555,{days_ago:19}],
    ['Van den Berg','SELL',3705134,{days_ago:22}],
    ['Eggestein','BUY',14999999,{days_ago:23}],
    ['Rieder','BUY',12888888,{days_ago:23}],
    ['Tapsoba','BUY',34999999,{days_ago:23}],
    ['Hendriks','BUY',12555555,{days_ago:24}],
    ['Gadou','BUY',24666666,{days_ago:25}],
    ['Marino','BUY',7899999,{days_ago:26}],
    ['Ibrahimović','SELL',6585689,{days_ago:27}],
    ['Backhaus','BUY',17888888,{days_ago:28}],
    ['Van den Berg','BUY',3666666,{days_ago:28}],
    ['Mwene','BUY',7899999,{days_ago:28}],
    ['Sticker','BUY',2199999,{absolute_time:'2026-08-03T12:00:00+02:00'}],
    ['Ibrahimović','BUY',6777777,{absolute_time:'2026-08-02T12:00:00+02:00'}],
    ['Aouchiche','BUY',12399999,{absolute_time:'2026-08-02T12:00:00+02:00'}],
    ['Moreira','BUY',21999999,{absolute_time:'2026-08-02T12:00:00+02:00'}]
  ];
  const slug=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const canonical=events.map((e,i)=>({event_id:`transfer::faps-ham-united::${String(i+1).padStart(3,'0')}`,player_id:`player::${slug(e[0])}`,player_name:e[0],manager_team_id:TEAM_ID,manager_team_name:TEAM_NAME,direction:e[1],counterparty_type:'kickbase',counterparty_team_id:null,counterparty_name:'Kickbase',price:e[2],relative_time:e[3].days_ago!=null?{days_ago:e[3].days_ago}:e[3].hours_ago!=null?{hours_ago:e[3].hours_ago}:null,absolute_time:e[3].absolute_time||null,source_scope:'transfer history transcribed from supplied Fäps Ham United screenshots',confidence:'high'}));
  function install(){
    const model=window.H2H_CANONICAL_MODEL;if(!model)return false;
    model.events=model.events||{};model.events.transfers=model.events.transfers||[];
    const ids=new Set(model.events.transfers.map(e=>e.event_id));
    for(const e of canonical)if(!ids.has(e.event_id))model.events.transfers.push(e);
    model.data_quality=model.data_quality||{};
    model.data_quality.normalized_transfer_events=model.events.transfers.length;
    model.data_quality.partial_transfer_history_teams=(model.data_quality.partial_transfer_history_teams||[]).filter(id=>id!==TEAM_ID);
    window.H2H_PHASE300_FAPS_TRANSFER_ANCHOR=true;
    return true;
  }
  install();setTimeout(install,250);setTimeout(install,800);
  console.info(`[H2H] ${VERSION} loaded`,canonical.length);
})();
