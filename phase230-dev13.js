(() => {
  const VERSION='2.3.0-dev13.0';

  if(typeof readLiveLineupV1==='function'){
    const priorReadLive=readLiveLineupV1;
    readLiveLineupV1=function(managerId='me'){
      const live=priorReadLive.apply(this,arguments);
      const id=String(managerId||'me');
      if(id==='me'||!live)return live;

      try{
        const md=Number(data?.settings?.currentMd)||1;
        const entry=typeof managerMatchdayData==='function'?managerMatchdayData(id,md):null;
        const hasExplicitLineup=Array.isArray(entry?.lineup)&&entry.lineup.length>0;
        const explicitlyTouched=Boolean(entry?.date||entry?.lineupSavedAt||entry?.lineupSnapshotAt||entry?.note||entry?.formation||Number.isFinite(Number(entry?.points)));

        // Opponent LIVE storage is manager-wide, while opponent matchday data is
        // matchday-specific. Once a matchday has explicitly stored data, that
        // matchday must be authoritative; a stale manager-wide LIVE screenshot
        // must never overwrite it during render/open.
        if(hasExplicitLineup||explicitlyTouched)return null;
      }catch(error){
        console.warn('[H2H] dev13 opponent source-priority check skipped',error);
      }
      return live;
    };
  }

  function stampSavedMatchday(){
    try{
      const modal=document.querySelector('.opponent-lineup-entry');
      if(!modal)return false;
      const heading=modal.querySelector('.section-head h2')?.textContent||'';
      const mdMatch=heading.match(/\bST\s*(\d+)/i);
      const md=Number(mdMatch?.[1])||Number(data?.settings?.currentMd)||1;
      const states=[...document.querySelectorAll('[data-opponent-player-state]')];
      if(!states.length)return false;

      // Resolve manager from the currently edited row by matching the visible
      // team label. This is only a timestamp aid; the original save handler
      // remains responsible for lineup contents.
      const team=heading.split('·')[0].trim();
      const manager=(typeof LEAGUE_MANAGERS!=='undefined'?LEAGUE_MANAGERS:[]).find(x=>String(x.team||'').trim()===team);
      if(!manager?.id)return false;
      const entry=managerMatchdayData(manager.id,md);
      entry.lineupSavedAt=new Date().toISOString();
      return true;
    }catch{return false}
  }

  document.addEventListener('click',event=>{
    if(event.target?.closest?.('#saveOpponentMd'))stampSavedMatchday();
  },true);

  window.H2H_PHASE230_OPPONENT_MATCHDAY_SOURCE='saved-matchday-first';
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
