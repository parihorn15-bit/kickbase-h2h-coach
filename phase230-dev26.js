(() => {
  const VERSION='3.0.0-points-integrity26';
  const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

  function rowFor(managerId,md){
    try{return typeof managerMatchdayData==='function'?managerMatchdayData(managerId,Number(md)||1):null}catch{return null}
  }

  function expectedTotal(row,managerId,md){
    const historical=Number(row?.historicalLineup230?.managerPoints);
    if(Number.isFinite(historical))return historical;
    const direct=Number(row?.points);
    if(Number.isFinite(direct))return direct;
    try{
      const record=typeof mdRecord==='function'?mdRecord(Number(md)||1):null;
      const league=Number(record?.managerPoints?.[managerId]);
      if(Number.isFinite(league))return league;
    }catch{}
    return null;
  }

  function lineupPoints(row){
    const lineup=Array.isArray(row?.historicalLineup230?.lineup)&&row.historicalLineup230.lineup.length
      ? row.historicalLineup230.lineup
      : Array.isArray(row?.lineup)?row.lineup:[];
    const snapshots=Array.isArray(row?.lineupSnapshot)?row.lineupSnapshot:[];
    const snapshotMap=new Map(snapshots.map(x=>[norm(x?.name||x?.raw),Number(x?.points)]));
    const pointMap=row?.historicalLineup230?.pointMap||{};
    const historicalMap=new Map(Object.entries(pointMap).map(([name,points])=>[norm(name),Number(points)]));
    const entries=lineup.map(name=>{
      const key=norm(name);
      const a=snapshotMap.get(key),b=historicalMap.get(key);
      const points=Number.isFinite(a)?a:Number.isFinite(b)?b:null;
      return {name:String(name||''),points};
    });
    return entries;
  }

  function validate(managerId,md=1,{write=true}={}){
    const row=rowFor(managerId,md);
    if(!row||!row.historicalLineup230)return {managerId,md:Number(md)||1,status:'not-historical',valid:null};
    const expected=expectedTotal(row,managerId,md);
    const entries=lineupPoints(row);
    const missing=entries.filter(x=>!Number.isFinite(x.points)).map(x=>x.name);
    const numeric=entries.filter(x=>Number.isFinite(x.points));
    const sum=numeric.reduce((total,x)=>total+x.points,0);
    const complete=entries.length===11&&missing.length===0;
    const difference=Number.isFinite(expected)&&complete?sum-expected:null;
    const valid=Number.isFinite(difference)?difference===0:false;
    const status=!Number.isFinite(expected)?'manager-total-missing':!complete?'player-points-incomplete':valid?'validated':'mismatch';
    const result={
      managerId,md:Number(md)||1,status,valid,
      expectedTotal:Number.isFinite(expected)?expected:null,
      playerTotal:complete?sum:null,
      difference,
      lineupCount:entries.length,
      numericPointCount:numeric.length,
      missingPlayers:missing,
      checkedAt:new Date().toISOString(),
      source:'automatic-historical-points-integrity-v1'
    };
    if(write){
      row.historicalPointsValidation230=result;
      row.historicalLineup230.pointsValidation=result;
      if(status==='mismatch')row.historicalDataSuspect230=true;
      else if(status==='validated')row.historicalDataSuspect230=false;
    }
    if(status==='mismatch')console.warn('[H2H] Historische Punkte stimmen nicht mit Manager-Gesamtpunkten überein',result);
    if(status==='player-points-incomplete'||status==='manager-total-missing')console.warn('[H2H] Historische Punkte noch nicht vollständig prüfbar',result);
    return result;
  }

  function validateKnown(){
    const known=[['me',1],['fabi',1],['fabio',1],['elias',1],['marci',1],['manu',1]];
    const results=known.map(([managerId,md])=>validate(managerId,md)).filter(x=>x.status!=='not-historical');
    window.H2H_HISTORICAL_POINTS_VALIDATION=results;
    return results;
  }

  function wrapScreenshotCommit(){
    if(typeof commitScreenshotLineupCoreV224!=='function'||commitScreenshotLineupCoreV224.__phase300PointsIntegrity)return false;
    const prior=commitScreenshotLineupCoreV224;
    const wrapped=async function(...args){
      const managerId=String(document.querySelector('#aiTargetManager')?.value||'');
      const md=Number(typeof data!=='undefined'?data?.settings?.currentMd:1)||1;
      const result=await prior.apply(this,args);
      if(result?.ok&&managerId)setTimeout(()=>validate(managerId,md),0);
      return result;
    };
    wrapped.__phase300PointsIntegrity=true;
    wrapped.__phase300prior=prior;
    commitScreenshotLineupCoreV224=wrapped;
    return true;
  }

  window.h2h230ValidateHistoricalPoints=validate;
  window.h2h230ValidateKnownHistoricalPoints=validateKnown;
  wrapScreenshotCommit();
  setTimeout(()=>{wrapScreenshotCommit();validateKnown()},350);
  setTimeout(validateKnown,1200);
  console.info(`[H2H] ${VERSION} loaded`);
})();
