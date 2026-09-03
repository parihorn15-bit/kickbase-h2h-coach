(() => {
  const VERSION='2026-09-03-st1-anchor-v1';
  const CAPTURED_AT='2026-09-03T13:16:00+02:00';
  const SOURCE='kickbase-screenshot-st1-2026-09-03';
  const EVIDENCE_NOTE='Punkte und ST11 1. Spieltag.zip · 12 Kickbase-Screenshots';

  const anchors={
    me:{team:'Horn Capital FC',points:972,lineup:[
      ['Stanišić',43],['Fernández',39],['Reis',29],['Deman',23],['Raab',9],
      ['Olise',249],['Gomis',178],['Anton',158],['García',98],['Tietz',85],['Castro-Montes',63]
    ],bench:[['Tigges',32]]},
    fabi:{team:'FÄPS HAM UNITED',points:1203,lineup:[
      ['Ebnoutalib',304],['Kimmich',303],['Rieder',195],['Gaddou',132],['Eggestein',119],
      ['Keidel',68],['Simpson-Pusey',62],['Aouchiche',43],['Moreira',5],['Zingerle',0],['Tapsoba',-28]
    ]},
    elias:{team:'Al Elshani',points:982,lineup:[
      ['Scherhant',144],['Koch',132],['Gruda',128],['Beste',128],['Kane',124],
      ['Zentner',104],['Vagnoman',73],['Uzun',65],['Bolin',32],['Diks',29],['Ljubičić',23]
    ]},
    manu:{team:'Calcio Rom FC',points:1291,lineup:[
      ['Nmecha',123],['Maza',107],['Makengo',80],['Kristof',83],['Kosugi',84],
      ['Hashioka',17],['Pejčinović',-6],['Juranović',218],['Díaz',215],['Kabak',201],['Konstantelias',181]
    ]},
    marci:{team:'Cello Football Club',points:996,lineup:[
      ['Pieper',85],['Treu',31],['Badé',30],['Stiller',25],['De Cat',-9],
      ['Guirassy',180],['Amiri',167],['Scheller',133],['Caci',124],['Bredlow',111],['Seiwald',109]
    ],bench:[['Vozar',0]]},
    fabio:{team:'FAPSE FC',points:1280,lineup:[
      ['Becker',49],['Onyedika',28],['Bakayoko',15],['Mohya',11],['Kleindienst',-21],
      ['Suzuki',385],['Karetsas',214],['Baum',181],['Raum',149],['Karius',142],['Gutiérrez',117]
    ],bench:[['Lemke',2]]}
  };

  const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

  function masterResolve(raw){
    let r=null;
    try{r=window.h2h230CanonicalIdentity?.(raw)||null}catch{}
    if(!r?.name)try{r=window.h2h230MasterResolve?.(raw,{})||null}catch{}
    if(!r?.name){
      const rows=Array.isArray(window.BUNDESLIGA_PLAYERS)?window.BUNDESLIGA_PLAYERS:[];
      const exact=rows.filter(p=>norm(p.name)===norm(raw)||norm(p.last_name)===norm(raw));
      if(exact.length===1)r=exact[0];
    }
    return r?.name?{
      raw,name:String(r.name),team:String(r.team||''),
      position:String(r.kickbase_position||r.kickbasePosition||r.position||''),
      externalPlayerId:r.externalPlayerId??r.external_id??r.id??null,
      resolved:true
    }:{raw,name:raw,team:'',position:'',externalPlayerId:null,resolved:false};
  }

  function resolveList(entries){
    return entries.map(([raw,points])=>({...masterResolve(raw),points:Number(points)}));
  }

  function inferFormation(names){
    try{
      const built=window.h2h230BuildLogicalLineup?.(names);
      if(built?.lineup?.length===11&&built.code)return built.code;
    }catch{}
    return null;
  }

  function mdRow(managerId){
    try{return managerMatchdayData(managerId,1)}catch{return null}
  }

  function writeLeaguePoints(managerId,points){
    try{
      const record=typeof mdRecord==='function'?mdRecord(1):null;
      if(record){
        record.managerPoints=record.managerPoints||{};
        record.managerPoints[managerId]=Number(points);
      }
    }catch{}
  }

  function seedOne(managerId,a){
    const row=mdRow(managerId);if(!row)return {managerId,ok:false,reason:'matchday-row-missing'};
    const lineupResolved=resolveList(a.lineup),benchResolved=resolveList(a.bench||[]);
    const names=lineupResolved.map(x=>x.name),bank=benchResolved.map(x=>x.name);
    const unresolved=[...lineupResolved,...benchResolved].filter(x=>!x.resolved).map(x=>x.raw);
    const formation=inferFormation(names);
    const pointMap=Object.fromEntries(lineupResolved.map(x=>[x.name,x.points]));

    row.points=Number(a.points);
    row.lineup=[...names];
    row.bank=[...bank];
    if(formation)row.formation=formation;
    row.lineupSnapshot=lineupResolved.map(x=>({
      raw:x.raw,name:x.name,team:x.team,teamAtImport:x.team,position:x.position,
      externalPlayerId:x.externalPlayerId,points:x.points,state:'secure',confidence:1,
      linkedAt:CAPTURED_AT,source:SOURCE
    }));
    row.historicalLineup230={
      lineup:[...names],bank:[...bank],formation:formation||row.formation||null,
      capturedAt:CAPTURED_AT,source:SOURCE,lockReason:'screenshot-backed-st1-anchor',
      evidence:EVIDENCE_NOTE,pointMap,managerPoints:Number(a.points),
      unresolvedAtSeed:[...unresolved],firstKickoffAt:'2026-08-28T20:30:00+02:00'
    };
    row.historicalLineupLocked230=true;
    row.historicalLineupLockedAt230=CAPTURED_AT;
    row.historicalLineupLockReason230='screenshot-backed-st1-anchor';
    row.reconstruction230={
      source:SOURCE,createdAt:CAPTURED_AT,noOriginalLineupScreenshot:false,
      evidence:EVIDENCE_NOTE,verifiedFromScreenshots:true
    };
    writeLeaguePoints(managerId,a.points);
    return {managerId,ok:true,unresolved,formation:formation||null};
  }

  function seedAll(){
    if(typeof data==='undefined'||typeof managerMatchdayData!=='function')return false;
    const results=Object.entries(anchors).map(([id,a])=>seedOne(id,a));
    try{
      data.settings=data.settings||{};
      data.settings.phase230HistoricalAnchors=data.settings.phase230HistoricalAnchors||{};
      data.settings.phase230HistoricalAnchors.st1={version:VERSION,capturedAt:CAPTURED_AT,source:SOURCE,evidence:EVIDENCE_NOTE,results};
      if(typeof save==='function')save();
      else localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
      try{window.cloudQueueSave?.()}catch{}
    }catch(e){console.error('[H2H ST1 anchor] save failed',e);return false}
    window.H2H_ST1_ANCHOR_RESULTS=results;
    console.info('[H2H] ST1 screenshot anchor seeded',results);
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(seedAll()||attempts>30)clearInterval(timer);
  },250);
  window.h2h230SeedSpieltag1Anchor=seedAll;
})();
