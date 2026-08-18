(() => {
  const VERSION='2.3.0-dev4';

  // A LIVE lineup is a matchday snapshot, not a timeless roster state.
  // Opponent views must not let a later matchday overwrite an older historical lineup.
  if(typeof readLiveLineupV1==='function'){
    const priorReadLive=readLiveLineupV1;
    readLiveLineupV1=function(managerId='me'){
      const live=priorReadLive(managerId);
      if(!live)return live;
      if(String(managerId||'me')==='me')return live;
      const currentMd=Number(data?.settings?.currentMd)||1;
      const snapshotMd=Number(live?.snapshotMd||0);
      if(snapshotMd&&snapshotMd!==currentMd)return null;
      return live;
    };
  }

  function verifyHistoricalIsolation230(managerId,md){
    let live=null,entry=null;
    try{
      const store=typeof liveLineupsV1==='function'?liveLineupsV1():{};
      live=store?.[managerId]||null;
    }catch{}
    try{entry=typeof managerMatchdayData==='function'?managerMatchdayData(managerId,md):null}catch{}
    const liveMd=Number(live?.snapshotMd||0);
    return {
      version:VERSION,
      managerId,md:Number(md)||1,
      liveSnapshotMd:liveMd||null,
      liveApplies:!liveMd||liveMd===Number(md),
      historicalLineupCount:Array.isArray(entry?.lineup)?entry.lineup.length:0,
      historicalSnapshotCount:Array.isArray(entry?.lineupSnapshot)?entry.lineupSnapshot.length:0
    };
  }

  window.h2h230HistoricalIsolationStatus=verifyHistoricalIsolation230;
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
