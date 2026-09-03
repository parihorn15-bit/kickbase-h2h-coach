(() => {
  const VERSION='3.0.0-anchor23';
  const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const model=()=>window.H2H_CANONICAL_MODEL||null;
  const teamName=id=>model()?.entities?.teams?.[id]?.name||'Liga';
  const eventDate=e=>{
    if(e.absolute_time)return e.absolute_time;
    const days=Number(e.relative_time?.days_ago);
    const base=Date.parse(model()?.generated_at||'');
    if(Number.isFinite(days)&&Number.isFinite(base))return new Date(base-days*86400000).toISOString();
    return model()?.generated_at||'';
  };
  function patchBaseTransfers(){
    if(typeof leagueIntelTimeline!=='function'||leagueIntelTimeline.__phase300baseanchors)return false;
    const prior=leagueIntelTimeline;
    leagueIntelTimeline=function(){
      const rows=prior.call(this)||[];
      const events=model()?.events?.transfers||[];
      const known=new Set(rows.map(x=>`${norm(x.title)}|${x.date||''}`));
      for(const e of events){
        const type=e.direction==='BUY'?'Kauf':e.direction==='SELL'?'Verkauf':'Transfer';
        const title=`${teamName(e.manager_team_id)}: ${type} ${e.player_name||e.player_id||''}`;
        const date=eventDate(e);
        const key=`${norm(title)}|${date}`;
        if(known.has(key))continue;
        known.add(key);
        rows.push({date,md:0,type:'canonical-base-transfer',icon:e.direction==='BUY'?'🟦':e.direction==='SELL'?'🟥':'🔄',title,text:[Number(e.price)&&typeof euro==='function'?euro(Number(e.price)):'',e.counterparty_name||'', 'Screenshot-Anker · 3.0'].filter(Boolean).join(' · '),canonicalEventId:e.event_id||null});
      }
      return rows.sort((a,b)=>{const da=a.date?new Date(a.date).getTime():0,db=b.date?new Date(b.date).getTime():0;return db-da||(+b.md||0)-(+a.md||0)});
    };
    leagueIntelTimeline.__phase300baseanchors=true;
    return true;
  }
  function ensureBrand(){
    const version=window.H2H_RELEASE?.version||window.H2H_APP_VERSION||'3.0.0';
    const brand=document.querySelector('#sidebar .brand small');
    if(brand&&!brand.textContent.includes(`Version ${version}`))brand.textContent=`Version ${version} · Cloud-Schreiben AKTIV · 2026/27`;
    document.title=`Kickbase H2H Coach ${version}`;
  }
  function hook(){patchBaseTransfers();ensureBrand();window.H2H_PHASE300_SCREENSHOT_ANCHORS=true}
  hook();setTimeout(hook,300);setTimeout(hook,900);
  console.info(`[H2H] ${VERSION} loaded`,{teams:Object.keys(model()?.entities?.teams||{}).length,transfers:(model()?.events?.transfers||[]).length,md1:model()?.matchdays?.md1?.official_team_totals||{}});
})();
