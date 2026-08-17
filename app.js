if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('message',event=>{
    if(event.data?.type==='APP_UPDATED'){
      const seen=sessionStorage.getItem('h2h-app-version');
      if(seen!==event.data.version){
        sessionStorage.setItem('h2h-app-version',event.data.version);
        setTimeout(()=>location.reload(),250);
      }
    }
  });
}
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];const euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(+n||0);const moneyInput=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:0}).format(+n||0);const parseMoney=v=>{let s=String(v??'').trim().replace(/\s/g,'').replace(/€/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else if(s.includes(','))s=s.replace(',','.');else s=s.replace(/\./g,'');return Number(s)||0};const BUY_REASONS=['Steigender Marktwert','Gutes Programm','Gutes Matchup','Punktepotenzial','Stammspieler','Standardschütze','Kaderbreite','Bauchgefühl','Sonstiges'];const TRANSFER_SOURCES=['Transfermarkt','Mitspieler'];const SELL_REASONS=['Bundesliga-MVP','Dreier-Regel','Sinkender Marktwert','Schlechtes Programm','Schwieriges Matchup','Gewinnmitnahme','Budget freimachen','Verletzung/Sperre','Kein Stammspieler','Sonstiges'];const LI_STATUSES=['Unbekannt','Voraussichtliche Startelf','Alternative','Ersatzbank','Fraglich','Fällt aus'];
const LI_SCORE={'Voraussichtliche Startelf':15,'Alternative':4,'Ersatzbank':-15,'Fraglich':-8,'Fällt aus':-50,'Unbekannt':0};
const LEAGUE_MANAGERS=[
{id:'me',manager:'Ich',team:'Horn Capital FC',isMe:true},
{id:'fabi',manager:'Fabi',team:'FÄPS HAM UNITED'},
{id:'elias',manager:'Elias',team:'Al Elshani'},
{id:'manu',manager:'Manu',team:'Calcio Rom FC'},
{id:'marci',manager:'Marci',team:'Cello Football Club'},
{id:'fabio',manager:'Fabio',team:'FAPSE FC'}
];
const TEAM_STRENGTH_BASELINE={
'FC Bayern München':10.0,
'Borussia Dortmund':7.8,
'Bayer 04 Leverkusen':7.2,
'RB Leipzig':7.0,
'VfB Stuttgart':6.7,
'TSG Hoffenheim':6.0,
'Sport-Club Freiburg':5.7,
'Eintracht Frankfurt':5.7,
'1. FSV Mainz 05':5.1,
'FC Augsburg':5.0,
'Borussia Mönchengladbach':4.7,
'1. FC Union Berlin':4.6,
'SV Werder Bremen':4.4,
'Hamburger SV':4.3,
'FC Schalke 04':4.1,
'SV Elversberg':3.8,
'1. FC Köln':3.7,
'SC Paderborn 07':3.7
};
const TEAM_STRENGTH_META={
updatedAt:'2026-08-04',
method:'70 % Bundesliga 2025/26, 30 % Bundesliga 2024/25; Aufsteiger nach 2. Bundesliga 2025/26 mit Aufsteigerabschlag.'
};
const MANAGER_OPTIONS=LEAGUE_MANAGERS.filter(x=>!x.isMe);
const LEAGUE_CRESTS={
  'Horn Capital FC':'team-logos/horn-capital-fc.webp',
  'FÄPS HAM UNITED':'team-logos/faeps-ham-united.webp',
  'Al Elshani':'team-logos/al-elshani.webp',
  'Calcio Rom FC':'team-logos/calcio-rom-fc.webp',
  'Cello Football Club':'team-logos/cello-football-club.webp',
  'FAPSE FC':'team-logos/fapse-fc.webp'
};
function localDateISO(date=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Berlin',
    year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(date);
  const get=type=>parts.find(p=>p.type===type)?.value||'';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function crest(team,className='team-crest'){
  const src=LEAGUE_CRESTS[team];
  return src
    ? `<img class="${className} round-team-crest" src="${src}" alt="Wappen ${esc(team)}">`
    : `<span class="${className} round-team-crest crest-fallback">${esc(String(team||'?').slice(0,2))}</span>`;
}

const CLUB_NAME_ALIASES={
  'FC Bayern München':['FC Bayern München','Bayern München','FC Bayern Munich','Bayern'],
  'Bayer 04 Leverkusen':['Bayer 04 Leverkusen','Bayer Leverkusen','Leverkusen'],
  'Sport-Club Freiburg':['Sport-Club Freiburg','SC Freiburg','Freiburg'],
  'SV Werder Bremen':['SV Werder Bremen','Werder Bremen','Werder'],
  'TSG Hoffenheim':['TSG Hoffenheim','TSG 1899 Hoffenheim','1899 Hoffenheim','Hoffenheim'],
  '1. FC Union Berlin':['1. FC Union Berlin','Union Berlin','Union'],
  'SV Elversberg':['SV Elversberg','SV 07 Elversberg','SpVgg 07 Elversberg','SpVgg Elversberg','Elversberg']
};

const OFFICIAL_CLUB_CREST_FALLBACKS={
  'SV Elversberg':'https://sv07elversberg.de/wp-content/uploads/2022/06/sve_badge_RGB.png'
};

function normalizeClubName(value){
  return String(value||'').toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\b(fussballclub|football club|sportverein|spielvereinigung)\b/g,'')
    .replace(/[^a-z0-9]/g,'');
}
function canonicalClubName(team){
  const key=normalizeClubName(team);
  for(const [canonical,aliases] of Object.entries(CLUB_NAME_ALIASES)){
    if([canonical,...aliases].some(name=>normalizeClubName(name)===key))return canonical;
  }
  return String(team||'').trim();
}
function clubRegistryEntry(team){
  const clubs=window.BUNDESLIGA_CLUBS||[];
  const canonical=canonicalClubName(team);
  const aliases=[canonical,...(CLUB_NAME_ALIASES[canonical]||[]),team].filter(Boolean);
  const keys=[...new Set(aliases.map(normalizeClubName).filter(Boolean))];
  const club=clubs.find(candidate=>{
    const candidateKeys=[candidate.team,candidate.short_name,candidate.name]
      .map(normalizeClubName).filter(Boolean);
    return candidateKeys.some(candidateKey=>keys.some(key=>
      candidateKey===key ||
      (candidateKey.length>=7&&key.length>=7&&(candidateKey.includes(key)||key.includes(candidateKey)))
    ));
  })||null;
  return{
    canonical,
    aliases,
    club,
    crest:club?.crest_url||OFFICIAL_CLUB_CREST_FALLBACKS[canonical]||null,
    competitionCode:club?.competition_code||'BL1',
    competitionName:club?.competition_name||'Bundesliga'
  };
}
function liveClub(team){return clubRegistryEntry(team).club}
function clubCompetition(team){return clubRegistryEntry(team).competitionCode}
function clubLeagueLabel(team){return clubRegistryEntry(team).competitionName}
function bundesligaCrest(team,className='bl-club-crest'){
  const entry=clubRegistryEntry(team);
  return entry.crest
    ? `<img class="${className}" src="${esc(entry.crest)}" alt="Vereinslogo ${esc(entry.canonical||team)}" loading="lazy" referrerpolicy="no-referrer" data-club-key="${esc(normalizeClubName(entry.canonical))}">`
    : `<span class="${className} bl-club-fallback" data-club-key="${esc(normalizeClubName(entry.canonical))}">${esc(String(entry.canonical||team||'?').split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,2).toUpperCase())}</span>`;
}

function bundesligaIdentity(team,{logoClass='inline-club-crest',showName=true}={}){
  const entry=clubRegistryEntry(team);
  return `<span class="bundesliga-identity" data-club-key="${esc(normalizeClubName(entry.canonical))}">
    ${bundesligaCrest(team,logoClass)}
    ${showName?`<span>${esc(team||entry.canonical||'Unbekannter Verein')}</span>`:''}
  </span>`;
}


function lineupStatusMeta(player){
  const status=effectiveLineupStatus(player).status||'Unbekannt';
  const map={
    'Voraussichtliche Startelf':{score:30,label:'voraussichtlich gesetzt',level:'good',confidence:1},
    'Alternative':{score:17,label:'Alternative/Rotationsrisiko',level:'warn',confidence:.85},
    'Ersatzbank':{score:4,label:'Bank prognostiziert',level:'bad',confidence:.9},
    'Fraglich':{score:9,label:'Einsatz fraglich',level:'warn',confidence:.8},
    'Fällt aus':{score:0,label:'fällt aus',level:'bad',confidence:1},
    'Unbekannt':{score:13,label:'Status ungeprüft',level:'info',confidence:.3}
  };
  return map[status]||map.Unbekannt;
}
function lineupStatusFresh(player){
  const raw=effectiveLineupStatus(player).updatedAt;
  if(!raw)return false;
  const t=new Date(raw).getTime();
  return Number.isFinite(t)&&Date.now()-t<4*24*60*60*1000;
}

const BASE_COACH_WEIGHTS={average:30,matchup:25,lineup:30,team:10,home:5,news:12};
const PRESEASON_COACH_WEIGHTS={matchup:40,team:25,lineup:20,home:5,average:10,news:12};

function coachCompletedMatchdays(){
  return (data.matchdays||[]).filter(record=>
    Object.values(record?.points||{}).some(value=>Number.isFinite(Number(value))&&String(value).trim()!=='')
  ).length;
}
function coachSeasonBlend(){
  // 0 = pure preseason model; after four evaluated matchdays the current-season
  // model has fully taken over.
  return Math.max(0,Math.min(1,coachCompletedMatchdays()/4));
}
function coachPhaseLabel(){
  const n=coachCompletedMatchdays();
  return n===0?'Preseason-Modell':n<4?`Übergangsmodell · ${n}/4 Spieltage`:'Saisonmodell';
}
function neutralLineupRatio(status){
  const key=String(status||'Unbekannt');
  if(key==='Voraussichtliche Startelf')return 1;
  if(key==='Alternative')return .63;
  if(key==='Ersatzbank')return .22;
  if(key==='Fraglich')return .38;
  if(key==='Fällt aus')return 0;
  return .58; // unknown is neutral, not a penalty
}
function preseasonCoachScore({avg,match,teamValue,status,fixtureData,newsImpact}){
  let score=50;
  // Matchup and club level carry preseason decisions while current-season
  // Kickbase averages do not exist yet.
  score+=(match-5)*5.5;                 // roughly -22 .. +27.5
  score+=(teamValue-5)*2.5;             // roughly -10 .. +12.5
  if(status==='Voraussichtliche Startelf')score+=8;
  else if(status==='Alternative')score+=2;
  else if(status==='Ersatzbank')score-=12;
  else if(status==='Fraglich')score-=8;
  else if(status==='Fällt aus')return 0;
  // Missing average is neutral. If an actual stored prior/current average exists,
  // use it only as a modest pedigree signal.
  if(avg>0)score+=Math.max(-8,Math.min(12,(avg-80)/6));
  if(fixtureData?.ha==='H')score+=3;
  score+=newsImpact;
  return Math.max(0,Math.min(100,score));
}


function pearsonCorrelation(xs,ys){
  if(xs.length<3||xs.length!==ys.length)return 0;
  const mx=xs.reduce((s,x)=>s+x,0)/xs.length;
  const my=ys.reduce((s,x)=>s+x,0)/ys.length;
  let num=0,dx=0,dy=0;
  xs.forEach((x,i)=>{const a=x-mx,b=ys[i]-my;num+=a*b;dx+=a*a;dy+=b*b});
  return dx&&dy?num/Math.sqrt(dx*dy):0;
}
function coachCalibrationSamples(){
  const samples=[];
  (data.matchdays||[]).forEach(record=>{
    const snapshot=record.coachSnapshot;
    if(!snapshot?.players?.length)return;
    snapshot.players.forEach(item=>{
      const actual=Number(record.points?.[item.playerId]);
      if(!Number.isFinite(actual))return;
      samples.push({...item,actual,md:record.md});
    });
  });
  return samples;
}
function coachCalibration(){
  const samples=coachCalibrationSamples();
  const matchdays=new Set(samples.map(x=>x.md)).size;
  const fields=['average','matchup','lineup','team','home','news'];
  const correlations={};
  fields.forEach(field=>{
    correlations[field]=pearsonCorrelation(
      samples.map(x=>Number(x.factors?.[field]||0)),
      samples.map(x=>x.actual)
    );
  });

  // Personalization starts only after four evaluated matchdays.
  const active=matchdays>=4&&samples.length>=20;
  const weights={...BASE_COACH_WEIGHTS};
  if(active){
    const positive=fields.map(field=>Math.max(.05,correlations[field]+.35));
    const total=positive.reduce((s,x)=>s+x,0);
    const targetTotal=100;
    fields.forEach((field,index)=>{
      const learned=positive[index]/total*targetTotal;
      // Conservative blend: 75% base model, 25% personal data.
      weights[field]=BASE_COACH_WEIGHTS[field]*.75+learned*.25;
    });
  }
  return{samples,matchdays,correlations,weights,active};
}
function captureCoachSnapshot(md=data.settings.currentMd){
  const record=mdRecord(md);
  const ids=(record.lineup||[]).filter(Boolean);
  if(!ids.length)return;
  record.coachSnapshot={
    capturedAt:new Date().toISOString(),
    formation:exactFormation(ids)?.code||null,
    players:ids.map(playerId=>{
      const player=activePlayers().find(p=>p.id===playerId);
      if(!player)return null;
      const assessment=coachPlayerAssessment(player,md,{ignoreCalibration:true});
      return{
        playerId,
        name:player.name,
        position:player.position,
        predictedScore:assessment.score,
        confidence:assessment.confidence,
        factors:{...assessment.factors}
      };
    }).filter(Boolean)
  };
}
function calibrationSummary(){
  const c=coachCalibration();
  if(!c.active)return{
    active:false,
    title:'Basismodell aktiv',
    text:`${c.matchdays}/4 ausgewertete Spieltage · ${c.samples.length} Spielerergebnisse`,
    accuracy:null
  };
  const mae=c.samples.reduce((sum,s)=>sum+Math.abs((s.predictedScore||0)-Math.min(100,Math.max(0,s.actual/2))),0)/c.samples.length;
  return{
    active:true,
    title:'Persönlich kalibriert',
    text:`${c.matchdays} Spieltage · ${c.samples.length} Spielerergebnisse`,
    accuracy:Math.max(0,100-mae)
  };
}

let _coachAssessmentCache=new Map();
function resetCoachAssessmentCache(){_coachAssessmentCache.clear()}

function coachPlayerAssessment(player,md=data.settings.currentMd,{ignoreCalibration=false}={}){
  const cacheKey=!ignoreCalibration?`${player?.id||player?.name}|${+md}`:'';
  if(cacheKey&&_coachAssessmentCache.has(cacheKey))return _coachAssessmentCache.get(cacheKey);

  const fixtureData=fixture(player.team,md);
  const status=lineupStatusMeta(player);
  const statusKey=effectiveLineupStatus(player).status||'Unbekannt';
  const avg=Math.max(0,Number(player.avgPoints||0));
  const match=Math.max(1,Math.min(10,matchup(player,md)));
  const teamValue=Math.max(1,Math.min(10,strength(player.team)));
  const fresh=lineupStatusFresh(player);

  const calibration=ignoreCalibration?{weights:{...BASE_COACH_WEIGHTS},active:false}:coachCalibration();
  const weights=calibration.weights;

  // Regular in-season score. Crucial 2.2.0 change: missing average is neutral,
  // and unknown lineup status is neutral rather than heavily punished.
  const avgRatio=avg>0?Math.max(0,Math.min(1,avg/150)):.55;
  const lineupRatio=neutralLineupRatio(statusKey);
  const factors={
    average:avgRatio*weights.average,
    matchup:(match-1)/9*weights.matchup,
    lineup:lineupRatio*weights.lineup,
    team:teamValue/10*weights.team,
    home:fixtureData?.ha==='H'?weights.home:0
  };

  const news=newsImpactForPlayer(player);
  const newsImpact=Math.max(-weights.news,Math.min(weights.news,Number(news?.impact_score||0)*.4));
  factors.news=newsImpact;

  let regularScore=Object.values(factors).reduce((sum,value)=>sum+value,0);
  regularScore=Math.max(0,Math.min(100,regularScore));

  const preseasonScore=preseasonCoachScore({
    avg,match,teamValue,status:statusKey,fixtureData,
    newsImpact:Math.max(-12,Math.min(12,newsImpact))
  });

  const seasonBlend=coachSeasonBlend();
  let score=preseasonScore*(1-seasonBlend)+regularScore*seasonBlend;
  if(statusKey==='Fällt aus')score=0;
  score=Math.max(0,Math.min(100,score));

  let confidence=35; // preseason has usable team/fixture information even without points
  if(avg>0)confidence+=15;
  if(fixtureData)confidence+=20;
  if(Number.isFinite(Number(data.teamStrength?.[canonicalClubName(player.team)]??data.teamStrength?.[player.team])))confidence+=10;
  if(statusKey!=='Unbekannt')confidence+=10;
  if(fresh)confidence+=10;
  confidence=Math.max(25,Math.min(100,confidence));

  const positives=[];
  const risks=[];
  if(status.level==='good')positives.push('voraussichtliche Startelf');
  if(match>=7)positives.push(`starkes Matchup ${match.toFixed(1)}`);
  if(avg>=100)positives.push(`${avg.toFixed(0)} Ø-Punkte`);
  if(!avg)positives.push('fehlende Saisonpunkte neutral gewertet');
  if(fixtureData?.ha==='H')positives.push('Heimspiel');
  if(teamValue>=7)positives.push('starkes Teamniveau');

  if(statusKey==='Alternative')risks.push('Rotationsrisiko');
  if(statusKey==='Ersatzbank')risks.push('Bank prognostiziert');
  if(statusKey==='Fraglich')risks.push('Einsatz fraglich');
  if(statusKey==='Fällt aus')risks.push('fällt aus');
  if(statusKey==='Unbekannt')risks.push('Startelfstatus noch ungeprüft');
  if(statusKey!=='Unbekannt'&&!fresh)risks.push('Status älter als vier Tage');
  if(match<=4)risks.push(`schweres Matchup ${match.toFixed(1)}`);
  if(avg>0&&avg<=50)risks.push('niedrige Ø-Punkte');
  if(news?.impact_score>0)positives.push(`offizielle Meldung: ${news.title}`);
  if(news?.impact_score<0)risks.push(`offizielle Meldung: ${news.title}`);

  const result={
    player,md,score,confidence,factors,positives,risks,
    status,fixture:fixtureData,matchup:match,average:avg,teamStrength:teamValue,news,
    calibrationActive:calibration.active,weights,
    preseasonScore,regularScore,seasonBlend,phase:coachPhaseLabel(),
    label:score>=82?'Top-Empfehlung':score>=68?'Starke Option':score>=52?'Solide Option':score>=35?'Riskante Option':'Nicht empfehlen'
  };
  if(cacheKey)_coachAssessmentCache.set(cacheKey,result);
  return result;
}
function coachPlayerScore(player,md=data.settings.currentMd){
  return coachPlayerAssessment(player,md).score;
}
function coachPlayerConfidence(player,md=data.settings.currentMd){
  return coachPlayerAssessment(player,md).confidence;
}
function coachPlayerExplanation(player,md=data.settings.currentMd){
  const a=coachPlayerAssessment(player,md);
  const base=[`${a.phase}`,`Coach ${a.score.toFixed(0)}/100`,`Sicherheit ${a.confidence.toFixed(0)} %`,a.status.label];
  if(a.fixture)base.push(`${a.fixture.ha==='H'?'Heim':'Auswärts'} gegen ${a.fixture.opp}`);
  base.push(`Matchup ${a.matchup.toFixed(1)}`,`Team ${a.teamStrength.toFixed(1)}`);
  if(!a.average)base.push('Saison-Ø noch neutral');
  base.push(`Quelle ${effectiveLineupStatus(player).source}`);
  return base.join(' · ');
}
function coachRankPlayers(md=data.settings.currentMd){
  return [...activePlayers()].sort((a,b)=>{
    const aa=coachPlayerAssessment(a,md),bb=coachPlayerAssessment(b,md);
    return bb.score-aa.score||bb.confidence-aa.confidence;
  });
}

const ALLOWED_FORMATIONS=[
  {code:'3-4-3',Abwehr:3,Mittelfeld:4,Sturm:3},
  {code:'4-4-2',Abwehr:4,Mittelfeld:4,Sturm:2},
  {code:'4-5-1',Abwehr:4,Mittelfeld:5,Sturm:1},
  {code:'5-3-2',Abwehr:5,Mittelfeld:3,Sturm:2},
  {code:'5-4-1',Abwehr:5,Mittelfeld:4,Sturm:1},
  {code:'4-2-4',Abwehr:4,Mittelfeld:2,Sturm:4},
  {code:'3-5-2',Abwehr:3,Mittelfeld:5,Sturm:2},
  {code:'5-2-3',Abwehr:5,Mittelfeld:2,Sturm:3},
  {code:'4-3-3',Abwehr:4,Mittelfeld:3,Sturm:3},
  {code:'3-6-1',Abwehr:3,Mittelfeld:6,Sturm:1}
];
function lineupPlayers(ids){
  return (ids||[]).map(pid=>activePlayers().find(p=>p.id===pid)).filter(Boolean);
}
function lineupPositionCounts(ids){
  const counts={Tor:0,Abwehr:0,Mittelfeld:0,Sturm:0,Andere:0};
  lineupPlayers(ids).forEach(player=>{
    const position=lineupPositionOf(player);
    if(Object.prototype.hasOwnProperty.call(counts,position))counts[position]++;
    else counts.Andere++;
  });
  return counts;
}
function exactFormation(ids){
  const counts=lineupPositionCounts(ids);
  if((ids||[]).length!==11||counts.Tor!==1||counts.Andere!==0)return null;
  return ALLOWED_FORMATIONS.find(f=>
    counts.Abwehr===f.Abwehr&&counts.Mittelfeld===f.Mittelfeld&&counts.Sturm===f.Sturm
  )||null;
}
function feasibleFormations(ids){
  const counts=lineupPositionCounts(ids);
  if((ids||[]).length>11||counts.Tor>1||counts.Andere>0)return[];
  return ALLOWED_FORMATIONS.filter(f=>
    counts.Abwehr<=f.Abwehr&&
    counts.Mittelfeld<=f.Mittelfeld&&
    counts.Sturm<=f.Sturm&&
    counts.Tor<=1
  );
}

function repairLegacyLineup(ids,md=data.settings.currentMd){
  const active=activePlayers();
  const unique=[...new Set((ids||[]).filter(pid=>active.some(p=>p.id===pid)))].slice(0,11);
  const players=lineupPlayers(unique);

  // Keep only the strongest goalkeeper when old data contains several.
  const keepers=players
    .filter(p=>p.position==='Tor')
    .sort((a,b)=>coachPlayerScore(b,md)-coachPlayerScore(a,md));
  let repaired=[...unique];
  if(keepers.length>1){
    const keepId=keepers[0].id;
    repaired=repaired.filter(pid=>{
      const p=active.find(x=>x.id===pid);
      return p?.position!=='Tor'||pid===keepId;
    });
  }

  // 2.1.9a: Never rebuild a user's lineup automatically.
  // Invalid/incomplete formations remain exactly as edited until the user
  // explicitly chooses "Empfehlung" or confirms a screenshot import.

  return{
    ids:repaired,
    changed:repaired.length!==unique.length||repaired.some((id,index)=>id!==unique[index]),
    removed:unique.filter(id=>!repaired.includes(id))
  };
}

function lineupValidation(ids,{complete=false}={}){
  const counts=lineupPositionCounts(ids);
  if(counts.Andere>0)return{ok:false,message:'Alle aufgestellten Spieler benötigen eine gültige Position.'};
  if(counts.Tor>1)return{ok:false,message:'Es darf nur ein Torwart aufgestellt werden.'};
  if((ids||[]).length>11)return{ok:false,message:'Die Startelf besteht aus genau elf Spielern.'};
  if(complete){
    if((ids||[]).length!==11)return{ok:false,message:`Die Startelf ist noch unvollständig (${(ids||[]).length}/11).`};
    if(counts.Tor!==1)return{ok:false,message:'Eine gültige Startelf benötigt genau einen Torwart.'};
    const formation=exactFormation(ids);
    if(!formation)return{ok:false,message:'Diese Positionsverteilung ist nicht erlaubt. Wähle eine der zehn gültigen Formationen.'};
    return{ok:true,formation};
  }
  const feasible=feasibleFormations(ids);
  if(!feasible.length)return{
    ok:false,
    message:'Diese Positionsverteilung lässt sich zu keiner erlaubten Formation ergänzen.'
  };
  return{ok:true,feasible};
}
function bestPlayersForPosition(players,position,count,md){
  return players.filter(p=>lineupPositionOf(p)===position)
    .sort((a,b)=>coachPlayerScore(b,md)-coachPlayerScore(a,md))
    .slice(0,count);
}

function coachOptimizedLineup(md=data.settings.currentMd){
  const ranked=coachRankPlayers(md).filter(p=>effectiveLineupStatus(p).status!=='Fällt aus');
  const keepers=ranked.filter(p=>lineupPositionOf(p)==='Tor');
  if(!keepers.length)return[];

  const candidates=[];
  for(const formation of ALLOWED_FORMATIONS){
    const selected=[
      ...bestPlayersForPosition(ranked,'Tor',1,md),
      ...bestPlayersForPosition(ranked,'Abwehr',formation.Abwehr,md),
      ...bestPlayersForPosition(ranked,'Mittelfeld',formation.Mittelfeld,md),
      ...bestPlayersForPosition(ranked,'Sturm',formation.Sturm,md)
    ];
    if(selected.length!==11)continue;
    const score=selected.reduce((sum,p)=>sum+coachPlayerScore(p,md),0);
    const confidence=selected.reduce((sum,p)=>sum+coachPlayerConfidence(p,md),0)/11;
    candidates.push({formation,selected,score,confidence});
  }
  candidates.sort((a,b)=>b.score-a.score||b.confidence-a.confidence);
  return candidates[0]?.selected||[];
}
function coachFactorRows(player,md=data.settings.currentMd){
  const a=coachPlayerAssessment(player,md);
  const rows=[
    ['Ø Punkte',a.factors.average,a.weights.average],
    ['Matchup',a.factors.matchup,a.weights.matchup],
    ['Startelfstatus',a.factors.lineup,a.weights.lineup],
    ['Teamstärke',a.factors.team,a.weights.team],
    ['Heimvorteil',a.factors.home,a.weights.home],
    ['Offizielle News',Math.abs(a.factors.news||0),a.weights.news]
  ];
  return rows.map(([label,value,max])=>`<div class="coach-factor-row">
    <span>${label}</span><div><i style="width:${Math.max(0,Math.min(100,value/max*100))}%"></i></div><b>${value.toFixed(0)}/${max}</b>
  </div>`).join('');
}

function coachAI(){
  const context=actualMatchdayContext?.()||{md:+data.settings.currentMd||1,phase:'pre'};
  const md=context.md;
  const active=activePlayers();
  const record=mdRecord(md);
  const selected=(record.lineup||[]).map(id=>active.find(p=>p.id===id)).filter(Boolean);
  const lineup=selected.length?selected:coachOptimizedLineup(md);
  const bench=active.filter(p=>!lineup.some(s=>s.id===p.id));
  const insights=[];

  if(!active.length)return [{
    level:'info',icon:'🧠',title:'Kader noch leer',
    text:'Nach dem ersten Kauf berechnet der Coach Score, Confidence und eine begründete Startelfempfehlung.',
    action:'scout',label:'Scout öffnen'
  }];

  const best=coachRankPlayers(md).find(p=>effectiveLineupStatus(p).status!=='Fällt aus');
  if(best){
    const a=coachPlayerAssessment(best,md);
    insights.push({
      level:a.status.level==='bad'?'warn':a.status.level,
      icon:a.score>=82?'🔥':'🎯',
      title:`${a.label}: ${best.name}`,
      text:`Coach Score ${a.score.toFixed(0)} · Confidence ${a.confidence.toFixed(0)} %. ${a.positives.join(' · ')||a.status.label}${a.risks.length?`. Risiko: ${a.risks.join(', ')}`:''}.`,
      action:'squad',label:'Details ansehen'
    });
  }

  const weakest=[...lineup].sort((a,b)=>coachPlayerScore(a,md)-coachPlayerScore(b,md))[0];
  const bestBench=[...bench].filter(p=>effectiveLineupStatus(p).status!=='Fällt aus').sort((a,b)=>coachPlayerScore(b,md)-coachPlayerScore(a,md))[0];
  if(weakest&&bestBench&&coachPlayerScore(bestBench,md)>=coachPlayerScore(weakest,md)+7){
    const incoming=coachPlayerAssessment(bestBench,md);
    const outgoing=coachPlayerAssessment(weakest,md);
    insights.push({
      level:'warn',icon:'🔄',title:'Coach empfiehlt einen Wechsel',
      text:`${bestBench.name} (${incoming.score.toFixed(0)}, ${incoming.confidence.toFixed(0)} % sicher) vor ${weakest.name} (${outgoing.score.toFixed(0)}). Hauptgrund: ${incoming.positives[0]||incoming.status.label}.`,
      action:'squad',label:'Startelf optimieren'
    });
  }

  const risks=lineup.map(p=>coachPlayerAssessment(p,md)).filter(a=>a.risks.some(r=>/aus|Bank|fraglich|Rotationsrisiko/.test(r)));
  if(risks.length)insights.push({
    level:'bad',icon:'🚑',title:'Startelf enthält Einsatzrisiken',
    text:risks.slice(0,3).map(a=>`${a.player.name}: ${a.risks.join(', ')}`).join(' · '),
    action:'lineupintel',label:'Status prüfen'
  });

  const lowConfidence=lineup.map(p=>coachPlayerAssessment(p,md)).filter(a=>a.confidence<60);
  if(lowConfidence.length)insights.push({
    level:'info',icon:'📡',title:'Datenlage noch unsicher',
    text:`Bei ${lowConfidence.length} Startelfspielern liegt die Confidence unter 60 %. Vor allem aktuelle Aufstellungsstatus fehlen.`,
    action:'lineupintel',label:'Daten aktualisieren'
  });

  const ruleNote=leagueAssistant().find(n=>n.level==='bad');
  if(ruleNote)insights.push({level:'bad',icon:'⚖️',title:ruleNote.title,text:ruleNote.text,action:ruleNote.action,label:ruleNote.label});

  if(!insights.length)insights.push({
    level:'good',icon:'✅',title:'Aufstellung wirkt stabil',
    text:'Coach Scores, Confidence und vorhandene Startelfstatus ergeben derzeit keinen klaren Wechselbedarf.',
    action:'squad',label:'Startelf öffnen'
  });
  return insights.slice(0,4);
}
function editingInProgress(){
  if(window.h2hAiImportBusy)return true;
  return Boolean(document.querySelector(
    [
      '#modalArea .modal-backdrop',
      '#competitionModal .modal-backdrop',
      '#transferForm input:focus',
      '#transferForm select:focus',
      '#transferForm textarea:focus',
      '#financeForm input:focus',
      '#financeForm select:focus',
      '#competitionModal input',
      '#competitionModal select',
      '#competitionModal textarea'
    ].join(', ')
  ));
}
window.h2hEditingInProgress=editingInProgress;

const LEAGUE_RULES=[
  {id:'mode',group:'Liga',title:'H2H-Modus',summary:'Sieg 3 Punkte, Unentschieden 1 Punkt, Niederlage 0 Punkte.',detail:'Tabellenreihenfolge: Punkte, Siege, direkter Vergleich, gesamte Kickbase-Punkte, anschließend Losentscheid.'},
  {id:'transfers',group:'Transfers',title:'Allgemeine Transfers',summary:'Höchstgebotsprinzip; kein Sofortkauf zwischen Manager und Kickbase.',detail:'Bei Managertransfers muss der wirtschaftlich beste zulässige Zuschlag beachtet werden. Auf Verlangen sind Preis, Gebote, Absprachen und Screenshots offenzulegen.'},
  {id:'marketvalue',group:'Transfers',title:'Nicht unter Marktwert verkaufen',summary:'Spieler dürfen nie unter ihrem unmittelbar vor Abschluss angezeigten Marktwert verkauft werden.',detail:'Ein vereinbarter Verkauf unter Marktwert muss vor dem nächsten Marktwertupdate durch einen Rückverkauf an Kickbase korrigiert werden.'},
  {id:'loans',group:'Transfers',title:'Leihgeschäfte',summary:'Mindestens ein Spieltag; Leihgebühr 20 % des Marktwerts bei Leihbeginn.',detail:'Nach Ablauf muss der Spieler unverzüglich zum ursprünglichen Eigentümer zurück. Die Gebühr ist unabhängig von Einsatz und Punkten geschuldet.'},
  {id:'swaps',group:'Transfers',title:'Spielertausch',summary:'Mit oder ohne Ausgleichszahlung möglich.',detail:'Tauschgeschäfte müssen fair sein und können bei einem nachweislich wirtschaftlich besseren, übergangenen Angebot angefochten werden.'},
  {id:'mvp',group:'Spieltag',title:'Bundesliga-MVP-Regel',summary:'Der Bundesliga-MVP eines Spieltags muss bis Dienstag vor dem Marktwertupdate an Kickbase verkauft werden.',detail:'Besitzt du den Bundesliga-MVP, erfüllt genau dieser Verkauf gleichzeitig die Top-3-Pflicht; es ist nur ein Pflichtverkauf nötig.'},
  {id:'top3',group:'Spieltag',title:'Top-3-Regel',summary:'Nach jedem Spieltag muss einer deiner drei punktbesten Spieler dauerhaft abgegeben werden.',detail:'Frist ist Dienstag vor dem Marktwertupdate. Bei Verstoß muss der folgende Spieltag mit nur zehn Spielern bestritten werden.'},
  {id:'jury',group:'Jury',title:'Transferanfechtung',summary:'Jeder Manager kann Vorgänge begründet bei der Ligajury anfechten.',detail:'Als Nachweise zählen unter anderem Screenshots, Chatverläufe und Gebotshistorien. Offensichtlich missbräuchliche Anfechtungen können ab dem zweiten Fall 1 Mio. € Ausgleich auslösen.'},
  {id:'sanctions',group:'Jury',title:'Sanktionen',summary:'Verwarnung, Geldstrafe, Punktabzug oder freier Kaderplatz sind möglich.',detail:'Besondere Sanktionen des Regelwerks gehen vor. Geldstrafen sind grundsätzlich innerhalb von sieben Tagen zu begleichen.'}
];
function ruleById(id){return LEAGUE_RULES.find(x=>x.id===id)}

function matchdayWindow(md){
  const dates=FIXTURES.filter(x=>+x.md===+md&&x.date)
    .map(x=>new Date(x.date)).filter(x=>!Number.isNaN(x.getTime()));
  if(!dates.length)return null;
  const first=new Date(Math.min(...dates.map(x=>x.getTime())));
  const lastKickoff=new Date(Math.max(...dates.map(x=>x.getTime())));
  return{md:+md,first,lastKickoff,end:new Date(lastKickoff.getTime()+3*60*60*1000)};
}
function actualMatchdayContext(now=new Date()){
  const windows=Array.from({length:34},(_,i)=>matchdayWindow(i+1)).filter(Boolean);
  if(!windows.length)return{md:+data.settings.currentMd||1,phase:'unknown',window:null};
  const live=windows.find(w=>now>=w.first&&now<=w.end);
  if(live)return{md:live.md,phase:'live',window:live};
  const previous=[...windows].filter(w=>w.end<now).sort((a,b)=>b.end-a.end)[0];
  const next=windows.find(w=>w.first>now);
  if(previous){
    const deadline=nextTuesdayDeadline(previous.md);
    if(deadline&&now<=deadline)return{md:previous.md,phase:'post',window:previous,deadline};
  }
  if(next)return{md:next.md,phase:'pre',window:next};
  if(previous)return{md:previous.md,phase:'finished',window:previous};
  return{md:windows[0].md,phase:'pre',window:windows[0]};
}
function matchdayPhaseLabel(c=actualMatchdayContext()){
  return c.phase==='pre'?`Vorbereitung auf Spieltag ${c.md}`:
    c.phase==='live'?`Spieltag ${c.md} läuft`:
    c.phase==='post'?`Nachbereitung Spieltag ${c.md}`:
    c.phase==='finished'?'Saison beendet':`Spieltag ${c.md}`;
}
function recentLineupCheck(){
  const raw=data.lineupIntel?.lastChecked||data.lineupIntel?.lastImport;
  if(!raw)return false;
  const t=new Date(raw).getTime();
  return Number.isFinite(t)&&Date.now()-t<4*24*60*60*1000;
}
function actualMatchdayChecklist(){
  const c=actualMatchdayContext(),md=c.md,record=mdRecord(md),active=activePlayers();
  const lineup=Array.isArray(record.lineup)?record.lineup.filter(id=>active.some(p=>p.id===id)):[];
  const mandatory=mandatoryStatus(md);
  if(c.phase==='pre')return[
    {id:'lineup',done:Boolean(exactFormation(lineup.map(p=>p.id||p))),label:`Startelf für Spieltag ${md}`,detail:`${lineup.length}/11 gespeichert`,page:'squad'},
    {id:'li',done:recentLineupCheck(),label:'Aufstellungsstatus geprüft',detail:recentLineupCheck()?'Innerhalb der letzten 4 Tage':'Noch nicht aktuell geprüft',page:'lineupintel'},
    {id:'coach',done:Boolean(sessionStorage.getItem(`coachReadMd${md}`)),label:'Coach AI gelesen',detail:'Hinweise für den tatsächlichen Spieltag',page:'dashboard'},
    {id:'bonus',done:dailyBonusBooked(),label:'Tagesbonus',detail:localDateISO(),page:'finances'}
  ];
  if(c.phase==='live')return[
    {id:'live',done:true,label:`Spieltag ${md} läuft`,detail:'Vorbereitungsphase abgeschlossen',page:'matchday'},
    {id:'bonus',done:dailyBonusBooked(),label:'Tagesbonus',detail:localDateISO(),page:'finances'}
  ];
  if(c.phase==='post')return[
    {id:'points',done:Object.values(record.points||{}).some(v=>v!==null&&v!==''),label:'Punkte eingetragen',detail:`Spieltag ${md}`,page:'matchday'},
    {id:'mvp',done:Boolean(record.mvp),label:'Bundesliga-MVP eingetragen',detail:record.mvp||'Noch offen',page:'matchday'},
    {id:'sale',done:mandatory.state==='done',label:'Pflichtverkauf erledigt',detail:mandatory.text,page:'matchday'},
    {id:'bonus',done:dailyBonusBooked(),label:'Tagesbonus',detail:localDateISO(),page:'finances'}
  ];
  return[{id:'bonus',done:dailyBonusBooked(),label:'Tagesbonus',detail:localDateISO(),page:'finances'}];
}

function nextTuesdayDeadline(md=data.settings.currentMd){
  const games=FIXTURES.filter(x=>+x.md===+md&&x.date);
  const dates=games.map(x=>new Date(x.date)).filter(x=>!Number.isNaN(x.getTime()));
  if(!dates.length)return null;
  const latest=new Date(Math.max(...dates.map(x=>x.getTime())));
  const deadline=new Date(latest);
  while(deadline.getDay()!==2)deadline.setDate(deadline.getDate()+1);
  deadline.setHours(19,30,0,0);
  return deadline;
}
function deadlineText(md=data.settings.currentMd){
  const d=nextTuesdayDeadline(md);
  return d?d.toLocaleString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Dienstag vor Marktwertupdate';
}
function dailyBonusBooked(){
  const today=localDateISO();
  return data.finances.some(x=>x.date===today&&String(x.type||'').toLowerCase().includes('bonus'));
}
function leagueAssistant(){
  const c=actualMatchdayContext(),md=c.md,record=mdRecord(md),mandatory=mandatoryStatus(md),notes=[];
  if(!dailyBonusBooked())notes.push({level:'warn',icon:'🎁',title:'Tagesbonus offen',text:`Für ${localDateISO()} ist noch kein Bonus verbucht.`,action:'finances',label:'Bonus eintragen'});

  if(c.phase==='pre'){
    const active=activePlayers(),lineup=(record.lineup||[]).filter(id=>active.some(p=>p.id===id));
    if(lineup.length<data.settings.lineupSize)notes.push({level:'bad',icon:'🧩',title:`Startelf für Spieltag ${md} unvollständig`,text:`${lineup.length}/11 Plätze gespeichert. Erster Anpfiff: ${c.window.first.toLocaleString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}.`,action:'squad',label:'Startelf ergänzen'});
    if(!recentLineupCheck())notes.push({level:'warn',icon:'🩺',title:'Aufstellungsstatus prüfen',text:`Vor Spieltag ${md} nur die Vereine deiner Kaderspieler kontrollieren.`,action:'lineupintel',label:'LigaInsider öffnen'});
  }else if(c.phase==='live'){
    notes.push({level:'info',icon:'⚽',title:`Spieltag ${md} läuft`,text:'Vorbereitungsaufgaben sind beendet. Jetzt stehen Punkte und das H2H-Duell im Mittelpunkt.',action:'matchday',label:'Spieltag öffnen'});
    const risks=(record.lineup||[]).map(id=>data.players.find(p=>p.id===id)).filter(p=>p&&['Fraglich','Ersatzbank','Fällt aus'].includes(p.liStatus));
    if(risks.length)notes.push({level:'warn',icon:'🚑',title:'Auffälliger Startelfstatus',text:risks.map(p=>`${p.name} (${p.liStatus})`).join(', '),action:'lineupintel',label:'Status ansehen'});
  }else if(c.phase==='post'){
    if(mandatory.state==='waiting')notes.push({level:'warn',icon:'🏅',title:`Spieltag ${md} auswerten`,text:'Punkte und Bundesliga-MVP eintragen, damit der Pflichtverkauf korrekt bestimmt wird.',action:'matchday',label:'Auswertung öffnen'});
    if(mandatory.state==='open')notes.push({level:'bad',icon:'⏰',title:'Pflichtverkauf offen',text:`${mandatory.text}. Frist: ${deadlineText(md)}.`,action:'matchday',label:'Verkauf prüfen'});
  }

  const invalid=data.players.filter(p=>p.soldDate&&+p.marketValueAtSale>0&&+p.salePrice<+p.marketValueAtSale);
  if(invalid.length)notes.push({level:'bad',icon:'⚖️',title:'Verkauf unter Marktwert',text:`${invalid.map(p=>p.name).join(', ')} prüfen.`,action:'transfers',label:'Transfers öffnen'});

  if(!notes.length)notes.push({level:'good',icon:'✅',title:matchdayPhaseLabel(c),text:'Aktuell sind alle erkannten Aufgaben erledigt.',action:c.phase==='pre'?'squad':'rules',label:c.phase==='pre'?'Startelf öffnen':'Regelwerk öffnen'});
  return notes.slice(0,4);
}


window.PLAYER_AVAILABILITY=window.PLAYER_AVAILABILITY||[];

window.OFFICIAL_CLUB_NEWS=window.OFFICIAL_CLUB_NEWS||[];

function relevantOfficialNews({hours=168,limit=20}={}){
  const cutoff=Date.now()-hours*60*60*1000;
  const activeNames=activePlayers().map(p=>({name:normalizePlayerName(p.name),player:p}));
  return (window.OFFICIAL_CLUB_NEWS||[])
    .filter(n=>!n.published_at||new Date(n.published_at).getTime()>=cutoff)
    .map(news=>{
      const hay=normalizePlayerName(`${news.title||''} ${news.summary||''}`);
      const players=activeNames.filter(x=>hay.includes(x.name)).map(x=>x.player);
      return {...news,matchedPlayers:players,relevance:players.length*50+Math.abs(Number(news.impact_score||0))+Number(news.trust_score||0)/10};
    })
    .filter(n=>n.matchedPlayers.length||Number(n.impact_score)!==0)
    .sort((a,b)=>b.relevance-a.relevance||new Date(b.published_at||0)-new Date(a.published_at||0))
    .slice(0,limit);
}
function newsImpactForPlayer(player){
  const name=normalizePlayerName(player.name);
  return (window.OFFICIAL_CLUB_NEWS||[])
    .filter(n=>normalizePlayerName(`${n.title||''} ${n.summary||''}`).includes(name))
    .filter(n=>!n.published_at||Date.now()-new Date(n.published_at).getTime()<7*86400000)
    .sort((a,b)=>new Date(b.published_at||0)-new Date(a.published_at||0))[0]||null;
}
function matchdayReadiness(){
  const context=actualMatchdayContext?.()||{md:+data.settings.currentMd||1,phase:'unknown'};
  const md=context.md,active=activePlayers(),lineup=(mdRecord(md).lineup||[]).map(id=>active.find(p=>p.id===id)).filter(Boolean);
  const assessments=lineup.map(p=>coachPlayerAssessment(p,md));
  const complete=Boolean(exactFormation(lineup.map(p=>p.id||p)));
  const avgConfidence=assessments.length?assessments.reduce((s,a)=>s+a.confidence,0)/assessments.length:0;
  const hardRisks=assessments.filter(a=>a.score===0||a.risks.some(r=>/fällt aus|Bank prognostiziert/i.test(r))).length;
  const score=Math.max(0,Math.min(100,(complete?35:lineup.length/data.settings.lineupSize*35)+avgConfidence*.45+(hardRisks?0:20)));
  return{context,md,lineup,assessments,complete,avgConfidence,hardRisks,score,
    label:score>=85?'Bereit für den Spieltag':score>=65?'Fast bereit':score>=40?'Prüfung nötig':'Nicht bereit'};
}
function coachMemory(){
  const key='h2hCoachFeedbackV1';
  let rows=[];try{rows=JSON.parse(localStorage.getItem(key)||'[]')}catch{}
  return{
    rows,
    add(value,md){rows.push({id:id(),date:new Date().toISOString(),md,value});localStorage.setItem(key,JSON.stringify(rows.slice(-200)))},
    stats(){const helpful=rows.filter(x=>x.value==='helpful').length;return{count:rows.length,helpful,rate:rows.length?helpful/rows.length*100:0}}
  };
}

window.DATA_SYNC_STATUS=window.DATA_SYNC_STATUS||[];

function normalizePlayerName(value){
  return String(value||'').toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]/g,'');
}
function externalAvailability(player){
  const rows=window.PLAYER_AVAILABILITY||[];
  const name=normalizePlayerName(player.name);
  const team=String(player.team||'').toLocaleLowerCase('de-DE');
  return rows
    .filter(row=>normalizePlayerName(row.player_name)===name&&(!row.team||team.includes(String(row.team).toLocaleLowerCase('de-DE').split(' ')[0])))
    .sort((a,b)=>new Date(b.provider_updated_at||b.updated_at||0)-new Date(a.provider_updated_at||a.updated_at||0))[0]||null;
}
function effectiveLineupStatus(player){
  const external=externalAvailability(player);
  if(external?.predicted_status)return{
    status:external.predicted_status,
    probability:Number(external.lineup_probability),
    confirmed:Boolean(external.is_confirmed),
    source:external.provider,
    updatedAt:external.provider_updated_at||external.updated_at,
    injury:external.injury_status,
    suspension:external.suspension_status
  };
  return{
    status:player.liStatus||'Unbekannt',
    probability:null,
    confirmed:false,
    source:player.liStatus&&player.liStatus!=='Unbekannt'?'Manuell':'Keine Daten',
    updatedAt:player.liUpdatedAt||null,
    injury:null,suspension:null
  };
}
function providerHealth(provider){
  return (window.DATA_SYNC_STATUS||[]).find(x=>x.provider===provider)||null;
}

window.BUNDESLIGA_CLUBS=window.BUNDESLIGA_CLUBS||[];
window.BUNDESLIGA_PLAYERS=window.BUNDESLIGA_PLAYERS||[];
function mapLivePosition(position){
  const p=String(position||'').trim().toLocaleLowerCase('de-DE');
  if(!p)return '';
  if(p==='tor'||p.includes('torwart')||p.includes('goalkeeper')||p==='gk')return 'Tor';
  if(p==='abwehr'||p.includes('verteid')||p.includes('defence')||p.includes('defender')||p==='df')return 'Abwehr';
  if(p==='mittelfeld'||p.includes('midfield')||p.includes('midfielder')||p==='mf')return 'Mittelfeld';
  if(p==='sturm'||p.includes('angriff')||p.includes('offence')||p.includes('forward')||p.includes('striker')||p==='fw')return 'Sturm';
  return '';
}
function canonicalLineupPosition(position){return mapLivePosition(position)}

const V219B_KICKBASE_ROSTER_METADATA={
  schwolow:{name:'Alexander Schwolow',team:'1. FSV Mainz 05',position:'Tor'},
  kristof:{name:'Nicolas Kristof',team:'SV Elversberg',position:'Tor'},
  gotze:{name:'Mario Götze',team:'Eintracht Frankfurt',position:'Mittelfeld'},
  beste:{name:'Jan-Niklas Beste',team:'Sport-Club Freiburg',position:'Mittelfeld'},
  olise:{name:'Michael Olise',team:'FC Bayern München',position:'Mittelfeld'},
  lienhart:{name:'Philipp Lienhart',team:'Sport-Club Freiburg',position:'Abwehr'},
  anton:{name:'Waldemar Anton',team:'Borussia Dortmund',position:'Abwehr'},
  garcia:{name:'Aleix García',team:'Bayer 04 Leverkusen',position:'Mittelfeld'},
  erevbenagie:{name:'Paul Erevbenagie',team:'SV Werder Bremen',position:'Sturm'},
  deman:{name:'Olivier Deman',team:'SV Werder Bremen',position:'Abwehr'},
  posch:{name:'Stefan Posch',team:'1. FSV Mainz 05',position:'Abwehr'},
  fernandez:{name:'Ignacio Fernández',team:'Bayer 04 Leverkusen',position:'Mittelfeld'},
  rubenmuller:{name:'Ruben Müller',team:'SC Paderborn 07',position:'Sturm'},
  leszczynski:{name:'Jan Leszczyński',team:'Borussia Mönchengladbach',position:'Abwehr'}
};
function v219bRosterKey(name){return v218AliasKey(name)}
const V219C_FULLNAME_TO_ROSTER_KEY={
  alexanderschwolow:'schwolow',
  nicolaskristof:'kristof',
  mariogotze:'gotze',
  janniklasbeste:'beste',
  michaelolise:'olise',
  philipplienhart:'lienhart',
  waldemaranton:'anton',
  aleixgarcia:'garcia',
  paulerevbenagie:'erevbenagie',
  olivierdeman:'deman',
  stefanposch:'posch',
  ignaciofernandez:'fernandez',
  rubenmuller:'rubenmuller',
  janleszczynski:'leszczynski'
};
function v219bKickbaseMetadata(name){
  const raw=v219bRosterKey(name);
  const direct=V219B_KICKBASE_ROSTER_METADATA[raw];
  if(direct)return direct;
  const mapped=V219C_FULLNAME_TO_ROSTER_KEY[raw];
  if(mapped&&V219B_KICKBASE_ROSTER_METADATA[mapped])return V219B_KICKBASE_ROSTER_METADATA[mapped];
  // Safe surname fallback only when it maps to exactly one confirmed roster record.
  const hits=Object.entries(V219B_KICKBASE_ROSTER_METADATA).filter(([key,meta])=>{
    const full=v219bRosterKey(meta.name);
    return full.endsWith(raw)||raw.endsWith(key)||full.endsWith(key);
  });
  return hits.length===1?hits[0][1]:null;
}


function lineupPositionOf(player){
  if(!player)return '';
  return canonicalLineupPosition(player.kickbasePosition||player.position);
}

function repairPlayerPositionV219(player){
  if(!player)return '';
  // 2.1.9b: Kickbase-specific roster metadata is authoritative for lineup rules.
  // Generic provider categories such as "Offence" must never turn a Kickbase
  // midfielder into a striker.
  const kb=v219bKickbaseMetadata(player.name);
  if(kb){
    player.name=kb.name;
    player.team=kb.team;
    player.position=kb.position;
    player.kickbasePosition=kb.position;
    return kb.position;
  }

  // Preserve an explicitly stored Kickbase position before consulting master data.
  const stored=canonicalLineupPosition(player.kickbasePosition||player.position);
  if(player.kickbasePosition&&stored){
    player.position=stored;
    return stored;
  }

  const master=resolveShortNameAgainstLocalMasters(player.name,{team:player.team||''});
  const resolved=canonicalLineupPosition(master?.position);
  if(master?.matched){
    if(master.name)player.name=master.name;
    if(master.team)player.team=master.team;
    if(resolved){
      player.position=resolved;
      player.kickbasePosition=player.kickbasePosition||resolved;
    }
    if(master.external_id!=null)player.externalPlayerId=master.external_id;
    return resolved||stored;
  }
  if(stored){player.position=stored;return stored}
  return '';
}
function playerVisual(player,className='player-photo'){
  if(player.photoUrl)return `<img class="${className}" src="${esc(player.photoUrl)}" alt="${esc(player.name)}">`;
  const initials=String(player.name||'?').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
  return `<span class="${className} photo-fallback">${esc(initials)}</span>`;
}


function selectableBundesligaPlayers(){
  const rows=[
    ...(window.BUNDESLIGA_PLAYERS||[]).map(player=>({
      id:String(player.external_id??player.id??''),
      name:String(player.name||'').trim(),
      team:String(player.team||'').trim(),
      position:String(player.position||'').trim()
    })),
    ...(data.players||[]).map(player=>({
      id:String(player.id||''),
      name:String(player.name||'').trim(),
      team:String(player.team||'').trim(),
      position:String(player.position||'').trim()
    }))
  ].filter(player=>player.name);

  const unique=new Map();
  rows.forEach(player=>{
    const key=normalizePlayerName(player.name);
    const current=unique.get(key);
    if(!current||(!current.team&&player.team))unique.set(key,player);
  });

  return [...unique.values()].sort((a,b)=>
    a.name.localeCompare(b.name,'de',{sensitivity:'base'})
  );
}
function playerAutocompleteOptions(){
  return selectablePlayerIndex().list.map(player=>
    `<option value="${esc(player.name)}">${esc(player.team?`${player.name} · ${player.team}`:player.name)}</option>`
  ).join('');
}
let selectablePlayerIndexCache={signature:'',index:new Map(),list:[]};
function selectablePlayerIndex(){
  const liveCount=(window.BUNDESLIGA_PLAYERS||[]).length;
  const storedCount=(data.players||[]).length;
  const signature=`${liveCount}|${storedCount}|${window.BUNDESLIGA_PLAYERS?.[0]?.updated_at||''}|${data.updatedAt||''}`;
  if(selectablePlayerIndexCache.signature===signature)return selectablePlayerIndexCache;

  const list=selectableBundesligaPlayers();
  const index=new Map(list.map(player=>[normalizePlayerName(player.name),player]));
  selectablePlayerIndexCache={signature,index,list};
  return selectablePlayerIndexCache;
}


let _canonicalIdentityIndex=null;
function canonicalFullKey(value){
  return String(value||'').toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .trim().replace(/\s+/g,' ');
}
function canonicalIdentitySourceRows(){
  // 2.1.5m compatibility shim:
  // Older cleanup/index code still calls canonicalIdentitySourceRows().
  // The authoritative source in 2.1.5m is bundesligaMasterPlayers().
  return bundesligaMasterPlayers();
}

function buildCanonicalIdentityIndex(force=false){
  if(_canonicalIdentityIndex && !force)return _canonicalIdentityIndex;
  const rows=canonicalIdentitySourceRows();
  const exact=new Map(), surname=new Map();

  for(const p of rows){
    const norm=canonicalFullKey(p.name);
    if(!norm)continue;
    if(!exact.has(norm))exact.set(norm,p);

    const parts=norm.split(/\s+/).filter(Boolean);
    if(parts.length<2)continue;
    const last=parts[parts.length-1];
    if(!surname.has(last))surname.set(last,[]);
    surname.get(last).push(p);
  }

  // Deduplicate each surname bucket by normalized full name.
  for(const [key,list] of surname){
    const uniq=new Map();
    for(const p of list){
      const n=canonicalFullKey(p.name);
      const old=uniq.get(n);
      if(!old || (!old.team&&p.team))uniq.set(n,p);
    }
    surname.set(key,[...uniq.values()]);
  }
  _canonicalIdentityIndex={rows,exact,surname};
  return _canonicalIdentityIndex;
}

function resolveCanonicalPlayer(name,context={}){
  const raw=String(name||'').trim();
  const norm=canonicalFullKey(raw);
  if(!norm)return {matched:false,ambiguous:false,input:raw,confidence:0,reason:'leer'};

  const idx=buildCanonicalIdentityIndex();
  const parts=norm.split(/\s+/).filter(Boolean);

  // Full names: exact only. Never guess a different person.
  if(parts.length>1){
    const exact=idx.exact.get(norm);
    return exact
      ? {...exact,matched:true,ambiguous:false,input:raw,confidence:1,reason:'exakter Master-Name'}
      : {matched:false,ambiguous:false,input:raw,confidence:0,reason:'kein exakter Master'};
  }

  // Kickbase transfer screenshots show a surname only. Resolve solely through
  // a precomputed surname bucket. Exactly one full-name identity is required.
  const candidates=idx.surname.get(parts[0])||[];
  if(candidates.length===1){
    return {...candidates[0],matched:true,ambiguous:false,input:raw,confidence:.98,reason:'eindeutiger Nachname'};
  }

  // If duplicate sources represent the same full name, collapse them.
  const uniqueNames=new Map(candidates.map(p=>[canonicalFullKey(p.name),p]));
  if(uniqueNames.size===1){
    const p=[...uniqueNames.values()][0];
    return {...p,matched:true,ambiguous:false,input:raw,confidence:.96,reason:'eindeutiger Nachname (Quellen zusammengeführt)'};
  }

  return {matched:false,ambiguous:candidates.length>1,input:raw,confidence:0,
    reason:candidates.length>1?`${candidates.length} Nachnamen-Treffer`:'kein Nachnamen-Treffer',
    candidates:candidates.map(p=>p.name)};
}

function canonicalPlayerKey(name,context={}){
  const r=resolveCanonicalPlayer(name,context);
  return normalizePlayerName(r.matched?r.name:name);
}


function findSelectablePlayerByName(name){
  return selectablePlayerIndex().index.get(normalizePlayerName(name))||null;
}
function bindPlayerAutocomplete({inputId,clubId}){
  const input=document.getElementById(inputId);
  const club=document.getElementById(clubId);
  if(!input||!club)return;

  const applyClub=()=>{
    const player=findSelectablePlayerByName(input.value);
    if(!player?.team)return;

    if(club.tagName==='SELECT'&&!Array.from(club.options).some(option=>option.value===player.team)){
      const option=document.createElement('option');
      option.value=player.team;
      option.textContent=player.team;
      club.appendChild(option);
    }
    club.value=player.team;
    club.dispatchEvent(new Event('change',{bubbles:true}));
  };

  input.addEventListener('input',()=>{
    if(findSelectablePlayerByName(input.value))applyClub();
  });
  input.addEventListener('change',applyClub);
  input.addEventListener('blur',applyClub);
  if(input.value)applyClub();
}

function selectableGermanClubs(){
  const live=(window.BUNDESLIGA_CLUBS||[])
    .map(club=>club.team)
    .filter(Boolean);
  const players=(window.BUNDESLIGA_PLAYERS||[])
    .map(player=>player.team)
    .filter(Boolean);
  return [...new Set([...TEAMS,...live,...players])]
    .sort((a,b)=>a.localeCompare(b,'de'));
}
function clubSelectOptions(selected='',includeUnknown=true){
  const clubs=selectableGermanClubs();
  return `${includeUnknown?`<option value="">Verein nicht bekannt</option>`:''}${clubs.map(club=>
    `<option value="${esc(club)}" ${club===selected?'selected':''}>${esc(club)}</option>`
  ).join('')}`;
}
function scoutTargetOptions(selected='me'){
  return [
    `<option value="me" ${selected==='me'?'selected':''}>Mein Team</option>`,
    ...MANAGER_OPTIONS.map(manager=>
      `<option value="${manager.id}" ${selected===manager.id?'selected':''}>${esc(manager.team)} · ${esc(manager.manager)}</option>`
    )
  ].join('');
}
function scoutTargetLabel(targetId){
  if(targetId==='me')return 'Mein Team';
  return managerById(targetId)?.team||'Gegner';
}
function routeLivePlayer(externalId){
  const player=window.BUNDESLIGA_PLAYERS.find(x=>+x.external_id===+externalId);
  if(!player)return toast('Spieler nicht gefunden');
  const target=data.ui?.scoutTarget||'me';
  if(target==='me'){
    buyLivePlayer(externalId);
    return;
  }
  addOpponentTransfer(target,{
    type:'Kauf',
    md:data.settings.currentMd,
    player:player.name||'',
    club:player.team||'',
    date:localDateISO(),
    note:'Aus dem Scout Center übernommen'
  });
}

function buyLivePlayer(externalId){
  const p=window.BUNDESLIGA_PLAYERS.find(x=>+x.external_id===+externalId);
  if(!p)return toast('Spieler nicht gefunden');
  sessionStorage.setItem(TRANSFER_DRAFT_KEY,JSON.stringify({
    pfName:p.name||'',
    pfTeam:p.team||'',
    pfPos:mapLivePosition(p.position),
    pfDate:localDateISO(),
    pfBuy:'',
    pfMwb:'',
    pfMw:'',
    pfAvg:'',
    pfBuySource:'Transfermarkt',
    pfBuyCounterparty:'',
    pfBuyReasons:['Gutes Programm'],
    pfNote:'',
    externalPlayerId:p.external_id,
    photoUrl:p.photo_url||''
  }));
  page='transfers';
  render();
  setTimeout(()=>$('#buyPlayer')?.click(),0);
}


const H2H_ROUNDS=[
[['fabi','fabio'],['elias','marci'],['me','manu']],
[['marci','fabi'],['me','fabio'],['manu','elias']],
[['me','fabi'],['marci','manu'],['fabio','elias']],
[['manu','fabi'],['me','elias'],['fabio','marci']],
[['fabi','elias'],['manu','fabio'],['me','marci']]
];
function buildH2HSchedule(){
  const out=[];
  for(let md=1;md<=34;md++){
    const cycle=Math.floor((md-1)/5);
    const round=H2H_ROUNDS[(md-1)%5];
    round.forEach(([a,b],index)=>{
      const reverse=cycle%2===1;
      out.push({md,slot:index+1,home:reverse?b:a,away:reverse?a:b});
    });
  }
  return out;
}
const H2H_SCHEDULE=buildH2HSchedule();
function managerById(id){return (data.leagueManagers||LEAGUE_MANAGERS).find(x=>x.id===id)||LEAGUE_MANAGERS.find(x=>x.id===id)}
function managerLabel(id){const m=managerById(id);return m?`${m.team} (${m.manager})`:id}
function otherManagerOptions(selected=''){return MANAGER_OPTIONS.map(m=>`<option value="${esc(m.team)}" ${selected===m.team?'selected':''}>${esc(m.team)} (${esc(m.manager)})</option>`).join('')}const DAILY_BONUSES=Array.from({length:10},(_,i)=>({label:`Tag ${i+1}`,amount:(i+1)*10000}));const ACHIEVEMENT_BONUSES=[{label:'Spieltagssieger',amount:1000000},{label:'Spieltagspunkte Silber (≥ 1.000)',amount:250000},{label:'Spieltagspunkte Gold (≥ 1.500)',amount:500000},{label:'Jahrhundertspiel (≥ 2.000)',amount:1000000},{label:'Topscorer (200 Punkte)',amount:100000},{label:'Matchwinner (300 Punkte)',amount:500000},{label:'Weltklasse (400 Punkte)',amount:1000000},{label:'Fußballgott (500 Punkte)',amount:2000000},{label:'MVP',amount:1000000},{label:'Tormaschine',amount:250000},{label:'Bronzenes Händchen (3 Mio. Gewinn)',amount:250000},{label:'Silbernes Händchen (5 Mio. Gewinn)',amount:500000},{label:'Goldenes Händchen (10 Mio. Gewinn)',amount:1000000},{label:'Königstransfer (25 Mio. Gewinn)',amount:2000000},{label:'Glückliches Händchen',amount:1000000},{label:'Meister',amount:2000000},{label:'Vizemeister',amount:1000000}];const SEEDED_DATA={"version":3,"settings":{"currentMd":1,"mode":"quick","startCapital":200000000,"homeBonus":1,"lineupSize":11},"players":[{"id":"4eb80f64-293c-4b3a-a93b-3989361b1027","name":"Axel Tape","team":"Bayer 04 Leverkusen","position":"Abwehr","buyDate":"2026-08-02","buyPrice":5071935,"marketAtBuy":0,"marketValue":4655501,"avgPoints":0,"note":""},{"id":"41172e46-cd74-405a-bf78-fa8884a27cac","name":"Robin Gosens","team":"FC Schalke 04","position":"Abwehr","buyDate":"2026-08-03","buyPrice":11445599,"marketAtBuy":0,"marketValue":11407285,"avgPoints":0,"note":"","soldDate":"2026-08-03","salePrice":11407285,"saleReason":"Sinkender Marktwert"},{"id":"016bc246-b164-4a17-a686-cd4a2e90c0d3","name":"Dominik Kohr","team":"1. FSV Mainz 05","position":"Abwehr","buyDate":"2026-08-03","buyPrice":6543210,"marketAtBuy":0,"marketValue":6627684,"avgPoints":0,"note":""},{"id":"6629cde9-bacc-4a2c-8cf1-d2bd98c55480","name":"Jovan Milosevic","team":"VfB Stuttgart","position":"Sturm","buyDate":"2026-08-03","buyPrice":4141414,"marketAtBuy":0,"marketValue":3539303,"avgPoints":0,"note":""}],"finances":[{"id":"start","date":"2026-08-01","type":"Startkapital","description":"Start ohne Kader","amount":200000000},{"id":"ac5941c7-600d-4b97-b27e-1af756a30baf","date":"2026-08-02","type":"Spielerkauf","description":"Kauf Axel Tape","amount":-5071935},{"id":"158bd348-1fc2-4dcd-85fe-0541c4901cfc","date":"2026-08-02","type":"Erfolgsbonus","description":"Kreisliga","amount":1000000},{"id":"466b9c05-c952-4ffa-802b-0861146ef671","date":"2026-08-02","type":"Erfolgsbonus","description":"Regionalliga","amount":1000000},{"id":"80b55a26-862c-4308-930c-2a0b0bac48af","date":"2026-08-02","type":"Erfolgsbonus","description":"Erster Deal","amount":100000},{"id":"ddee6a22-5c27-4387-baa0-caf7cdec2f05","date":"2026-08-03","type":"Tagesanmeldebonus","description":"Tag 1","amount":10000},{"id":"23eb8316-babe-4af3-bf4b-0921645d3098","date":"2026-08-04","type":"Tagesanmeldebonus","description":"Tag 2","amount":20000},{"id":"618181e0-a4f3-46a0-98af-eea7ba7d8d04","date":"2026-08-03","type":"Spielerkauf","description":"Kauf Robin Gosens","amount":-11445599},{"id":"4c3c279c-c039-4ecc-9b56-e105e858bbc1","date":"2026-08-03","type":"Spielerkauf","description":"Kauf Dominik Kohr","amount":-6543210},{"id":"b9c2a384-9ece-4b1f-a87b-4b00ae137cc4","date":"2026-08-03","type":"Spielerkauf","description":"Kauf Jovan Milosevic","amount":-4141414},{"id":"a511955c-44d8-46db-9b75-8fd010f78f26","date":"2026-08-03","type":"Spielerverkauf","description":"Verkauf Robin Gosens","amount":11407285}],"matchdays":[{"id":"6abff25d-b7c8-4738-80c1-fda4f34ebf2b","md":1,"mvp":"","points":{},"lineup":[],"soldPlayer":"","soldDate":"","soldPrice":0}],"opponents":[],"h2h":[],"teamStrength":{"1. FC Köln":5,"1. FC Union Berlin":5,"1. FSV Mainz 05":5,"Bayer 04 Leverkusen":5,"Borussia Dortmund":5,"Borussia Mönchengladbach":5,"Eintracht Frankfurt":5,"FC Augsburg":5,"FC Bayern München":5,"FC Schalke 04":5,"Hamburger SV":5,"RB Leipzig":5,"SC Paderborn 07":5,"SV Elversberg":5,"SV Werder Bremen":5,"Sport-Club Freiburg":5,"TSG Hoffenheim":5,"VfB Stuttgart":5}};const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));const id=()=>crypto.randomUUID?.()||Math.random().toString(36).slice(2);const FALLBACK_TEAMS=['1. FC Köln','1. FC Union Berlin','1. FSV Mainz 05','Bayer 04 Leverkusen','Borussia Dortmund','Borussia Mönchengladbach','Eintracht Frankfurt','FC Augsburg','FC Bayern München','FC Schalke 04','Hamburger SV','RB Leipzig','SC Paderborn 07','SV Elversberg','SV Werder Bremen','Sport-Club Freiburg','TSG Hoffenheim','VfB Stuttgart'];const TEAMS=[...new Set([...(Array.isArray(FIXTURES)?FIXTURES.flatMap(x=>[x.home,x.away]).filter(Boolean):[]),...FALLBACK_TEAMS])].sort((a,b)=>a.localeCompare(b,'de'));
const defaults={version:69,teamStrengthDetails:{},teamStrengthCloudUpdatedAt:'',ui:{transferFilter:'all',transferSearch:'',leagueTab:'current',bundesligaTab:'matchups',bundesligaTeam:'Alle',bundesligaSearch:'',rulesSection:'overview',scoutPosition:'Alle',scoutTeam:'Alle',scoutSearch:''},settings:{currentMd:1,mode:'quick',startCapital:200000000,homeBonus:1,lineupSize:11},players:[],finances:[{id:'start',date:'2026-08-01',type:'Startkapital',description:'Start ohne Kader',amount:200000000}],matchdays:[],opponents:[],h2h:[],leagueManagers:LEAGUE_MANAGERS,leagueIntel:{managerData:{},reminderDismissed:{}},lineupIntel:{pending:[],lastImport:''},teamStrength:{...TEAM_STRENGTH_BASELINE}};
const KICKBASE_AI_ENDPOINT='https://amdtcadswtmgwdhytehe.supabase.co/functions/v1/kickbase-ai';
let data=load(),page='dashboard';function mergeData(x){
  const source=x&&typeof x==='object'?x:{};
  const incomingStrengths=source.teamStrength&&typeof source.teamStrength==='object'
    ? source.teamStrength
    : {};
  const known=Object.values(incomingStrengths).filter(v=>Number.isFinite(+v));
  const looksLikeOldPlaceholder=known.length>0&&known.every(v=>+v===5);
  const strengths=looksLikeOldPlaceholder
    ? {...TEAM_STRENGTH_BASELINE}
    : {...TEAM_STRENGTH_BASELINE,...incomingStrengths};

  return {
    ...structuredClone(defaults),
    ...source,
    version:7,
    ui:{...defaults.ui,...(source.ui||{})},
    settings:{...defaults.settings,...(source.settings||{})},
    leagueManagers:LEAGUE_MANAGERS,
    lineupIntel:{...defaults.lineupIntel,...(source.lineupIntel||{})},
    teamStrength:strengths,
    teamStrengthDetails:{
      ...(defaults.teamStrengthDetails||{}),
      ...(source.teamStrengthDetails&&typeof source.teamStrengthDetails==='object'
        ? source.teamStrengthDetails
        : {})
    },
    teamStrengthCloudUpdatedAt:source.teamStrengthCloudUpdatedAt||''
  };
}
let _fixtureCache=new Map();
function resetFixtureCache(){_fixtureCache.clear()}
function fixture(team,md=data.settings.currentMd){
  const target=canonicalClubName(team);
  const key=`${+md}|${target}`;
  if(_fixtureCache.has(key))return _fixtureCache.get(key);
  const f=FIXTURES.find(x=>+x.md===+md&&(
    canonicalClubName(x.home)===target||canonicalClubName(x.away)===target
  ));
  if(!f){_fixtureCache.set(key,null);return null}
  const isHome=canonicalClubName(f.home)===target;
  const value={
    opp:isHome?canonicalClubName(f.away):canonicalClubName(f.home),
    ha:isHome?'H':'A',
    date:f.date
  };
  _fixtureCache.set(key,value);
  return value;
}
function strength(team){
  const value=Number(data?.teamStrength?.[team]);
  return Number.isFinite(value)?value:Number(TEAM_STRENGTH_BASELINE[team]||5);
}
function strengthDetail(team){
  const detail=data?.teamStrengthDetails?.[team];
  return detail&&typeof detail==='object'?detail:null;
}
function strengthFreshness(){
  const raw=data?.teamStrengthCloudUpdatedAt;
  if(!raw)return `Lokale Basiswerte · Stand ${TEAM_STRENGTH_META.updatedAt}`;
  const parsed=new Date(raw);
  if(Number.isNaN(parsed.getTime()))return 'Cloud-Teamstärken geladen';
  return `Cloud-Update ${parsed.toLocaleString('de-DE')}`;
}
function matchup(player,md=data.settings.currentMd){
  const f=fixture(player.team,md);
  if(!f)return 5;
  const homeBonus=f.ha==='H'?Number(data.settings.homeBonus||0):0;
  return Math.max(1,Math.min(10,5+strength(player.team)-strength(f.opp)+homeBonus));
}
function score(player){
  return Number(player.avgPoints||0)+matchup(player)*10+(LI_SCORE[player.liStatus||'Unbekannt']||0);
}
function rankPlayers(){
  return [...activePlayers()].sort((a,b)=>score(b)-score(a));
}
function previousSavedLineup(md){
  const activeIds=new Set(activePlayers().map(player=>player.id));
  const previous=(data.matchdays||[])
    .filter(record=>+record.md<+md&&Array.isArray(record.lineup)&&record.lineup.length)
    .sort((a,b)=>+b.md-+a.md)[0];
  if(!previous)return{lineup:[],sourceMd:null};
  return{
    lineup:[...new Set(previous.lineup.filter(playerId=>activeIds.has(playerId)))].slice(0,11),
    sourceMd:+previous.md
  };
}
function mdRecord(md){
  let record=data.matchdays.find(x=>+x.md===+md);
  if(!record){
    const inherited=previousSavedLineup(md);
    record={
      id:id(),md:+md,mvp:'',points:{},
      lineup:[...inherited.lineup],
      lineupInheritedFrom:inherited.sourceMd,
      lineupInheritedAt:inherited.sourceMd?new Date().toISOString():null,
      soldPlayer:'',soldDate:'',soldPrice:0
    };
    data.matchdays.push(record);
  }
  if(!record.points||typeof record.points!=='object')record.points={};
  if(!Array.isArray(record.lineup))record.lineup=[];
  return record;
}
function top3(md){
  const record=mdRecord(md);
  return activePlayers()
    .map(player=>({p:player,pts:Number(record.points[player.id]||0)}))
    .sort((a,b)=>b.pts-a.pts)
    .slice(0,3);
}
function mandatoryStatus(md){
  const record=mdRecord(md);
  const mvpName=String(record.mvp||'').trim().toLocaleLowerCase('de-DE');
  const mvpOwned=mvpName
    ? activePlayers().find(p=>String(p.name||'').trim().toLocaleLowerCase('de-DE')===mvpName)
    : null;
  const top=top3(md);
  if(!record.mvp)return{state:'waiting',text:'Bundesliga-MVP fehlt'};
  if(mvpOwned){
    const valid=record.soldPlayer===mvpOwned.name;
    return{state:valid?'done':'open',text:valid?'Erledigt':mvpOwned.name,mvpOwned:true};
  }
  const valid=top.some(x=>x.p.name===record.soldPlayer);
  return{
    state:valid?'done':'open',
    text:valid?'Erledigt':'Wahl aus: '+top.map(x=>x.p.name).filter(Boolean).join(', '),
    mvpOwned:false
  };
}

function load(){try{const raw=localStorage.getItem('kickbaseCoachV07')||localStorage.getItem('kickbaseCoachV06')||localStorage.getItem('kickbaseCoachV05')||localStorage.getItem('kickbaseCoachV04')||localStorage.getItem('kickbaseCoachV03')||localStorage.getItem('kickbaseCoachV2');return raw?mergeData(JSON.parse(raw)):mergeData(SEEDED_DATA)}catch{return mergeData(SEEDED_DATA)}}function save(){syncTransferSingleSource();localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));if(window.cloudQueueSave)window.cloudQueueSave();toast('Gespeichert')}function touch(){save();render()}function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1300)}
const activePlayers=()=>data.players.filter(p=>!p.soldDate);const soldPlayers=()=>data.players.filter(p=>p.soldDate);const financeTotal=()=>data.finances.reduce((a,x)=>a+(+x.amount||0),0);const squadValue=()=>activePlayers().reduce((a,p)=>a+(+p.marketValue||0),0);const wealth=()=>financeTotal()+squadValue();const realized=()=>soldPlayers().reduce((a,p)=>a+(+p.salePrice||0)-(+p.buyPrice||0),0);const unrealized=()=>activePlayers().reduce((a,p)=>a+(+p.marketValue||0)-(+p.buyPrice||0),0);
function fixtureLegacyV220(team,md=data.settings.currentMd){return fixture(team,md)}function strength(t){return +data.teamStrength[t]||5}function matchup(p,md=data.settings.currentMd){const f=fixture(p.team,md);if(!f)return 5;return Math.max(1,Math.min(10,5+strength(p.team)-strength(f.opp)+(f.ha==='H'?+data.settings.homeBonus:0)))}function score(p){return (+p.avgPoints||0)+matchup(p)*10+(LI_SCORE[p.liStatus||'Unbekannt']||0)}function rankPlayers(){return [...activePlayers()].sort((a,b)=>score(b)-score(a))}function mdRecord(md){let x=data.matchdays.find(x=>x.md===md);if(!x){x={id:id(),md,mvp:'',points:{},lineup:[],soldPlayer:'',soldDate:'',soldPrice:0};data.matchdays.push(x)}return x}function top3(md){const r=mdRecord(md);return activePlayers().map(p=>({p,pts:+r.points[p.id]||0})).sort((a,b)=>b.pts-a.pts).slice(0,3)}function mandatoryStatus(md){const r=mdRecord(md),mvpOwned=activePlayers().find(p=>p.name.trim().toLowerCase()===r.mvp.trim().toLowerCase());const top=top3(md);let valid=false,required='';if(!r.mvp)return{state:'waiting',text:'Bundesliga-MVP fehlt'};if(mvpOwned){required=mvpOwned.name;valid=r.soldPlayer===required}else{required='Wahl aus: '+top.map(x=>x.p.name).filter(Boolean).join(', ');valid=top.some(x=>x.p.name===r.soldPlayer)}return{state:valid?'done':'open',text:valid?'Erledigt':required,mvpOwned:!!mvpOwned}}
const NAV_GROUPS=[
  {id:'coach',label:'Coach',icon:'🟢',items:[
    ['dashboard','Übersicht','⌂'],
    ['squad','Aufstellung','⚽'],
    ['scout','Scout Center','⌕'],
    ['news','News Intelligence','📰'],
    ['matchday','Spieltag','◷']
  ]},
  {id:'league',label:'Liga',icon:'🔵',items:[
    ['competition','H2H Liga','🏆'],
    ['bundesliga','Bundesliga','🇩🇪'],
    ['lineupintel','LigaInsider','🩺'],
    ['rules','Regelwerk','§']
  ]},
  {id:'office',label:'Managerbüro',icon:'🟠',items:[
    ['transfers','Transfers','⇄'],
    ['finances','Finanzen','€'],
    ['analysis','Intelligence','▥'],
    ['settings','Einstellungen','⚙']
  ]}
];
const nav=NAV_GROUPS.flatMap(group=>group.items.map(([key,label,icon])=>[key,`${icon} ${label}`]));
function navHtml(){
  return NAV_GROUPS.map(group=>`<section class="nav-group" data-nav-group="${group.id}">
    <div class="nav-group-title"><span>${group.icon}</span>${group.label}</div>
    ${group.items.map(([key,label,icon])=>`<button class="nav-btn" data-page="${key}"><span>${icon}</span><b>${label}</b></button>`).join('')}
  </section>`).join('');
}
function bottomNavHtml(){
  return `<nav class="bottom-nav">
    <button data-page="dashboard" data-zone="coach"><span>⌂</span><b>Coach</b></button>
    <button data-page="squad"><span>⚽</span><b>Elf</b></button>
    <button data-page="competition" data-zone="league"><span>🏆</span><b>Liga</b></button>
    <button data-page="transfers" data-zone="office"><span>⇄</span><b>Büro</b></button>
    <button id="bottomMore"><span>☰</span><b>Mehr</b></button>
  </nav>`;
}
function goPage(next){
  page=next;
  render();
  $('#sidebar')?.classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}
function bindGlobalNavigation(){
  $$('[data-page]').forEach(button=>button.onclick=()=>goPage(button.dataset.page));
  const more=$('#bottomMore');
  if(more)more.onclick=()=>$('#sidebar')?.classList.toggle('open');
}
function init(){
  const n=$('#nav');
  n.innerHTML=navHtml();
  if(!$('#bottomNavigation')){
    const holder=document.createElement('div');
    holder.id='bottomNavigation';
    holder.innerHTML=bottomNavHtml();
    document.body.appendChild(holder.firstElementChild);
  }
  bindGlobalNavigation();
  $('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');
  $('#currentMd').innerHTML=Array.from({length:34},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('');
  $('#currentMd').value=data.settings.currentMd;
  $('#currentMd').onchange=e=>{data.settings.currentMd=+e.target.value;touch()};
  $$('[data-mode]').forEach(b=>b.onclick=()=>{data.settings.mode=b.dataset.mode;touch()});
  $('#exportBtn').onclick=exportData;
  $('#importFile').onchange=importData;
  $('#resetBtn').onclick=()=>{
    if(confirm('Wirklich alle Daten löschen?')){
      ['kickbaseCoachV07','kickbaseCoachV06','kickbaseCoachV05','kickbaseCoachV04','kickbaseCoachV03','kickbaseCoachV2'].forEach(k=>localStorage.removeItem(k));
      data=mergeData(SEEDED_DATA);touch();
    }
  };
  render();
}







function bundesligaMasterPlayers(){
  const rows=(window.BUNDESLIGA_PLAYERS||[]).map(p=>({
    external_id:p.external_id ?? p.id ?? null,
    name:String(p.name||'').trim(),
    first_name:p.first_name||p.firstName||'',
    last_name:p.last_name||p.lastName||'',
    team:String(p.team||'').trim(),
    team_external_id:p.team_external_id ?? p.teamId ?? null,
    position:String(p.position||'').trim(),
    source:p.source||'bundesliga_players'
  })).filter(p=>p.name);
  if(rows.length)return rows;
  return selectableBundesligaPlayers().map(p=>({
    external_id:p.external_id ?? p.id ?? null,
    name:String(p.name||'').trim(),
    first_name:p.first_name||p.firstName||'',
    last_name:p.last_name||p.lastName||'',
    team:String(p.team||'').trim(),
    team_external_id:p.team_external_id ?? p.teamId ?? null,
    position:String(p.position||'').trim(),
    source:'selectable-fallback'
  })).filter(p=>p.name);
}
function buildBundesligaMasterIndex(){
  const rows=bundesligaMasterPlayers(),byId=new Map(),byFull=new Map(),bySurname=new Map();
  for(const p of rows){
    const full=canonicalFullKey(p.name);
    if(!full)continue;
    if(p.external_id!==null&&p.external_id!==undefined)byId.set(String(p.external_id),p);
    if(!byFull.has(full))byFull.set(full,p);
    const surnameField=canonicalFullKey(p.last_name||'');
    const surnameName=full.split(/\s+/).filter(Boolean).at(-1)||'';
    for(const s of new Set([surnameField,surnameName].filter(Boolean))){
      if(!bySurname.has(s))bySurname.set(s,[]);
      bySurname.get(s).push(p);
    }
  }
  for(const [s,list] of bySurname){
    const uniq=new Map();
    for(const p of list){
      const key=p.external_id!==null&&p.external_id!==undefined?`id:${p.external_id}`:`name:${canonicalFullKey(p.name)}`;
      if(!uniq.has(key))uniq.set(key,p);
    }
    bySurname.set(s,[...uniq.values()]);
  }
  return {rows,byId,byFull,bySurname};
}
function resolveAgainstBundesligaMaster(name,context={}){
  const raw=String(name||'').trim(),norm=canonicalFullKey(raw);
  if(!norm)return {matched:false,name:raw,reason:'leer',confidence:0};
  const idx=buildBundesligaMasterIndex();
  const explicitId=context.external_id ?? context.externalId ?? context.player_id ?? context.playerId;
  if(explicitId!==undefined&&explicitId!==null){
    const p=idx.byId.get(String(explicitId));
    if(p)return {...p,matched:true,confidence:1,reason:'Player-ID'};
  }
  const parts=norm.split(/\s+/).filter(Boolean);
  if(parts.length>1){
    const p=idx.byFull.get(norm);
    return p?{...p,matched:true,confidence:1,reason:'exakter Bundesliga-Mastername'}:{matched:false,name:raw,reason:'kein exakter Bundesliga-Master',confidence:0};
  }
  let candidates=(idx.bySurname.get(parts[0])||[]).slice();
  const teamHint=canonicalFullKey(context.club||context.team||'');
  if(teamHint&&candidates.length>1){
    const c=candidates.filter(p=>canonicalFullKey(p.team)===teamHint);
    if(c.length===1)return {...c[0],matched:true,confidence:.995,reason:'Nachname + Verein'};
  }
  const posHint=canonicalFullKey(context.position||'');
  if(posHint&&candidates.length>1){
    const c=candidates.filter(p=>canonicalFullKey(p.position)===posHint);
    if(c.length===1)return {...c[0],matched:true,confidence:.99,reason:'Nachname + Position'};
  }
  if(candidates.length===1)return {...candidates[0],matched:true,confidence:.99,reason:'eindeutiger Bundesliga-Nachname'};
  return {matched:false,name:raw,confidence:0,ambiguous:candidates.length>1,
    reason:candidates.length>1?`${candidates.length} Bundesliga-Nachnamen-Treffer`:'kein Bundesliga-Nachnamen-Treffer',
    candidates:candidates.map(p=>({external_id:p.external_id,name:p.name,team:p.team,position:p.position}))};
}

function buildLocalSurnameMasterMap(){
  const bySurname=new Map();
  const add=(name,team='',position='',source='local')=>{
    const full=String(name||'').trim();
    const parts=canonicalFullKey(full).split(/\s+/).filter(Boolean);
    if(parts.length<2)return;
    const surname=parts.at(-1);
    if(!bySurname.has(surname))bySurname.set(surname,new Map());
    const bucket=bySurname.get(surname);
    const key=canonicalFullKey(full);
    const old=bucket.get(key);
    const candidate={name:full,team:team||'',position:position||'',source};
    const score=x=>(x.team?4:0)+(x.position?2:0)+(String(x.name||'').split(/\s+/).length>1?3:0);
    if(!old || score(candidate)>score(old))bucket.set(key,candidate);
  };

  for(const p of (data.players||[]))add(p.name,p.team,p.position,'players');
  for(const manager of LEAGUE_MANAGERS){
    const row=managerLeagueData(manager.id);
    for(const t of (row.transfers||[]))add(t.player,t.club,t.position,'transfers');
  }
  for(const p of selectableBundesligaPlayers())add(p.name,p.team,p.position,'selectable');

  return new Map([...bySurname].map(([k,v])=>[k,[...v.values()]]));
}


const V218_CONFIRMED_PLAYER_ALIASES={
  posch:{name:'Stefan Posch',team:'1. FSV Mainz 05',position:'Abwehr'},
  schwolow:{name:'Alexander Schwolow',team:'1. FSV Mainz 05',position:'Tor'},
  gotze:{name:'Mario Götze',team:'Eintracht Frankfurt',position:'Mittelfeld'}
};
function v218AliasKey(v){
  return String(v||'').toLocaleLowerCase('de-DE').normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
}
function resolveV218ConfirmedAlias(name){
  const hit=V218_CONFIRMED_PLAYER_ALIASES[v218AliasKey(name)];
  return hit?{...hit,matched:true,confidence:1,source:'v218-confirmed-alias'}:null;
}

function resolveShortNameAgainstLocalMasters(name,context={}){
  const confirmed=resolveV218ConfirmedAlias(name);
  if(confirmed)return confirmed;
  const master=resolveAgainstBundesligaMaster(name,context);
  if(master.matched)return master;
  const raw=String(name||'').trim(),norm=canonicalFullKey(raw),parts=norm.split(/\s+/).filter(Boolean);
  if(!norm)return {matched:false,name:raw,reason:'leer',confidence:0};
  if(parts.length>1)return {matched:false,name:raw,reason:master.reason||'kein Master-Match',confidence:0};
  const surnameMap=buildLocalSurnameMasterMap();
  const unique=[...new Map((surnameMap.get(parts[0])||[]).map(x=>[canonicalFullKey(x.name),x])).values()];
  if(unique.length===1)return {...unique[0],matched:true,confidence:.85,reason:'lokaler Fallback-Nachname'};
  return {matched:false,name:raw,team:'',position:'',confidence:0,reason:master.reason||'kein Match',candidates:master.candidates||[]};
}
function traceCanonicalResolution(name,context={}){
  const raw=String(name||'').trim();
  let masterResult=null;
  let localResult=null;
  let masterCandidates=[];
  let targetSurname='';

  try{
    const parts=(typeof normalizeCanonicalNameParts==='function'
      ? normalizeCanonicalNameParts(raw)
      : canonicalFullKey(raw).split(/\s+/).filter(Boolean));
    targetSurname=parts.at(-1)||'';
  }catch(e){
    targetSurname=canonicalFullKey(raw).split(/\s+/).filter(Boolean).at(-1)||'';
  }

  try{
    const idx=typeof buildBundesligaMasterIndex==='function' ? buildBundesligaMasterIndex() : null;
    masterCandidates=(idx?.bySurname?.get?.(targetSurname)||[]).map(p=>({
      id:p.external_id ?? p.id ?? null,
      name:p.name||'',
      team:p.team||'',
      position:p.position||''
    }));
  }catch(e){}

  try{masterResult=resolveAgainstBundesligaMaster(raw,context)}catch(e){masterResult={matched:false,reason:String(e)}}
  try{localResult=resolveShortNameAgainstLocalMasters(raw,context)}catch(e){localResult={matched:false,reason:String(e)}}

  return {
    input:raw,
    normalizePlayerName:typeof normalizePlayerName==='function'?normalizePlayerName(raw):'',
    canonicalFullKey:canonicalFullKey(raw),
    targetSurname,
    masterCandidates,
    masterResult,
    localResult
  };
}

function renderDirectHandlerTrace(){
  const host=document.querySelector('#canonicalDiagnostics') || document.querySelector('#canonicalCleanupStatus');
  if(!host)return;
  const aliases=['Gosens','Kohr','Tape','García','Deman','Erevbenagie','Anton','Olise','Götze','Pedersen','Lienhart','Kristof','Beste','Conté','Pruhs','Schwolow','Burke'];
  const traces=aliases.map(name=>traceCanonicalResolution(name));
  const box=document.createElement('div');
  box.id='directHandlerTrace';
  box.style.cssText='margin-top:10px;padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;display:grid;gap:6px';
  box.innerHTML=`<b>DIRECT HANDLER TRACE 2.1.7</b><small>Direkter Vergleich: Master-Resolver → lokaler Resolver. Keine Daten werden verändert.</small>${traces.map(t=>{
    const mr=t.masterResult||{}, lr=t.localResult||{};
    const mc=mr.matched?`${mr.name||'—'} · ${mr.team||'—'} · ${mr.reason||''}`:`OFFEN · ${mr.reason||'—'}`;
    const lc=lr.matched?`${lr.name||'—'} · ${lr.team||'—'} · ${lr.reason||''}`:`OFFEN · ${lr.reason||'—'}`;
    return `<div style="padding-top:5px;border-top:1px solid rgba(255,255,255,.07)"><b>${esc(t.input)}</b> · target=${esc(t.targetSurname||'—')} · bucket=${t.masterCandidates.length}<br><small>Master: ${esc(mc)}<br>Local: ${esc(lc)}<br>normalizePlayerName=${esc(t.normalizePlayerName||'—')} · canonicalFullKey=${esc(t.canonicalFullKey||'—')}</small></div>`;
  }).join('')}`;
  host.appendChild(box);
}
window.traceCanonicalResolution=traceCanonicalResolution;
window.renderDirectHandlerTrace=renderDirectHandlerTrace;

function canonicalDiagnosticSnapshot(){
  const master=buildBundesligaMasterIndex();
  const aliases=['Anton','Olise','Burke','Götze','Kohr','Schwolow','Pedersen','Lienhart','Gosens','Tape','Kristof','Beste','Deman','Conté','Pruhs','García','Erevbenagie'];
  const matches=aliases.map(alias=>{
    const r=resolveAgainstBundesligaMaster(alias);
    return {alias,match:r.matched?r.name:'—',team:r.matched?(r.team||'Verein offen'):'—',external_id:r.matched?(r.external_id??'—'):'—',confidence:r.confidence||0,reason:r.reason||''};
  });
  return {masterCount:master.rows.length,liveCount:(window.BUNDESLIGA_PLAYERS||[]).length,localCount:(data.players||[]).length,matches};
}
function renderCanonicalDiagnostics(){
  const el=$('#canonicalDiagnostics');
  if(!el)return;
  const d=canonicalDiagnosticSnapshot();
  const found=d.matches.filter(x=>x.match!=='—');
  el.innerHTML=`<div class="diag-head"><b>Diagnose:</b> ${d.masterCount} Master-Spieler · ${d.liveCount} Supabase · ${d.localCount} lokale Datensätze</div>
    <div class="diag-matches">${d.matches.map(x=>`<span class="${x.match==='—'?'miss':'hit'}">${esc(x.alias)} → ${esc(x.match)}${x.team!=='—'?` · ${esc(x.team)}`:''}</span>`).join('')}</div>
    <small>${found.length}/${d.matches.length} Test-Nachnamen eindeutig aufgelöst.</small>`;
}

function runV215bCanonicalCleanup(){
  data.ui=data.ui||{};
  if(window.__v215kCleanupRunning)return {ok:false,message:'Bereinigung läuft bereits.'};
  window.__v215kCleanupRunning=true;

  try{
    _canonicalIdentityIndex=null;
    buildCanonicalIdentityIndex(true);

    const beforeTransfers=LEAGUE_MANAGERS.reduce((sum,m)=>sum+(managerLeagueData(m.id).transfers||[]).length,0);
    const beforePlayers=(data.players||[]).length;

    let renamed=0,clubs=0,mergedTransfers=0,mergedPlayers=0,lineupRefs=0;
    const aliasMatches=[];
    const mergedDetails=[];
    const unresolved=[];

    // TRANSFERS: resolve surname aliases first, then deduplicate by canonical transaction identity.
    for(const manager of LEAGUE_MANAGERS){
      const row=managerLeagueData(manager.id);
      row.transfers=Array.isArray(row.transfers)?row.transfers:[];

      for(const t of row.transfers){
        const original=String(t.player||'').trim();
        const r=resolveShortNameAgainstLocalMasters(original,{managerId:manager.id,club:t.club});
        if(r.matched){
          if(r.external_id!==undefined&&r.external_id!==null)t.externalPlayerId=r.external_id;
          if(r.name&&normalizePlayerName(original)!==normalizePlayerName(r.name)){t.player=r.name;renamed++;aliasMatches.push(`${original} → ${r.name}`)}
          if(!t.club&&r.team){t.club=r.team;clubs++}
          if(!t.position&&r.position)t.position=r.position;
        }else if(original&&normalizePlayerName(original).split(/\s+/).length===1){
          unresolved.push({manager:manager.id,player:original,type:t.type||'Transfer',date:t.date||'',price:Number(t.price||0),reason:r.reason||'nicht aufgelöst',candidates:r.candidates||[]});
        }
      }

      const groups=new Map();
      for(const t of row.transfers){
        const identityKey=t.externalPlayerId!==undefined&&t.externalPlayerId!==null?`id:${t.externalPlayerId}`:`name:${normalizePlayerName(t.player)}`;
        const txDate=String(t.date||'').trim();
        const txSource=String(t.source||t.note||'').toLowerCase();
        const screenshotLike=txSource.includes('screenshot');
        const key=[
          String(t.type||'').toLowerCase(),
          identityKey,
          Math.round(Number(t.price||0)),
          txDate,
          screenshotLike?'screenshot':'regular'
        ].join('|');
        if(!groups.has(key))groups.set(key,[]);
        groups.get(key).push(t);
      }

      const kept=[];
      for(const records of groups.values()){
        if(records.length===1){
          kept.push(records[0]);
          continue;
        }

        const score=t=>
          (String(t.player||'').trim().split(/\s+/).length>1?10:0)+
          (t.club?6:0)+(t.position?2:0)+
          (!String(t.source||t.note||'').toLowerCase().includes('screenshot')?5:0)+
          (t.date?1:0);

        records.sort((a,b)=>score(b)-score(a));
        const master=records[0];

        for(const dup of records.slice(1)){
          master.club=master.club||dup.club||'';
          master.position=master.position||dup.position||'';
          master.note=master.note||dup.note||'';
          master.source=(master.source&&!String(master.source).toLowerCase().includes('screenshot'))
            ? master.source
            : (dup.source||master.source||'');

          // Prefer plausible historical/non-import date over a known bad migration date.
          const bad=d=>d==='2026-08-14';
          if((!master.date||bad(master.date)) && dup.date)master.date=dup.date;

          mergedTransfers++;
          mergedDetails.push(`${master.player} (${master.type||'Transfer'})`);
        }
        kept.push(master);
      }
      row.transfers=kept;
    }

    // OWN PLAYERS: resolve aliases and merge all records of same canonical player.
    data.players=Array.isArray(data.players)?data.players:[];
    const playerGroups=new Map();

    for(const p of data.players){
      const original=String(p.name||'').trim();
      const r=resolveShortNameAgainstLocalMasters(original,{club:p.team});
      if(r.matched){
        if(r.external_id!==undefined&&r.external_id!==null)p.externalPlayerId=r.external_id;
        if(r.name&&normalizePlayerName(original)!==normalizePlayerName(r.name)){p.name=r.name;renamed++;aliasMatches.push(`${original} → ${r.name}`)}
        if(!p.team&&r.team){p.team=r.team;clubs++}
        if(!p.position&&r.position)p.position=r.position;
      }else if(original&&normalizePlayerName(original).split(/\s+/).length===1){
        unresolved.push({manager:'me',player:original,type:'Spielerdatensatz',date:p.buyDate||'',price:Number(p.buyPrice||0),reason:r.reason||'nicht aufgelöst',candidates:r.candidates||[]});
      }

      const playerIdentity=p.externalPlayerId!==undefined&&p.externalPlayerId!==null
        ?`id:${p.externalPlayerId}`
        :`name:${normalizePlayerName(p.name)}`;
      const ownershipKey=[
        playerIdentity,
        String(p.buyDate||'').trim(),
        Math.round(Number(p.buyPrice||0))
      ].join('|');
      if(!playerGroups.has(ownershipKey))playerGroups.set(ownershipKey,[]);
      playerGroups.get(ownershipKey).push(p);
    }

    const mergedPlayerRows=[];
    for(const records of playerGroups.values()){
      if(records.length===1){
        mergedPlayerRows.push(records[0]);
        continue;
      }

      const score=p=>
        (String(p.name||'').trim().split(/\s+/).length>1?10:0)+
        (p.team?6:0)+(p.position?2:0)+
        (!String(p.buySource||'').toLowerCase().includes('screenshot')?4:0)+
        (p.marketValue?1:0);

      records.sort((a,b)=>score(b)-score(a));
      const master=records[0];

      for(const dup of records.slice(1)){
        master.team=master.team||dup.team||'';
        master.position=master.position||dup.position||'';
        master.photoUrl=master.photoUrl||dup.photoUrl||'';
        master.buyDate=master.buyDate||dup.buyDate||'';
        master.buyPrice=Number(master.buyPrice||0)||Number(dup.buyPrice||0);
        master.marketAtBuy=Number(master.marketAtBuy||0)||Number(dup.marketAtBuy||0);
        master.marketValue=Number(master.marketValue||0)||Number(dup.marketValue||0);
        master.avgPoints=Number(master.avgPoints||0)||Number(dup.avgPoints||0);
        master.note=master.note||dup.note||'';
        master.buyCounterparty=master.buyCounterparty||dup.buyCounterparty||'';

        if(dup.soldDate && (!master.soldDate || new Date(dup.soldDate)>=new Date(master.soldDate))){
          master.soldDate=dup.soldDate;
          master.salePrice=Number(dup.salePrice||0);
          master.saleSource=dup.saleSource||master.saleSource||'';
          master.saleReason=dup.saleReason||master.saleReason||'';
          master.saleCounterparty=dup.saleCounterparty||master.saleCounterparty||'';
        }

        mergedPlayers++;
        mergedDetails.push(`${master.name} (Spielerdatensatz)`);
      }

      mergedPlayerRows.push(master);
    }
    data.players=mergedPlayerRows;

    // LINEUP/BENCH REFERENCES
    const rewriteList=list=>{
      if(!Array.isArray(list))return list;
      const seen=new Set(),out=[];
      for(const name of list){
        const r=resolveShortNameAgainstLocalMasters(name);
        const fixed=r.matched?r.name:name;
        const key=normalizePlayerName(fixed);
        if(seen.has(key))continue;
        seen.add(key);
        out.push(fixed);
        if(normalizePlayerName(fixed)!==normalizePlayerName(name))lineupRefs++;
      }
      return out;
    };

    for(const manager of LEAGUE_MANAGERS){
      const mdData=data.leagueIntel?.managerData?.[manager.id]?.matchdays||{};
      for(const rec of Object.values(mdData)){
        if(rec?.lineup)rec.lineup=rewriteList(rec.lineup);
        if(rec?.bank)rec.bank=rewriteList(rec.bank);
      }
    }
    for(const rec of Object.values(data.matchdays||{})){
      if(rec?.lineup)rec.lineup=rewriteList(rec.lineup);
      if(rec?.bench)rec.bench=rewriteList(rec.bench);
    }

    try{ applyHistoricHornDates(); }catch(e){ console.warn('historic dates',e); }

    resetOpponentRosterCache();
    resetOpponentAnalysisCache();

    const afterTransfers=LEAGUE_MANAGERS.reduce((sum,m)=>sum+(managerLeagueData(m.id).transfers||[]).length,0);
    const afterPlayers=(data.players||[]).length;

    const uniqueAliases=[...new Set(aliasMatches)];
    const uniqueMerged=[...new Set(mergedDetails)];

    data.ui.v215kCleanupSummary={
      at:new Date().toISOString(),
      renamed,clubs,mergedTransfers,mergedPlayers,lineupRefs,
      beforeTransfers,afterTransfers,beforePlayers,afterPlayers,
      aliasMatches:uniqueAliases.slice(0,50),
      mergedDetails:uniqueMerged.slice(0,50),
      unresolved:unresolved.slice(0,100),
      masterPlayers:bundesligaMasterPlayers().length
    };

    localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));

    return {
      ok:true,renamed,clubs,mergedTransfers,mergedPlayers,lineupRefs,
      beforeTransfers,afterTransfers,beforePlayers,afterPlayers,
      aliasMatches:uniqueAliases,
      mergedDetails:uniqueMerged,
      unresolved,
      masterPlayers:bundesligaMasterPlayers().length
    };
  }catch(e){
    console.error('2.1.5k cleanup failed',e);
    return {ok:false,message:String(e?.message||e)};
  }finally{
    window.__v215kCleanupRunning=false;
  }
}
function previewV215sCanonicalCleanup(){
  const storageKey='kickbaseCoachV07';
  const liveData=data;
  const simulationData=structuredClone(liveData);
  const beforeStorage=localStorage.getItem(storageKey);
  let result;
  try{
    data=simulationData;
    _canonicalIdentityIndex=null;
    result=runV215bCanonicalCleanup();
    if(!result?.ok)return result||{ok:false,message:'Vorschau fehlgeschlagen.'};
    return {...result,preview:true,isolated:true};
  }catch(e){
    console.error('2.1.7 isolated preview failed',e);
    return {ok:false,message:String(e?.message||e)};
  }finally{
    data=liveData;
    if(beforeStorage===null)localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey,beforeStorage);
    _canonicalIdentityIndex=null;
    try{
      resetOpponentRosterCache();
      resetOpponentAnalysisCache();
    }catch(e){}
  }
}


const V217_HORN_TRANSFER_BASELINE=[
  ['Kauf','Kohr',6543210,'2026-08-03','Kickbase'],
  ['Kauf','Gosens',11445599,'2026-08-03','Kickbase'],
  ['Kauf','Tape',5071935,'2026-08-02','Kickbase'],
  ['Kauf','Schwolow',1000000,'2026-08-04','Kickbase'],
  ['Kauf','Pruhs',600000,'2026-08-04','Kickbase'],
  ['Kauf','Milosevic',4141414,'2026-08-04','Kickbase'],
  ['Verkauf','Gosens',11407285,'2026-08-04','Kickbase'],
  ['Kauf','Labrović',3000000,'2026-08-04','Kickbase'],
  ['Kauf','Conté',12345678,'2026-08-04','Kickbase'],
  ['Kauf','Pfeiffer',5000000,'2026-08-04','Kickbase'],
  ['Kauf','Führich',26555555,'2026-08-05','Kickbase'],
  ['Kauf','Khedira',4455667,'2026-08-06','Kickbase'],
  ['Kauf','Kristof',12345678,'2026-08-07','Kickbase'],
  ['Kauf','Götze',3222220,'2026-08-07','Kickbase'],
  ['Kauf','Beste',10700005,'2026-08-07','Kickbase'],
  ['Kauf','Burke',3566666,'2026-08-08','Kickbase'],
  ['Verkauf','Khedira',4529355,'2026-08-08','Kickbase'],
  ['Verkauf','Tape',5363338,'2026-08-08','Kickbase'],
  ['Kauf','Olise',69258147,'2026-08-09','Kickbase'],
  ['Verkauf','Pfeiffer',5334535,'2026-08-10','Kickbase'],
  ['Verkauf','Labrović',2698542,'2026-08-10','Kickbase'],
  ['Kauf','Lienhart',13131313,'2026-08-10','Kickbase'],
  ['Kauf','Pedersen',3888888,'2026-08-10','Kickbase'],
  ['Kauf','Anton',38777999,'2026-08-10','Kickbase'],
  ['Kauf','García',44332211,'2026-08-12','Kickbase'],
  ['Verkauf','Milosevic',5484262,'2026-08-12','Kickbase'],
  ['Kauf','Erevbenagie',1899999,'2026-08-12','Kickbase'],
  ['Verkauf','Burke',4451380,'2026-08-12','Kickbase'],
  ['Kauf','Deman',10777777,'2026-08-12','Kickbase'],
  ['Verkauf','Führich',25000000,'2026-08-12','Calcio Rom FC'],

  // Latest Horn Capital screenshots supplied for the 2.1.7 rebuild.
  ['Verkauf','Conté',11298026,'2026-08-17','Kickbase'],
  ['Kauf','Posch',10500000,'2026-08-17','Kickbase'],
  ['Verkauf','Kohr',8704641,'2026-08-17','Kickbase'],
  ['Kauf','Fernández',5005555,'2026-08-17','Kickbase'],
  ['Verkauf','Pedersen',4719156,'2026-08-17','Kickbase'],
  ['Kauf','Ruben Müller',3777777,'2026-08-17','Kickbase'],
  ['Verkauf','Florian Pruhs',3718683,'2026-08-17','Kickbase'],
  ['Kauf','Jan Leszczyński',4334334,'2026-08-16','Kickbase']
];

function applyV217CleanTransferRebuild(){
  data.ui=data.ui||{};
  if(data.ui.v217CleanTransferRebuildApplied)return;

  // Safety snapshot before any destructive reset.
  data.ui.v217TransferRebuildBackup={
    at:new Date().toISOString(),
    players:structuredClone(data.players||[]),
    matchdays:structuredClone(data.matchdays||[]),
    leagueManagerData:structuredClone(data.leagueIntel?.managerData||{})
  };

  const root=ensureLeagueIntel();

  // Reset every manager's transfer history and every stored opponent lineup.
  for(const manager of LEAGUE_MANAGERS){
    const row=managerLeagueData(manager.id);
    row.transfers=[];
    row.matchdays=row.matchdays&&typeof row.matchdays==='object'?row.matchdays:{};
    for(const rec of Object.values(row.matchdays)){
      if(!rec||typeof rec!=='object')continue;
      rec.lineup=[];
      rec.bank=[];
      rec.formation='';
      rec.note='';
    }
  }

  // Reset own lineup/bench references as requested. Keep matchday points/rules data.
  for(const rec of data.matchdays||[]){
    if(!rec||typeof rec!=='object')continue;
    rec.lineup=[];
    rec.bench=[];
    rec.lineupInheritedFrom=null;
    rec.lineupInheritedAt=null;
  }

  // The current squad is rebuilt solely from the clean Horn Capital transfer baseline.
  data.players=[];
  const own=managerLeagueData('me');
  own.transfers=V217_HORN_TRANSFER_BASELINE.map((x,i)=>{
    const [type,player,price,date,counterparty]=x;
    const resolved=resolveShortNameAgainstLocalMasters(player);
    return {
      id:`v217-me-${String(i+1).padStart(3,'0')}`,
      type,
      md:1,
      player:resolved?.matched&&resolved.name?resolved.name:player,
      externalPlayerId:resolved?.matched?resolved.external_id??null:null,
      club:resolved?.matched?resolved.team||'':'',
      position:resolved?.matched?resolved.position||'':'',
      price:Number(price)||0,
      date,
      note:counterparty?`Gegenpartei: ${counterparty}`:'',
      source:'2.1.7 Clean Rebuild · bestätigte Horn-Capital-Historie'
    };
  });

  // Prevent old seed migrations from ever repopulating opponent data.
  data.ui.v200ScreenshotSeedApplied=true;
  data.ui.v206LeagueSnapshotApplied=true;
  data.ui.v212TransferSingleSourceApplied=true;
  data.ui.v213SmartTransferApplied=true;

  syncMyPlayersFromLeagueTransfers();
  try{backfillTransferClubs()}catch(e){console.warn('2.1.7 club backfill',e)}
  resetOpponentRosterCache();
  resetOpponentAnalysisCache();

  data.ui.v217CleanTransferRebuildApplied=true;
  data.ui.v217CleanTransferRebuildSummary={
    at:new Date().toISOString(),
    ownTransfers:own.transfers.length,
    opponentTransfers:0,
    lineupsReset:true,
    backupAvailable:true
  };

  localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
  clearTimeout(window.__v217SaveTimer);
  window.__v217SaveTimer=setTimeout(()=>{
    localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
    if(window.cloudQueueSave)window.cloudQueueSave();
  },1800);
}

function scheduleV215aCanonicalCleanup(){
  // Disabled in 2.1.5b. No automatic cleanup at startup.
}
function applyV215CanonicalIdentityMigration(){
  // Disabled in 2.1.5b. Cleanup is only triggered from the Transfers page.
}
function applyV214CanonicalMigration(){
  // 2.1.5b: intentionally no automatic data migration during startup/render.
}
function applyV213SmartTransferMigration(){
  data.ui=data.ui||{};
  if(data.ui.v213SmartTransferApplied)return;
  backfillTransferClubs();
  syncTransferSingleSource();
  data.ui.v213SmartTransferApplied=true;
  localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
  clearTimeout(window.__v213SaveTimer);
  window.__v213SaveTimer=setTimeout(()=>{
    backfillTransferClubs();
    syncTransferSingleSource();
    localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
    if(window.cloudQueueSave)window.cloudQueueSave();
  },1800);
}

function applyV212TransferSingleSourceMigration(){
  data.ui=data.ui||{};
  if(data.ui.v212TransferSingleSourceApplied)return;
  syncTransferSingleSource();
  data.ui.v212TransferSingleSourceApplied=true;
  localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
  clearTimeout(window.__v212SaveTimer);
  window.__v212SaveTimer=setTimeout(()=>{
    syncTransferSingleSource();
    localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
    if(window.cloudQueueSave)window.cloudQueueSave();
  },1800);
}


const V218_VERIFIED_BUDGET=-19118424;
const V218_LOGIN_BONUS_TOTAL=1050000;
const V218_UNEXPLAINED_BONUS_TOTAL=2800000;

function v218CanonicalPlayerName(name){
  const alias=resolveV218ConfirmedAlias(name);
  return alias?.name||String(name||'').trim();
}
function v218TransferKey(t){
  return [
    String(t?.type||'').toLowerCase(),
    v218AliasKey(v218CanonicalPlayerName(t?.player)),
    Number(t?.price)||0,
    String(t?.date||''),
    String(t?.note||'').toLowerCase().replace(/\s+/g,' ').trim()
  ].join('|');
}
function v218MergeConfirmedPlayerDuplicates(){
  // Rewrite every transfer reference first.
  const root=ensureLeagueIntel();
  for(const manager of LEAGUE_MANAGERS){
    const row=managerLeagueData(manager.id);
    row.transfers=(row.transfers||[]).map(t=>{
      const alias=resolveV218ConfirmedAlias(t.player);
      if(!alias)return t;
      return {...t,player:alias.name,club:alias.team||t.club||'',position:alias.position||t.position||''};
    });
    // Exact transfer duplicates only; never collapse a buy and a sale.
    const seen=new Set();
    row.transfers=row.transfers.filter(t=>{
      const k=v218TransferKey(t);
      if(seen.has(k))return false;
      seen.add(k); return true;
    });
  }
  // Player cards: collapse only the three explicitly confirmed aliases.
  const byName=new Map();
  const next=[];
  for(const p of data.players||[]){
    const alias=resolveV218ConfirmedAlias(p.name);
    const q=alias?{...p,name:alias.name,team:alias.team||p.team||'',position:alias.position||p.position||''}:p;
    const k=v218AliasKey(q.name);
    if(byName.has(k)){
      const keep=byName.get(k);
      Object.assign(keep,{
        team:keep.team||q.team||'',
        position:keep.position||q.position||'',
        marketValue:Number(keep.marketValue)||Number(q.marketValue)||0
      });
    }else{
      byName.set(k,q); next.push(q);
    }
  }
  data.players=next;
}

function v218BuildFinanceBaseline(){
  // Preserve non-transfer finance entries only for audit, but rebuild the active budget baseline
  // from the verified current Kickbase balance to avoid carrying legacy double bookings.
  data.financeArchiveV217=structuredClone(data.finances||[]);
  data.finances=[
    {id:'v218-start',date:'2026-08-01',type:'Startkapital',description:'Startkapital',amount:200000000,source:'2.1.8'},
    {id:'v218-login',date:'2026-08-17',type:'Kickbase-Bonus',description:'15 Auflaufprämien (10k…90k + 6×100k)',amount:V218_LOGIN_BONUS_TOTAL,source:'2.1.8'},
    {id:'v218-lucky-hand',date:'2026-08-17',type:'Kickbase-Erfolg',description:'Glückliches Händchen – bereits erreicht (Saison 2026/27, gesperrt)',amount:0,source:'2.1.8',locked:true},
    {id:'v218-unexplained',date:'2026-08-17',type:'Kickbase-Bonus',description:'Ungeklärte Kickbase-Boni/Erfolge – Bestandsabgleich',amount:V218_UNEXPLAINED_BONUS_TOTAL,source:'2.1.8'}
  ];
  // Recreate all own transfer cash flows from the clean single source.
  const own=managerLeagueData('me');
  for(const t of own.transfers||[]){
    const amt=(String(t.type).toLowerCase()==='kauf'?-1:1)*(Number(t.price)||0);
    data.finances.push({
      id:`v218-transfer-${t.id}`,
      date:t.date||'2026-08-17',
      type:String(t.type).toLowerCase()==='kauf'?'Spielerkauf':'Spielerverkauf',
      description:`${t.type} ${v218CanonicalPlayerName(t.player)}`,
      amount:amt,
      transferId:t.id,
      source:'2.1.8 transfer single source'
    });
  }
  // Final reconciliation entry is deliberately explicit/auditable.
  const calculated=data.finances.reduce((s,x)=>s+(Number(x.amount)||0),0);
  const delta=V218_VERIFIED_BUDGET-calculated;
  if(delta){
    data.finances.push({
      id:'v218-balance-reconciliation',date:'2026-08-17',type:'Kickbase-Bonus',
      description:'Ungeklärte Kickbase-Boni/Erfolge – verifizierter Kontostand-Abgleich',
      amount:delta,source:'2.1.8 verified balance'
    });
  }
  data.ui=data.ui||{};
  data.ui.v218VerifiedBudget=V218_VERIFIED_BUDGET;
  data.ui.v218LuckyHandLocked=true;
  data.ui.v218LuckyHandSeason='2026/27';
}

function v218TransferCounterparty(t){
  const m=String(t?.note||'').match(/Gegenpartei:\s*(.+)$/i);
  return m?m[1].trim():'';
}
function v218FindLastKickbaseBuy(transfers,sale){
  const name=v218AliasKey(v218CanonicalPlayerName(sale.player));
  const saleDate=String(sale.date||'9999-12-31');
  const candidates=(transfers||[]).filter(t=>
    String(t.type).toLowerCase()==='kauf' &&
    v218AliasKey(v218CanonicalPlayerName(t.player))===name &&
    String(t.date||'')<=saleDate &&
    /kickbase/i.test(v218TransferCounterparty(t)||'Kickbase')
  ).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  return candidates[0]||null;
}
function v218ExpectedRepeatableBonus(profit){
  if(profit>=25000000)return {amount:2000000,label:'Transfererfolg ≥25 Mio. Gewinn'};
  if(profit>=10000000)return {amount:1000000,label:'Transfererfolg ≥10 Mio. Gewinn'};
  if(profit>=5000000)return {amount:500000,label:'Transfererfolg ≥5 Mio. Gewinn'};
  if(profit>=3000000)return {amount:250000,label:'Transfererfolg ≥3 Mio. Gewinn'};
  return null;
}
function v218SyncAutomaticTransferBonuses(){
  const own=managerLeagueData('me');
  data.finances=(data.finances||[]).filter(x=>x.source!=='2.1.8 automatic transfer bonus');
  for(const sale of own.transfers||[]){
    if(String(sale.type).toLowerCase()!=='verkauf')continue;
    const cp=v218TransferCounterparty(sale);
    if(cp && !/kickbase/i.test(cp))continue; // manager-to-manager does not qualify
    const buy=v218FindLastKickbaseBuy(own.transfers,sale);
    if(!buy)continue;
    const profit=(Number(sale.price)||0)-(Number(buy.price)||0);
    const bonus=v218ExpectedRepeatableBonus(profit);
    if(!bonus)continue;
    data.finances.push({
      id:`v218-auto-bonus-${sale.id}`,date:sale.date||'2026-08-17',type:'Kickbase-Erfolg',
      description:`${bonus.label}: ${v218CanonicalPlayerName(sale.player)}`,
      amount:bonus.amount,transferId:sale.id,buyTransferId:buy.id,profit,
      source:'2.1.8 automatic transfer bonus'
    });
  }
}

function applyV218Migration(){
  data.ui=data.ui||{};
  if(data.ui.v218Applied)return;
  data.ui.v218Backup={
    at:new Date().toISOString(),
    players:structuredClone(data.players||[]),
    finances:structuredClone(data.finances||[]),
    leagueManagerData:structuredClone(data.leagueIntel?.managerData||{})
  };
  v218MergeConfirmedPlayerDuplicates();
  v218BuildFinanceBaseline();
  // Existing historical repeatable bonuses are intentionally not inferred twice.
  // Automatic bonus calculation applies from the verified 2.1.8 baseline onward.
  data.ui.v218BonusAutomationFrom='2026-08-17T20:37:00+02:00';
  data.ui.v218Applied=true;
  localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
  if(window.cloudQueueSave)setTimeout(()=>window.cloudQueueSave(),1600);
}






function applyV220CoachMigration(){
  data.ui=data.ui||{};
  if(data.ui.v220CoachMigrationApplied)return;

  // Normalize club keys once so matchup/team strength lookup is stable.
  const normalizedStrength={};
  for(const [team,value] of Object.entries(data.teamStrength||{})){
    const key=canonicalClubName(team);
    const n=Number(value);
    if(Number.isFinite(n))normalizedStrength[key]=n;
  }
  data.teamStrength={...TEAM_STRENGTH_BASELINE,...normalizedStrength};

  // Metadata repair belongs in a migration, not every render.
  for(const p of data.players||[])repairPlayerPositionV219(p);

  data.ui.v220CoachMigrationApplied=true;
  data.ui.v220CoachModel='preseason-transition-v1';
  data.ui.v220PerformanceCleanup=true;
  localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
}

function applyV219cMetadataMigration(){
  data.ui=data.ui||{};
  if(data.ui.v219cMetadataMigrationApplied)return;
  let corrected=0;
  for(const p of data.players||[]){
    const kb=v219bKickbaseMetadata(p.name);
    if(!kb)continue;
    const before=[p.name,p.team,p.position,p.kickbasePosition].join('|');
    p.name=kb.name;
    p.team=canonicalClubName(kb.team);
    p.position=kb.position;
    p.kickbasePosition=kb.position;
    const after=[p.name,p.team,p.position,p.kickbasePosition].join('|');
    if(before!==after)corrected++;
  }
  const own=managerLeagueData('me');
  for(const t of own.transfers||[]){
    const kb=v219bKickbaseMetadata(t.player);
    if(!kb)continue;
    t.player=kb.name;
    t.club=canonicalClubName(kb.team);
    t.position=kb.position;
  }
  data.ui.v219cMetadataMigrationApplied=true;
  data.ui.v219cMetadataCorrections=corrected;
  localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
}

function applyV219bRosterMigration(){
  data.ui=data.ui||{};
  if(data.ui.v219bRosterMigrationApplied)return;
  let corrected=0;

  for(const p of data.players||[]){
    const kb=v219bKickbaseMetadata(p.name);
    if(!kb)continue;
    const before=[p.name,p.team,p.position].join('|');
    p.name=kb.name;
    p.team=kb.team;
    p.position=kb.position;
    p.kickbasePosition=kb.position;
    if(before!==[p.name,p.team,p.position].join('|'))corrected++;
  }

  // Keep the own transfer single-source metadata consistent with the same identity.
  const own=managerLeagueData('me');
  for(const t of own.transfers||[]){
    const kb=v219bKickbaseMetadata(t.player);
    if(!kb)continue;
    t.player=kb.name;
    t.club=kb.team;
    t.position=kb.position;
  }

  // Never alter the chosen members of the lineup here; only metadata/order state.
  for(const rec of data.matchdays||[]){
    if(rec&&typeof rec==='object'){
      rec.lineup=Array.isArray(rec.lineup)?rec.lineup:[];
      delete rec.lineupRepairNotice;
    }
  }

  data.ui.v219bRosterMigrationApplied=true;
  data.ui.v219bRosterCorrections=corrected;
  localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
}

function applyV219LineupMigration(){
  data.ui=data.ui||{};
  // 2.1.9a reruns the safe metadata repair once even if 2.1.9 already ran.
  if(data.ui.v219aLineupMigrationApplied)return;
  let repaired=0;
  for(const p of data.players||[]){
    const before=String(p.position||'');
    const after=repairPlayerPositionV219(p);
    if(after&&after!==before)repaired++;
  }
  for(const manager of LEAGUE_MANAGERS){
    const row=managerLeagueData(manager.id);
    for(const t of row.transfers||[]){
      const pos=canonicalLineupPosition(t.position);
      if(pos)t.position=pos;
      else{
        const r=resolveShortNameAgainstLocalMasters(t.player,{team:t.club||''});
        const rp=canonicalLineupPosition(r?.position);
        if(rp)t.position=rp;
      }
    }
  }
  // Explicitly preserve current lineups. This migration only repairs metadata.
  data.ui.v219LineupMigrationApplied=true;
  data.ui.v219aLineupMigrationApplied=true;
  data.ui.v219PositionRepairs=repaired;
  localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
}

function render(){
  resetCoachAssessmentCache();
  resetFixtureCache();
  applyV217CleanTransferRebuild();
  applyV220CoachMigration();
  applyV219cMetadataMigration();
  applyV219bRosterMigration();
  applyV219LineupMigration();
  applyV218Migration();
  // Recalculate repeatable Kickbase transfer bonuses for transactions added after the 2.1.8 baseline.
  try{
    const own=managerLeagueData('me');
    const hasNew=(own.transfers||[]).some(t=>!String(t.id||'').startsWith('v217-me-'));
    if(hasNew)v218SyncAutomaticTransferBonuses();
  }catch(e){console.warn('2.1.8 bonus sync',e)}
  applyV212TransferSingleSourceMigration();
  applyV213SmartTransferMigration();
  applyV214CanonicalMigration();
  queueMicrotask(()=>restoreScreenshotImportUi());
  document.body.classList.toggle('analysis',data.settings.mode==='analysis');if($('#currentMd'))$('#currentMd').value=data.settings.currentMd;$$('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===data.settings.mode));$$('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));const titles={dashboard:['Dashboard','Schnelle Entscheidungen und offene Aufgaben.'],squad:['Aufstellung','Deine Elf auf dem Spielfeld – ziehen oder antippen.'],scout:['Scout Center','Bundesligaspieler filtern und direkt zum Kauf vormerken.'],news:['News Intelligence','Offizielle Meldungen, gefiltert auf deine Kaderspieler.'],matchday:['Spieltag','Punkte, Bundesliga-MVP und Pflichtverkauf.'],bundesliga:['Bundesliga','Alle 34 Spieltage und die Matchups deines Kaders.'],transfers:['Transfers','Hier kaufst und verkaufst du Spieler. Der Kader aktualisiert sich automatisch.'],finances:['Finanzen','Startkapital, Boni und sämtliche Geldbewegungen.'],analysis:['H2H Intelligence','Was funktioniert bei deinen Transfers und Entscheidungen wirklich?'],lineupintel:['LigaInsider-Abgleich','Voraussichtliche Aufstellungen halbautomatisch prüfen und übernehmen.'],competition:['Liga','Dein aktuelles Duell, Spielplan und Tabelle.'],rules:['Regelwerk','Interaktive Regeln und dein aktueller Status.'],settings:['Einstellungen','Teamstärken, Matchups und Grundwerte.']};$('#pageTitle').textContent=titles[page][0];$('#pageSub').textContent=titles[page][1];try{
  const renderer=({dashboard,squad,scout,news,matchday,bundesliga,transfers,finances,analysis,lineupintel,competition,rules,settings}[page]);
  if(typeof renderer!=='function')throw new Error(`Seite ${page} ist nicht verfügbar.`);
  $('#content').innerHTML=renderer();
  bind();
}catch(error){
  console.error('Seitenfehler:',error);
  $('#content').innerHTML=`<div class="card error-card"><h2>Bereich konnte nicht geladen werden</h2><p>${esc(error?.message||'Unbekannter Fehler')}</p><button class="btn" onclick="location.reload()">App neu laden</button></div>`;
}}

function matchdayCountdownText(context=actualMatchdayContext()){
  const target=context.phase==='pre'?context.window?.first:
    context.phase==='live'?context.window?.end:
    context.phase==='post'?context.deadline:null;
  if(!target)return 'Kein Termin verfügbar';
  const diff=target.getTime()-Date.now();
  if(diff<=0)return context.phase==='live'?'läuft gerade':'Frist erreicht';
  const hours=Math.floor(diff/3600000);
  const minutes=Math.floor((diff%3600000)/60000);
  const days=Math.floor(hours/24);
  return days>0?`${days} T. ${hours%24} Std.`:`${hours} Std. ${minutes} Min.`;
}
function matchdayDecisionBriefing(){
  const ready=matchdayReadiness();
  const ranked=coachRankPlayers(ready.md);
  const risks=ready.assessments.filter(a=>a.score===0||a.risks.length>=2).slice(0,3);
  const top=ranked.filter(p=>effectiveLineupStatus(p).status!=='Fällt aus').slice(0,3);
  const news=relevantOfficialNews({hours:168,limit:3});
  return{ready,risks,top,news,calibration:calibrationSummary()};
}

function dashboard(){
  const md=+data.settings.currentMd||1;
  const rank=coachRankPlayers(actualMatchdayContext?.().md||md);
  const mandatory=mandatoryStatus(md);
  const assistant=leagueAssistant();
  const schedule=H2H_SCHEDULE.filter(x=>x.md===md);
  const myGame=schedule.find(x=>x.home==='me'||x.away==='me');
  const opponentId=myGame?(myGame.home==='me'?myGame.away:myGame.home):null;
  const opponent=teamOnly(opponentId);
  const lineup=mdRecord(md).lineup||[];
  const lineupCount=lineup.length||Math.min(activePlayers().length,data.settings.lineupSize);
  const best=rank.slice(0,3);
  const topMatchup=best[0];
  const todayBonus=dailyBonusBooked();

  return `<div class="premium-dashboard">
    ${(()=>{const ready=matchdayReadiness(),news=relevantOfficialNews({hours:168,limit:4}),mem=coachMemory().stats();return `
    <section class="assistant-briefing">
      <div class="briefing-main">
        <span>PERSÖNLICHES BRIEFING · ${esc(matchdayPhaseLabel(ready.context))}</span>
        <h2>${esc(ready.label)}</h2>
        <p>${ready.complete?'Startelf vollständig gespeichert.':`${ready.lineup.length}/${data.settings.lineupSize} Startelfplätze gespeichert.`} Durchschnittliche Daten-Confidence ${ready.avgConfidence.toFixed(0)} %.</p>
        <div class="readiness-line"><div><i style="width:${ready.score}%"></i></div><strong>${ready.score.toFixed(0)}/100</strong></div>
      </div>
      <div class="briefing-counters">
        <button data-go-page="squad"><strong>${ready.hardRisks}</strong><span>harte Risiken</span></button>
        <button data-go-page="news"><strong>${news.length}</strong><span>relevante Meldungen</span></button>
        <button data-go-page="analysis"><strong>${mem.count?mem.rate.toFixed(0)+' %':'–'}</strong><span>Coach hilfreich</span></button>
      </div>
    </section>`})()}
    ${(()=>{const brief=matchdayDecisionBriefing();return `
    <section class="polished-assistant">
      <div class="polished-assistant-head">
        <div><span>NÄCHSTE ENTSCHEIDUNG</span><h2>${esc(matchdayPhaseLabel(brief.ready.context))}</h2><p>Start/Frist in <b>${esc(matchdayCountdownText(brief.ready.context))}</b></p></div>
        <div class="assistant-ready-score"><strong>${brief.ready.score.toFixed(0)}</strong><span>Readiness</span></div>
      </div>
      <div class="assistant-action-grid">
        <button data-go-page="squad"><strong>${brief.ready.lineup.length}/11</strong><span>Startelf</span><small>${brief.ready.complete?'gültig gespeichert':'noch prüfen'}</small></button>
        <button data-go-page="lineupintel"><strong>${brief.risks.length}</strong><span>Risiken</span><small>${brief.risks[0]?.player?.name||'keine harten Warnungen'}</small></button>
        <button data-go-page="news"><strong>${brief.news.length}</strong><span>News</span><small>relevant für deinen Kader</small></button>
        <button data-go-page="analysis"><strong>${brief.calibration.active?'Aktiv':brief.calibration.text.split(' ')[0]+'/4'}</strong><span>Kalibrierung</span><small>${brief.calibration.title}</small></button>
      </div>
      ${brief.top.length?`<div class="assistant-top-picks"><span>Coach-Fokus</span>${brief.top.map(p=>{const a=coachPlayerAssessment(p,brief.ready.md);return `<b>${esc(p.name)} <i>${a.score.toFixed(0)}</i></b>`}).join('')}</div>`:''}
    </section>`})()}
    <section class="coach-hero">
      <div class="coach-club">
        ${crest('Horn Capital FC','hero-crest')}
        <div><span>Dein Manager-Cockpit</span><h2>Horn Capital FC</h2><p>Spieltag ${md} · ${localDateISO()}</p></div>
      </div>
      <button class="cloud-mini" data-go-page="settings">⚙</button>
    </section>

    <section class="matchup-spotlight">
      <div class="spotlight-label">Nächstes H2H-Duell</div>
      <div class="spotlight-teams">
        <div>${crest('Horn Capital FC','spotlight-crest')}<b>Horn Capital FC</b></div>
        <div class="spotlight-vs"><span>ST ${md}</span><strong>VS</strong></div>
        <div>${crest(opponent,'spotlight-crest')}<b>${esc(opponent||'Gegner offen')}</b></div>
      </div>
      <div class="spotlight-actions">
        <button class="btn" data-go-page="squad">Startelf prüfen</button>
        <button class="btn secondary" data-go-page="competition">Duell öffnen</button>
      </div>
    </section>

    <section class="manager-kpis">
      <article><span>Budget</span><strong>${euro(financeTotal())}</strong><small>verfügbar</small></article>
      <article><span>Teamwert</span><strong>${euro(squadValue())}</strong><small>${activePlayers().length}/14 Spieler</small></article>
      <article><span>Startelf</span><strong>${lineupCount}/${data.settings.lineupSize}</strong><small>${lineup.length?'gespeichert':'Empfehlung'}</small></article>
      <article><span>Pflichtverkauf</span><strong>${mandatory.state==='done'?'✓':mandatory.state==='open'?'!':'…'}</strong><small>${esc(mandatory.text)}</small></article>
    </section>

    <div class="dashboard-columns">
      <section class="premium-panel">
        <div class="premium-panel-head"><div><span>HEUTE</span><h3>Coach-Aufgaben</h3></div><button data-go-page="rules">Alle Regeln</button></div>
        <div class="coach-task-list">
          ${assistant.map(n=>`<button class="coach-task ${n.level}" data-go-page="${n.action}">
            <span class="task-icon">${n.icon}</span><span><b>${esc(n.title)}</b><small>${esc(n.text)}</small></span><i>›</i>
          </button>`).join('')}
          <button class="coach-task ${todayBonus?'good':'warn'}" data-go-page="finances">
            <span class="task-icon">🎁</span><span><b>Tagesbonus</b><small>${todayBonus?'Für heute verbucht.':'Noch nicht verbucht.'}</small></span><i>›</i>
          </button>
        </div>
      </section>

      <section class="premium-panel">
        <div class="premium-panel-head"><div><span>COACH-RANKING</span><h3>Beste Optionen</h3></div><button data-go-page="scout">Scout öffnen</button></div>
        <div class="top-player-list">
          ${best.length?best.map((p,i)=>{const f=fixture(p.team);return `<button data-go-page="squad" class="top-player-row">
            <span class="rank-number">${i+1}</span>${playerVisual(p,'rank-photo')}
            <span><b>${esc(p.name)}</b><small>${esc(p.position||'')} · ${coachPlayerConfidence(p,actualMatchdayContext?.().md||md).toFixed(0)} % sicher · ${f?`${esc(f.opp)} (${f.ha})`:'kein Gegner'}</small></span>
            <strong class="${coachPlayerScore(p,actualMatchdayContext?.().md||md)>=75?'good-text':coachPlayerScore(p,actualMatchdayContext?.().md||md)<45?'bad-text':''}">${coachPlayerScore(p,actualMatchdayContext?.().md||md).toFixed(0)}</strong>
          </button>`}).join(''):'<div class="empty-soft">Kader anlegen, dann erscheinen Empfehlungen.</div>'}
        </div>
      </section>
    </div>

    ${['pre','live','post'].includes(actualMatchdayContext().phase)?`<section class="premium-panel matchday-checklist-panel">
      <div class="premium-panel-head"><div><span>MATCHDAY ASSISTENT</span><h3>${esc(matchdayPhaseLabel(actualMatchdayContext()))}</h3></div><strong>${actualMatchdayChecklist().filter(x=>x.done).length}/${actualMatchdayChecklist().length}</strong></div>
      <div class="matchday-checklist">${actualMatchdayChecklist().map(item=>`<button class="checklist-row ${item.done?'done':'open'}" data-check-page="${item.page}" data-check-id="${item.id}"><span class="check-circle">${item.done?'✓':''}</span><span><b>${esc(item.label)}</b><small>${esc(item.detail)}</small></span><i>›</i></button>`).join('')}</div>
      <p class="checklist-deadline">${(()=>{const c=actualMatchdayContext();return c.phase==='pre'?`Erster Anpfiff: ${c.window.first.toLocaleString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}`:c.phase==='post'?`Verkaufsfrist: ${deadlineText(c.md)}`:'Automatisch an den realen Bundesliga-Spielplan angepasst.'})()}</p>
    </section>`:''}

    <section class="premium-panel coach-ai-panel">
      <div class="premium-panel-head">
        <div><span>DATENBASIERTER COACH</span><h3>Coach AI</h3></div>
        <small>Matchups · Status · Regeln · Marktwerte</small>
      </div>
      <div class="coach-ai-grid">${coachAI().map(note=>`
        <button class="coach-ai-card ${note.level}" data-go-page="${note.action}">
          <span class="coach-ai-icon">${note.icon}</span>
          <span><b>${esc(note.title)}</b><small>${esc(note.text)}</small></span>
          <i>${esc(note.label)} ›</i>
        </button>`).join('')}</div>
      <div class="coach-feedback"><span>War das heutige Briefing hilfreich?</span><button data-coach-feedback="helpful">👍 Ja</button><button data-coach-feedback="not_helpful">👎 Nein</button></div>
      <p class="coach-ai-disclaimer">Die Hinweise sind nachvollziehbare Datenbewertungen und keine Garantie für Punkte, Marktwerte oder Startelfeinsätze.</p>
    </section>

    <section class="quick-launch">
      <button data-go-page="transfers"><span>⇄</span><b>Transfer</b><small>Kaufen oder verkaufen</small></button>
      <button data-go-page="bundesliga"><span>🇩🇪</span><b>Bundesliga</b><small>Live-Kader & Matchups</small></button>
      <button data-go-page="lineupintel"><span>🩺</span><b>LigaInsider</b><small>Aufstellung prüfen</small></button>
      <button data-go-page="analysis"><span>▥</span><b>Analyse</b><small>Saison & Finanzen</small></button>
    </section>
  </div>`;
}

function scout(){
  const players=window.BUNDESLIGA_PLAYERS||[];
  const position=data.ui?.scoutPosition||'Alle';
  const team=data.ui?.scoutTeam||'Alle';
  const target=data.ui?.scoutTarget||'me';
  const search=String(data.ui?.scoutSearch||'').trim().toLocaleLowerCase('de-DE');
  const clubNames=[...new Set(players.map(p=>p.team).filter(Boolean))].sort();

  const rows=players.map(p=>{
    const mapped=mapLivePosition(p.position);
    const fake={team:p.team,position:mapped,avgPoints:0,liStatus:'Unbekannt'};
    const f=fixture(p.team);
    return {...p,mapped,fixture:f,matchupScore:matchup(fake)};
  }).filter(p=>
    (position==='Alle'||p.mapped===position)&&
    (team==='Alle'||p.team===team)&&
    (!search||`${p.name} ${p.team} ${p.mapped}`.toLocaleLowerCase('de-DE').includes(search))
  ).sort((a,b)=>b.matchupScore-a.matchupScore||a.name.localeCompare(b.name,'de'));

  const featured=rows.slice(0,6);
  return `<div class="scout-page">
    <section class="scout-hero">
      <div><span>TRANSFER-RADAR</span><h2>Scout Center</h2><p>Aktuelle Bundesliga-Kader, Restprogramm und Matchups auf einen Blick.</p></div>
      <div class="scout-count"><b>${rows.length}</b><span>Spieler</span></div>
    </section>

    <section class="scout-target-panel">
      <label><span>Spieler zuordnen zu</span><select id="scoutTarget">${scoutTargetOptions(target)}</select></label>
      <small>${target==='me'
        ? 'Ausgewählte Spieler öffnen deinen normalen Kaufdialog.'
        : `Ausgewählte Spieler werden als Kauf für ${esc(scoutTargetLabel(target))} vorbereitet.`}</small>
    </section>
    <section class="scout-filters">
      <input id="scoutSearch" type="search" value="${esc(data.ui?.scoutSearch||'')}" placeholder="Spieler suchen">
      <select id="scoutPosition">${['Alle','Tor','Abwehr','Mittelfeld','Sturm'].map(x=>`<option ${position===x?'selected':''}>${x}</option>`).join('')}</select>
      <select id="scoutTeam"><option>Alle</option>${clubNames.map(x=>`<option ${team===x?'selected':''}>${esc(x)}</option>`).join('')}</select>
    </section>

    ${featured.length?`<section class="premium-panel">
      <div class="premium-panel-head"><div><span>TOP-MATCHUPS</span><h3>Diese Woche interessant</h3></div></div>
      <div class="scout-featured-grid">${featured.map(p=>`
        <article class="premium-player-card">
          <div class="premium-card-score ${p.matchupScore>=7?'good':p.matchupScore<=4?'bad':'warn'}">${p.matchupScore.toFixed(1)}</div>
          <div class="premium-player-visual">${p.photo_url?`<img src="${esc(p.photo_url)}" alt="${esc(p.name)}">`:bundesligaCrest(p.team,'scout-club-crest')}</div>
          <div class="premium-player-info"><small>${esc(p.mapped)}</small><h4>${esc(p.name)}</h4><p>${bundesligaIdentity(p.team,{logoClass:'premium-info-club-crest'})}</p></div>
          <div class="premium-player-fixture"><span>Nächster Gegner</span><b>${p.fixture?`${esc(p.fixture.opp)} · ${p.fixture.ha}`:'–'}</b></div>
          <button class="btn" data-buy-live-player="${p.external_id}">${target==='me'?'Kaufen':'Zuordnen'}</button>
        </article>`).join('')}</div>
    </section>`:''}

    <section class="premium-panel">
      <div class="premium-panel-head"><div><span>ALLE SPIELER</span><h3>Bundesliga-Kader</h3></div></div>
      <div class="scout-list">${rows.map(p=>`
        <article class="scout-list-row">
          <div class="scout-avatar">${p.photo_url?`<img src="${esc(p.photo_url)}" alt="${esc(p.name)}">`:bundesligaCrest(p.team,'scout-list-club-crest')}</div>
          <div><b>${esc(p.name)}</b><small>${bundesligaIdentity(p.team,{logoClass:'scout-row-club-crest'})}<span> · ${esc(p.mapped)}</span></small></div>
          <div class="scout-opponent"><span>${p.fixture?`${esc(p.fixture.opp)} (${p.fixture.ha})`:'–'}</span><strong>${p.matchupScore.toFixed(1)}</strong></div>
          <button class="gear-button" data-buy-live-player="${p.external_id}" title="${target==='me'?'Spieler kaufen':'Gegnertransfer vorbereiten'}">＋</button>
        </article>`).join('')||'<div class="empty">Noch keine Live-Kader geladen. Führe den Vereinsdaten-Workflow aus.</div>'}</div>
    </section>
  </div>`;
}


function news(){
  const items=relevantOfficialNews({hours:24*14,limit:60});
  const provider=providerHealth('official-club-news');
  return `<div class="news-page">
    <section class="news-hero"><div><span>OFFIZIELLE QUELLEN</span><h2>News Intelligence</h2><p>Nur Meldungen, die deine Kaderspieler betreffen oder eine klare Verfügbarkeitswirkung haben.</p></div>
      <div class="news-provider ${provider?.status||'unknown'}">
        <b>${provider?.status==='success'?'Newsquellen geprüft':provider?.status==='disabled'?'Nicht eingerichtet':provider?.status==='error'?'Quellen momentan nicht erreichbar':'Noch kein Lauf'}</b>
        <small>${esc(provider?.message||'Zwei verifizierte Quellen sind im Projekt hinterlegt; weitere können über die JSON-Datei oder ein GitHub-Secret ergänzt werden.')}</small>
      </div>
    </section>
    <div class="news-trust-note">Vertrauen: offizielle Vereinsquelle 95/100. Die App fasst Schlagwörter zusammen, ersetzt aber keine medizinische oder endgültige Trainerbestätigung.</div>
    <section class="news-list">${items.length?items.map(n=>`
      <article class="news-card ${Number(n.impact_score)>0?'positive':Number(n.impact_score)<0?'negative':'neutral'}">
        <div class="news-club">${bundesligaCrest(n.team,'news-club-crest')}<span><b>${esc(n.team)}</b><small>${n.published_at?new Date(n.published_at).toLocaleString('de-DE'):'Datum unbekannt'} · Vertrauen ${n.trust_score||95}/100</small></span></div>
        <h3>${esc(n.title)}</h3><p>${esc(n.summary||'Keine Zusammenfassung verfügbar.')}</p>
        <div class="news-impact"><span>${Number(n.impact_score)>0?'↗ Positiver Hinweis':Number(n.impact_score)<0?'↘ Risiko/Verfügbarkeit':'Information'}</span>
          <b>${n.matchedPlayers.map(p=>esc(p.name)).join(', ')||esc(n.impact_type||'')}</b></div>
        ${n.url?`<a href="${esc(n.url)}" target="_blank" rel="noopener">Originalmeldung öffnen ↗</a>`:''}
      </article>`).join(''):`<div class="news-empty-state">
      <strong>Keine relevanten Meldungen für deinen Kader gefunden</strong>
      <span>Einzelne nicht erreichbare Feeds blockieren die News Intelligence nicht mehr. Der Provider-Status oben zeigt erfolgreiche und ausgefallene Quellen.</span>
      <div><a href="https://www.bundesliga.com/de/bundesliga/news" target="_blank" rel="noopener">Bundesliga-News öffnen ↗</a></div>
    </div>`}</section>
  </div>`;
}


function lineupOwnerOptions(selected='me'){
  return [
    `<option value="me" ${selected==='me'?'selected':''}>Mein Team</option>`,
    ...MANAGER_OPTIONS.map(manager=>`<option value="${manager.id}" ${selected===manager.id?'selected':''}>${esc(manager.team)} · ${esc(manager.manager)}</option>`)
  ].join('');
}
function lineupOwnerSwitcher(selected='me'){
  return `<section class="lineup-owner-switch">
    <label><span>Aufstellung anzeigen</span><select id="lineupOwner">${lineupOwnerOptions(selected)}</select></label>
    <small>${selected==='me'?'Deine eigene Aufstellung und Coach-Optimierung.':'Gegneraufstellung auf Basis der von dir erfassten Transfers.'}</small>
  </section>`;
}
function normalizedOpponentPosition(position){
  const raw=String(position||'').trim();
  if(['Tor','Abwehr','Mittelfeld','Sturm'].includes(raw))return raw;
  return mapLivePosition(raw);
}

function opponentPositionCounts(managerId,md=data.settings.currentMd){
  const entry=managerMatchdayData(managerId,md);
  const counts={Tor:0,Abwehr:0,Mittelfeld:0,Sturm:0,Andere:0};
  (entry.lineup||[]).forEach(name=>{
    const p=opponentRosterPlayer(managerId,name,md);
    const pos=normalizedOpponentPosition(p?.position);
    if(pos&&Object.prototype.hasOwnProperty.call(counts,pos))counts[pos]++;
    else counts.Andere++;
  });
  return counts;
}
function opponentDerivedFormation(managerId,md=data.settings.currentMd){
  const entry=managerMatchdayData(managerId,md);
  const c=opponentPositionCounts(managerId,md);
  if(entry.lineup.length!==11||c.Tor!==1||c.Andere)return null;
  return ALLOWED_FORMATIONS.find(f=>c.Abwehr===f.Abwehr&&c.Mittelfeld===f.Mittelfeld&&c.Sturm===f.Sturm)||null;
}
function setOpponentLineupState(managerId,name,toLineup){
  const entry=managerMatchdayData(managerId,data.settings.currentMd);
  entry.lineup=Array.isArray(entry.lineup)?entry.lineup:[];
  entry.bank=Array.isArray(entry.bank)?entry.bank:[];
  entry.lineup=entry.lineup.filter(x=>x!==name);
  entry.bank=entry.bank.filter(x=>x!==name);

  if(toLineup){
    if(entry.lineup.length>=11){
      toast('Die Gegner-Startelf enthält bereits 11 Spieler.');
      return false;
    }
    entry.lineup.push(name);
  }else{
    entry.bank.push(name);
  }

  const formation=opponentDerivedFormation(managerId,data.settings.currentMd);
  if(formation)entry.formation=formation.code;
  return true;
}
function opponentSquadPage(managerId){
  const md=+data.settings.currentMd||1;
  const manager=managerById(managerId);
  const entry=managerMatchdayData(managerId,md);
  const roster=opponentRoster(managerId,md);
  const lineupSet=new Set(entry.lineup||[]);
  const starters=roster.filter(p=>lineupSet.has(p.name)).map(p=>({...p,position:normalizedOpponentPosition(p.position)}));
  const bench=roster.filter(p=>!lineupSet.has(p.name)).map(p=>({...p,position:normalizedOpponentPosition(p.position)}));
  const counts=opponentPositionCounts(managerId,md);
  const derived=opponentDerivedFormation(managerId,md);
  const completeness=opponentLineupDataQuality(managerId,md);
  const formation=derived?.code||entry.formation||[counts.Abwehr,counts.Mittelfeld,counts.Sturm].join('-');

  const playerButton=(p,onField)=>{
    return `<button type="button" class="${onField?'field-player':'bench-player'} opponent-squad-player"
      data-opponent-toggle-lineup="${esc(managerId)}|${esc(p.name)}|${onField?'bench':'lineup'}">
      ${onField
        ? `${bundesligaCrest(p.team,'pitch-club-crest')}<b>${esc(p.name.split(' ').pop())}</b><small>${esc(p.team||'')}</small><span class="field-score neutral" title="Analyse erst im Analyse-Tab">–</span>`
        : `${bundesligaCrest(p.team,'bench-club-crest')}<span><b>${esc(p.name)}</b><small>${esc(p.team||'')} · ${esc(normalizedOpponentPosition(p.position)||'Position offen')}</small></span><span class="drag-handle">↕</span>`}
    </button>`;
  };
  const row=position=>{
    const list=starters.filter(p=>p.position===position);
    return `<div class="pitch-row pitch-${position.toLowerCase()}">${list.map(p=>playerButton(p,true)).join('')||`<span class="empty-position">${position}</span>`}</div>`;
  };

  const fieldHtml=`<div class="pitch-head">
      <div><span>Formation</span><b class="${derived?'formation-valid':'formation-open'}">${esc(formation||'offen')}</b></div>
      <small>${starters.length}/11 Spieler · Datenqualität ${completeness}% · Analyse separat im Analyse-Tab</small>
    </div>
    <div class="football-pitch opponent-football-pitch">
      ${row('Sturm')}${row('Mittelfeld')}${row('Abwehr')}${row('Tor')}
      ${starters.filter(p=>!['Tor','Abwehr','Mittelfeld','Sturm'].includes(p.position)).length?`
        <div class="pitch-row opponent-position-warning">
          ${starters.filter(p=>!['Tor','Abwehr','Mittelfeld','Sturm'].includes(p.position)).map(p=>playerButton(p,true)).join('')}
        </div>`:''}
    </div>
    <div class="pitch-bench">
      <div class="bench-title"><h3>Bank / übriger Kader</h3><span>${bench.length} Spieler</span></div>
      ${bench.map(p=>playerButton(p,false)).join('')||'<div class="empty-soft">Keine weiteren Kaderspieler erfasst.</div>'}
    </div>`;

  const analysisHtml=`<div class="opponent-analysis-lazy">
    <div class="empty-soft">Analyse wird erst beim Öffnen dieses Tabs berechnet.</div>
  </div>`;

  return `${lineupOwnerSwitcher(managerId)}
  <div class="status-strip opponent-lineup-status">
    <div class="progress-ring" style="--pct:${Math.min(100,starters.length/11*100)}%"><b>${starters.length}/11</b></div>
    <div><b>${esc(manager?.team||'Gegner')} · Spieltag ${md}</b><div class="muted" style="font-size:12px">Kader aus erfassten Käufen abzüglich Verkäufen · ${roster.length} Spieler</div></div>
    <div class="toolbar" style="margin-left:auto">
      <button type="button" class="btn secondary" data-open-opponent-entry="${esc(managerId)}|${md}">Details erfassen</button>
      <button type="button" class="btn" id="saveOpponentSquad">Speichern</button>
    </div>
  </div>
  <div class="squad-tabs" style="margin-top:17px">
    <button type="button" class="squad-tab active" data-squad-view="lineup">⚽ Spielfeld</button>
    <button type="button" class="squad-tab" data-squad-view="bench">🪑 Kader (${roster.length})</button>
    <button type="button" class="squad-tab" data-squad-view="coach">🧠 Analyse</button>
  </div>
  <div id="squadView">${fieldHtml}</div>
  <template id="viewLineup">${fieldHtml}</template>
  <template id="viewBench"><div class="bench-list">${roster.map(p=>playerButton(p,lineupSet.has(p.name))).join('')||'<div class="empty-soft">Noch keine Transfers für diesen Gegner erfasst.</div>'}</div></template>
  <template id="viewCoach">${analysisHtml}</template>
  <div id="modalArea"></div>`;
}

function renderOpponentCoachTab(managerId){
  resetOpponentAnalysisCache();
  const md=+data.settings.currentMd||1;
  const roster=opponentRoster(managerId,md);
  const html=`<div class="opponent-analysis-tab-summary">
    <span><b>${analysis.avgScore.toFixed(0)}</b> Ø Coach Score</span>
    <span><b>${analysis.avgConfidence.toFixed(0)} %</b> Confidence</span>
    <span><b>${analysis.completeness} %</b> Datenqualität</span>
  </div>
  <div class="coach-score-list">${roster.map(p=>{
    const a=opponentPlayerAnalysis(managerId,p.name,md);
    return `<article class="coach-score-card ${a.score>=75?'strong':a.score!==null&&a.score<45?'weak':''}">
      <div class="coach-score-head">
        ${bundesligaCrest(p.team,'coach-score-photo')}
        <div><b>${esc(p.name)}</b><small>${bundesligaIdentity(p.team,{logoClass:'table-club-crest'})} · ${esc(p.position||'')}</small></div>
        <div class="coach-score-number"><strong>${a.score===null?'–':a.score.toFixed(0)}</strong><span>Coach</span></div>
      </div>
      <div class="confidence-line"><span>Confidence ${a.confidence.toFixed(0)} %</span><div><i style="width:${a.confidence}%"></i></div></div>
      <div class="coach-reasons">
        ${a.reasons.length?`<div class="positive"><b>Plus</b><span>${a.reasons.map(esc).join(' · ')}</span></div>`:''}
        ${a.risks.length?`<div class="negative"><b>Risiken / fehlende Daten</b><span>${a.risks.map(esc).join(' · ')}</span></div>`:''}
      </div>
    </article>`;
  }).join('')||'<div class="empty-soft">Noch kein Gegnerkader erfasst.</div>'}</div>`;
  const view=document.getElementById('squadView');
  if(view)view.innerHTML=html;
}

function bindOpponentSquadCards(){
  $$('[data-opponent-toggle-lineup]').forEach(button=>button.onclick=()=>{
    const [managerId,name,target]=button.dataset.opponentToggleLineup.split('|');
    if(setOpponentLineupState(managerId,name,target==='lineup')){
      save();render();
    }
  });
  $$('[data-open-opponent-entry]').forEach(button=>button.onclick=()=>{
    const [managerId,md]=button.dataset.openOpponentEntry.split('|');
    data.ui.leagueManager=managerId;
    page='competition';
    data.ui.leagueTab='managers';
    data.settings.currentMd=+md;
    save();render();
    requestAnimationFrame(()=>editOpponentMatchday(managerId,+md));
  });
  if($('#saveOpponentSquad'))$('#saveOpponentSquad').onclick=()=>{
    const managerId=data.ui?.lineupOwner;
    const entry=managerMatchdayData(managerId,data.settings.currentMd);
    const derived=opponentDerivedFormation(managerId,data.settings.currentMd);
    if(entry.lineup.length===11&&!derived&&!entry.formation)return toast('Bitte Formation prüfen oder in „Details erfassen“ auswählen.');
    if(derived)entry.formation=derived.code;
    entry.date=localDateISO();
    save();render();toast(`Gegneraufstellung gespeichert${entry.formation?` · ${entry.formation}`:''}`);
  };
}

function squad(){
  syncTransferSingleSource();
  let lineupOwner=data.ui?.lineupOwner||'me';
  if(lineupOwner!=='me'&&!managerById(lineupOwner)){
    lineupOwner='me';
    data.ui.lineupOwner='me';
  }
  if(lineupOwner!=='me')return opponentSquadPage(lineupOwner);

  const r=mdRecord(data.settings.currentMd);
  const active=activePlayers();
  if(!Array.isArray(r.lineup))r.lineup=[];
  r.lineup=r.lineup.filter(pid=>active.some(p=>p.id===pid)).slice(0,11);

  const legacyRepair=repairLegacyLineup(r.lineup,data.settings.currentMd);
  if(legacyRepair.changed){
    r.lineup=legacyRepair.ids;
    r.lineupRepairNotice={
      removed:legacyRepair.removed.map(id=>active.find(p=>p.id===id)?.name).filter(Boolean),
      date:new Date().toISOString()
    };
    save();
  }

  const recommended=coachOptimizedLineup(data.settings.currentMd).map(p=>p.id);
  // 2.1.9a: A stored empty lineup is a valid state. Do not silently render
  // the Coach recommendation as if it were the user's lineup.
  const displayLineup=[...r.lineup];
  const starters=displayLineup.map(pid=>active.find(p=>p.id===pid)).filter(Boolean);
  const bench=active.filter(p=>!displayLineup.includes(p.id));

  const positionOrder=['Sturm','Mittelfeld','Abwehr','Tor'];
  const counts=Object.fromEntries(positionOrder.map(pos=>[pos,starters.filter(p=>lineupPositionOf(p)===pos).length]));
  const validFormation=exactFormation(displayLineup);
  const possibleFormations=feasibleFormations(displayLineup);
  const formation=validFormation?.code||[counts.Abwehr,counts.Mittelfeld,counts.Sturm].join('-');

  const fieldPlayer=p=>{
    const f=fixture(p.team);
    return `<button type="button" class="field-player drag-player" draggable="true"
      data-drag-player="${p.id}" data-toggle-lineup="${p.id}" data-swap-target="${p.id}" data-player-position="${esc(p.position)}" aria-label="${esc(p.name)} auf die Bank verschieben">
      ${playerVisual(p,'field-photo')}
      <span class="field-club-logo" title="${esc(p.team)}">${bundesligaCrest(p.team,'pitch-club-crest')}</span>
      <b>${esc(p.name.split(' ').pop())}</b>
      <small>${esc(p.position)} · ${f?`Gegner: ${esc(f.opp)} (${f.ha})`:'Gegner: –'}</small>
      <span class="field-score ${coachPlayerScore(p,data.settings.currentMd)>=75?'good':coachPlayerScore(p,data.settings.currentMd)<45?'bad':'warn'}" title="${esc(coachPlayerExplanation(p,data.settings.currentMd))}">${coachPlayerScore(p,data.settings.currentMd).toFixed(0)}</span>
    </button>`;
  };

  const row=position=>{
    const list=starters.filter(p=>lineupPositionOf(p)===position);
    return `<div class="pitch-row pitch-${position.toLowerCase()}" data-position="${position}" data-count="${list.length}">
      ${list.map(fieldPlayer).join('')||`<span class="empty-position">${position}</span>`}
    </div>`;
  };

  const benchCard=p=>`<button type="button" class="bench-player drag-player" draggable="true"
      data-drag-player="${p.id}" data-toggle-lineup="${p.id}" aria-label="${esc(p.name)} aufstellen">
    ${playerVisual(p,'bench-photo')}
    <span><b>${esc(p.name)}</b><small>${bundesligaIdentity(p.team,{logoClass:'bench-club-crest'})} · ${esc(p.position||'')} · Coach ${coachPlayerScore(p).toFixed(0)} · ${coachPlayerConfidence(p).toFixed(0)} % sicher</small></span>
    <span class="drag-handle">⋮⋮</span>
  </button>`;

  const allCard=p=>{const f=fixture(p.team);return `<article class="player-card clickable drag-player" draggable="true"
      data-drag-player="${p.id}" data-toggle-lineup="${p.id}">
    ${playerVisual(p,'squad-photo')}<div class="name">${esc(p.name)}</div><div class="club">${bundesligaIdentity(p.team,{logoClass:'card-club-crest'})}<span>· ${esc(p.position||'')}</span></div>
    <div class="metrics"><div class="metric"><span>Gegner</span><b>${f?`${esc(f.opp)} (${f.ha})`:'–'}</b></div><div class="metric"><span>Matchup</span><b>${matchup(p).toFixed(1)}</b></div></div>
  </article>`};

  const fieldHtml=`${r.lineupRepairNotice?`<div class="lineup-repair-notice">
      <div><b>Alte Aufstellung automatisch korrigiert</b><span>${r.lineupRepairNotice.removed.length?`${esc(r.lineupRepairNotice.removed.join(', '))} auf die Bank gesetzt.`:'Ungültige Alt-Daten wurden bereinigt.'}</span></div>
      <button type="button" id="dismissLineupRepair">Verstanden</button>
    </div>`:''}<div class="pitch-head">
      <div><span>Formation</span><b class="${validFormation?'formation-valid':'formation-open'}">${formation}</b></div>
      <small>${validFormation?'Gültige Kickbase-Formation.':`${starters.length}/11 Spieler · möglich: ${possibleFormations.map(f=>f.code).join(', ')||'keine'}`} · ${esc(coachPhaseLabel())}</small>
    </div>
    <div class="football-pitch drop-zone" data-drop-zone="lineup">
      ${row('Sturm')}${row('Mittelfeld')}${row('Abwehr')}${row('Tor')}
      <div class="drop-hint">Hier ablegen, um aufzustellen</div>
    </div>
    <div class="pitch-bench drop-zone" data-drop-zone="bench">
      <div class="bench-title"><h3>Bank</h3><span>${bench.length} Spieler</span></div>
      ${bench.map(benchCard).join('')||'<div class="empty-soft">Keine Bankspieler.</div>'}
      <div class="drop-hint">Hier ablegen, um auf die Bank zu setzen</div>
    </div>`;

  return `${lineupOwnerSwitcher('me')}<div class="status-strip">
    <div class="progress-ring" style="--pct:${Math.min(100,starters.length/11*100)}%"><b>${starters.length}/11</b></div>
    <div><b>Aufstellung für Spieltag ${data.settings.currentMd}</b><div class="muted" style="font-size:12px">${
      r.lineupInheritedFrom
        ? `Provisorisch aus Spieltag ${r.lineupInheritedFrom} übernommen`
        : r.lineup.length
          ? 'Für diesen Spieltag gespeichert'
          : 'Noch keine Startelf gespeichert.'
    }</div></div>
    <div class="toolbar" style="margin-left:auto"><button type="button" class="btn secondary" id="useRecommendation">Empfehlung</button><button type="button" class="btn" id="saveLineup">Speichern</button></div>
  </div>
  <div class="squad-tabs" style="margin-top:17px">
    <button type="button" class="squad-tab active" data-squad-view="lineup">⚽ Spielfeld</button>
    <button type="button" class="squad-tab" data-squad-view="bench">🪑 Bank (${bench.length})</button>
    <button type="button" class="squad-tab" data-squad-view="all">📋 Gesamtkader (${active.length})</button>
    <button type="button" class="squad-tab" data-squad-view="stats">📊 Details</button>
    <button type="button" class="squad-tab" data-squad-view="coach">🧠 Coach</button>
  </div>
  <div id="squadView">${fieldHtml}</div>
  <template id="viewLineup">${fieldHtml}</template>
  <template id="viewBench"><div class="bench-list drop-zone" data-drop-zone="bench">${bench.map(benchCard).join('')||'<div class="empty-soft">Keine Bankspieler.</div>'}</div></template>
  <template id="viewAll"><div class="player-grid">${active.map(allCard).join('')||'<div class="empty-soft">Noch kein Spieler im Kader.</div>'}</div></template>
  <template id="viewStats"><div class="card"><div class="table-wrap"><table><thead><tr><th>Spieler</th><th>Kaufpreis</th><th>Marktwert</th><th>Ø Punkte</th><th>Gegner</th></tr></thead><tbody>${active.map(p=>{const f=fixture(p.team);return `<tr><td><b>${esc(p.name)}</b><small>${bundesligaIdentity(p.team,{logoClass:'table-club-crest'})}</small></td><td>${euro(p.buyPrice)}</td><td>${euro(p.marketValue)}</td><td>${(+p.avgPoints||0).toFixed(1)}</td><td>${f?`${esc(f.opp)} (${f.ha})`:'–'}</td></tr>`}).join('')}</tbody></table></div></div></template>
  <template id="viewCoach"><div class="coach-score-list">${coachRankPlayers(data.settings.currentMd).map(p=>{const a=coachPlayerAssessment(p,data.settings.currentMd);return `
    <article class="coach-score-card ${a.score>=75?'strong':a.score<45?'weak':''}">
      <div class="coach-score-head">
        ${playerVisual(p,'coach-score-photo')}
        <div><b>${esc(p.name)}</b><small>${bundesligaIdentity(p.team,{logoClass:'table-club-crest'})} · ${esc(p.position||'')}</small></div>
        <div class="coach-score-number"><strong>${a.score.toFixed(0)}</strong><span>Coach</span></div>
      </div>
      <div class="confidence-line"><span>Confidence ${a.confidence.toFixed(0)} %</span><div><i style="width:${a.confidence}%"></i></div></div>
      ${coachFactorRows(p,data.settings.currentMd)}
      <div class="coach-reasons">
        ${a.positives.length?`<div class="positive"><b>Plus</b><span>${a.positives.map(esc).join(' · ')}</span></div>`:''}
        ${a.risks.length?`<div class="negative"><b>Risiken</b><span>${a.risks.map(esc).join(' · ')}</span></div>`:''}
      </div>
    </article>`}).join('')}</div></template>
  <div id="modalArea"></div>`;
}
function bundesliga(){
  const md=+data.settings.currentMd||1;
  const tab=data.ui?.bundesligaTab||'matchups';
  const clubs=window.BUNDESLIGA_CLUBS||[];
  const players=window.BUNDESLIGA_PLAYERS||[];
  const teamFilter=data.ui?.bundesligaTeam||'Alle';
  const search=String(data.ui?.bundesligaSearch||'').toLocaleLowerCase('de-DE');

  const matchupView=()=>{
    const games=FIXTURES.filter(x=>+x.md===md),active=activePlayers();
    return `<div class="grid two bl-main-grid">
      <section class="card"><div class="section-head"><div><h2>Alle Partien</h2><p>Deine Spieler sind grün markiert.</p></div></div><div class="bl-fixture-list">${games.map(g=>{
        const hp=active.filter(p=>p.team===g.home),ap=active.filter(p=>p.team===g.away);
        return `<article class="bl-fixture-card ${hp.length||ap.length?'has-squad-player':''}"><div class="bl-date">${esc(g.date||'')}</div><div class="bl-match-row"><div class="bl-team home">${bundesligaCrest(g.home,'fixture-club-crest')}<span><b>${esc(g.home)}</b>${hp.length?`<small>${hp.map(p=>esc(p.name)).join(', ')}</small>`:''}</span></div><div class="bl-score">${g.hg??'–'} : ${g.ag??'–'}</div><div class="bl-team away">${bundesligaCrest(g.away,'fixture-club-crest')}<span><b>${esc(g.away)}</b>${ap.length?`<small>${ap.map(p=>esc(p.name)).join(', ')}</small>`:''}</span></div></div></article>`;
      }).join('')}</div></section>
      <section class="card"><div class="section-head"><div><h2>Deine Matchups</h2><p>Gegner, Ort und Teamstärken.</p></div></div><div class="table-wrap"><table class="bl-matchup-table"><thead><tr><th>Spieler</th><th>Gegner</th><th>Ort</th><th>Score</th></tr></thead><tbody>${active.map(p=>{const f=fixture(p.team,md);return `<tr><td><b>${esc(p.name)}</b><small>${bundesligaIdentity(p.team,{logoClass:'table-club-crest'})}</small></td><td>${f?esc(f.opp):'–'}</td><td>${f?(f.ha==='H'?'Heim':'Auswärts'):'–'}</td><td><span class="matchup-number">${matchup(p,md).toFixed(1)}</span></td></tr>`}).join('')}</tbody></table></div></section>
    </div>`;
  };
  const clubsView=()=>clubs.length?`<div class="club-live-grid">${clubs.map(c=>`
    <article class="club-live-card">
      ${c.crest_url?`<img src="${esc(c.crest_url)}" alt="${esc(c.team)}">`:'<div class="club-logo-fallback">⚽</div>'}
      <div><h3>${esc(c.team)}</h3><p>${c.position?`${c.position}. Platz · ${c.points||0} Punkte`:'Saison noch nicht gestartet'}</p></div>
      <div class="club-live-stats"><span>Trainer<b>${esc(c.coach||'–')}</b></span><span>Stadion<b>${esc(c.venue||'–')}</b></span><span>Form<b>${esc(c.form||'–')}</b></span></div>
      <button class="btn secondary" data-club-squad="${esc(c.team)}">Kader anzeigen</button>
    </article>`).join('')}</div>`:'<div class="empty">Noch keine Live-Vereinsdaten. Führe Migration und GitHub-Workflow aus.</div>';

  const filteredPlayers=players.filter(p=>(teamFilter==='Alle'||p.team===teamFilter)&&(!search||`${p.name} ${p.team} ${p.position}`.toLocaleLowerCase('de-DE').includes(search)));
  const playersView=()=>`<div class="live-player-toolbar">
    <select id="liveTeamFilter"><option>Alle</option>${clubs.map(c=>`<option ${teamFilter===c.team?'selected':''}>${esc(c.team)}</option>`).join('')}</select>
    <input id="livePlayerSearch" type="search" value="${esc(data.ui?.bundesligaSearch||'')}" placeholder="Spieler suchen">
  </div>
  <div class="live-player-grid">${filteredPlayers.map(p=>`
    <article class="live-player-card">
      ${p.photo_url?`<img src="${esc(p.photo_url)}" alt="${esc(p.name)}">`:`<div class="live-player-initials">${esc(p.name.split(/\s+/).map(x=>x[0]).join('').slice(0,2))}</div>`}
      <div><b>${esc(p.name)}</b><small>${esc(p.team)} · ${esc(mapLivePosition(p.position))}</small></div>
      <button class="btn small" data-buy-live-player="${p.external_id}">Kaufen</button>
    </article>`).join('')||'<div class="empty">Keine passenden Spieler gefunden.</div>'}</div>`;

  const content=tab==='clubs'?clubsView():tab==='players'?playersView():matchupView();
  return `<div class="bl-page">
    <div class="bl-page-head"><div><span>Bundesliga 2026/27</span><h2>Live-Zentrale</h2><p>Spielplan, Vereine und aktuelle Kader.</p></div>
      <div class="bl-md-nav"><button data-bl-md="${Math.max(1,md-1)}" ${md<=1?'disabled':''}>‹</button><select id="blMdSelect">${Array.from({length:34},(_,i)=>`<option value="${i+1}" ${i+1===md?'selected':''}>Spieltag ${i+1}</option>`).join('')}</select><button data-bl-md="${Math.min(34,md+1)}" ${md>=34?'disabled':''}>›</button></div>
    </div>
    <div class="bundesliga-tabs"><button data-bl-tab="matchups" class="${tab==='matchups'?'active':''}">Matchups</button><button data-bl-tab="clubs" class="${tab==='clubs'?'active':''}">Vereine</button><button data-bl-tab="players" class="${tab==='players'?'active':''}">Spieler</button></div>
    ${content}
  </div>`;
}
function matchday(){
  const md=data.settings.currentMd;
  const r=mdRecord(md);
  const m=mandatoryStatus(md);
  const active=activePlayers();
  const top=top3(md);
  const fx=FIXTURES.filter(x=>x.md===md);
  const lineupIds=Array.isArray(r.lineup)?r.lineup:[];
  const lineup=lineupIds.map(pid=>active.find(p=>p.id===pid)).filter(Boolean);
  const totalPoints=active.reduce((sum,p)=>sum+(+r.points[p.id]||0),0);
  const lineupPoints=lineup.reduce((sum,p)=>sum+(+r.points[p.id]||0),0);
  const benchPoints=active.filter(p=>!lineupIds.includes(p.id)).reduce((sum,p)=>sum+(+r.points[p.id]||0),0);
  return `<div class="grid kpis">
    <div class="card kpi"><span>Spieltag</span><strong>${md}</strong><small>${active.length} Spieler im Kader</small></div>
    <div class="card kpi"><span>Gesamtpunkte</span><strong>${totalPoints}</strong><small>Startelf ${lineupPoints} · Bank ${benchPoints}</small></div>
    <div class="card kpi"><span>Bundesliga-MVP</span><strong style="font-size:18px">${esc(r.mvp||'Noch offen')}</strong><small>${m.mvpOwned?'Im eigenen Kader':'–'}</small></div>
    <div class="card kpi"><span>Pflichtverkauf</span><strong>${m.state==='done'?'✅':m.state==='open'?'🚨':'⏳'}</strong><small>${esc(m.text)}</small></div>
  </div>
  <div class="grid two" style="margin-top:17px">
    <div class="card">
      <div class="section-head"><div><h2>Spielerpunkte</h2><p>Punkte nach dem Spieltag eintragen. Die Top 3 werden automatisch ermittelt.</p></div></div>
      ${active.length?`<div class="table-wrap"><table><thead><tr><th>Spieler</th><th>Aufstellung</th><th>Punkte</th><th>Rang</th></tr></thead><tbody>${active.map(p=>{const rank=top.findIndex(x=>x.p.id===p.id)+1;return `<tr><td><b>${esc(p.name)}</b><br><span class="muted">${esc(p.team)}</span></td><td>${lineupIds.includes(p.id)?'<span class="pill good">Startelf</span>':'<span class="pill warn">Bank</span>'}</td><td><input type="number" inputmode="numeric" data-points="${p.id}" value="${r.points[p.id]??''}" placeholder="0" style="width:100px"></td><td>${rank?`Top ${rank}`:'–'}</td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Noch keine aktiven Spieler vorhanden.</div>'}
    </div>
    <div class="card">
      <div class="section-head"><div><h2>Pflichtverkauf</h2><p>Bundesliga-MVP besitzt du → MVP verkaufen; sonst einen deiner Top 3.</p></div></div>
      <div class="form-grid" style="margin-top:12px">
        <label class="wide">Bundesliga-MVP<input id="mdMvp" value="${esc(r.mvp||'')}" placeholder="Spielername"></label>
        <label class="wide">Verkaufter Spieler<select id="mdSold"><option value="">Noch nicht gewählt</option>${active.map(p=>`<option value="${esc(p.name)}" ${r.soldPlayer===p.name?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>
        <label>Verkaufsdatum<input id="mdSoldDate" type="date" value="${esc(r.soldDate||'')}"></label>
        <label>Verkaufspreis<input id="mdSoldPrice" class="money-field" inputmode="numeric" value="${moneyInput(r.soldPrice||0)}"></label>
        <div class="full"><button class="btn" id="saveMd">Spieltag speichern</button></div>
      </div>
      <div style="margin-top:15px"><h3>Deine Top 3</h3>${top.length?top.map((x,i)=>`<div class="decision ${i===0?'good':''}">${i+1}. ${esc(x.p.name)} · ${x.pts} Punkte</div>`).join(''):'<div class="empty-soft">Noch keine Punkte eingetragen.</div>'}</div>
    </div>
  </div>
  <div class="card analysis-only" style="margin-top:17px">
    <div class="section-head"><div><h2>Bundesliga-Partien</h2><p>Spieltag ${md}</p></div></div>
    <div class="fixtures">${fx.length?fx.map(f=>`<div class="fixture"><span class="home">${esc(f.home)}</span><small>${esc(f.date||'')}</small><span>${esc(f.away)}</span></div>`).join(''):'<div class="empty-soft">Für diesen Spieltag sind aktuell keine Partien geladen.</div>'}</div>
  </div>`;
}

function transfers(){
  syncTransferSingleSource();
  setTimeout(()=>{try{renderCanonicalDiagnostics()}catch(e){console.warn('identity diagnostics',e)}},0);
  const filter=data.ui?.transferFilter||'all';
  const search=(data.ui?.transferSearch||'').trim().toLocaleLowerCase('de-DE');
  const all=[...data.players].sort((a,b)=>(b.buyDate||'').localeCompare(a.buyDate||''));
  const rows=all.filter(p=>{
    const statusOk=filter==='all'||(filter==='active'&&!p.soldDate)||(filter==='sold'&&p.soldDate);
    const text=[p.name,p.team,p.position,p.buyReason,...normalizeBuyReasons(p),p.saleReason,p.buySource,p.saleSource,p.buyCounterparty,p.saleCounterparty].join(' ').toLocaleLowerCase('de-DE');
    return statusOk&&(!search||text.includes(search));
  });
  const summary={
    all:all.length,
    active:all.filter(p=>!p.soldDate).length,
    sold:all.filter(p=>p.soldDate).length
  };
  const tableRows=rows.map(p=>{
    const gain=p.soldDate?(+p.salePrice||0)-(+p.buyPrice||0):(+p.marketValue||0)-(+p.buyPrice||0);
    return `<tr>
      <td><b>${esc(p.name)}</b><small>${bundesligaIdentity(p.team,{logoClass:'table-club-crest'})}<span> · ${esc(p.position||'')}</span></small></td>
      <td>${esc(p.buyDate||'–')}</td>
      <td>${esc(p.buySource||'Transfermarkt')}${p.buyCounterparty?`<small>${esc(p.buyCounterparty)}</small>`:''}</td>
      <td>${euro(p.buyPrice)}</td>
      <td class="optional-col">${buyReasonChips(p)}</td>
      <td><span class="pill ${p.soldDate?'neutral':'good'}">${p.soldDate?'Verkauft':'Im Kader'}</span></td>
      <td>${p.soldDate?esc(p.soldDate):'–'}</td>
      <td class="optional-col">${p.soldDate?`${esc(p.saleSource||'Transfermarkt')}${p.saleCounterparty?`<small>${esc(p.saleCounterparty)}</small>`:''}`:'–'}</td>
      <td>${p.soldDate?euro(p.salePrice):'–'}</td>
      <td class="${gain>=0?'money-pos':'money-neg'}">${euro(gain)}</td>
      <td class="action-cell"><button class="gear-button" data-manage-transfer="${p.id}" title="Transfer verwalten" aria-label="Transfer von ${esc(p.name)} verwalten">⚙</button></td>
    </tr>`;
  }).join('');
  return `<section class="card screenshot-import-card" style="margin-bottom:17px">
    <div class="screenshot-import-copy">
      <span class="eyebrow">SCREENSHOT ENGINE 2.1.9</span>
      <h3>📷 Screenshot auswerten</h3>
      <p>Transfer- oder Aufstellungsscreenshot auswählen. Die App erkennt den Typ automatisch, gleicht Spielernamen mit dem Bundesliga-Master ab und zeigt zuerst eine prüfbare Vorschau. Unsichere Treffer werden nicht automatisch übernommen.</p>
    </div>
    <div class="screenshot-import-actions">
      <label class="btn secondary">Screenshot auswählen
        <input id="screenshotImportFiles" type="file" accept="image/*" multiple hidden>
      </label>
      <button type="button" class="btn" id="analyzeScreenshotFiles">Screenshot analysieren</button>
    </div>
    <div id="screenshotImportStatus" class="screenshot-import-status">Noch kein Screenshot ausgewählt.</div>
    <div class="ai-import-receipt">${data.ui?.lastAiImport?`Letzter bestätigter Import: ${esc(managerById(data.ui.lastAiImport.managerId)?.team||data.ui.lastAiImport.managerId)} · ${data.ui.lastAiImport.added} neu · ${data.ui.lastAiImport.updated} geändert`:''}</div>
    <div id="aiUsageBox" class="ai-usage-box"></div>
    <div id="screenshotImportResult" class="screenshot-import-result"></div>
  </section>
  <div class="transfer-actions">
    <button class="action-card" id="buyPlayer"><strong>🟢 Spieler kaufen</strong><span>Neuen Transfer erfassen.</span></button>
    <button class="action-card" id="sellPlayerOpen"><strong>🔴 Spieler verkaufen</strong><span>Aktiven Spieler verkaufen.</span></button>
  </div>
  <div id="transferForm"></div>
  <div class="grid kpis" style="margin-top:17px">
    <div class="card kpi"><span>Budget</span><strong>${euro(financeTotal())}</strong></div>
    <div class="card kpi"><span>Im Kader</span><strong>${summary.active}</strong></div>
    <div class="card kpi"><span>Verkauft</span><strong>${summary.sold}</strong></div>
    <div class="card kpi"><span>Realisierter Gewinn</span><strong>${euro(realized())}</strong></div>
  </div>
  <div class="card transfer-history-card" style="margin-top:17px">
    <div class="section-head">
      <div><h2>Transferhistorie</h2><p>Alle Transfers zentral in einer Tabelle verwalten.</p></div>
      <button class="btn secondary" id="runCanonicalCleanup">Spielerdaten bereinigen</button>
    </div>
    <div id="canonicalCleanupStatus" class="canonical-cleanup-status">${data.ui?.v215bCleanupSummary?`Letzter Lauf: ${data.ui.v215bCleanupSummary.renamed} Namen · ${data.ui.v215bCleanupSummary.clubs} Vereine · ${data.ui.v215bCleanupSummary.mergedTransfers} Transfer-Dubletten zusammengeführt`:''}</div>
    <div class="transfer-toolbar">
      <div class="segmented">
        <button data-transfer-filter="all" class="${filter==='all'?'active':''}">Alle ${summary.all}</button>
        <button data-transfer-filter="active" class="${filter==='active'?'active':''}">Im Kader ${summary.active}</button>
        <button data-transfer-filter="sold" class="${filter==='sold'?'active':''}">Verkauft ${summary.sold}</button>
      </div>
      <input id="transferSearch" type="search" value="${esc(data.ui?.transferSearch||'')}" placeholder="Spieler, Verein oder Grund suchen">
    </div>
    <div class="table-wrap transfer-history-table">
      <table>
        <thead><tr>
          <th>Spieler</th><th>Kauf</th><th>Von</th><th>Kaufpreis</th><th class="optional-col">Kaufgrund</th>
          <th>Status</th><th>Verkauf</th><th class="optional-col">An</th><th>Verkaufspreis</th><th>Gewinn/Wert</th><th></th>
        </tr></thead>
        <tbody>${tableRows||`<tr><td colspan="11"><div class="empty">Keine passenden Transfers gefunden.</div></td></tr>`}</tbody>
      </table>
    </div>
    <p class="table-help">⚙ öffnet Bearbeiten, Verkaufen, Rückgängig und Löschen.</p>
  </div>
  <div id="modalArea"></div>`;
}
function finances(){const bonuses=data.finances.filter(x=>!['Startkapital','Spielerkauf','Spielerverkauf'].includes(x.type)).reduce((a,x)=>a+(+x.amount||0),0);return `<div class="grid kpis"><div class="card kpi"><span>Startkapital</span><strong>${euro(data.settings.startCapital)}</strong></div><div class="card kpi"><span>Boni</span><strong>${euro(bonuses)}</strong></div><div class="card kpi"><span>Kontostand</span><strong>${euro(financeTotal())}</strong></div><div class="card kpi"><span>Gesamtvermögen</span><strong>${euro(wealth())}</strong></div></div><div class="grid two" style="margin-top:17px"><div class="card"><div class="section-head"><div><h2>Schnellbonus</h2><p>Ein Klick übernimmt Betrag und Beschreibung.</p></div></div><h3 style="margin:14px 0 8px">Tagesanmeldebonus · ${localDateISO()}</h3><div class="quick-grid">${DAILY_BONUSES.map(x=>`<button class="quick-money" data-quick-bonus="daily" data-label="${esc(x.label)}" data-amount="${x.amount}"><span>${esc(x.label)}</span><b>${euro(x.amount)}</b></button>`).join('')}</div><h3 style="margin:18px 0 8px">Erfolgsbonus</h3><div class="quick-grid achievements">${ACHIEVEMENT_BONUSES.map(x=>`<button class="quick-money" data-quick-bonus="achievement" data-label="${esc(x.label)}" data-amount="${x.amount}"><span>${esc(x.label)}</span><b>${euro(x.amount)}</b></button>`).join('')}</div></div><div class="card"><div class="section-head"><div><h2>Finanzbuchungen</h2><p>Boni, Korrekturen und Geldbewegungen.</p></div><button class="btn" id="addFinance">Eigene Buchung</button></div><div class="table-wrap"><table><thead><tr><th>Datum</th><th>Typ</th><th>Beschreibung</th><th>Betrag</th><th></th></tr></thead><tbody>${[...data.finances].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.type)}</td><td>${esc(x.description)}</td><td class="${+x.amount>=0?'money-pos':'money-neg'}">${euro(x.amount)}</td><td>${x.id==='start'?'':`<button class="btn danger small" data-del-fin="${x.id}">×</button>`}</td></tr>`).join('')}</tbody></table></div><div id="financeForm"></div></div></div>`}

function playerPerformance(player){
  const buy=Number(player.buyPrice||0);
  const end=Number(player.soldDate?player.salePrice:player.marketValue||0);
  const profit=end-buy;
  const days=(()=>{
    const start=new Date(player.buyDate||0);
    const finish=new Date(player.soldDate||localDateISO());
    if(Number.isNaN(start.getTime())||Number.isNaN(finish.getTime()))return 0;
    return Math.max(0,Math.round((finish-start)/(24*60*60*1000)));
  })();
  return{player,buy,end,profit,days,realized:Boolean(player.soldDate),success:profit>0};
}
function transferDataset(){
  return data.players.filter(p=>Number(p.buyPrice||0)>0).map(playerPerformance);
}
function groupTransferStats(keyFn){
  const map=new Map();
  transferDataset().forEach(entry=>{
    const keys=keyFn(entry.player);
    const list=Array.isArray(keys)?keys:[keys];
    list.filter(Boolean).forEach(key=>{
      if(!map.has(key))map.set(key,[]);
      map.get(key).push(entry);
    });
  });
  return [...map.entries()].map(([name,entries])=>{
    const realizedEntries=entries.filter(x=>x.realized);
    const profit=entries.reduce((sum,x)=>sum+x.profit,0);
    const realizedProfit=realizedEntries.reduce((sum,x)=>sum+x.profit,0);
    const successes=entries.filter(x=>x.success).length;
    return{
      name,entries,count:entries.length,profit,realizedProfit,
      successRate:entries.length?successes/entries.length*100:0,
      avgProfit:entries.length?profit/entries.length:0,
      avgDays:entries.length?entries.reduce((sum,x)=>sum+x.days,0)/entries.length:0
    };
  }).sort((a,b)=>b.profit-a.profit);
}
function h2hIntelligence(){
  const managerById=id=>LEAGUE_MANAGERS.find(m=>m.id===id);
  const games=(data.h2h||[]).map(game=>{
    if(game.homeId&&game.awayId){
      const meHome=game.homeId==='me';
      const meAway=game.awayId==='me';
      if(!meHome&&!meAway)return null;
      const myPoints=Number(meHome?game.homePoints:game.awayPoints);
      const oppPoints=Number(meHome?game.awayPoints:game.homePoints);
      const oppId=meHome?game.awayId:game.homeId;
      return{md:+game.md||0,myPoints,oppPoints,opponent:managerById(oppId)?.team||oppId};
    }
    if(game.opponent){
      return{md:+game.md||0,myPoints:Number(game.myPoints||0),oppPoints:Number(game.oppPoints||0),opponent:game.opponent};
    }
    return null;
  }).filter(Boolean).filter(g=>Number.isFinite(g.myPoints)&&Number.isFinite(g.oppPoints));
  const wins=games.filter(g=>g.myPoints>g.oppPoints).length;
  const draws=games.filter(g=>g.myPoints===g.oppPoints).length;
  const losses=games.length-wins-draws;
  const avg=games.length?games.reduce((s,g)=>s+g.myPoints,0)/games.length:0;
  const best=games.length?[...games].sort((a,b)=>b.myPoints-a.myPoints)[0]:null;
  const opponents=[...new Set(games.map(g=>g.opponent))].map(name=>{
    const rows=games.filter(g=>g.opponent===name);
    const w=rows.filter(g=>g.myPoints>g.oppPoints).length;
    const l=rows.filter(g=>g.myPoints<g.oppPoints).length;
    const d=rows.length-w-l;
    return{name,count:rows.length,w,l,d,diff:rows.reduce((s,g)=>s+g.myPoints-g.oppPoints,0)};
  });
  return{games,wins,draws,losses,avg,best,opponents};
}
function managerDNA(){
  const transfers=transferDataset();
  if(transfers.length<3)return{
    title:'Profil entsteht',
    icon:'🧬',
    text:`Noch ${3-transfers.length} Transfer${3-transfers.length===1?'':'s'}, bis erste belastbare Muster sichtbar werden.`,
    traits:['Daten sammeln']
  };
  const reasonStats=groupTransferStats(p=>normalizeBuyReasons(p));
  const positionStats=groupTransferStats(p=>p.position||'Unbekannt');
  const avgDays=transfers.reduce((s,x)=>s+x.days,0)/transfers.length;
  const profitable=transfers.filter(x=>x.success).length/transfers.length;
  const topReason=reasonStats[0]?.name||'';
  const topPosition=positionStats[0]?.name||'';
  let title='Ausgewogener Manager',icon='🧠';
  if(avgDays<=7&&profitable>=.55){title='Aktiver Trader';icon='📈'}
  else if(topReason==='Steigender Marktwert'){title='Value Hunter';icon='💎'}
  else if(['Gutes Matchup','Gutes Programm'].includes(topReason)){title='Matchup-Stratege';icon='🎯'}
  else if(avgDays>=21){title='Geduldiger Kaderplaner';icon='🛡️'}
  const traits=[];
  if(profitable>=.65)traits.push('hohe Gewinnquote');
  if(avgDays<=7)traits.push('kurze Haltedauer');
  if(avgDays>=21)traits.push('langfristige Käufe');
  if(topReason)traits.push(`stark bei „${topReason}“`);
  if(topPosition)traits.push(`beste Bilanz: ${topPosition}`);
  return{title,icon,text:`Basierend auf ${transfers.length} erfassten Transfers.`,traits:traits.slice(0,4)};
}
function intelligenceAchievements(){
  const transfers=transferDataset();
  const totalProfit=transfers.reduce((s,x)=>s+x.profit,0);
  const realizedProfit=transfers.filter(x=>x.realized).reduce((s,x)=>s+x.profit,0);
  const profitable=transfers.filter(x=>x.success).length;
  const h=h2hIntelligence();
  const items=[
    {icon:'💰',title:'Value Hunter',done:totalProfit>=10000000,detail:`${euro(totalProfit)} / 10 Mio. € Wertzuwachs`},
    {icon:'📈',title:'Grüne Serie',done:profitable>=5,detail:`${profitable} / 5 erfolgreiche Transfers`},
    {icon:'⚔️',title:'H2H-Spezialist',done:h.wins>=5,detail:`${h.wins} / 5 H2H-Siege`},
    {icon:'🏦',title:'Realisierer',done:realizedProfit>=10000000,detail:`${euro(realizedProfit)} / 10 Mio. € realisierter Gewinn`}
  ];
  return items;
}
function statBar(value,max){
  const pct=max>0?Math.max(3,Math.min(100,Math.abs(value)/max*100)):3;
  return `<div class="intel-bar"><i style="width:${pct}%"></i></div>`;
}

function analysis(){
  const transfers=transferDataset();
  const realizedRows=transfers.filter(x=>x.realized);
  const totalProfit=transfers.reduce((s,x)=>s+x.profit,0);
  const realizedProfit=realizedRows.reduce((s,x)=>s+x.profit,0);
  const avgProfit=transfers.length?totalProfit/transfers.length:0;
  const successRate=transfers.length?transfers.filter(x=>x.success).length/transfers.length*100:0;
  const avgDays=transfers.length?transfers.reduce((s,x)=>s+x.days,0)/transfers.length:0;
  const best=transfers.length?[...transfers].sort((a,b)=>b.profit-a.profit)[0]:null;
  const worst=transfers.length?[...transfers].sort((a,b)=>a.profit-b.profit)[0]:null;
  const reasons=groupTransferStats(p=>normalizeBuyReasons(p));
  const positions=groupTransferStats(p=>p.position||'Unbekannt');
  const clubs=groupTransferStats(p=>p.team||'Unbekannt');
  const h2h=h2hIntelligence();
  const dna=managerDNA();
  const achievements=intelligenceAchievements();
  const maxReason=Math.max(1,...reasons.map(x=>Math.abs(x.profit)));
  const maxPosition=Math.max(1,...positions.map(x=>Math.abs(x.profit)));
  const maxClub=Math.max(1,...clubs.map(x=>Math.abs(x.profit)));

  return `<div class="intelligence-page">
    <section class="intelligence-hero">
      <div>
        <span>H2H INTELLIGENCE · SAISON 2026/27</span>
        <h2>Deine Entscheidungen werden messbar</h2>
        <p>Alle Auswertungen entstehen automatisch aus Käufen, Verkäufen, Kaufgründen und H2H-Ergebnissen.</p>
      </div>
      <div class="dna-badge"><strong>${dna.icon}</strong><span>${esc(dna.title)}</span></div>
    </section>

    <section class="intel-kpis">
      <article><span>Gesamter Wertzuwachs</span><strong class="${totalProfit>=0?'money-pos':'money-neg'}">${euro(totalProfit)}</strong><small>realisiert + aktuell</small></article>
      <article><span>Realisierter Gewinn</span><strong class="${realizedProfit>=0?'money-pos':'money-neg'}">${euro(realizedProfit)}</strong><small>${realizedRows.length} Verkäufe</small></article>
      <article><span>Gewinnquote</span><strong>${successRate.toFixed(0)} %</strong><small>${transfers.filter(x=>x.success).length}/${transfers.length} Transfers im Plus</small></article>
      <article><span>Ø Haltedauer</span><strong>${avgDays.toFixed(1)} Tage</strong><small>über alle Käufe</small></article>
      <article><span>H2H-Bilanz</span><strong>${h2h.wins}-${h2h.draws}-${h2h.losses}</strong><small>${h2h.games.length} eingetragene Duelle</small></article>
    </section>

    <section class="intel-grid-two">
      <article class="premium-panel manager-dna-panel">
        <div class="premium-panel-head"><div><span>MANAGER-DNA</span><h3>${dna.icon} ${esc(dna.title)}</h3></div></div>
        <p>${esc(dna.text)}</p>
        <div class="dna-traits">${dna.traits.map(t=>`<span>${esc(t)}</span>`).join('')}</div>
        <div class="dna-note">Das Profil beschreibt Muster deiner erfassten Entscheidungen – keine feste Bewertung deiner Spielstärke.</div>
      </article>

      <article class="premium-panel">
        <div class="premium-panel-head"><div><span>TRANSFER-HIGHLIGHTS</span><h3>Beste und schwächste Entscheidung</h3></div></div>
        ${best?`<div class="highlight-transfer good">
          <span>🏆 Bester Transfer</span><b>${esc(best.player.name)}</b>
          <strong>${euro(best.profit)}</strong><small>${esc(best.player.team)} · ${best.days} Tage gehalten</small>
        </div>`:'<div class="empty-soft">Noch keine Transfers vorhanden.</div>'}
        ${worst?`<div class="highlight-transfer ${worst.profit>=0?'neutral':'bad'}">
          <span>🔍 Größtes Verbesserungspotenzial</span><b>${esc(worst.player.name)}</b>
          <strong>${euro(worst.profit)}</strong><small>${esc(buyReasonSummary(worst.player))}</small>
        </div>`:''}
      </article>
    </section>

    <section class="intel-grid-two">
      <article class="premium-panel">
        <div class="premium-panel-head"><div><span>KAUFGRUNDANALYSE</span><h3>Welche Strategien funktionieren?</h3></div></div>
        ${reasons.length?`<div class="intel-ranking">${reasons.map((row,i)=>`
          <div class="intel-ranking-row">
            <span class="intel-rank">${i+1}</span>
            <div><b>${esc(row.name)}</b><small>${row.count} Transfers · ${row.successRate.toFixed(0)} % im Plus · Ø ${euro(row.avgProfit)}</small>${statBar(row.profit,maxReason)}</div>
            <strong class="${row.profit>=0?'money-pos':'money-neg'}">${euro(row.profit)}</strong>
          </div>`).join('')}</div>`:'<div class="empty-soft">Kaufgründe werden mit deinen nächsten Transfers automatisch ausgewertet.</div>'}
      </article>

      <article class="premium-panel">
        <div class="premium-panel-head"><div><span>POSITIONSANALYSE</span><h3>Wo investierst du erfolgreich?</h3></div></div>
        ${positions.length?`<div class="intel-ranking">${positions.map((row,i)=>`
          <div class="intel-ranking-row">
            <span class="intel-rank">${i+1}</span>
            <div><b>${esc(row.name)}</b><small>${row.count} Käufe · Ø Haltedauer ${row.avgDays.toFixed(1)} Tage</small>${statBar(row.profit,maxPosition)}</div>
            <strong class="${row.profit>=0?'money-pos':'money-neg'}">${euro(row.profit)}</strong>
          </div>`).join('')}</div>`:'<div class="empty-soft">Noch keine Positionsdaten vorhanden.</div>'}
      </article>
    </section>

    <section class="intel-grid-two">
      <article class="premium-panel">
        <div class="premium-panel-head"><div><span>VEREINSANALYSE</span><h3>Deine erfolgreichsten Bundesliga-Clubs</h3></div></div>
        ${clubs.length?`<div class="intel-ranking club-intel-ranking">${clubs.slice(0,10).map((row,i)=>`
          <div class="intel-ranking-row">
            <span class="intel-rank">${i+1}</span>
            <div class="intel-club-name">${bundesligaCrest(row.name,'intel-club-crest')}<span><b>${esc(row.name)}</b><small>${row.count} Käufe · ${row.successRate.toFixed(0)} % im Plus</small>${statBar(row.profit,maxClub)}</span></div>
            <strong class="${row.profit>=0?'money-pos':'money-neg'}">${euro(row.profit)}</strong>
          </div>`).join('')}</div>`:'<div class="empty-soft">Noch keine Vereinsdaten vorhanden.</div>'}
      </article>

      <article class="premium-panel">
        <div class="premium-panel-head"><div><span>H2H-ANALYTICS</span><h3>Deine direkten Duelle</h3></div></div>
        ${h2h.games.length?`
          <div class="h2h-intel-summary"><div><strong>${h2h.avg.toFixed(0)}</strong><span>Ø eigene Punkte</span></div><div><strong>${h2h.best?.myPoints||0}</strong><span>Bestwert</span></div><div><strong>${h2h.wins}</strong><span>Siege</span></div></div>
          <div class="intel-ranking">${h2h.opponents.sort((a,b)=>b.diff-a.diff).map((row,i)=>`
            <div class="intel-ranking-row">
              <span class="intel-rank">${i+1}</span>
              <div><b>${esc(row.name)}</b><small>${row.w} S · ${row.d} U · ${row.l} N</small></div>
              <strong class="${row.diff>=0?'money-pos':'money-neg'}">${row.diff>=0?'+':''}${row.diff.toFixed(0)} Pkt.</strong>
            </div>`).join('')}</div>
        `:'<div class="empty-soft">Trage nach Spieltagen nur die H2H-Punkte ein. Gegnertransfers sind für diese Analyse nicht nötig.</div>'}
      </article>
    </section>

    <section class="premium-panel">
      <div class="premium-panel-head"><div><span>ENTWICKLUNG</span><h3>Auszeichnungen und nächste Ziele</h3></div></div>
      <div class="achievement-grid">${achievements.map(a=>`
        <article class="achievement-card ${a.done?'unlocked':'locked'}">
          <span>${a.icon}</span><div><b>${esc(a.title)}</b><small>${esc(a.detail)}</small></div><i>${a.done?'Erreicht':'In Arbeit'}</i>
        </article>`).join('')}</div>
    </section>

    <section class="premium-panel season-review-panel">
      <div class="premium-panel-head"><div><span>SAISON-REVIEW</span><h3>Dein Zwischenfazit 2026/27</h3></div></div>
      ${(()=>{const m=coachMemory().stats(),h=h2hIntelligence(),t=transferDataset(),profit=t.reduce((s,x)=>s+x.profit,0),best=t.length?[...t].sort((a,b)=>b.profit-a.profit)[0]:null;return `
      <div class="season-review-grid">
        <article><span>Transferentwicklung</span><strong class="${profit>=0?'money-pos':'money-neg'}">${euro(profit)}</strong><small>${t.length} erfasste Käufe</small></article>
        <article><span>H2H</span><strong>${h.wins}-${h.draws}-${h.losses}</strong><small>${h.avg.toFixed(0)} Ø Punkte</small></article>
        <article><span>Coach Feedback</span><strong>${m.count?m.rate.toFixed(0)+' %':'–'}</strong><small>${m.count} Bewertungen</small></article>
        <article><span>Bester Transfer</span><strong>${best?esc(best.player.name):'–'}</strong><small>${best?euro(best.profit):'Noch keine Daten'}</small></article>
      </div>
      <div class="season-summary-text">${t.length<3?'Die Transferanalyse wird nach mindestens drei Käufen belastbarer. ':''}${h.games.length===0?'Für die H2H-Entwicklung reichen deine und die gegnerischen Spieltagspunkte. ':''}${m.count===0?'Bewerte gelegentlich das Coach-Briefing, damit die App dessen Nutzen messen kann.':''}</div>`})()}
    </section>

    <section class="premium-panel calibration-panel">
      <div class="premium-panel-head"><div><span>COACH-KALIBRIERUNG</span><h3>Bewertungslogik lernt aus echten Spieltagen</h3></div></div>
      ${(()=>{const c=coachCalibration(),s=calibrationSummary();const labels={average:'Ø Punkte',matchup:'Matchup',lineup:'Startelfstatus',team:'Teamstärke',home:'Heimvorteil',news:'Offizielle News'};return `
        <div class="calibration-status ${c.active?'active':'learning'}">
          <strong>${c.active?'✓ Persönliche Gewichtung aktiv':'◷ Lernphase'}</strong>
          <span>${esc(s.text)}</span>
          ${s.accuracy!==null?`<b>${s.accuracy.toFixed(0)} % Modellnähe</b>`:''}
        </div>
        <div class="calibration-weights">${Object.entries(c.weights).map(([key,value])=>`
          <div><span>${labels[key]}</span><div><i style="width:${Math.min(100,value/35*100)}%"></i></div><b>${value.toFixed(1)}</b></div>`).join('')}</div>
        <p>Vor dem Saisonstart bewertet der Coach vor allem Matchup, Teamniveau und Aufstellungsstatus; fehlende Saison-Ø-Punkte werden neutral behandelt. Nach jedem ausgewerteten Spieltag fließen aktuelle Daten stärker ein. Ab vier Spieltagen läuft das Saisonmodell vollständig; die persönliche Kalibrierung bleibt zusätzlich vorsichtig begrenzt.</p>
      `})()}
    </section>

    <section class="premium-panel intelligence-explanation">
      <h3>Wie die Analyse gerechnet wird</h3>
      <p>Bei verkauften Spielern zählt der Verkaufspreis, bei aktiven Spielern der aktuell manuell gepflegte Marktwert. Mehrfach ausgewählte Kaufgründe werden jedem Grund vollständig zugerechnet; dadurch misst die Auswertung, welche Merkmale häufig mit erfolgreichen Käufen zusammen auftreten.</p>
      <p>Coach-AI-Trefferquoten werden erst ergänzt, sobald Empfehlungen und deine tatsächlichen Entscheidungen strukturiert gespeichert werden. Die App erfindet dafür keine rückwirkenden Daten.</p>
    </section>
  </div>`;
}
function lineupintel(){
  const active=activePlayers();
  const pending=data.lineupIntel?.pending||[];
  const last=data.lineupIntel?.lastImport?new Date(data.lineupIntel.lastImport).toLocaleString('de-DE'):'Noch nie';
  return `<div class="mobile-steps">
    <div class="step"><b>1</b><span>LigaInsider im Browser öffnen</span></div>
    <div class="step"><b>2</b><span>Aufstellungsseite markieren und kopieren</span></div>
    <div class="step"><b>3</b><span>Text einfügen, prüfen und übernehmen</span></div>
  </div>
  <div class="grid two" style="margin-top:16px">
    <div class="card">
      <div class="section-head"><div><h2>Halbautomatischer Abgleich</h2><p>Letzter Import: ${esc(last)}</p></div>
      <a class="btn secondary link-btn" href="https://www.ligainsider.de/bundesliga/" target="_blank" rel="noopener">LigaInsider öffnen ↗</a></div>
      <div class="notice">Auf dem Samsung: LigaInsider öffnen, den relevanten Aufstellungstext lange antippen, kopieren und unten einfügen. Die App ändert nichts ohne deine Bestätigung.</div>
      <label class="paste-label">Kopierter Text oder gespeicherter HTML-Inhalt
        <textarea id="liPaste" placeholder="Hier den kopierten LigaInsider-Inhalt einfügen …"></textarea>
      </label>
      <div class="toolbar"><button class="btn" id="liAnalyze">Änderungen erkennen</button><button class="btn secondary" id="liClear">Leeren</button></div>
    </div>
    <div class="card">
      <div class="section-head"><div><h2>Erkannte Änderungen</h2><p>Vor dem Übernehmen kontrollieren.</p></div>
      ${pending.length?`<button class="btn" id="liApply">Alle übernehmen</button>`:''}</div>
      ${pending.length?pending.map(c=>`<div class="change-row"><div><b>${esc(c.name)}</b><small>${esc(c.context||'')}</small></div><span class="pill ${liStatusClass(c.oldStatus)}">${esc(c.oldStatus)}</span><span>→</span><span class="pill ${liStatusClass(c.newStatus)}">${esc(c.newStatus)}</span><button class="btn small danger" data-li-remove="${esc(c.playerId)}">×</button></div>`).join(''):'<div class="empty-soft">Noch keine Änderungen erkannt.</div>'}
    </div>
  </div>
  <div class="card" style="margin-top:16px">
    <div class="section-head"><div><h2>Status deiner Spieler</h2><p>Manuelle Korrektur ist jederzeit möglich.</p></div></div>
    <div class="li-player-grid">
      ${active.length?active.map(p=>`<article class="li-player">
        <div><b>${esc(p.name)}</b><small>${esc(p.team)}</small></div>
        <select data-li-status="${p.id}">${LI_STATUSES.map(s=>`<option ${s===(p.liStatus||'Unbekannt')?'selected':''}>${esc(s)}</option>`).join('')}</select>
        <a href="https://www.google.com/search?q=${encodeURIComponent('site:ligainsider.de '+p.name+' '+p.team)}" target="_blank" rel="noopener" class="icon-link" title="Spieler bei LigaInsider suchen">↗</a>
      </article>`).join(''):'<div class="empty">Keine aktiven Spieler vorhanden.</div>'}
    </div>
  </div>`;
}
function detectLiChanges(raw){
  const text=String(raw||'').replace(/\s+/g,' ').trim();
  if(!text)return [];
  const lower=text.toLocaleLowerCase('de-DE');
  const changes=[];
  activePlayers().forEach(p=>{
    const name=p.name.toLocaleLowerCase('de-DE');
    let idx=lower.indexOf(name);
    if(idx<0){
      const surname=name.split(/\s+/).pop();
      if(surname.length>=4)idx=lower.indexOf(surname);
    }
    if(idx<0)return;
    const context=text.slice(Math.max(0,idx-180),Math.min(text.length,idx+p.name.length+220));
    const c=context.toLocaleLowerCase('de-DE');
    let status='Unbekannt';
    if(/fällt aus|faellt aus|nicht im kader|verletzt|gesperrt/.test(c))status='Fällt aus';
    else if(/fraglich|angeschlagen|einsatz offen|wackelkandidat/.test(c))status='Fraglich';
    else if(/ersatzbank|bank|nicht in der startelf/.test(c))status='Ersatzbank';
    else if(/alternative|konkurrenz|option für|option fuer/.test(c))status='Alternative';
    else if(/voraussichtliche startelf|startelf|beginnt|von beginn an/.test(c))status='Voraussichtliche Startelf';
    if(status!=='Unbekannt'&&status!==(p.liStatus||'Unbekannt')){
      changes.push({playerId:p.id,name:p.name,oldStatus:p.liStatus||'Unbekannt',newStatus:status,context:context.slice(0,130)+'…'});
    }
  });
  return changes;
}

function calculateLeagueTable(){
  const rows=(data.leagueManagers||LEAGUE_MANAGERS).map(m=>({
    id:m.id,team:m.team,isMe:m.isMe||false,
    played:0,wins:0,draws:0,losses:0,pointsFor:0,pointsAgainst:0,tablePoints:0
  }));
  const byId=Object.fromEntries(rows.map(r=>[r.id,r]));
  (data.h2h||[]).forEach(g=>{
    const home=byId[g.homeId],away=byId[g.awayId];
    if(!home||!away||g.homePoints===undefined||g.awayPoints===undefined)return;
    const hp=+g.homePoints,ap=+g.awayPoints;
    home.played++;away.played++;
    home.pointsFor+=hp;home.pointsAgainst+=ap;
    away.pointsFor+=ap;away.pointsAgainst+=hp;
    if(hp>ap){home.wins++;away.losses++;home.tablePoints+=3}
    else if(ap>hp){away.wins++;home.losses++;away.tablePoints+=3}
    else{home.draws++;away.draws++;home.tablePoints++;away.tablePoints++}
  });
  return rows.sort((a,b)=>b.tablePoints-a.tablePoints||(b.pointsFor-b.pointsAgainst)-(a.pointsFor-a.pointsAgainst)||b.pointsFor-a.pointsFor);
}
function teamOnly(id){return managerById(id)?.team||id}

const OPPONENT_FORMATIONS=['3-4-3','4-4-2','4-5-1','5-3-2','5-4-1','4-2-4','3-5-2','5-2-3','4-3-3','3-6-1'];

function ensureLeagueIntel(){
  if(!data.leagueIntel||typeof data.leagueIntel!=='object')data.leagueIntel={managerData:{},reminderDismissed:{}};
  if(!data.leagueIntel.managerData)data.leagueIntel.managerData={};
  if(!data.leagueIntel.reminderDismissed)data.leagueIntel.reminderDismissed={};
  return data.leagueIntel;
}
const V200_SCREENSHOT_SEED={"Fäps Ham United":{"team":"Fäps Ham United","transfers":[{"type":"Kauf","player":"Eggestein","price":14999999},{"type":"Kauf","player":"Rieder","price":12888888},{"type":"Kauf","player":"Tapsoba","price":34999999},{"type":"Kauf","player":"Hendriks","price":12555555},{"type":"Kauf","player":"Gadou","price":24666666},{"type":"Kauf","player":"Marino","price":7899999},{"type":"Kauf","player":"Aouchiche","price":12399999},{"type":"Kauf","player":"Moreira","price":21999999},{"type":"Kauf","player":"Mwene","price":7899999},{"type":"Kauf","player":"Sticker","price":2199999},{"type":"Kauf","player":"van den Berg","price":3666666},{"type":"Kauf","player":"Backhaus","price":17888888},{"type":"Kauf","player":"Ibrahimović","price":6777777},{"type":"Verkauf","player":"Ibrahimović","price":6585689},{"type":"Verkauf","player":"van den Berg","price":3705134}],"lineup":[]},"Al Elshani":{"team":"Al Elshani","transfers":[{"type":"Kauf","player":"Musiala","price":36213452},{"type":"Kauf","player":"Baku","price":20612487},{"type":"Kauf","player":"Zieler","price":1835741},{"type":"Kauf","player":"Günther","price":7937315},{"type":"Kauf","player":"Lynen","price":7416099},{"type":"Kauf","player":"Schmahl","price":2546473},{"type":"Kauf","player":"Arévalo","price":3537247},{"type":"Kauf","player":"Katić","price":13532214},{"type":"Kauf","player":"Chuki","price":9936505},{"type":"Kauf","player":"Vermeeren","price":3641623},{"type":"Kauf","player":"Koch","price":24669518},{"type":"Kauf","player":"Porath","price":4649398},{"type":"Kauf","player":"Upamecano","price":34646680},{"type":"Kauf","player":"Damjanović","price":7658250},{"type":"Verkauf","player":"Damjanović","price":8347676},{"type":"Kauf","player":"Elfadli","price":3964212},{"type":"Verkauf","player":"Elfadli","price":4702842},{"type":"Kauf","player":"Ribeiro","price":5926876},{"type":"Verkauf","player":"Ribeiro","price":5646465},{"type":"Kauf","player":"Amoako","price":6201584},{"type":"Verkauf","player":"Amoako","price":6231729}],"lineup":["Musiala","Günther","Koch","Katić","Upamecano","Baku"]},"Calcio Rom FC":{"team":"Calcio Rom FC","transfers":[{"type":"Kauf","player":"Díaz","price":59888099},{"type":"Kauf","player":"Nmecha","price":29899999},{"type":"Kauf","player":"Querfeld","price":12864999},{"type":"Kauf","player":"Hashioka","price":6108899},{"type":"Kauf","player":"Muheim","price":9188089},{"type":"Kauf","player":"Gouweleeuw","price":11588889},{"type":"Kauf","player":"Friedl","price":11800089},{"type":"Kauf","player":"Claude-Maurice","price":12180009},{"type":"Kauf","player":"Becker","price":12380999},{"type":"Kauf","player":"Kabak","price":23108999},{"type":"Kauf","player":"Sander","price":10900089},{"type":"Kauf","player":"Noll","price":11278999},{"type":"Kauf","player":"Batshuayi","price":2111089},{"type":"Kauf","player":"Orban","price":31300089},{"type":"Verkauf","player":"Orban","price":30710853},{"type":"Kauf","player":"Schick","price":28969999},{"type":"Verkauf","player":"Schick","price":29026293},{"type":"Kauf","player":"Petersson","price":500009},{"type":"Verkauf","player":"Petersson","price":500000},{"type":"Kauf","player":"Baumann","price":19764849},{"type":"Verkauf","player":"Baumann","price":20010247},{"type":"Kauf","player":"Führich","price":25000000}],"lineup":["Díaz","Becker","Claude-Maurice","Sander","Nmecha","Führich","Friedl","Kabak","Querfeld"]},"Cello Football Club":{"team":"Cello Football Club","transfers":[{"type":"Kauf","player":"Bredlow","price":8375545},{"type":"Kauf","player":"Schlotterbeck","price":36124581},{"type":"Kauf","player":"Larsson","price":12184548},{"type":"Kauf","player":"Sakar","price":3385669},{"type":"Kauf","player":"Stiller","price":41822455},{"type":"Kauf","player":"Duric","price":5195558},{"type":"Kauf","player":"Thielmann","price":4945546},{"type":"Kauf","player":"Schnellbacher","price":2257115},{"type":"Kauf","player":"Maksimovic","price":4574558},{"type":"Kauf","player":"Palacios","price":26265455},{"type":"Kauf","player":"Collins","price":15855665},{"type":"Kauf","player":"Tiago Tomás","price":5784581},{"type":"Verkauf","player":"Tiago Tomás","price":5592722},{"type":"Kauf","player":"Maloney","price":3682258},{"type":"Verkauf","player":"Maloney","price":3143797},{"type":"Kauf","player":"Rosenfelder","price":5761584},{"type":"Verkauf","player":"Rosenfelder","price":4882932},{"type":"Kauf","player":"Banzuzi","price":3712455},{"type":"Verkauf","player":"Banzuzi","price":3657413},{"type":"Kauf","player":"Oermann","price":3215585},{"type":"Verkauf","player":"Oermann","price":4236377},{"type":"Kauf","player":"Ayhan","price":9045225},{"type":"Verkauf","player":"Ayhan","price":9384443},{"type":"Kauf","player":"Poreba","price":8052255},{"type":"Verkauf","player":"Poreba","price":8717610}],"lineup":["Bredlow","Schlotterbeck","Palacios","Larsson","Stiller"]},"Fapse FC":{"team":"Fapse FC","transfers":[{"type":"Kauf","player":"Mittelstädt","price":30500000},{"type":"Kauf","player":"Pavlović","price":34500000},{"type":"Kauf","player":"Karetsas","price":27500000},{"type":"Kauf","player":"Kleindienst","price":20030000},{"type":"Kauf","player":"Stöger","price":5000099},{"type":"Verkauf","player":"Stöger","price":5253555},{"type":"Kauf","player":"Sylla","price":7999999},{"type":"Verkauf","player":"Sylla","price":8400192},{"type":"Kauf","player":"Arthur","price":8777999},{"type":"Verkauf","player":"Arthur","price":6197946},{"type":"Kauf","player":"Ruoppi","price":5799999},{"type":"Verkauf","player":"Ruoppi","price":5924409},{"type":"Kauf","player":"Jatta","price":5099999},{"type":"Verkauf","player":"Jatta","price":5249276},{"type":"Kauf","player":"Arp/Hov","price":4999999},{"type":"Verkauf","player":"Arp/Hov","price":5230106},{"type":"Kauf","player":"Baack","price":5000999},{"type":"Verkauf","player":"Baack","price":5549790}],"lineup":["Karius","Svensson","Mittelstädt","Yilmaz","Mohya","Karetsas","Pavlović","Suzuki","Kemlein","Kleindienst"]}};

const V206_SCREENSHOT_PATCH={"FÄPS HAM UNITED":{"team":"FÄPS HAM UNITED","lineup":["Moreira","Eggestein","Rieder","Aouchiche","Hendriks","Tapsoba","Gadou","Mwene","Backhaus"],"transfers":[]},"FAPSE FC":{"team":"FAPSE FC","lineup":["Karius","Svensson","Mittelstädt","Yilmaz","Mohya","Karetsas","Pavlović","Suzuki","Kemlein","Kleindienst"],"transfers":[{"type":"Kauf","player":"Svensson","price":19999999},{"type":"Kauf","player":"Mittelstädt","price":30500999},{"type":"Kauf","player":"Suzuki","price":12500000},{"type":"Kauf","player":"Pavlović","price":34500999},{"type":"Kauf","player":"Obermair","price":8666999},{"type":"Kauf","player":"Karetsas","price":27500000},{"type":"Kauf","player":"Karius","price":15555999},{"type":"Kauf","player":"Bøving","price":4099999},{"type":"Kauf","player":"Yilmaz","price":11750999},{"type":"Kauf","player":"Kemlein","price":7500000},{"type":"Kauf","player":"Kleindienst","price":20028034},{"type":"Kauf","player":"Hollerbach","price":4166666},{"type":"Kauf","player":"Džeko","price":7750000},{"type":"Kauf","player":"Mohya","price":10500000}]},"Horn Capital FC":{"team":"Horn Capital FC","lineup":["Kristof","Deman","Anton","Lienhart","Kohr","Götze","García","Beste","Olise","Erevbenagie","Conté"],"transfers":[{"type":"Kauf","player":"Schwolow","price":1000000},{"type":"Kauf","player":"Pruhs","price":600000},{"type":"Kauf","player":"Milosevic","price":4141414},{"type":"Kauf","player":"Gosens","price":11445599},{"type":"Verkauf","player":"Gosens","price":11407285},{"type":"Kauf","player":"Kohr","price":6543210},{"type":"Kauf","player":"Tape","price":5071935},{"type":"Kauf","player":"Kristof","price":12345678},{"type":"Kauf","player":"Götze","price":3222220},{"type":"Kauf","player":"Khedira","price":4455667},{"type":"Kauf","player":"Führich","price":26555555},{"type":"Kauf","player":"Labrović","price":3000000},{"type":"Kauf","player":"Conté","price":12345678},{"type":"Kauf","player":"Pfeiffer","price":5000000},{"type":"Verkauf","player":"Pfeiffer","price":5334535},{"type":"Verkauf","player":"Labrović","price":2698542},{"type":"Kauf","player":"Olise","price":69258147},{"type":"Kauf","player":"Burke","price":3566666},{"type":"Verkauf","player":"Khedira","price":4529355},{"type":"Verkauf","player":"Tape","price":5363338},{"type":"Kauf","player":"Beste","price":10700005},{"type":"Kauf","player":"García","price":44332211},{"type":"Verkauf","player":"Milosevic","price":5484262},{"type":"Kauf","player":"Erevbenagie","price":1899999},{"type":"Verkauf","player":"Burke","price":4451380},{"type":"Kauf","player":"Lienhart","price":13131313},{"type":"Kauf","player":"Pedersen","price":3888888},{"type":"Kauf","player":"Anton","price":38777999},{"type":"Kauf","player":"Deman","price":10777777},{"type":"Verkauf","player":"Führich","price":25000000}]}};
function v200Norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function v200ManagerId(team){const q=v200Norm(team);return MANAGER_OPTIONS.find(m=>[m.id,m.team,m.manager].map(v200Norm).some(x=>x===q||x.includes(q)||q.includes(x)))?.id||null}
function applyV200ScreenshotSeed(){
  data.ui=data.ui||{};
  if(data.ui.v200ScreenshotSeedApplied)return;
  Object.values(V200_SCREENSHOT_SEED).forEach(seed=>{
    const id=v200ManagerId(seed.team); if(!id)return;
    const row=managerLeagueData(id); row.transfers=Array.isArray(row.transfers)?row.transfers:[];
    seed.transfers.forEach(x=>{
      const found=[...row.transfers].reverse().find(t=>t.type===x.type&&normalizePlayerName(t.player)===normalizePlayerName(x.player));
      if(found){found.player=x.player;if(x.price)found.price=x.price;found.source='Screenshot-Import 2.0'}
      else row.transfers.push({id:`v200-${id}-${Math.random().toString(36).slice(2)}`,type:x.type,md:+data.settings.currentMd||1,player:x.player,club:findSelectablePlayerByName(x.player)?.team||'',price:+x.price||0,date:'',note:'Aus Kickbase-Screenshot übernommen',source:'Screenshot-Import 2.0'});
    });
    if(seed.lineup?.length){const md=+data.settings.currentMd||1,r=managerMatchdayData(id,md);r.lineup=[...seed.lineup];r.bank=Array.isArray(r.bank)?r.bank:[]}
  });
  data.ui.v200ScreenshotSeedApplied=true;
}


function v206ManagerId(team){
  const q=v200Norm(team);
  return LEAGUE_MANAGERS.find(m=>[m.id,m.team,m.manager].map(v200Norm).some(x=>x===q||x.includes(q)||q.includes(x)))?.id||null;
}
function v206SeedRows(){
  const merged={};
  Object.values(V200_SCREENSHOT_SEED||{}).forEach(seed=>{merged[v200Norm(seed.team)]={team:seed.team,transfers:[...(seed.transfers||[])],lineup:[...(seed.lineup||[])]}});
  Object.values(V206_SCREENSHOT_PATCH||{}).forEach(seed=>{
    const key=v200Norm(seed.team);
    if(!merged[key])merged[key]={team:seed.team,transfers:[],lineup:[]};
    for(const t of seed.transfers||[]){
      const found=merged[key].transfers.find(x=>x.type===t.type&&normalizePlayerName(x.player)===normalizePlayerName(t.player)&&Number(x.price||0)===Number(t.price||0));
      if(!found)merged[key].transfers.push(t);
    }
    if(seed.lineup?.length)merged[key].lineup=[...seed.lineup];
  });
  return Object.values(merged);
}
function applyV206LeagueSnapshot(){
  data.ui=data.ui||{};
  const rows=v206SeedRows();
  const expected={fabi:15,elias:21,manu:22,marci:25,fabio:30,me:30};
  const incomplete=Object.entries(expected).some(([id,min])=>(data.leagueIntel?.managerData?.[id]?.transfers||[]).length<min);
  if(data.ui.v206LeagueSnapshotApplied&&!incomplete)return;

  rows.forEach(seed=>{
    const id=v206ManagerId(seed.team); if(!id)return;
    const row=managerLeagueData(id); row.transfers=Array.isArray(row.transfers)?row.transfers:[];
    for(const incoming of seed.transfers||[]){
      const same=row.transfers.filter(t=>t.type===incoming.type&&normalizePlayerName(t.player)===normalizePlayerName(incoming.player));
      const exact=same.find(t=>Number(t.price||0)===Number(incoming.price||0));
      if(exact){exact.source=exact.source||'Screenshot Liga-Snapshot 2.0.6';continue}
      if(same.length===1&&same[0].source?.includes('Screenshot')){
        same[0].price=Number(incoming.price||0);same[0].player=incoming.player;same[0].source='Screenshot Liga-Snapshot 2.0.6';
      }else{
        row.transfers.push({id:`v206-${id}-${Math.random().toString(36).slice(2)}`,type:incoming.type,md:+data.settings.currentMd||1,player:incoming.player,club:findSelectablePlayerByName(incoming.player)?.team||'',price:Number(incoming.price||0),date:'',note:'Aus bereits bereitgestelltem Kickbase-Screenshot',source:'Screenshot Liga-Snapshot 2.0.6'});
      }
    }
    if(seed.lineup?.length){
      const md=+data.settings.currentMd||1, m=managerMatchdayData(id,md);
      m.lineup=[...seed.lineup];m.bank=Array.isArray(m.bank)?m.bank:[];
      m.note=[m.note,'Aufstellung aus Liga-Screenshot 2.0.6'].filter(Boolean).join(' · ');
    }
  });
  data.ui.v206LeagueSnapshotApplied=true;
  localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));
  clearTimeout(window.__v206SeedSaveTimer);
  window.__v206SeedSaveTimer=setTimeout(()=>{localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));if(window.cloudQueueSave)window.cloudQueueSave();},2200);
}


function transferIdentity(type,player,price){
  return `${String(type||'').toLowerCase()}|${normalizePlayerName(player)}|${Math.round(Number(price)||0)}`;
}
function ensureMyLeagueTransferHistory(){
  const row=managerLeagueData('me');
  row.transfers=Array.isArray(row.transfers)?row.transfers:[];
  const existing=new Set(row.transfers.map(t=>transferIdentity(t.type,t.player,t.price)));

  for(const p of data.players||[]){
    const buyKey=transferIdentity('Kauf',p.name,p.buyPrice);
    if(p.name && Number(p.buyPrice||0)>0 && !existing.has(buyKey)){
      row.transfers.push({
        id:`own-buy-${p.id||id()}`,
        type:'Kauf',
        md:+p.boughtMd||+data.settings.currentMd||1,
        player:p.name,
        club:p.team||'',
        price:Number(p.buyPrice)||0,
        date:p.buyDate||'',
        note:p.buyCounterparty?`Gegenpartei: ${p.buyCounterparty}`:(p.note||''),
        source:p.buySource||'Eigene Transferhistorie'
      });
      existing.add(buyKey);
    }

    if(p.soldDate && Number(p.salePrice||0)>=0){
      const sellKey=transferIdentity('Verkauf',p.name,p.salePrice);
      if(!existing.has(sellKey)){
        row.transfers.push({
          id:`own-sell-${p.id||id()}`,
          type:'Verkauf',
          md:+p.soldMd||+data.settings.currentMd||1,
          player:p.name,
          club:p.team||'',
          price:Number(p.salePrice)||0,
          date:p.soldDate||'',
          note:p.saleCounterparty?`Gegenpartei: ${p.saleCounterparty}`:(p.saleReason||''),
          source:p.saleSource||'Eigene Transferhistorie'
        });
        existing.add(sellKey);
      }
    }
  }
}
function syncMyPlayersFromLeagueTransfers(){
  const row=managerLeagueData('me');
  const transfers=(row.transfers||[]).slice().sort((a,b)=>
    (+a.md||0)-(+b.md||0) ||
    String(a.date||'').localeCompare(String(b.date||'')) ||
    String(a.id||'').localeCompare(String(b.id||''))
  );

  data.players=Array.isArray(data.players)?data.players:[];
  const ownership=new Map();

  // Existing manually maintained player records stay authoritative for rich metadata.
  for(const p of data.players){
    const key=normalizePlayerName(p.name);
    if(!key)continue;
    if(!ownership.has(key))ownership.set(key,[]);
    ownership.get(key).push(p);
  }

  for(const t of transfers){
    const name=String(t.player||'').trim();
    const key=normalizePlayerName(name);
    if(!key)continue;

    const records=ownership.get(key)||[];
    const live=findSelectablePlayerByName(name);

    if(t.type==='Verkauf'){
      const active=[...records].reverse().find(p=>!p.soldDate);
      if(active){
        active.soldDate=t.date||active.soldDate||localDateISO();
        active.salePrice=Number(t.price)||0;
        active.saleSource=t.source||'AI Screenshot Import';
        active.saleReason=active.saleReason||'Aus Transferhistorie synchronisiert';
        if(t.note&&!active.saleCounterparty){
          active.saleCounterparty=String(t.note).replace(/^Gegenpartei:\s*/,'').replace(/^Screenshot:\s*/,'');
        }
      }
      continue;
    }

    // If this exact purchase is already represented, keep it.
    const exact=records.find(p=>
      Number(p.buyPrice||0)===Number(t.price||0) &&
      (!t.date || !p.buyDate || p.buyDate===t.date)
    );
    if(exact){
      exact.team=exact.team||t.club||live?.team||'';
      exact.position=exact.position||live?.position||'';
      exact.buySource=exact.buySource||t.source||'AI Screenshot Import';
      continue;
    }

    // A later buy after a completed sale creates a new ownership period.
    const active=[...records].reverse().find(p=>!p.soldDate);
    if(active){
      // Do not duplicate an already active player simply because old seed prices differ.
      active.team=active.team||t.club||live?.team||'';
      active.position=active.position||live?.position||'';
      continue;
    }

    const created={
      id:`league-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      team:t.club||live?.team||'',
      position:live?.position||t.position||'',
      buyDate:t.date||localDateISO(),
      buyPrice:Number(t.price)||0,
      marketAtBuy:Number(live?.marketValue||0),
      marketValue:Number(live?.marketValue||0),
      avgPoints:Number(live?.avgPoints||0),
      note:t.note||'',
      buySource:t.source||'AI Screenshot Import'
    };
    if(t.note){
      created.buyCounterparty=String(t.note).replace(/^Gegenpartei:\s*/,'').replace(/^Screenshot:\s*/,'');
    }
    data.players.push(created);
    if(!ownership.has(key))ownership.set(key,[]);
    ownership.get(key).push(created);
  }
}
function syncTransferSingleSource(){
  if(!data?.leagueIntel)return;
  ensureMyLeagueTransferHistory();
  syncMyPlayersFromLeagueTransfers();
  resetOpponentRosterCache();
  resetOpponentAnalysisCache();
}
function managerCurrentRoster(managerId,md=data.settings.currentMd){
  if(managerId==='me'){
    syncTransferSingleSource();
    return activePlayers().map(p=>({
      id:p.id,name:p.name,team:p.team||'',position:p.position||'',
      buyPrice:Number(p.buyPrice)||0,boughtMd:+p.boughtMd||null
    })).sort((a,b)=>a.name.localeCompare(b.name,'de'));
  }
  return opponentRoster(managerId,md);
}

function managerLeagueData(managerId){
  const root=ensureLeagueIntel();
  if(!root.managerData[managerId]){
    root.managerData[managerId]={matchdays:{},transfers:[],notes:''};
  }
  const row=root.managerData[managerId];
  if(!row.matchdays)row.matchdays={};
  if(!Array.isArray(row.transfers))row.transfers=[];
  return row;
}
function managerMatchdayData(managerId,md=data.settings.currentMd){
  const row=managerLeagueData(managerId);
  if(!row.matchdays[md])row.matchdays[md]={points:null,formation:'',lineup:[],bank:[],note:''};
  const entry=row.matchdays[md];
  if(!Array.isArray(entry.lineup))entry.lineup=[];
  if(!Array.isArray(entry.bank))entry.bank=[];
  return entry;
}
function cleanNameList(value){
  return String(value||'').split(/\n|,/).map(x=>x.trim()).filter(Boolean);
}
function managerDataQuality(managerId){
  const row=managerLeagueData(managerId);
  const matchdays=Object.values(row.matchdays||{});
  const withPoints=matchdays.filter(x=>Number.isFinite(Number(x.points))).length;
  const withLineup=matchdays.filter(x=>Array.isArray(x.lineup)&&x.lineup.length).length;
  const withFormation=matchdays.filter(x=>x.formation).length;
  const transfers=(row.transfers||[]).length;
  const score=Math.min(100,Math.round(
    Math.min(40,withPoints*5)+
    Math.min(35,withLineup*4)+
    Math.min(10,withFormation*2)+
    Math.min(15,transfers*2)
  ));
  return{
    score,
    label:score>=75?'Hoch':score>=35?'Teilweise':'Wenig Daten',
    withPoints,withLineup,withFormation,transfers,
    matchdays:matchdays.length
  };
}
function opponentCompletion(md=data.settings.currentMd){
  const managers=MANAGER_OPTIONS;
  const rows=managers.map(manager=>{
    const entry=managerMatchdayData(manager.id,md);
    return{
      manager,
      points:Number.isFinite(Number(entry.points)),
      lineup:Array.isArray(entry.lineup)&&entry.lineup.length>0,
      transfers:managerLeagueData(manager.id).transfers.some(t=>+t.md===+md)
    };
  });
  const total=rows.length*3;
  const done=rows.reduce((sum,row)=>sum+(row.points?1:0)+(row.lineup?1:0)+(row.transfers?1:0),0);
  return{rows,done,total,pct:total?Math.round(done/total*100):0};
}

let opponentRosterCache=new Map();
function resetOpponentRosterCache(){opponentRosterCache.clear()}
function opponentRoster(managerId,md=data.settings.currentMd){
  const key=`${managerId}|${md}`;
  if(opponentRosterCache.has(key))return opponentRosterCache.get(key);

  const transfers=(managerLeagueData(managerId).transfers||[])
    .filter(t=>(+t.md||0)<=+md)
    .slice()
    .sort((a,b)=>(+a.md||0)-(+b.md||0)||String(a.date||'').localeCompare(String(b.date||'')));

  const playerIndex=selectablePlayerIndex().index;
  const rosterMap=new Map();

  for(const t of transfers){
    const playerKey=normalizePlayerName(t.player);
    if(!playerKey)continue;

    if(t.type==='Verkauf'){
      rosterMap.delete(playerKey);
      continue;
    }

    const live=playerIndex.get(playerKey)||null;
    const canonical=resolveCanonicalPlayer(t.player,{managerId,club:t.club});
    const resolvedName=canonical.matched?canonical.name:t.player;
    const resolvedLive=canonical.matched?canonical:live;
    const resolvedKey=normalizePlayerName(resolvedName);
    rosterMap.set(resolvedKey,{
      id:resolvedKey,
      name:resolvedName,
      team:t.club||resolvedLive?.team||live?.team||'',
      buyPrice:Number(t.price||0),
      boughtMd:+t.md||null,
      position:t.position||resolvedLive?.position||live?.position||''
    });
  }

  const roster=[...rosterMap.values()].sort((a,b)=>a.name.localeCompare(b.name,'de'));
  opponentRosterCache.set(key,roster);
  return roster;
}
function opponentRosterPlayer(managerId,name,md=data.settings.currentMd){
  const key=normalizePlayerName(name);
  const raw=opponentRoster(managerId,md).find(p=>normalizePlayerName(p.name)===key)||null;
  if(!raw)return null;
  if(raw.team&&raw.position)return raw;

  const live=findSelectablePlayerByName(name);
  return{
    ...raw,
    team:raw.team||live?.team||'',
    position:raw.position||live?.position||''
  };
}
function opponentLineupDataQuality(managerId,md=data.settings.currentMd){
  const entry=managerMatchdayData(managerId,md);
  const roster=opponentRoster(managerId,md);
  let score=0;
  if(entry.lineup?.length)score+=40;
  if(entry.formation)score+=20;
  if(Number.isFinite(Number(entry.points)))score+=20;
  if(roster.length>=11)score+=20;
  return Math.min(100,score);
}
let opponentAnalysisCache=new Map();
function resetOpponentAnalysisCache(){opponentAnalysisCache.clear()}
function opponentAnalysisCacheKey(managerId,name,md){
  return `${managerId}|${md}|${normalizePlayerName(name)}|${window.OFFICIAL_CLUB_NEWS?.length||0}|${window.PLAYER_AVAILABILITY?.length||0}`;
}

function opponentPlayerAnalysis(managerId,name,md=data.settings.currentMd){
  const cacheKey=opponentAnalysisCacheKey(managerId,name,md);
  if(opponentAnalysisCache.has(cacheKey))return opponentAnalysisCache.get(cacheKey);
  const rosterPlayer=opponentRosterPlayer(managerId,name,md);
  const live=findSelectablePlayerByName(name);
  const team=rosterPlayer?.team||live?.team||'';
  const position=rosterPlayer?.position||live?.position||'';

  if(!team){
    const result={
      name,team,position,score:null,confidence:20,
      reasons:[],risks:['Vereinszuordnung fehlt – keine faire Bewertung möglich'],
      comparable:false
    };
    opponentAnalysisCache.set(cacheKey,result);
    return result;
  }

  // Same model and same 0–100 scale as the user's own players.
  // Missing opponent performance data stays missing (0 contribution) and
  // lowers confidence instead of being replaced by a strong matchup.
  const ownEquivalent=(data.players||[]).find(p=>normalizePlayerName(p.name)===normalizePlayerName(name));
  const synthetic={
    id:live?.id||rosterPlayer?.id||normalizePlayerName(name),
    name:live?.name||name,
    team,
    position,
    avgPoints:Number(ownEquivalent?.avgPoints||0),
    liStatus:ownEquivalent?.liStatus||'Unbekannt',
    liUpdatedAt:ownEquivalent?.liUpdatedAt||null
  };

  const assessment=coachPlayerAssessment(synthetic,md,{ignoreCalibration:true});
  let confidence=assessment.confidence;
  const risks=[...assessment.risks];
  const reasons=[...assessment.positives];

  if(!synthetic.avgPoints){
    confidence=Math.min(confidence,55);
    if(!risks.includes('Ø-Punkte fehlen'))risks.push('Ø-Punkte fehlen');
  }
  if(effectiveLineupStatus(synthetic).status==='Unbekannt'){
    confidence=Math.min(confidence,50);
  }

  const result={
    name:synthetic.name,
    team,
    position,
    score:assessment.score,
    confidence,
    reasons,
    risks,
    factors:assessment.factors,
    comparable:true
  };
  opponentAnalysisCache.set(cacheKey,result);
  return result;
}
function opponentLineupAnalysis(managerId,md=data.settings.currentMd){
  const entry=managerMatchdayData(managerId,md);
  const players=(entry.lineup||[]).map(name=>opponentPlayerAnalysis(managerId,name,md));
  const scored=players.filter(p=>Number.isFinite(p.score));
  return{
    players,
    avgScore:scored.length?scored.reduce((s,p)=>s+p.score,0)/scored.length:0,
    avgConfidence:players.length?players.reduce((s,p)=>s+p.confidence,0)/players.length:0,
    completeness:opponentLineupDataQuality(managerId,md),
    formation:entry.formation||'Formation offen'
  };
}

function opponentManagerStats(managerId){
  const row=managerLeagueData(managerId);
  const matchdays=Object.entries(row.matchdays||{}).map(([md,x])=>({md:+md,...x}));
  const pointRows=matchdays.filter(x=>Number.isFinite(Number(x.points)));
  const avg=pointRows.length?pointRows.reduce((s,x)=>s+Number(x.points),0)/pointRows.length:0;
  const formations={};
  matchdays.filter(x=>x.formation).forEach(x=>formations[x.formation]=(formations[x.formation]||0)+1);
  const favorite=Object.entries(formations).sort((a,b)=>b[1]-a[1])[0];
  const transferCount=(row.transfers||[]).length;
  const buys=(row.transfers||[]).filter(t=>t.type==='Kauf').length;
  const sales=(row.transfers||[]).filter(t=>t.type==='Verkauf').length;
  const quality=managerDataQuality(managerId);
  return{
    avg,pointRows,matchdays,favorite:favorite?.[0]||'–',
    favoriteCount:favorite?.[1]||0,transferCount,buys,sales,quality
  };
}
function leagueIntelTimeline(){
  const events=[];
  (data.players||[]).forEach(p=>{
    if(p.buyDate)events.push({date:p.buyDate,type:'transfer',icon:'🟢',title:`Du kaufst ${p.name}`,text:`${p.team||''} · ${euro(p.buyPrice)}`});
    if(p.soldDate)events.push({date:p.soldDate,type:'transfer',icon:'🔴',title:`Du verkaufst ${p.name}`,text:`${euro(p.salePrice)}`});
  });
  MANAGER_OPTIONS.forEach(manager=>{
    const row=managerLeagueData(manager.id);
    (row.transfers||[]).forEach(t=>events.push({
      date:t.date||'',md:t.md||0,type:'opponent-transfer',
      icon:t.type==='Kauf'?'🟦':'🟥',
      title:`${manager.team}: ${t.type} ${t.player}`,
      text:[t.club,t.price?euro(t.price):'',t.note].filter(Boolean).join(' · ')
    }));
    Object.entries(row.matchdays||{}).forEach(([md,entry])=>{
      if(Number.isFinite(Number(entry.points)))events.push({
        date:entry.date||'',md:+md,type:'points',icon:'📊',
        title:`${manager.team}: ${entry.points} Punkte`,
        text:entry.formation?`Formation ${entry.formation}`:`Spieltag ${md}`
      });
      if(entry.lineup?.length)events.push({
        date:entry.date||'',md:+md,type:'lineup',icon:'⚽',
        title:`${manager.team}: Aufstellung erfasst`,
        text:`${entry.formation||'Formation offen'} · ${entry.lineup.length} Spieler`
      });
    });
  });
  (data.h2h||[]).forEach(row=>{
    const home=managerById(row.homeId),away=managerById(row.awayId);
    if(home&&away)events.push({
      date:'',md:+row.md,type:'h2h',icon:'🏆',
      title:`Spieltag ${row.md}: ${home.team} ${row.homePoints}:${row.awayPoints} ${away.team}`,
      text:'H2H-Ergebnis'
    });
  });
  return events.sort((a,b)=>{
    const dateA=a.date?new Date(a.date).getTime():0,dateB=b.date?new Date(b.date).getTime():0;
    return dateB-dateA||(+b.md||0)-(+a.md||0);
  });
}
function leagueReminder(md=data.settings.currentMd){
  const completion=opponentCompletion(md);
  const missing=completion.rows.filter(x=>!x.points||!x.lineup);
  const dismissed=ensureLeagueIntel().reminderDismissed[md];
  if(!missing.length||dismissed)return null;
  return{
    count:missing.length,
    text:`Für Spieltag ${md} fehlen bei ${missing.length} Gegner${missing.length===1?'':'n'} noch Punkte oder Aufstellung.`
  };
}
function confidenceLabel(count){
  return count>=8?'Hoch':count>=3?'Mittel':'Niedrig';
}

function competition(){
  ensureLeagueIntel();
  const currentMd=+data.settings.currentMd||1;
  const tab=data.ui?.leagueTab||'current';
  const selectedManager=data.ui?.leagueManager||MANAGER_OPTIONS[0]?.id;
  const schedule=H2H_SCHEDULE.filter(x=>x.md===currentMd);
  const myGame=schedule.find(x=>x.home==='me'||x.away==='me');
  const otherGames=schedule.filter(x=>x!==myGame);
  const resultFor=g=>(data.h2h||[]).find(x=>+x.md===+g.md&&((x.homeId===g.home&&x.awayId===g.away)||(x.homeId===g.away&&x.awayId===g.home)));
  const outcomeLabel=g=>{const r=resultFor(g);return r?`${r.homePoints} : ${r.awayPoints}`:'Ergebnis eintragen'};
  const completion=opponentCompletion(currentMd);
  const reminder=leagueReminder(currentMd);

  const currentContent=`
    ${reminder?`<div class="league-soft-reminder"><span>🔔 ${esc(reminder.text)}</span><button id="dismissLeagueReminder">Für diesen Spieltag ausblenden</button></div>`:''}
    <section class="league-completion-card">
      <div><span>DATENVOLLSTÄNDIGKEIT · SPIELTAG ${currentMd}</span><h3>${completion.pct} % erfasst</h3></div>
      <div class="league-completion-bar"><i style="width:${completion.pct}%"></i></div>
      <div class="league-completion-stats">
        <span><b>${completion.rows.filter(x=>x.points).length}/${completion.rows.length}</b> Gegnerpunkte</span>
        <span><b>${completion.rows.filter(x=>x.lineup).length}/${completion.rows.length}</b> Aufstellungen</span>
        <span><b>${completion.rows.filter(x=>x.transfers).length}/${completion.rows.length}</b> Transferdaten</span>
      </div>
    </section>
    <section class="league-now">
      <div class="league-round-top">
        <button class="round-arrow" data-change-md="-1" ${currentMd<=1?'disabled':''}>‹</button>
        <div><span>Aktueller Spieltag</span><strong>Spieltag ${currentMd}</strong></div>
        <button class="round-arrow" data-change-md="1" ${currentMd>=34?'disabled':''}>›</button>
      </div>
      <article class="league-main-duel">
        <div class="main-team ${myGame?.home==='me'?'my-side':''}">${crest(teamOnly(myGame?.home||''),'main-crest')}<span>${esc(teamOnly(myGame?.home||''))}</span></div>
        <div class="main-versus">
          <span>${myGame&&resultFor(myGame)?outcomeLabel(myGame):'VS'}</span>
          ${myGame?`<button class="text-action" data-h2h-edit="${currentMd}|${myGame.home}|${myGame.away}">${resultFor(myGame)?'Bearbeiten':'Ergebnis eintragen'}</button>`:''}
        </div>
        <div class="main-team ${myGame?.away==='me'?'my-side':''}">${crest(teamOnly(myGame?.away||''),'main-crest')}<span>${esc(teamOnly(myGame?.away||''))}</span></div>
      </article>
      <div class="league-other-title">Weitere Paarungen</div>
      <div class="league-other-list">${otherGames.map(g=>`
        <button class="league-other-row" data-h2h-edit="${currentMd}|${g.home}|${g.away}">
          <span class="other-team">${crest(teamOnly(g.home),'mini-crest')}<span>${esc(teamOnly(g.home))}</span></span>
          <b>${resultFor(g)?outcomeLabel(g):'VS'}</b>
          <span class="other-team right">${crest(teamOnly(g.away),'mini-crest')}<span>${esc(teamOnly(g.away))}</span></span>
        </button>`).join('')}</div>
    </section>`;

  const scheduleContent=`<div class="my-season-list">${Array.from({length:34},(_,i)=>i+1).map(md=>{
    const game=H2H_SCHEDULE.find(x=>x.md===md&&(x.home==='me'||x.away==='me'));
    const opp=game?(game.home==='me'?game.away:game.home):null;
    const res=game?resultFor(game):null;
    return `<button class="season-line ${md===currentMd?'active':''}" data-set-md="${md}">
      <span class="season-number">${md}</span><span class="season-opponent">${esc(teamOnly(opp))}</span>
      <span class="season-score">${res?`${res.homePoints} : ${res.awayPoints}`:'–'}</span>
    </button>`;
  }).join('')}</div>`;

  const standings=calculateLeagueTable();
  const tableContent=`<div class="minimal-table-wrap"><table class="minimal-league-table">
    <thead><tr><th>#</th><th>Team</th><th>Sp.</th><th>S</th><th>U</th><th>N</th><th>Diff.</th><th>Pkt.</th></tr></thead>
    <tbody>${standings.map((r,i)=>`<tr class="${r.isMe?'is-me':''}">
      <td>${i+1}</td><td><span class="league-table-team">${crest(r.team,'table-crest')}<b>${esc(r.team)}</b></span></td><td>${r.played}</td><td>${r.wins}</td><td>${r.draws}</td><td>${r.losses}</td>
      <td>${r.pointsFor-r.pointsAgainst>=0?'+':''}${r.pointsFor-r.pointsAgainst}</td><td><b>${r.tablePoints}</b></td>
    </tr>`).join('')}</tbody></table></div>`;

  const managerCards=MANAGER_OPTIONS.map(manager=>{
    const stats=opponentManagerStats(manager.id);
    return `<button class="manager-intel-card ${selectedManager===manager.id?'active':''}" data-select-league-manager="${manager.id}">
      ${crest(manager.team,'manager-intel-crest')}
      <span><b>${esc(manager.team)}</b><small>${esc(manager.manager)} · Datenqualität ${stats.quality.score}%</small></span>
      <i>${stats.quality.label}</i>
    </button>`;
  }).join('');

  const selected=managerById(selectedManager);
  const selectedStats=opponentManagerStats(selectedManager);
  const selectedMd=managerMatchdayData(selectedManager,currentMd);
  const managerContent=`<div class="league-intel-layout">
    <aside class="manager-intel-list">${managerCards}</aside>
    <section class="manager-profile-panel">
      <div class="manager-profile-head">${crest(selected?.team,'manager-profile-crest')}<div><span>MANAGERPROFIL</span><h3>${esc(selected?.team||'Manager')}</h3><p>${esc(selected?.manager||'')}</p></div><button class="btn" data-edit-manager-md="${selectedManager}|${currentMd}">Spieltag ${currentMd} erfassen</button></div>
      <div class="manager-stat-grid">
        <article><span>Ø Punkte</span><strong>${selectedStats.pointRows.length?selectedStats.avg.toFixed(0):'–'}</strong><small>${selectedStats.pointRows.length} Spieltage · Vertrauen ${confidenceLabel(selectedStats.pointRows.length)}</small></article>
        <article><span>Lieblingsformation</span><strong>${selectedStats.favorite}</strong><small>${selectedStats.favoriteCount} Einträge · Vertrauen ${confidenceLabel(selectedStats.favoriteCount)}</small></article>
        <article><span>Transfers</span><strong>${selectedStats.transferCount}</strong><small>${selectedStats.buys} Käufe · ${selectedStats.sales} Verkäufe</small></article>
        <article><span>Datenqualität</span><strong>${selectedStats.quality.score}%</strong><small>${selectedStats.quality.label}</small></article>
      </div>
      <div class="manager-current-md">
        <div><span>SPIELTAG ${currentMd}</span><h4>${selectedMd.points??'–'} Punkte · ${esc(selectedMd.formation||'Formation offen')}</h4><p>${selectedMd.lineup.length?selectedMd.lineup.join(', '):'Noch keine Aufstellung erfasst.'}</p></div>
        <div class="manager-current-actions">
          <button class="btn" data-edit-manager-md="${selectedManager}|${currentMd}">${selectedMd.lineup.length||selectedMd.points!==null?'Bearbeiten':'Erfassen'}</button>
          <button class="btn secondary" data-add-opponent-transfer="${selectedManager}">Transfer erfassen</button>
        </div>
      </div>
      <div class="manager-history-grid">
        <section class="manager-history-panel">
          <div class="manager-history-head"><div><span>AUFSTELLUNGEN</span><h4>Spieltagsverlauf</h4></div></div>
          <div class="manager-lineup-history">${
            Object.entries(managerLeagueData(selectedManager).matchdays||{})
              .map(([md,row])=>({md:+md,...row}))
              .filter(row=>row.lineup?.length||row.points!==null||row.formation)
              .sort((a,b)=>b.md-a.md)
              .map(row=>`<article class="manager-lineup-history-row">
                <div class="manager-lineup-main">
                  <span class="manager-history-md">ST ${row.md}</span>
                  <button class="manager-lineup-open" data-view-opponent-lineup="${selectedManager}|${row.md}">
                    <b>${esc(row.formation||'Formation offen')} · ${row.points??'–'} Punkte</b><small>${row.lineup?.length?esc(row.lineup.join(', ')):'Keine Startelf erfasst'}</small>
                  </button>
                  <button class="manager-lineup-edit" data-edit-manager-md="${selectedManager}|${row.md}">Bearbeiten</button>
                </div>
                <button class="manager-history-delete" data-delete-opponent-md="${selectedManager}|${row.md}" title="Spieltagsdaten löschen">×</button>
              </article>`).join('') || '<div class="empty-soft">Noch keine Aufstellungen oder Spieltagspunkte eingetragen.</div>'
          }</div>
        </section>
        <section class="manager-history-panel">
          <div class="manager-history-head"><div><span>TRANSFERS</span><h4>Transferverlauf</h4></div><button class="btn secondary compact" data-add-opponent-transfer="${selectedManager}">＋ Neu</button></div>
          <div class="manager-transfer-list">${
            managerLeagueData(selectedManager).transfers.length
              ? managerLeagueData(selectedManager).transfers.slice()
                .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||(+b.md||0)-(+a.md||0))
                .map(t=>`<article>
                  <span>${t.type==='Kauf'?'🟢':'🔴'}</span>
                  <button class="manager-transfer-main" data-edit-opponent-transfer="${selectedManager}|${t.id}">
                    <b>${esc(t.player)}</b><small>${t.type} · ST ${t.md||'–'} · ${esc(t.club||resolvePlayerClubSmart(t.player).club||'Verein unbekannt')} · ${t.price?euro(t.price):'Preis offen'}${t.date?` · ${new Date(t.date).toLocaleDateString('de-DE')}`:''}</small>
                  </button>
                  <button data-delete-opponent-transfer="${selectedManager}|${t.id}" title="Transfer löschen">×</button>
                </article>`).join('')
              : '<div class="empty-soft">Noch keine Gegnertransfers eingetragen.</div>'
          }</div>
        </section>
      </div>
    </section>
  </div>`;

  const timeline=leagueIntelTimeline();
  const timelineContent=`<section class="league-timeline">
    <div class="section-head"><div><h2>Liga-Timeline</h2><p>Eigene und freiwillig erfasste Gegnerereignisse.</p></div></div>
    ${timeline.length?timeline.slice(0,80).map(event=>`<article class="timeline-event">
      <span class="timeline-icon">${event.icon}</span><div><b>${esc(event.title)}</b><small>${event.date?new Date(event.date).toLocaleDateString('de-DE'):event.md?`Spieltag ${event.md}`:'Ohne Datum'}${event.text?` · ${esc(event.text)}`:''}</small></div>
    </article>`).join(''):'<div class="empty-soft">Die Timeline wächst automatisch mit deinen Einträgen.</div>'}
  </section>`;

  const content=tab==='schedule'?scheduleContent:tab==='teams'?tableContent:tab==='managers'?managerContent:tab==='timeline'?timelineContent:currentContent;
  return `<div class="league-redesign">
    <section class="card screenshot-import-card">
      <div class="screenshot-import-copy"><span class="eyebrow">SCREENSHOT ENGINE 2.1.9</span><h3>Screenshot Import · 2.1.9</h3><p>Screenshot → kanonischer Spielerabgleich → Transferhistorie → aktueller Kader → Aufstellungsseite. Kurz-/Nachnamen werden mit bereits bekannten vollständigen Spielern zusammengeführt; Vereine und historische Daten werden bereinigt.</p></div>
      <div class="screenshot-import-actions"><label class="btn secondary">Screenshots auswählen<input id="screenshotImportFiles" type="file" accept="image/*" multiple hidden></label><button type="button" class="btn" id="analyzeScreenshotFiles">Mit AI analysieren</button></div>
      <div id="screenshotImportStatus" class="screenshot-import-status">Noch keine Screenshots ausgewählt.</div><div class="ai-import-receipt">${data.ui?.lastAiImport?`Letzter Import: ${esc(managerById(data.ui.lastAiImport.managerId)?.team||data.ui.lastAiImport.managerId)} · ${data.ui.lastAiImport.added} neu · ${data.ui.lastAiImport.updated} geändert · ${data.ui.lastAiImport.beforeCount} → ${data.ui.lastAiImport.afterCount} Transfers · ${data.ui.lastAiImport.rosterAfter??'–'} im aktuellen Kader`:''}</div>
      <div id="aiUsageBox" class="ai-usage-box"></div><div id="screenshotImportResult" class="screenshot-import-result"></div>
    </section>
    <header class="league-page-header">
      <div><span>6MINI · DIKS</span><h2>League Intelligence</h2></div>
      <div class="league-current-pill">ST ${currentMd}</div>
    </header>
    <nav class="league-nav league-nav-wide">
      <button data-league-tab="current" class="${tab==='current'?'active':''}">Spieltag</button>
      <button data-league-tab="schedule" class="${tab==='schedule'?'active':''}">Mein Spielplan</button>
      <button data-league-tab="teams" class="${tab==='teams'?'active':''}">Tabelle</button>
      <button data-league-tab="managers" class="${tab==='managers'?'active':''}">Manager</button>
      <button data-league-tab="timeline" class="${tab==='timeline'?'active':''}">Timeline</button>
    </nav>
    <div class="league-content">${content}</div>
  </div><div id="competitionModal"></div>`;
}

function editOpponentMatchday(managerId,md){
  const manager=managerById(managerId);
  const row=managerMatchdayData(managerId,md);
  const roster=opponentRoster(managerId,md);
  const selected=new Set(row.lineup||[]);
  const bankSelected=new Set(row.bank||[]);

  $('#competitionModal').innerHTML=`<div class="modal-backdrop"><div class="card modal-card league-entry-modal opponent-lineup-entry">
    <div class="section-head"><div><h2>${esc(manager?.team||'Manager')} · ST ${md}</h2><p>Aufstellung aus dem erfassten Kader dieses Managers auswählen.</p></div><button type="button" class="btn secondary" id="closeOpponentMd">Schließen</button></div>

    <div class="opponent-roster-summary">
      <span><b>${roster.length}</b> Spieler · automatisch aus Transfers</span>
      <span><b>${selected.size}</b> Startelf</span>
      <span><b>${bankSelected.size}</b> Bank</span>
    </div>

    <div class="form-grid" style="margin-top:14px">
      <label>Punkte<input id="oppMdPoints" type="number" min="0" value="${row.points??''}" placeholder="optional"></label>
      <label>Formation<select id="oppMdFormation"><option value="">Nicht bekannt</option>${OPPONENT_FORMATIONS.map(f=>`<option ${row.formation===f?'selected':''}>${f}</option>`).join('')}</select></label>
      <label class="wide">Notiz<textarea id="oppMdNote" rows="3">${esc(row.note||'')}</textarea></label>
    </div>

    <div class="opponent-roster-picker">
      <div class="opponent-roster-picker-head"><div><span>KADERAUSWAHL</span><h3>Spieler auswählen</h3></div><small>Startelf und Bank sind optional. Der Kader entsteht aus erfassten Käufen abzüglich Verkäufen.</small></div>
      ${roster.length?`<div class="opponent-roster-grid">${roster.map(player=>{
        const state=selected.has(player.name)?'lineup':bankSelected.has(player.name)?'bank':'none';
        return `<article class="opponent-roster-player">
          <div><b>${esc(player.name)}</b><small>${esc(player.team||'Verein unbekannt')}${player.position?` · ${esc(player.position)}`:''}</small></div>
          <select data-opponent-player-state="${esc(player.name)}">
            <option value="none" ${state==='none'?'selected':''}>Nicht erfasst</option>
            <option value="lineup" ${state==='lineup'?'selected':''}>Startelf</option>
            <option value="bank" ${state==='bank'?'selected':''}>Bank</option>
          </select>
        </article>`;
      }).join('')}</div>`:`<div class="empty-soft">Noch kein Gegnerkader vorhanden. Erfasse zunächst Käufe für diesen Manager.</div>`}
    </div>

    <div class="full toolbar opponent-lineup-actions">
      <button type="button" class="btn" id="saveOpponentMd">Speichern</button>
      <button type="button" class="btn secondary" id="viewOpponentLineupAnalysis">Aufstellung ansehen & analysieren</button>
      <button type="button" class="btn danger-outline" id="clearOpponentMd">Daten für ST ${md} leeren</button>
    </div>
  </div></div>`;

  $('#closeOpponentMd').onclick=()=>$('#competitionModal').innerHTML='';
  $('#saveOpponentMd').onclick=()=>{
    const lineup=[],bank=[];
    $$('[data-opponent-player-state]').forEach(select=>{
      const name=select.dataset.opponentPlayerState;
      if(select.value==='lineup')lineup.push(name);
      if(select.value==='bank')bank.push(name);
    });
    if(lineup.length>11)return toast('Maximal 11 Spieler in der Startelf');
    Object.assign(row,{
      points:$('#oppMdPoints').value===''?null:Number($('#oppMdPoints').value),
      formation:$('#oppMdFormation').value,
      lineup,bank,note:$('#oppMdNote').value.trim(),date:localDateISO()
    });
    $('#competitionModal').innerHTML='';touch();toast('Gegneraufstellung gespeichert');
  };
  $('#viewOpponentLineupAnalysis').onclick=()=>{
    const lineup=[],bank=[];
    $$('[data-opponent-player-state]').forEach(select=>{
      const name=select.dataset.opponentPlayerState;
      if(select.value==='lineup')lineup.push(name);
      if(select.value==='bank')bank.push(name);
    });
    Object.assign(row,{
      points:$('#oppMdPoints').value===''?null:Number($('#oppMdPoints').value),
      formation:$('#oppMdFormation').value,
      lineup,bank,note:$('#oppMdNote').value.trim()
    });
    save();
    showOpponentLineupAnalysis(managerId,md);
  };
  $('#clearOpponentMd').onclick=()=>{
    managerLeagueData(managerId).matchdays[md]={points:null,formation:'',lineup:[],bank:[],note:''};
    $('#competitionModal').innerHTML='';touch();toast('Spieltagsdaten geleert');
  };
}

function showOpponentLineupAnalysis(managerId,md){
  const manager=managerById(managerId);
  const entry=managerMatchdayData(managerId,md);
  const analysis=opponentLineupAnalysis(managerId,md);
  const roster=opponentRoster(managerId,md);

  $('#competitionModal').innerHTML=`<div class="modal-backdrop"><div class="card modal-card opponent-analysis-modal">
    <div class="section-head">
      <div><h2>${esc(manager?.team||'Manager')} · Aufstellungsanalyse ST ${md}</h2><p>Nur auf Basis deiner erfassten Gegnerdaten und unserer vorhandenen Bundesliga-Daten.</p></div>
      <button type="button" class="btn secondary" id="closeOpponentAnalysis">Schließen</button>
    </div>

    <div class="opponent-analysis-summary">
      <article><span>Formation</span><strong>${esc(analysis.formation)}</strong></article>
      <article><span>Startelf</span><strong>${entry.lineup.length}/11</strong></article>
      <article><span>Analyse-Score</span><strong>${analysis.players.length?analysis.avgScore.toFixed(0):'–'}</strong></article>
      <article><span>Confidence</span><strong>${analysis.players.length?analysis.avgConfidence.toFixed(0)+' %':'–'}</strong></article>
      <article><span>Datenqualität</span><strong>${analysis.completeness} %</strong></article>
    </div>

    <div class="opponent-analysis-layout">
      <section class="opponent-analysis-pitch">
        <div class="opponent-analysis-pitch-head"><span>STARTELF</span><b>${esc(analysis.formation)}</b></div>
        <div class="opponent-analysis-player-grid">
          ${analysis.players.length?analysis.players.map(player=>`
            <article class="opponent-analysis-player">
              <div class="opponent-analysis-player-top">
                ${player.team?bundesligaCrest(player.team,'table-club-crest'):''}
                <div><b>${esc(player.name)}</b><small>${esc(player.position||'Position unbekannt')} · ${esc(player.team||'Verein unbekannt')}</small></div>
                <strong>${player.score===null?'–':player.score}</strong>
              </div>
              <div class="confidence-line"><span>Confidence ${player.confidence}%</span><div><i style="width:${player.confidence}%"></i></div></div>
              <div class="opponent-analysis-reasons">${player.reasons.map(r=>`<span class="positive">+ ${esc(r)}</span>`).join('')}${player.risks.map(r=>`<span class="negative">− ${esc(r)}</span>`).join('')}</div>
            </article>`).join(''):'<div class="empty-soft">Noch keine Startelf gespeichert.</div>'}
        </div>
      </section>

      <aside class="opponent-analysis-side">
        <section><span>BANK</span>${entry.bank.length?entry.bank.map(name=>`<div class="opponent-bank-row"><b>${esc(name)}</b><small>${esc(opponentRosterPlayer(managerId,name,md)?.team||'')}</small></div>`).join(''):'<div class="empty-soft">Keine Bank erfasst.</div>'}</section>
        <section><span>KADER</span><strong>${roster.length} Spieler</strong><small>aus erfassten Käufen und Verkäufen</small></section>
        <section><span>ANALYSEGRENZE</span><small>Ohne automatische Kickbase-Daten kennt die App keine echten Gegner-Ø-Punkte oder Marktwerte. Die Gegneranalyse nutzt deshalb Verein, Matchup, Heim/Auswärts, Teamstärke und vorhandene offizielle Meldungen.</small></section>
      </aside>
    </div>

    <div class="toolbar" style="margin-top:12px"><button type="button" class="btn" id="editOpponentAnalysisLineup">Aufstellung bearbeiten</button></div>
  </div></div>`;

  $('#closeOpponentAnalysis').onclick=()=>$('#competitionModal').innerHTML='';
  $('#editOpponentAnalysisLineup').onclick=()=>editOpponentMatchday(managerId,md);
}

function editOpponentTransfer(managerId,transferId){
  const row=managerLeagueData(managerId);
  const transfer=row.transfers.find(t=>t.id===transferId);
  if(!transfer)return toast('Transfer nicht gefunden');
  const manager=managerById(managerId);
  $('#competitionModal').innerHTML=`<div class="modal-backdrop"><div class="card modal-card league-entry-modal">
    <div class="section-head"><div><h2>Transfer bearbeiten · ${esc(manager?.team||'Manager')}</h2><p>Bestehenden Eintrag ändern oder korrigieren.</p></div><button type="button" class="btn secondary" id="closeEditOpponentTransfer">Schließen</button></div>
    <div class="form-grid" style="margin-top:14px">
      <label>Typ<select id="editOppTransferType"><option ${transfer.type==='Kauf'?'selected':''}>Kauf</option><option ${transfer.type==='Verkauf'?'selected':''}>Verkauf</option></select></label>
      <label>Spieltag<input id="editOppTransferMd" type="number" min="1" max="34" value="${transfer.md||data.settings.currentMd}"></label>
      <label class="wide">Spieler<input id="editOppTransferPlayer" list="playerAutocompleteOpponentEdit" autocomplete="off" value="${esc(transfer.player||'')}" placeholder="Vor- und Nachname"><datalist id="playerAutocompleteOpponentEdit">${playerAutocompleteOptions()}</datalist></label>
      <label>Bundesligaverein<select id="editOppTransferClub">${clubSelectOptions(transfer.club||'',true)}</select></label>
      <label>Preis (€)<input id="editOppTransferPrice" class="money-field" inputmode="numeric" value="${transfer.price?String(transfer.price):''}" placeholder="optional"></label>
      <label>Datum<input id="editOppTransferDate" type="date" value="${esc(transfer.date||localDateISO())}"></label>
      <label class="wide">Notiz<input id="editOppTransferNote" value="${esc(transfer.note||'')}" placeholder="optional"></label>
      <div class="full toolbar"><button type="button" class="btn" id="saveEditedOpponentTransfer">Änderungen speichern</button><button type="button" class="btn danger-outline" id="deleteEditedOpponentTransfer">Transfer löschen</button></div>
    </div>
  </div></div>`;
  bindMoneyFields();
  bindPlayerAutocomplete({inputId:'editOppTransferPlayer',clubId:'editOppTransferClub'});
  $('#closeEditOpponentTransfer').onclick=()=>$('#competitionModal').innerHTML='';
  $('#saveEditedOpponentTransfer').onclick=()=>{
    const player=$('#editOppTransferPlayer').value.trim();
    if(!player)return toast('Bitte einen Spielernamen eintragen');
    Object.assign(transfer,{type:$('#editOppTransferType').value,md:+$('#editOppTransferMd').value||data.settings.currentMd,player,club:$('#editOppTransferClub').value,price:parseMoney($('#editOppTransferPrice').value),date:$('#editOppTransferDate').value,note:$('#editOppTransferNote').value.trim()});
    $('#competitionModal').innerHTML='';touch();toast('Gegnertransfer aktualisiert');
  };
  $('#deleteEditedOpponentTransfer').onclick=()=>{row.transfers=row.transfers.filter(t=>t.id!==transferId);$('#competitionModal').innerHTML='';touch();toast('Gegnertransfer gelöscht')};
}

function addOpponentTransfer(managerId,prefill=null){
  const manager=managerById(managerId);
  const stored=readOpponentTransferDraft(managerId);
  const draft=prefill?{...stored,...prefill}:stored;
  if(prefill)sessionStorage.setItem(opponentTransferDraftKey(managerId),JSON.stringify(draft));
  $('#competitionModal').innerHTML=`<div class="modal-backdrop"><div class="card modal-card league-entry-modal">
    <div class="section-head"><div><h2>Transfer · ${esc(manager?.team||'Manager')}</h2><p>${prefill?.player?'Aus dem Scout Center vorbereitet. Preis und Datum können ergänzt werden.':'Optionaler Eintrag für Ligaübersicht und Statistiken.'}</p></div><button type="button" class="btn secondary" id="closeOpponentTransfer">Schließen</button></div>
    <div class="form-grid" style="margin-top:14px">
      <label>Typ<select id="oppTransferType"><option ${draft.type==="Kauf"?"selected":""}>Kauf</option><option ${draft.type==="Verkauf"?"selected":""}>Verkauf</option></select></label>
      <label>Spieltag<input id="oppTransferMd" type="number" min="1" max="34" value="${esc(String(draft.md||data.settings.currentMd))}"></label>
      <label class="wide">Spieler<input id="oppTransferPlayer" list="playerAutocompleteOpponent" autocomplete="off" value="${esc(draft.player||'')}" placeholder="Vor- und Nachname"><datalist id="playerAutocompleteOpponent">${playerAutocompleteOptions()}</datalist></label>
      <label>Bundesligaverein<select id="oppTransferClub">${clubSelectOptions(draft.club||'',true)}</select></label>
      <label>Preis (€)<input id="oppTransferPrice" class="money-field" inputmode="numeric" value="${esc(draft.price||'')}" placeholder="optional"></label>
      <label>Datum<input id="oppTransferDate" type="date" value="${esc(draft.date||localDateISO())}"></label>
      <label class="wide">Notiz<input id="oppTransferNote" value="${esc(draft.note||'')}" placeholder="optional"></label>
      <div class="full"><button type="button" class="btn" id="saveOpponentTransfer">Transfer speichern</button></div>
    </div>
  </div></div>`;
  bindMoneyFields();
  bindPlayerAutocomplete({inputId:'oppTransferPlayer',clubId:'oppTransferClub'});
  $$('#competitionModal input,#competitionModal select,#competitionModal textarea').forEach(field=>{
    field.addEventListener('input',()=>saveOpponentTransferDraft(managerId));
    field.addEventListener('change',()=>saveOpponentTransferDraft(managerId));
  });
  $('#closeOpponentTransfer').onclick=()=>{
    saveOpponentTransferDraft(managerId);
    $('#competitionModal').innerHTML='';
  };
  $('#saveOpponentTransfer').onclick=()=>{
    const player=$('#oppTransferPlayer').value.trim();
    if(!player)return toast('Bitte einen Spielernamen eintragen');
    managerLeagueData(managerId).transfers.push({
      id:id(),type:$('#oppTransferType').value,md:+$('#oppTransferMd').value||data.settings.currentMd,
      player,club:$('#oppTransferClub').value.trim(),price:parseMoney($('#oppTransferPrice').value),
      date:$('#oppTransferDate').value,note:$('#oppTransferNote').value.trim()
    });
    clearOpponentTransferDraft(managerId);
    $('#competitionModal').innerHTML='';touch();toast('Gegnertransfer gespeichert');
  };
}
function editH2H(md,homeId,awayId){
  let row=(data.h2h||[]).find(x=>+x.md===+md&&((x.homeId===homeId&&x.awayId===awayId)||(x.homeId===awayId&&x.awayId===homeId)));
  const home=managerById(homeId),away=managerById(awayId);
  $('#competitionModal').innerHTML=`<div class="modal-backdrop"><div class="card modal-card"><div class="section-head"><div><h2>H2H-Ergebnis · ST ${md}</h2><p>${esc(home.team)} gegen ${esc(away.team)}</p></div><button class="btn secondary" id="closeH2H">Schließen</button></div><div class="form-grid" style="margin-top:14px"><label>${esc(home.team)} – Punkte<input id="h2hHomePoints" type="number" min="0" value="${row?.homePoints??''}"></label><label>${esc(away.team)} – Punkte<input id="h2hAwayPoints" type="number" min="0" value="${row?.awayPoints??''}"></label><div class="full toolbar"><button class="btn" id="saveH2H">Speichern</button>${row?'<button class="btn danger-outline" id="deleteH2H">Löschen</button>':''}</div></div></div></div>`;
  $('#closeH2H').onclick=()=>{$('#competitionModal').innerHTML=''};
  $('#saveH2H').onclick=()=>{
    const homePoints=+$('#h2hHomePoints').value,awayPoints=+$('#h2hAwayPoints').value;
    if(!Number.isFinite(homePoints)||!Number.isFinite(awayPoints))return toast('Beide Punktzahlen eintragen');
    if(!row){row={id:id(),md:+md,homeId,awayId};data.h2h.push(row)}
    Object.assign(row,{homePoints,awayPoints});
    $('#competitionModal').innerHTML='';touch();toast('H2H-Ergebnis gespeichert');
  };
  if($('#deleteH2H'))$('#deleteH2H').onclick=()=>{data.h2h=data.h2h.filter(x=>x.id!==row.id);$('#competitionModal').innerHTML='';touch();toast('H2H-Ergebnis gelöscht')};
}

function rules(){
  const selected=data.ui?.rulesSection||'overview';
  const md=+data.settings.currentMd||1;
  const mandatory=mandatoryStatus(md);
  const assistant=leagueAssistant();
  const groups=['overview','Spieltag','Transfers','Jury'];
  const overview=`<div class="rules-overview">
    <div class="grid kpis">
      <div class="card kpi"><span>Spieltag</span><strong>${md}</strong><small>Frist: ${esc(deadlineText(md))}</small></div>
      <div class="card kpi"><span>Pflichtverkauf</span><strong>${mandatory.state==='done'?'✅':mandatory.state==='open'?'🚨':'⏳'}</strong><small>${esc(mandatory.text)}</small></div>
      <div class="card kpi"><span>Tagesbonus</span><strong>${dailyBonusBooked()?'✅':'○'}</strong><small>${localDateISO()}</small></div>
      <div class="card kpi"><span>Regeln</span><strong>${LEAGUE_RULES.length}</strong><small>Interaktiv zusammengefasst</small></div>
    </div>
    <div class="card" style="margin-top:15px"><h2>Aktueller Regelstatus</h2><div class="assistant-list" style="margin-top:12px">${assistant.map(n=>`<article class="assistant-note ${n.level}"><div class="assistant-icon">${n.icon}</div><div><b>${esc(n.title)}</b><p>${esc(n.text)}</p></div></article>`).join('')}</div></div>
    <div class="notice" style="margin-top:15px">Kickbase erzwingt bereits maximal 14 Spieler und höchstens zwei Spieler je Bundesligaverein. Diese beiden Regeln werden hier bewusst nicht doppelt geprüft.</div>
  </div>`;

  const list=LEAGUE_RULES.filter(r=>selected==='overview'||r.group===selected);
  const ruleCards=selected==='overview'?overview:`<div class="rule-card-list">${list.map(r=>`
    <article class="rule-card">
      <div class="rule-card-head"><span>${r.group}</span><h3>${esc(r.title)}</h3></div>
      <p class="rule-summary">${esc(r.summary)}</p>
      <details><summary>Details anzeigen</summary><p>${esc(r.detail)}</p></details>
      ${r.id==='mvp'||r.id==='top3'?`<div class="rule-live-status ${mandatory.state}">
        <b>Dein Status · Spieltag ${md}</b><span>${esc(mandatory.text)}</span><small>Frist: ${esc(deadlineText(md))}</small>
      </div>`:''}
    </article>`).join('')}</div>`;

  return `<div class="rules-page">
    <div class="rules-hero"><div><span>6MINI · DIKS</span><h2>Offizielles Ligaregelwerk</h2><p>Saison 2026/27 · kompakt, interaktiv und mit deinem Status verknüpft.</p></div><div class="rules-seal">⚖️</div></div>
    <div class="rules-tabs">${groups.map(g=>`<button data-rules-section="${g}" class="${selected===g?'active':''}">${g==='overview'?'Übersicht':g}</button>`).join('')}</div>
    ${ruleCards}
  </div>`;
}

function settings(){return `<div class="grid two">
  <div class="card"><h2>Grundlagen</h2><div class="form-grid" style="margin-top:14px">
    <label>Startkapital (€)<input id="setCapital" class="money-field" inputmode="numeric" value="${moneyInput(data.settings.startCapital)}"></label>
    <label>Startelf-Größe<input id="setLineup" type="number" min="1" max="14" value="${data.settings.lineupSize}"></label>
    <label>Heimbonus<input id="setHome" type="number" step="0.5" value="${data.settings.homeBonus}"></label>
    <div><button class="btn" id="saveSettings">Speichern</button></div>
  </div><div class="notice" style="margin-top:15px">Der Marktwert beim Kauf ist optional. Er ist für den echten Transfergewinn nicht nötig, aber hilfreich zur Bewertung deines Einkaufspreises.</div></div>
  <div class="card strength-card">
    <div class="section-head"><div><h2>Bundesliga-Teamstärken</h2><p>${esc(strengthFreshness())}</p></div><button class="btn secondary small" id="resetStrengths">Basiswerte laden</button></div>
    <div class="strength-method">${esc(TEAM_STRENGTH_META.method)}</div>
    <div class="strength-list">${[...TEAMS].sort((a,b)=>strength(b)-strength(a)).map(t=>`
      <div class="strength-row strength-row-rich">
        <span>${esc(t)}<small>${(()=>{const d=strengthDetail(t);return d?`${Number(d.matchesPlayed||0)} Spiele · Form ${Number(d.form||strength(t)).toFixed(1)} · Off. ${Number(d.attack||strength(t)).toFixed(1)} · Def. ${Number(d.defence||strength(t)).toFixed(1)}`:'Vorsaisonbasis'})()}</small></span>
        <div class="strength-track"><i style="width:${strength(t)*10}%"></i></div>
        <input type="number" min="1" max="10" step="0.1" data-strength="${esc(t)}" value="${Number(strength(t)||5).toFixed(1)}">
      </div>`).join('')}</div>
    <div class="notice" style="margin-top:13px">OpenLigaDB aktualisiert die Werte automatisch über GitHub Actions. Ohne abgeschlossene Saisonspiele bleiben die Vorsaison-Basiswerte aktiv. Manuelle Änderungen können beim nächsten Cloud-Update überschrieben werden.</div>
  </div>
</div>`}
function transferFinanceEntry(p,type){
  const wantedType=type==='buy'?'Spielerkauf':'Spielerverkauf';
  const storedId=type==='buy'?p.buyFinanceId:p.saleFinanceId;
  let entry=storedId?data.finances.find(x=>x.id===storedId):null;
  if(!entry){
    const amount=type==='buy'?-(+p.buyPrice||0):(+p.salePrice||0);
    const date=type==='buy'?p.buyDate:p.soldDate;
    entry=data.finances.find(x=>x.type===wantedType&&x.date===date&&Math.abs((+x.amount||0)-amount)<1&&String(x.description||'').includes(p.name));
    if(entry){
      if(type==='buy')p.buyFinanceId=entry.id; else p.saleFinanceId=entry.id;
    }
  }
  return entry;
}
function syncTransferFinance(p){
  let buy=transferFinanceEntry(p,'buy');
  const buyDescription=`Kauf ${p.name} von ${p.buySource||'Transfermarkt'}${p.buyCounterparty?' ('+p.buyCounterparty+')':''}`;
  if(!buy){
    buy={id:id(),date:p.buyDate,type:'Spielerkauf',description:buyDescription,amount:-(+p.buyPrice||0)};
    data.finances.push(buy);p.buyFinanceId=buy.id;
  }else Object.assign(buy,{date:p.buyDate,type:'Spielerkauf',description:buyDescription,amount:-(+p.buyPrice||0)});
  let sale=transferFinanceEntry(p,'sale');
  if(p.soldDate){
    const saleDescription=`Verkauf ${p.name} an ${p.saleSource||'Transfermarkt'}${p.saleCounterparty?' ('+p.saleCounterparty+')':''}`;
    if(!sale){
      sale={id:id(),date:p.soldDate,type:'Spielerverkauf',description:saleDescription,amount:+p.salePrice||0};
      data.finances.push(sale);p.saleFinanceId=sale.id;
    }else Object.assign(sale,{date:p.soldDate,type:'Spielerverkauf',description:saleDescription,amount:+p.salePrice||0});
  }else if(sale){
    data.finances=data.finances.filter(x=>x.id!==sale.id);
    delete p.saleFinanceId;
  }
}

function manageTransfer(pid){
  const p=data.players.find(x=>x.id===pid);if(!p)return;
  const gain=p.soldDate?(+p.salePrice||0)-(+p.buyPrice||0):(+p.marketValue||0)-(+p.buyPrice||0);
  $('#modalArea').innerHTML=`<div class="modal-backdrop"><div class="card modal-card manage-transfer-modal">
    <div class="section-head">
      <div><h2>${esc(p.name)}</h2><p>${bundesligaIdentity(p.team,{logoClass:'modal-club-crest'})}<span> · ${esc(p.position||'')}</span></p></div>
      <button class="btn secondary" id="closeManageTransfer">Schließen</button>
    </div>
    <div class="manage-transfer-summary">
      <div><span>Kaufpreis</span><b>${euro(p.buyPrice)}</b></div>
      <div><span>${p.soldDate?'Verkaufspreis':'Marktwert'}</span><b>${euro(p.soldDate?p.salePrice:p.marketValue)}</b></div>
      <div><span>${p.soldDate?'Gewinn/Verlust':'Unrealisiert'}</span><b class="${gain>=0?'money-pos':'money-neg'}">${euro(gain)}</b></div>
    </div>
    <div class="manage-transfer-actions">
      <button class="manage-action" id="manageEdit"><span>✏️</span><div><b>Bearbeiten</b><small>Kauf- und Verkaufsdaten korrigieren</small></div></button>
      ${p.soldDate
        ? `<button class="manage-action" id="manageUndo"><span>↩️</span><div><b>Verkauf rückgängig</b><small>Spieler wieder in den Kader aufnehmen</small></div></button>`
        : `<button class="manage-action danger-action" id="manageSell"><span>🔴</span><div><b>Spieler verkaufen</b><small>Verkaufsdaten erfassen</small></div></button>`}
      <button class="manage-action delete-action" id="manageDelete"><span>🗑️</span><div><b>Kompletten Transfer löschen</b><small>Entfernt auch verknüpfte Finanzbuchungen</small></div></button>
    </div>
  </div></div>`;
  $('#closeManageTransfer').onclick=()=>{$('#modalArea').innerHTML=''};
  $('#manageEdit').onclick=()=>editTransfer(pid);
  if($('#manageSell'))$('#manageSell').onclick=()=>sellPlayer(pid);
  if($('#manageUndo'))$('#manageUndo').onclick=()=>{
    if(!confirm(`Den Verkauf von ${p.name} rückgängig machen?`))return;
    p.soldDate='';p.salePrice=0;p.saleReason='';p.saleSource='';p.saleCounterparty='';
    syncTransferFinance(p);$('#modalArea').innerHTML='';touch();toast('Verkauf rückgängig gemacht');
  };
  $('#manageDelete').onclick=()=>deleteTransfer(pid);
}

function editTransfer(pid){
  const p=data.players.find(x=>x.id===pid);if(!p)return;
  $('#modalArea').innerHTML=`<div class="modal-backdrop"><div class="card modal-card transfer-edit-modal"><div class="section-head"><div><h2>Transfer bearbeiten</h2><p>Kauf und – falls vorhanden – Verkauf von ${esc(p.name)}.</p></div><button class="btn secondary" id="closeTransferEdit">Schließen</button></div><div class="form-grid" style="margin-top:14px">
  <label>Name<input id="teName" value="${esc(p.name||'')}"></label>
  <label>Verein<select id="teTeam">${TEAMS.map(t=>`<option ${p.team===t?'selected':''}>${esc(t)}</option>`).join('')}</select></label>
  <label>Position<select id="tePos">${['Tor','Abwehr','Mittelfeld','Sturm'].map(x=>`<option ${p.position===x?'selected':''}>${x}</option>`).join('')}</select></label>
  <label>Kaufdatum<input id="teBuyDate" type="date" value="${esc(p.buyDate||'')}"></label>
  <label>Kaufpreis (€)<input id="teBuyPrice" class="money-field" inputmode="numeric" value="${moneyInput(p.buyPrice||0)}"></label>
  <label>Gekauft von<select id="teBuySource">${TRANSFER_SOURCES.map(x=>`<option ${p.buySource===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
  <label>Mitspieler beim Kauf<select id="teBuyCounterparty"><option value="">Bitte auswählen</option>${otherManagerOptions(p.buyCounterparty||'')}</select></label>
  <div class="wide"><span class="field-label">Kaufgründe · Mehrfachauswahl</span>${buyReasonPicker(normalizeBuyReasons(p))}</div>
  <label>Aktueller Marktwert (€)<input id="teMarketValue" class="money-field" inputmode="numeric" value="${moneyInput(p.marketValue||0)}"></label>
  <label>Verkaufsdatum<input id="teSoldDate" type="date" value="${esc(p.soldDate||'')}"></label>
  <label>Verkaufspreis (€)<input id="teSalePrice" class="money-field" inputmode="numeric" value="${p.soldDate?moneyInput(p.salePrice||0):''}" placeholder="Leer lassen, wenn noch im Kader"></label>
  <label>Verkauft an<select id="teSaleSource"><option value="">Noch nicht verkauft</option>${TRANSFER_SOURCES.map(x=>`<option ${p.saleSource===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
  <label>Mitspieler beim Verkauf<select id="teSaleCounterparty"><option value="">Bitte auswählen</option>${otherManagerOptions(p.saleCounterparty||'')}</select></label>
  <label>Verkaufsgrund<select id="teSaleReason"><option value="">Noch nicht verkauft</option>${SELL_REASONS.map(x=>`<option ${p.saleReason===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
  <label class="wide">Notiz<input id="teNote" value="${esc(p.note||'')}"></label>
  <div class="full toolbar"><button class="btn" id="saveTransferEdit">Änderungen speichern</button>${p.soldDate?'<button class="btn secondary" id="undoSale">Verkauf rückgängig</button>':''}</div>
  </div></div></div>`;
  bindMoneyFields();
  $('#closeTransferEdit').onclick=()=>{$('#modalArea').innerHTML=''};
  if($('#undoSale'))$('#undoSale').onclick=()=>{p.soldDate='';p.salePrice=0;p.saleReason='';p.saleSource='';p.saleCounterparty='';syncTransferFinance(p);$('#modalArea').innerHTML='';touch();toast('Verkauf rückgängig gemacht')};
  $('#saveTransferEdit').onclick=()=>{
    const soldDate=$('#teSoldDate').value;
    const salePrice=parseMoney($('#teSalePrice').value);
    if(!$('#teName').value.trim()||!$('#teBuyDate').value||!parseMoney($('#teBuyPrice').value))return toast('Name, Kaufdatum und Kaufpreis sind erforderlich');if(!selectedBuyReasons($('#modalArea')).length)return toast('Bitte mindestens einen Kaufgrund auswählen');
    if((soldDate&&!salePrice)||(!soldDate&&salePrice))return toast('Für einen Verkauf Datum und Preis gemeinsam eintragen');if($('#teBuySource').value==='Mitspieler'&&!$('#teBuyCounterparty').value)return toast('Mitspieler beim Kauf auswählen');if(soldDate&&$('#teSaleSource').value==='Mitspieler'&&!$('#teSaleCounterparty').value)return toast('Mitspieler beim Verkauf auswählen');
    Object.assign(p,{
      name:$('#teName').value.trim(),team:$('#teTeam').value,position:$('#tePos').value,
      buyDate:$('#teBuyDate').value,buyPrice:parseMoney($('#teBuyPrice').value),
      buySource:$('#teBuySource').value,buyCounterparty:$('#teBuySource').value==='Mitspieler'?$('#teBuyCounterparty').value.trim():'',
      buyReasons:selectedBuyReasons($('#modalArea')),buyReason:selectedBuyReasons($('#modalArea')).join(' · '),marketValue:parseMoney($('#teMarketValue').value),
      soldDate:soldDate,salePrice:soldDate?salePrice:0,
      saleSource:soldDate?$('#teSaleSource').value:'',saleCounterparty:soldDate&&$('#teSaleSource').value==='Mitspieler'?$('#teSaleCounterparty').value.trim():'',
      saleReason:soldDate?$('#teSaleReason').value:'',note:$('#teNote').value
    });
    syncTransferFinance(p);$('#modalArea').innerHTML='';touch();toast('Transfer aktualisiert');
  };
}
function deleteTransfer(pid){
  const p=data.players.find(x=>x.id===pid);if(!p)return;
  if(!confirm(`Den kompletten Transfer von ${p.name} löschen?\\n\\nDadurch werden Kauf, Verkauf und die dazugehörigen Finanzbuchungen entfernt.`))return;
  const buy=transferFinanceEntry(p,'buy'),sale=transferFinanceEntry(p,'sale');
  const ids=[buy?.id,sale?.id].filter(Boolean);
  data.finances=data.finances.filter(x=>!ids.includes(x.id));
  data.players=data.players.filter(x=>x.id!==pid);
  data.matchdays.forEach(m=>{
    if(Array.isArray(m.lineup))m.lineup=m.lineup.filter(x=>x!==pid);
    if(m.points&&Object.prototype.hasOwnProperty.call(m.points,pid))delete m.points[pid];
    if(m.soldPlayer===pid)m.soldPlayer='';
  });
  touch();toast('Transfer gelöscht');
}



function normalizeBuyReasons(value){
  if(Array.isArray(value))return[...new Set(value.filter(Boolean))];
  if(value&&Array.isArray(value.buyReasons))return[...new Set(value.buyReasons.filter(Boolean))];
  const legacy=typeof value==='object'?value?.buyReason:value;
  return legacy?String(legacy).split(/\s*[·,;|]\s*/).map(x=>x.trim()).filter(Boolean):[];
}
function selectedBuyReasons(scope=document){return[...scope.querySelectorAll('[data-buy-reason]:checked')].map(x=>x.value)}
function buyReasonPicker(selected=[]){
  const set=new Set(normalizeBuyReasons(selected));
  return `<div class="buy-reason-picker">${BUY_REASONS.map(r=>`<label class="reason-option"><input type="checkbox" data-buy-reason value="${esc(r)}" ${set.has(r)?'checked':''}><span>${esc(r)}</span></label>`).join('')}</div>`;
}
function buyReasonSummary(p){const r=normalizeBuyReasons(p);return r.length?r.join(' · '):'–'}
function buyReasonChips(p){const r=normalizeBuyReasons(p);return r.length?`<span class="reason-chip-list">${r.map(x=>`<span class="reason-chip">${esc(x)}</span>`).join('')}</span>`:'–'}

const TRANSFER_DRAFT_KEY='h2hTransferDraftV1';
function readTransferDraft(){
  try{return JSON.parse(sessionStorage.getItem(TRANSFER_DRAFT_KEY)||'{}')}catch{return{}}
}
function writeTransferDraft(){
  const fields=['pfName','pfTeam','pfPos','pfDate','pfBuy','pfMwb','pfMw','pfAvg','pfBuySource','pfBuyCounterparty','pfNote'];
  const draft={};
  fields.forEach(key=>{const el=$(`#${key}`);if(el)draft[key]=el.value});draft.pfBuyReasons=selectedBuyReasons($('#transferForm'));
  sessionStorage.setItem(TRANSFER_DRAFT_KEY,JSON.stringify(draft));
}
function clearTransferDraft(){sessionStorage.removeItem(TRANSFER_DRAFT_KEY)}
function bindTransferDraft(){
  $$('#transferForm input,#transferForm select').forEach(el=>{
    el.addEventListener('input',writeTransferDraft);
    el.addEventListener('change',writeTransferDraft);
  });
}

function playerForm(p={}){
  const d=p.id?{}:readTransferDraft();
  const val=(key,fallback='')=>d[key]!==undefined?d[key]:fallback;
  const selectedTeam=val('pfTeam',p.team||TEAMS[0]);
  return `<div class="card" style="margin-top:16px"><div class="transfer-form-heading"><div><h3>${p.id?'Spielerdetails bearbeiten':'Spieler kaufen'}</h3><p>${bundesligaIdentity(selectedTeam,{logoClass:'form-club-crest'})}</p></div></div><div class="form-grid" style="margin-top:12px"><label>Name<input id="pfName" list="playerAutocompleteMain" autocomplete="off" value="${esc(val('pfName',p.name||''))}" placeholder="Vor- und Nachname"><datalist id="playerAutocompleteMain">${playerAutocompleteOptions()}</datalist></label><label>Verein<select id="pfTeam">${clubSelectOptions(val('pfTeam',p.team)||'',true)}</select></label><label>Position<select id="pfPos">${['Tor','Abwehr','Mittelfeld','Sturm'].map(x=>`<option ${val('pfPos',p.position)===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Kaufdatum<input id="pfDate" type="date" value="${esc(val('pfDate',p.buyDate||localDateISO()))}"></label><label>Kaufpreis (€)<input id="pfBuy" class="money-field" inputmode="numeric" value="${p.buyPrice?moneyInput(p.buyPrice):''}" placeholder="z. B. 5.071.935 €"></label><label>Marktwert beim Kauf (€) – optional<input id="pfMwb" class="money-field" inputmode="numeric" value="${p.marketAtBuy?moneyInput(p.marketAtBuy):''}"></label><label>Aktueller Marktwert (€)<input id="pfMw" class="money-field" inputmode="numeric" value="${p.marketValue?moneyInput(p.marketValue):''}"></label><label>Ø Punkte<input id="pfAvg" type="number" step="0.1" value="${p.avgPoints||''}"></label><label>Gekauft von<select id="pfBuySource">${TRANSFER_SOURCES.map(x=>`<option ${p.buySource===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Mitspieler<select id="pfBuyCounterparty"><option value="">Bitte auswählen</option>${otherManagerOptions(p.buyCounterparty||'')}</select></label><div class="wide"><span class="field-label">Kaufgründe · Mehrfachauswahl</span>${buyReasonPicker(d.pfBuyReasons||normalizeBuyReasons(p))}</div><label class="wide">Notiz<input id="pfNote" value="${esc(p.note||'')}"></label><div class="full"><button type="button" class="btn" id="savePlayer">Speichern</button></div></div></div>`}

let deferredFilterTimer=null;
function deferredFilterUpdate({key,value,inputId,delay=320}){
  data.ui[key]=value;
  save();
  clearTimeout(deferredFilterTimer);
  deferredFilterTimer=setTimeout(()=>{
    const keepFocus=document.activeElement?.id===inputId;
    const cursor=document.activeElement?.selectionStart??String(value).length;
    render();
    if(keepFocus){
      requestAnimationFrame(()=>{
        const input=document.getElementById(inputId);
        if(!input)return;
        input.focus({preventScroll:true});
        const position=Math.min(cursor,input.value.length);
        try{input.setSelectionRange(position,position)}catch{}
      });
    }
  },delay);
}


let screenshotImportSelection=[];
let screenshotImportDraft={images:[],names:[],referenceAt:null,referenceTrusted:false};
let screenshotImportReview=null;
let screenshotImportLastResult=null;
let aiUsageSession={calls:0,screenshots:0,inputTokens:0,outputTokens:0,totalTokens:0,estimatedCost:0};
function aiManagerOptions(selected=''){return LEAGUE_MANAGERS.map(m=>`<option value="${esc(m.id)}" ${m.id===selected?'selected':''}>${esc(m.team)} · ${esc(m.manager)}</option>`).join('')}
function aiUsageFromResult(result,imageCount){
  const u=result?.usage||result?.data?.usage||result?.meta?.usage||{};
  aiUsageSession.calls++;aiUsageSession.screenshots+=imageCount||0;
  aiUsageSession.inputTokens+=Number(u.input_tokens||u.prompt_tokens||0);
  aiUsageSession.outputTokens+=Number(u.output_tokens||u.completion_tokens||0);
  aiUsageSession.totalTokens+=Number(u.total_tokens||0);
  if(Number(result?.estimated_cost||result?.meta?.estimated_cost))aiUsageSession.estimatedCost+=Number(result?.estimated_cost||result?.meta?.estimated_cost);
}
function renderAiUsage(){
  const el=$('#aiUsageBox');if(!el)return;
  const u=aiUsageSession;
  el.innerHTML=`<b>AI-Nutzung dieser Sitzung</b> · ${u.calls} Aufruf${u.calls===1?'':'e'} · ${u.screenshots} Screenshot${u.screenshots===1?'':'s'}${u.totalTokens?` · ${u.totalTokens.toLocaleString('de-DE')} Tokens`:''}${u.estimatedCost?` · ca. $${u.estimatedCost.toFixed(4)}`:' · Kosten werden angezeigt, sobald die Function Usage/Kosten zurückliefert.'}`;
}

let screenshotImportStatusText='';

function restoreScreenshotImportUi(){
  const status=$('#screenshotImportStatus');
  const result=$('#screenshotImportResult');
  const btn=$('#analyzeScreenshotFiles');
  const n=screenshotImportDraft.images.length;
  if(status){
    status.innerHTML=n
      ? `<b>${n} Screenshot${n===1?'':'s'} ausgewählt:</b> ${screenshotImportDraft.names.map(esc).join(' · ')}`
      : 'Noch keine Screenshots ausgewählt.';
  }
  if(result&&n&&!result.innerHTML){
    result.innerHTML='<div class="screenshot-selection-ok">✓ Auswahl gespeichert – Cloud-Updates können sie nicht mehr verwerfen.</div>';
  }
  if(btn)btn.disabled=n===0;
  if(screenshotImportLastResult&&targetIsLeagueImportVisible())renderScreenshotAiResult(screenshotImportLastResult);renderAiUsage();
}
function targetIsLeagueImportVisible(){return Boolean($('#screenshotImportResult'))}

function fileToDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(r.error||new Error('Datei konnte nicht gelesen werden'));r.readAsDataURL(file)})}


const HISTORIC_SCREENSHOT_REFERENCE_DATE='2026-08-12';
const V214_HORN_TRANSFER_DATES=[
  ['Kauf','Schwolow',1000000,'2026-08-04'],['Kauf','Pruhs',600000,'2026-08-04'],
  ['Kauf','Milosevic',4141414,'2026-08-04'],['Verkauf','Gosens',11407285,'2026-08-04'],
  ['Kauf','Kohr',6543210,'2026-08-03'],['Kauf','Gosens',11445599,'2026-08-03'],
  ['Kauf','Tape',5071935,'2026-08-02'],
  ['Kauf','Kristof',12345678,'2026-08-07'],['Kauf','Götze',3222220,'2026-08-07'],
  ['Kauf','Khedira',4455667,'2026-08-06'],['Kauf','Führich',26555555,'2026-08-05'],
  ['Kauf','Labrović',3000000,'2026-08-04'],['Kauf','Conté',12345678,'2026-08-04'],
  ['Kauf','Pfeiffer',5000000,'2026-08-04'],
  ['Verkauf','Pfeiffer',5334535,'2026-08-10'],['Verkauf','Labrović',2698542,'2026-08-10'],
  ['Kauf','Olise',69258147,'2026-08-09'],['Kauf','Burke',3566666,'2026-08-08'],
  ['Verkauf','Khedira',4529355,'2026-08-08'],['Verkauf','Tape',5363338,'2026-08-08'],
  ['Kauf','Beste',10700005,'2026-08-07'],
  ['Kauf','García',44332211,'2026-08-12'],['Verkauf','Milosevic',5484262,'2026-08-12'],
  ['Kauf','Erevbenagie',1899999,'2026-08-12'],['Verkauf','Burke',4451380,'2026-08-12'],
  ['Kauf','Lienhart',13131313,'2026-08-10'],['Kauf','Pedersen',3888888,'2026-08-10'],
  ['Kauf','Anton',38777999,'2026-08-10'],['Kauf','Deman',10777777,'2026-08-12'],
  ['Verkauf','Führich',25000000,'2026-08-12']
];

function canonicalPlayerCandidates(){
  const out=[];
  // Use raw cached Bundesliga data here. Calling selectablePlayerIndex() during
  // migration can enter the render/sync chain again and freeze the page.
  const liveLists=[
    window.__bundesligaPlayers,
    window.bundesligaPlayers,
    data?.bundesligaPlayers,
    data?.playerDatabase,
    data?.playersDatabase
  ];
  for(const list of liveLists){
    if(!Array.isArray(list))continue;
    for(const p of list)if(p?.name)out.push({name:p.name,team:p.team||p.club||'',position:p.position||'',source:'live'});
  }
  for(const p of data.players||[])if(p?.name)out.push({name:p.name,team:p.team||'',position:p.position||'',source:'own'});
  for(const m of LEAGUE_MANAGERS){
    const row=data.leagueIntel?.managerData?.[m.id];
    for(const t of row?.transfers||[])if(t?.player)out.push({name:t.player,team:t.club||'',position:t.position||'',source:'transfer'});
  }
  const seen=new Map();
  for(const p of out){
    const key=normalizePlayerName(p.name);
    if(!key)continue;
    const old=seen.get(key);
    if(!old || (!old.team&&p.team) || (old.source==='transfer'&&p.source!=='transfer'))seen.set(key,p);
  }
  return [...seen.values()];
}
function canonicalPlayerIdentity(name){
  const raw=String(name||'').trim();
  const norm=normalizePlayerName(raw);
  if(!norm)return {key:'',name:raw,team:'',position:'',confidence:0,method:'leer'};

  const exact=canonicalPlayerCandidates().find(p=>normalizePlayerName(p.name)===norm);
  if(exact)return {key:normalizePlayerName(exact.name),name:exact.name,team:exact.team||'',position:exact.position||'',confidence:1,method:'exakt'};

  const parts=norm.split(/\s+/).filter(Boolean);
  const surname=parts.at(-1)||norm;
  const surnameMatches=canonicalPlayerCandidates().filter(p=>{
    const pp=normalizePlayerName(p.name).split(/\s+/).filter(Boolean);
    return pp.at(-1)===surname;
  });
  const uniqueNames=[...new Set(surnameMatches.map(p=>normalizePlayerName(p.name)))];
  if(uniqueNames.length===1&&surnameMatches.length){
    const best=surnameMatches.find(p=>p.team)||surnameMatches[0];
    return {key:normalizePlayerName(best.name),name:best.name,team:best.team||'',position:best.position||'',confidence:.94,method:'eindeutiger Nachname'};
  }

  // If the imported value is only one token, allow unique "contains" match conservatively.
  if(parts.length===1){
    const contains=canonicalPlayerCandidates().filter(p=>{
      const pp=normalizePlayerName(p.name).split(/\s+/);
      return pp.includes(norm);
    });
    const keys=[...new Set(contains.map(p=>normalizePlayerName(p.name)))];
    if(keys.length===1&&contains.length){
      const best=contains.find(p=>p.team)||contains[0];
      return {key:normalizePlayerName(best.name),name:best.name,team:best.team||'',position:best.position||'',confidence:.9,method:'eindeutiger Kurzname'};
    }
  }
  return {key:norm,name:raw,team:'',position:'',confidence:.25,method:'kein eindeutiger Match'};
}
function sameCanonicalPlayer(a,b){
  const ca=canonicalPlayerIdentity(a),cb=canonicalPlayerIdentity(b);
  return Boolean(ca.key&&cb.key&&ca.key===cb.key);
}
function richerPlayerRecord(a,b){
  const score=x=>(x.team?5:0)+(x.position?3:0)+(String(x.name||'').includes(' ')?3:0)+(x.photoUrl?2:0)+(x.buySource&&!String(x.buySource).includes('Screenshot')?2:0)+(x.buyDate?1:0);
  return score(a)>=score(b)?a:b;
}
function mergePlayerRecord(target,source){
  const canonical=canonicalPlayerIdentity(target.name||source.name);
  if(canonical.name&&canonical.confidence>=.9)target.name=canonical.name;
  target.team=target.team||source.team||canonical.team||'';
  target.position=target.position||source.position||canonical.position||'';
  target.photoUrl=target.photoUrl||source.photoUrl||'';
  target.buyDate=target.buyDate||source.buyDate||'';
  target.buyPrice=Number(target.buyPrice||0)||Number(source.buyPrice||0);
  target.marketAtBuy=Number(target.marketAtBuy||0)||Number(source.marketAtBuy||0);
  target.marketValue=Number(target.marketValue||0)||Number(source.marketValue||0);
  target.avgPoints=Number(target.avgPoints||0)||Number(source.avgPoints||0);
  target.note=target.note||source.note||'';
  target.buySource=(target.buySource&&!String(target.buySource).includes('Screenshot'))?target.buySource:(source.buySource||target.buySource||'');
  target.buyCounterparty=target.buyCounterparty||source.buyCounterparty||'';
  if(source.soldDate&&!target.soldDate){
    target.soldDate=source.soldDate;target.salePrice=source.salePrice;target.saleSource=source.saleSource||'';
    target.saleReason=source.saleReason||'';target.saleCounterparty=source.saleCounterparty||'';
  }
}
function cleanupOwnPlayerDuplicates(){
  data.players=Array.isArray(data.players)?data.players:[];
  const removed=new Set();
  for(let i=0;i<data.players.length;i++){
    if(removed.has(i))continue;
    const a=data.players[i],ca=canonicalPlayerIdentity(a.name);
    if(!ca.key)continue;
    if(ca.confidence>=.9){a.name=ca.name;a.team=a.team||ca.team||'';a.position=a.position||ca.position||''}
    for(let j=i+1;j<data.players.length;j++){
      if(removed.has(j))continue;
      const b=data.players[j],cb=canonicalPlayerIdentity(b.name);
      if(!cb.key||ca.key!==cb.key)continue;
      const bothActive=!a.soldDate&&!b.soldDate;
      const pa=Number(a.buyPrice||0),pb=Number(b.buyPrice||0);
      const priceClose=!pa||!pb||Math.abs(pa-pb)<=Math.max(50000,Math.max(pa,pb)*.01);
      const screenshotish=[a.buySource,b.buySource].some(x=>String(x||'').toLowerCase().includes('screenshot'));
      if(bothActive&&(priceClose||screenshotish)){
        const keep=richerPlayerRecord(a,b),drop=keep===a?b:a;
        mergePlayerRecord(keep,drop);
        if(keep===b){data.players[i]=b;a=data.players[i]}
        removed.add(keep===a?j:i);
        if(removed.has(i))break;
      }
    }
  }
  data.players=data.players.filter((_,i)=>!removed.has(i));
}
function transferNearSame(a,b){
  if(String(a.type||'').toLowerCase()!==String(b.type||'').toLowerCase())return false;
  if(!sameCanonicalPlayer(a.player,b.player))return false;
  const pa=Number(a.price||0),pb=Number(b.price||0);
  const priceClose=pa===pb || Math.abs(pa-pb)<=Math.max(50000,Math.max(pa,pb)*.01);
  const dd=daysBetweenIso(a.date,b.date);
  const dateClose=dd===null||dd<=1;
  return priceClose&&dateClose;
}
function mergeTransferRecord(target,source){
  const c=canonicalPlayerIdentity(target.player||source.player);
  if(c.confidence>=.9)target.player=c.name;
  target.club=target.club||source.club||c.team||'';
  target.position=target.position||source.position||c.position||'';
  if(!target.date||target.date==='2026-08-14')target.date=source.date||target.date||'';
  if((!target.price||String(target.source||'').includes('Screenshot'))&&source.price)target.price=source.price;
  if(!target.note||String(target.note).includes('Screenshot'))target.note=source.note||target.note||'';
  if(!target.source||String(target.source).includes('Screenshot'))target.source=source.source||target.source||'';
}
function cleanupManagerTransferDuplicates(managerId){
  const row=managerLeagueData(managerId);
  row.transfers=Array.isArray(row.transfers)?row.transfers:[];
  const removed=new Set();
  for(let i=0;i<row.transfers.length;i++){
    if(removed.has(i))continue;
    let a=row.transfers[i];
    const ca=canonicalPlayerIdentity(a.player);
    if(ca.confidence>=.9){a.player=ca.name;a.club=a.club||ca.team||''}
    for(let j=i+1;j<row.transfers.length;j++){
      if(removed.has(j))continue;
      const b=row.transfers[j];
      if(!transferNearSame(a,b))continue;
      const aScore=(a.club?3:0)+(a.date&&a.date!=='2026-08-14'?3:0)+(!String(a.source||'').includes('Screenshot')?3:0)+(String(a.player||'').includes(' ')?2:0);
      const bScore=(b.club?3:0)+(b.date&&b.date!=='2026-08-14'?3:0)+(!String(b.source||'').includes('Screenshot')?3:0)+(String(b.player||'').includes(' ')?2:0);
      if(bScore>aScore){
        mergeTransferRecord(b,a);row.transfers[i]=b;a=b;removed.add(j);
      }else{
        mergeTransferRecord(a,b);removed.add(j);
      }
    }
  }
  row.transfers=row.transfers.filter((_,i)=>!removed.has(i));
}
function applyHistoricHornDates(){
  const row=managerLeagueData('me');
  for(const [type,player,price,date] of V214_HORN_TRANSFER_DATES){
    const candidates=(row.transfers||[]).filter(t=>
      String(t.type||'').toLowerCase()===type.toLowerCase() &&
      sameCanonicalPlayer(t.player,player) &&
      Number(t.price||0)===Number(price)
    );
    for(const t of candidates){
      if(!t.date||t.date==='2026-08-14'||String(t.source||'').includes('Screenshot')){
        t.date=date;
        t.dateSource=`Kickbase-Screenshot vom ${HISTORIC_SCREENSHOT_REFERENCE_DATE}`;
      }
      const c=canonicalPlayerIdentity(t.player);
      if(c.confidence>=.9){t.player=c.name;t.club=t.club||c.team||''}
    }
  }

  // Correct corresponding own player purchase/sale dates where the prices identify the same screenshot transaction.
  for(const p of data.players||[]){
    const c=canonicalPlayerIdentity(p.name);
    if(c.confidence>=.9){p.name=c.name;p.team=p.team||c.team||'';p.position=p.position||c.position||''}
    const buy=V214_HORN_TRANSFER_DATES.find(([type,name,price])=>type==='Kauf'&&sameCanonicalPlayer(name,p.name)&&Number(price)===Number(p.buyPrice||0));
    if(buy && (!p.buyDate||p.buyDate==='2026-08-14'||String(p.buySource||'').includes('Screenshot')))p.buyDate=buy[3];
    if(p.soldDate){
      const sell=V214_HORN_TRANSFER_DATES.find(([type,name,price])=>type==='Verkauf'&&sameCanonicalPlayer(name,p.name)&&Number(price)===Number(p.salePrice||0));
      if(sell && (p.soldDate==='2026-08-14'||String(p.saleSource||'').includes('Screenshot')))p.soldDate=sell[3];
    }
  }
}
function runV214CanonicalCleanup(){
  cleanupOwnPlayerDuplicates();
  for(const m of LEAGUE_MANAGERS)cleanupManagerTransferDuplicates(m.id);
  applyHistoricHornDates();
  backfillTransferClubs();
  cleanupOwnPlayerDuplicates();
  for(const m of LEAGUE_MANAGERS)cleanupManagerTransferDuplicates(m.id);
  resetOpponentRosterCache();
  resetOpponentAnalysisCache();
}

function localIsoDateFromDate(date){
  const d=new Date(date);
  if(Number.isNaN(d.getTime()))return '';
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function screenshotReferenceInfo(){
  const raw=screenshotImportDraft.referenceAt;
  const ref=raw?new Date(raw):new Date();
  const now=new Date();
  const trusted=Boolean(
    screenshotImportDraft.referenceTrusted &&
    localIsoDateFromDate(ref)===localIsoDateFromDate(now)
  );
  return {ref,trusted};
}
function deriveTransferDate(relativeTime){
  const text=String(relativeTime||'').trim().toLowerCase();
  if(!text)return {date:'',confidence:0,note:'Keine Zeitangabe erkannt'};
  const {ref,trusted}=screenshotReferenceInfo();
  if(!trusted)return {date:'',confidence:.25,note:'Screenshot-Aufnahmedatum nicht als tagesaktuell bestätigt'};

  let d=new Date(ref);
  const num=(pattern)=>{const m=text.match(pattern);return m?Number(String(m[1]).replace(',','.')):null};

  if(text==='heute'||text.includes('gerade eben')||text.includes('wenigen sek')||text.includes('sekunde')){
    return {date:localIsoDateFromDate(d),confidence:.98,note:'aus tagesaktuellem Screenshot'};
  }
  if(text==='gestern'){
    d.setDate(d.getDate()-1);
    return {date:localIsoDateFromDate(d),confidence:.98,note:'aus „gestern“'};
  }

  let n=num(/vor\s+(\d+(?:[.,]\d+)?)\s*(?:min|minuten?)/);
  if(n!==null){
    d=new Date(d.getTime()-n*60*1000);
    return {date:localIsoDateFromDate(d),confidence:.92,note:'aus relativer Minutenangabe'};
  }
  n=num(/vor\s+(\d+(?:[.,]\d+)?)\s*(?:std|stunden?|h)\b/);
  if(n!==null){
    d=new Date(d.getTime()-n*60*60*1000);
    return {date:localIsoDateFromDate(d),confidence:n<20?.9:.72,note:n<20?'aus relativer Stundenangabe':'Tagesgrenze kann je nach Aufnahmezeit knapp sein'};
  }
  n=num(/vor\s+(\d+(?:[.,]\d+)?)\s*(?:tag|tage|tagen)\b/);
  if(n!==null){
    d.setDate(d.getDate()-Math.round(n));
    return {date:localIsoDateFromDate(d),confidence:.96,note:'aus relativer Tagesangabe'};
  }
  n=num(/vor\s+(\d+(?:[.,]\d+)?)\s*(?:woche|wochen)\b/);
  if(n!==null){
    d.setDate(d.getDate()-Math.round(n*7));
    return {date:localIsoDateFromDate(d),confidence:.9,note:'aus relativer Wochenangabe'};
  }

  return {date:'',confidence:.35,note:`Zeitangabe nicht sicher umrechenbar: ${relativeTime}`};
}
function normalizedNameParts(name){
  return normalizePlayerName(name).split(/\s+/).filter(Boolean);
}
function resolvePlayerClubSmart(name,existingClub='',context={}){
  if(existingClub)return {club:existingClub,confidence:1,method:'vorhandener Transfer'};
  const r=resolveCanonicalPlayer(name,context);
  if(r.matched&&r.team)return {club:r.team,confidence:r.confidence,method:r.reason};
  return {club:'',confidence:r.confidence||0,method:r.reason||'Verein unbekannt'};
}
function daysBetweenIso(a,b){
  if(!a||!b)return null;
  const da=new Date(`${a}T12:00:00`),db=new Date(`${b}T12:00:00`);
  if(Number.isNaN(da.getTime())||Number.isNaN(db.getTime()))return null;
  return Math.round(Math.abs(da-db)/86400000);
}
function smartTransferMatch(existing,t,derivedDate){
  const same=existing.filter(x=>
    sameCanonicalPlayer(x.player,t.player) &&
    String(x.type||'').toLowerCase()===String(t.type||'').toLowerCase()
  );
  if(!same.length)return {action:'new',candidate:null,reason:'Kein bestehender Transfer dieses Spielers/Typ'};

  const price=Number(t.price)||0;
  let best=null,bestScore=-1;
  for(const x of same){
    const oldPrice=Number(x.price)||0;
    const priceDiff=Math.abs(oldPrice-price);
    const pricePct=price&&oldPrice?priceDiff/Math.max(price,oldPrice):1;
    const dateDiff=daysBetweenIso(x.date,derivedDate);
    let score=0;
    if(price&&oldPrice&&priceDiff===0)score+=65;
    else if(price&&oldPrice&&pricePct<=.002)score+=55;
    else if(price&&oldPrice&&pricePct<=.01)score+=42;
    else if(price&&oldPrice&&pricePct<=.05)score+=22;
    if(x.date&&derivedDate&&dateDiff===0)score+=30;
    else if(x.date&&derivedDate&&dateDiff===1)score+=18;
    else if(!x.date||!derivedDate)score+=6;
    if(!best||score>bestScore){best=x;bestScore=score}
  }

  if(bestScore>=80)return {action:'unchanged',candidate:best,reason:'Spieler, Typ, Preis und Datum stimmen überein'};
  if(bestScore>=50)return {action:'update',candidate:best,reason:'Wahrscheinlich derselbe Transfer – Screenshot kann bestehende Angaben präzisieren'};
  if(same.length===1&&(!same[0].date||!derivedDate)&&Math.abs(Number(same[0].price||0)-price)<=Math.max(50000,price*.01)){
    return {action:'update',candidate:same[0],reason:'Ein bestehender Transfer mit nahezu gleichem Preis'};
  }
  return {action:'uncertain',candidate:best,reason:'Ähnlicher bestehender Transfer vorhanden – bitte prüfen'};
}
function backfillTransferClubs(){
  for(const manager of LEAGUE_MANAGERS){
    const row=managerLeagueData(manager.id);
    for(const t of row.transfers||[]){
      if(t.club)continue;
      const resolved=resolvePlayerClubSmart(t.player);
      if(resolved.club){
        t.club=resolved.club;
        t.clubResolution=resolved.method;
      }
    }
  }
}


/* 2.1.7 Screenshot Engine v2
   Vision extracts visible text/rows; this client performs deterministic Bundesliga identity resolution.
   Uncertain identities are never auto-selected. */
function v216Words(value){
  return String(value||'').toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);
}
function v216Compact(value){return v216Words(value).join('')}
function v216EditDistance(a,b){
  a=String(a||'');b=String(b||'');
  const row=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    let prev=row[0];row[0]=i;
    for(let j=1;j<=b.length;j++){
      const old=row[j];
      row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));
      prev=old;
    }
  }
  return row[b.length];
}
function v216PlayerCandidates(){
  const seen=new Map();
  for(const p of bundesligaMasterPlayers()){
    const id=String(p.external_id??p.id??'');
    const key=id?`id:${id}`:`name:${canonicalFullKey(p.name)}`;
    if(!seen.has(key))seen.set(key,p);
  }
  return [...seen.values()];
}

const SCREENSHOT_CANONICAL_ALIASES_V216B={
  posch:{name:'Stefan Posch',team:'1. FSV Mainz 05',position:'Abwehr',source:'screenshot-confirmed-alias'}
};
function screenshotAliasFallbackV216b(raw){
  const key=v216Compact(raw);
  const p=SCREENSHOT_CANONICAL_ALIASES_V216B[key];
  return p?{...p,matched:true,ambiguous:false,confidence:.94,reason:'2.1.7 Alias-Fallback (Master-Sync noch offen)'}:null;
}


function screenshotManagerRosterV221(managerId){
  if(managerId==='me'){
    return (activePlayers()||[]).map(p=>({
      id:p.id,name:p.name,team:p.team||'',position:lineupPositionOf(p)||p.position||'',
      source:'current-own-roster'
    }));
  }
  return (opponentRoster(managerId,+data.settings.currentMd||1)||[]).map(p=>({
    id:p.id,name:p.name,team:p.team||'',position:normalizedOpponentPosition(p.position)||p.position||'',
    source:'current-opponent-roster'
  }));
}
function v221RosterCandidateScore(raw,player){
  const needle=v216Compact(String(raw||'').replace(/\.{2,}$/,''));
  if(!needle)return 0;
  const full=v216Compact(player?.name||''),words=v216Words(player?.name||''),surname=words.at(-1)||'';
  if(!full)return 0;
  if(full===needle||surname===needle)return 1;
  if(full.startsWith(needle)||surname.startsWith(needle))return needle.length>=6?.98:needle.length>=4?.93:.82;
  const target=surname||full,d=v216EditDistance(needle,target),ratio=1-d/Math.max(needle.length,target.length,1);
  if(d===1&&Math.min(needle.length,target.length)>=5)return .95;
  if(d<=2&&Math.min(needle.length,target.length)>=7&&ratio>=.72)return .88;
  return 0;
}
function resolveScreenshotPlayerAgainstRosterV221(input,managerId){
  if(!managerId)return null;
  const raw=String(input||'').trim();
  const scored=screenshotManagerRosterV221(managerId).map(p=>({p,score:v221RosterCandidateScore(raw,p)}))
    .filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  const best=scored[0],second=scored[1];
  if(!best)return null;
  if(second&&second.score>=best.score-.035)return {matched:false,ambiguous:true,confidence:best.score,reason:'Manager-Kader: mehrere ähnliche Treffer',candidates:scored.slice(0,4).map(x=>x.p.name)};
  if(best.score<.82)return null;
  return {...best.p,matched:true,ambiguous:false,confidence:best.score,reason:`Manager-Kader: ${best.score>=.98?'eindeutig':'OCR/Abkürzung aufgelöst'}`};
}
function scoreScreenshotManagerByLineupV221(lineup,managerId){
  const entries=Array.isArray(lineup)?lineup:[],roster=screenshotManagerRosterV221(managerId);
  if(!entries.length||!roster.length)return {managerId,score:0,matches:0,strong:0,total:entries.length,rosterSize:roster.length,details:[],coverage:0};
  let score=0,matches=0,strong=0;const details=[],used=new Set();
  for(const entry of entries){
    const raw=typeof entry==='string'?entry:String(entry?.player||entry?.name||'');
    const ranked=roster.map((p,index)=>({p,index,s:v221RosterCandidateScore(raw,p)}))
      .filter(x=>x.s>=.78&&!used.has(x.index)).sort((a,b)=>b.s-a.s);
    const best=ranked[0];
    if(!best){details.push({raw,match:'',score:0});continue}
    used.add(best.index);matches++;if(best.s>=.93)strong++;
    score+=best.s>=.98?12:best.s>=.93?10:7;
    details.push({raw,match:best.p.name,score:best.s});
  }
  const coverage=entries.length?matches/entries.length:0;
  score+=coverage*35;
  if(strong>=7)score+=25;
  if(matches>=9)score+=30;
  return {managerId,score,matches,strong,total:entries.length,rosterSize:roster.length,details,coverage};
}
function inferScreenshotManagerV221(d){
  const lineup=Array.isArray(d?.lineup)?d.lineup:[],aiManagerId=resolveScreenshotManagerV216b(d?.manager||'');
  const ranked=LEAGUE_MANAGERS.map(m=>scoreScreenshotManagerByLineupV221(lineup,m.id)).sort((a,b)=>b.score-a.score);
  const best=ranked[0],second=ranked[1];

  if(best&&best.matches>=6&&best.coverage>=.55&&(!second||best.score-second.score>=18)){
    return {managerId:best.managerId,method:'Kaderabgleich',confidence:Math.min(.99,.72+best.coverage*.25),rosterMatch:best,aiManagerId,ranked};
  }
  if(best&&best.matches>=9&&best.coverage>=.8){
    return {managerId:best.managerId,method:'Kaderabgleich',confidence:.99,rosterMatch:best,aiManagerId,ranked};
  }
  if(aiManagerId){
    const aiScore=ranked.find(x=>x.managerId===aiManagerId);
    if(!best||best.matches<4||aiScore?.score>=best.score-10){
      return {managerId:aiManagerId,method:'sichtbarer Managername',confidence:.9,rosterMatch:aiScore||null,aiManagerId,ranked};
    }
  }
  return {managerId:'',method:'nicht eindeutig',confidence:0,rosterMatch:best||null,aiManagerId,ranked};
}

function resolveScreenshotPlayerV216(input,context={}){
  const raw=String(input||'').trim();
  if(!raw)return {matched:false,confidence:0,reason:'Kein Spielername'};
  const rosterMatch=resolveScreenshotPlayerAgainstRosterV221(raw,context.managerId||'');
  if(rosterMatch?.matched)return rosterMatch;
  if(rosterMatch?.ambiguous)return rosterMatch;

  const kb=v219bKickbaseMetadata(raw);
  if(kb)return {...kb,matched:true,ambiguous:false,confidence:.99,reason:'Bestätigte Kickbase-Spielerdaten'};

  const exact=resolveShortNameAgainstLocalMasters(raw,context);
  if(exact.matched){
    const confirmed=v219bKickbaseMetadata(exact.name);
    return confirmed
      ? {...exact,...confirmed,matched:true,confidence:Math.max(.98,Number(exact.confidence)||0),reason:'Master + bestätigte Kickbase-Position'}
      : {...exact,confidence:Math.max(.96,Number(exact.confidence)||0),reason:`Master: ${exact.reason||'eindeutig'}`};
  }

  const needle=v216Compact(raw.replace(/\.{2,}$/,''));
  if(needle.length<3)return {matched:false,confidence:0,reason:'Name zu kurz'};

  const aliasFallback=screenshotAliasFallbackV216b(raw);
  if(aliasFallback)return aliasFallback;

  const scored=[];
  for(const p of v216PlayerCandidates()){
    const full=v216Compact(p.name),words=v216Words(p.name),surname=words.at(-1)||'';
    if(!full)continue;
    let score=0,method='';
    if(full===needle||surname===needle){score=1;method='exakt'}
    else if(full.startsWith(needle)||surname.startsWith(needle)){
      score=needle.length>=6?.95:needle.length>=4?.88:.78;method='abgeschnittener Name';
    }else{
      const target=surname||full;
      const d=v216EditDistance(needle,target);
      const ratio=1-d/Math.max(needle.length,target.length,1);
      if(d===1&&Math.min(needle.length,target.length)>=6){score=.93;method='1 OCR-Zeichen'}
      else if(d<=2&&Math.min(needle.length,target.length)>=8&&ratio>=.78){score=.84;method='OCR-Toleranz'}
    }
    if(score)scored.push({p,score,method});
  }
  scored.sort((x,y)=>y.score-x.score);
  const best=scored[0],second=scored[1];
  if(!best)return {matched:false,confidence:0,reason:'Kein Bundesliga-Match'};
  if(second&&second.score>=best.score-.04){
    return {matched:false,ambiguous:true,confidence:best.score,reason:'Mehrere ähnliche Bundesliga-Spieler',
      candidates:scored.slice(0,4).map(x=>x.p.name)};
  }
  if(best.score<.84)return {matched:false,confidence:best.score,reason:'Treffer zu unsicher',candidates:[best.p.name]};
  const confirmed=v219bKickbaseMetadata(best.p.name);
  return confirmed
    ? {...best.p,...confirmed,matched:true,ambiguous:false,confidence:best.score,reason:`Screenshot v2 + Kickbase-Metadaten: ${best.method}`}
    : {...best.p,matched:true,ambiguous:false,confidence:best.score,reason:`Screenshot v2: ${best.method}`};
}

function resolveScreenshotManagerV216b(value){
  const q=v200Norm(value);
  if(!q)return null;
  const exact=LEAGUE_MANAGERS.find(m=>
    [m.id,m.team,m.manager].map(v200Norm).some(x=>x===q)
  );
  if(exact)return exact.id;

  // Conservative normalized containment fallback for OCR additions such as "Member".
  const candidates=LEAGUE_MANAGERS.filter(m=>
    [m.team,m.manager].map(v200Norm).some(x=>
      x && q && x.length>=5 && q.length>=5 && (x.includes(q)||q.includes(x))
    )
  );
  return candidates.length===1?candidates[0].id:null;
}

function classifyScreenshotResultV216(d){
  const transfers=Array.isArray(d?.transfers)?d.transfers:[];
  const lineup=Array.isArray(d?.lineup)?d.lineup:[];
  if(transfers.length&&lineup.length)return 'Gemischt';
  if(transfers.length)return 'Transfers';
  if(lineup.length)return 'Aufstellung';
  return 'Unbekannt';
}
function resolveLineupV216(lineup,managerId=''){
  return (Array.isArray(lineup)?lineup:[]).map((entry,i)=>{
    const raw=typeof entry==='string'?entry:String(entry?.player||entry?.name||'');
    const r=resolveScreenshotPlayerV216(raw,{managerId});
    const kb=r.matched?v219bKickbaseMetadata(r.name):null;
    return {index:i,raw,resolved:r.matched?r.name:raw,matched:Boolean(r.matched),
      confidence:Number(r.confidence)||0,reason:r.reason||'',candidates:r.candidates||[],
      team:canonicalClubName(kb?.team||r.team||''),
      position:canonicalLineupPosition(kb?.position||r.position)||''};
  });
}

function aiKey(t){return `${normalizePlayerName(t.player||'')}|${String(t.type||'').toLowerCase()}`}
function renderScreenshotAiResult(result){
 const d=result?.data||{},ts=Array.isArray(d.transfers)?d.transfers:[];
 const managerInference=inferScreenshotManagerV221(d);
 const recognizedManagerId=managerInference.managerId||'',managerId=recognizedManagerId||'',row=managerId?managerLeagueData(managerId):null,existing=Array.isArray(row?.transfers)?row.transfers:[];
 const items=ts.map((t,i)=>{
   const canonical=resolveScreenshotPlayerV216(t.player,{managerId});
   if(canonical.matched)t={...t,player:canonical.name};
   const dateInfo=deriveTransferDate(t.relative_time);
   const clubInfo=resolvePlayerClubSmart(t.player,canonical.team||'',{managerId});
   const match=smartTransferMatch(existing,t,dateInfo.date);
   let action=match.action;
   if((Number(t.confidence)||0)<.75 || !canonical.matched || Number(canonical.confidence||0)<.84)action='uncertain';
   t={...t,identityConfidence:Number(canonical.confidence)||0,identityReason:canonical.reason||'',identityCandidates:canonical.candidates||[]};
   return {
     id:`r${i}`,t,
     action,
     candidateId:match.candidate?.id||null,
     selected:action!=='unchanged'&&action!=='uncertain',
     derivedDate:dateInfo.date,
     dateConfidence:dateInfo.confidence,
     dateNote:dateInfo.note,
     club:clubInfo.club,
     clubConfidence:clubInfo.confidence,
     clubMethod:clubInfo.method,
     matchReason:match.reason
   };
 });
 const screenshotType=classifyScreenshotResultV216(d);
 const lineupReview=resolveLineupV216(d.lineup,managerId);
 screenshotImportReview={managerId,recognizedManagerId,screenshotType,managerInference,lineupReview,lineup:lineupReview.filter(x=>x.matched&&x.confidence>=.84).map(x=>x.resolved),items};
 const r=screenshotImportReview,target=$('#screenshotImportResult');if(!target)return;
 const label=x=>x==='new'?'NEU':x==='update'?'ÄNDERN':x==='unchanged'?'UNVERÄNDERT':'PRÜFEN';
 const ref=screenshotReferenceInfo();
 const inferredManager=managerId?managerById(managerId):null;
 const rosterEvidence=r.managerInference?.rosterMatch;
 const managerDetail=managerId
   ? `${esc(r.managerInference?.method||'Zuordnung')} · ${Math.round((r.managerInference?.confidence||0)*100)}%${rosterEvidence?.total?` · ${rosterEvidence.matches}/${rosterEvidence.total} Spieler passen zum aktuellen Kader`:''}${r.managerInference?.aiManagerId&&r.managerInference.aiManagerId!==managerId?` · Screenshot-Text "${esc(d.manager||'')}" wegen Kaderwiderspruch verworfen`:''}`
   : `Keine eindeutige Manager-Zuordnung${rosterEvidence?.total?` · bester Kaderabgleich ${rosterEvidence.matches}/${rosterEvidence.total}`:''}`;
 target.innerHTML=`<div class="screenshot-result-head"><div><span>SCREENSHOT ENGINE 2.2.1 · ${esc(r.screenshotType)}</span><h4>${inferredManager?esc(inferredManager.team):esc(d.manager||'Manager nicht erkannt')}</h4></div><strong>${r.items.length} Transfers${r.lineupReview?.length?` · ${r.lineupReview.length} Aufstellungsplätze`:''}</strong></div>
 <div class="ai-reference-date ${ref.trusted?'trusted':'uncertain'}"><b>Screenshot-Referenz:</b> ${esc(localIsoDateFromDate(ref.ref)||'unbekannt')} ${ref.trusted?'· tagesaktuell erkannt':'· nicht als tagesaktuell bestätigt – Transferdaten werden nicht automatisch gesetzt'}</div>
 <div class="ai-manager-assignment ${managerId?'confirmed':'uncertain'}"><label>Ziel-Manager für diesen Import</label><select id="aiTargetManager"><option value="">Bitte Manager auswählen…</option>${aiManagerOptions(managerId)}</select><small>${managerDetail}</small></div>
 ${r.managerInference?.ranked?.length?`<details class="ai-manager-diagnostics"><summary>Manager-Kaderabgleich anzeigen</summary><small>${r.managerInference.ranked.map(s=>`${esc(managerById(s.managerId)?.team||s.managerId)}: ${s.matches}/${s.total||0} Treffer · Score ${Math.round(s.score)}`).join(' · ')}</small></details>`:''}
 <div class="screenshot-result-list">${r.items.map(x=>`<article class="ai-review-row smart ${x.action}">
   <label><input type="checkbox" data-ai="${x.id}" ${x.selected?'checked':''} ${x.action==='unchanged'?'disabled':''}></label>
   <div class="ai-player-main"><b>${esc(x.t.player||'Unbekannt')}</b><small>${esc(x.t.type||'')} · ${x.club?esc(x.club):'Verein unbekannt'}</small><small>${x.derivedDate?`Transferdatum ${esc(x.derivedDate)}`:'Transferdatum offen'}${x.t.relative_time?` · ${esc(x.t.relative_time)}`:''}</small><small class="ai-match-reason">${esc(x.matchReason)}</small><small class="ai-match-reason">Spieler-ID: ${Math.round((Number(x.t.identityConfidence)||0)*100)}% · ${esc(x.t.identityReason||'nicht aufgelöst')}${x.t.identityCandidates?.length?` · Kandidaten: ${esc(x.t.identityCandidates.join(', '))}`:''}</small></div>
   <div class="ai-review-price">${Number.isFinite(Number(x.t.price))?euro(Number(x.t.price)):'–'}</div>
   <div class="ai-tag ${x.action}">${label(x.action)}</div>
   <div class="screenshot-confidence">${Math.round((Number(x.t.confidence)||0)*100)}%</div>
 </article>`).join('')}</div>
 ${r.lineupReview?.length?`<div class="ai-lineup"><b>Aufstellung erkannt (${r.lineupReview.length})</b>
 <div class="ai-lineup-review-list" style="margin-top:8px">${r.lineupReview.map(x=>`<div class="ai-lineup-review-row">
   <span>${x.matched&&x.confidence>=.84?'✓':'⚠'} ${esc(x.raw)}</span>
   <input data-ai-lineup-name="${x.index}" value="${esc(x.resolved)}" aria-label="Spielername korrigieren">
   <select data-ai-lineup-pos="${x.index}" aria-label="Position korrigieren"><option value="">Position…</option>${['Tor','Abwehr','Mittelfeld','Sturm'].map(p=>`<option ${x.position===p?'selected':''}>${p}</option>`).join('')}</select>
   <small>${Math.round(x.confidence*100)}% · ${esc(x.reason)}${x.team?` · ${esc(x.team)}`:''}</small>
 </div>`).join('')}</div>
 <label style="display:block;margin-top:10px"><input id="aiLineup" type="checkbox" checked> Aufstellung übernehmen (${r.lineupReview.length} erkannte Plätze)</label>
 <small>Unsichere oder nicht gefundene Spieler und Positionen kannst du direkt korrigieren.</small></div>`:''}
 <div class="ai-actions"><button class="btn" id="aiCommit" ${!managerId?'disabled':''}>Ausgewählte Änderungen übernehmen</button><button class="btn secondary" id="aiDiscard">Verwerfen</button></div>
 <div class="screenshot-result-foot">Abgleich berücksichtigt Spieler, Kauf/Verkauf, Preis und – wenn tagesaktuell ableitbar – das Transferdatum. Verein wird aus dem Bundesliga-Spielerdatensatz ergänzt.</div>`;
 $$('[data-ai]').forEach(c=>c.onchange=()=>{const x=r.items.find(i=>i.id===c.dataset.ai);if(x)x.selected=c.checked});
 if($('#aiTargetManager'))$('#aiTargetManager').onchange=e=>{
   r.managerId=e.target.value||'';
   const b=$('#aiCommit');if(b)b.disabled=!r.managerId;
 };
 const refreshAiCommitState=()=>{
   const selected=$$('[data-ai]:checked').length;
   const lineupSelected=Boolean($('#aiLineup')?.checked&&r.lineupReview?.length);
   const b=$('#aiCommit');
   if(b){
     b.disabled=!($('#aiTargetManager')?.value)||(!selected&&!lineupSelected);
     b.textContent=selected?`${selected} Transferänderung${selected===1?'':'en'}${lineupSelected?' + Aufstellung':''} übernehmen`:(lineupSelected?'Aufstellung übernehmen':'Keine Änderung ausgewählt');
   }
 };
 $$('[data-ai]').forEach(c=>c.addEventListener('change',refreshAiCommitState));
 $('#aiTargetManager')?.addEventListener('change',refreshAiCommitState);
 $('#aiLineup')?.addEventListener('change',refreshAiCommitState);
 refreshAiCommitState();
 if($('#aiCommit'))$('#aiCommit').onclick=commitAiReview;
 if($('#aiDiscard'))$('#aiDiscard').onclick=()=>{
   screenshotImportReview=null;screenshotImportLastResult=null;
   screenshotImportDraft={images:[],names:[],referenceAt:null,referenceTrusted:false};
   screenshotImportSelection=[];window.h2hAiImportBusy=false;target.innerHTML='';restoreScreenshotImportUi()
 };
}

function commitOwnScreenshotLineupV221a(corrected,md=data.settings.currentMd){
  // Synchronize first. The lineup must reference the final active-player IDs,
  // not IDs captured before the transfer single-source synchronization.
  syncTransferSingleSource();

  const active=activePlayers();
  const ids=[];
  const unresolved=[];

  for(const x of corrected){
    const resolved=resolveScreenshotPlayerV216(x.name,{managerId:'me'});
    const canonicalName=String(resolved.matched?resolved.name:x.name||'').trim();
    const player=active.find(p=>sameCanonicalIdentity(p.name,canonicalName,{managerId:'me'}));

    if(!player){
      unresolved.push(canonicalName||x.name);
      continue;
    }

    const kb=v219bKickbaseMetadata(player.name);
    const position=canonicalLineupPosition(kb?.position||x.position||resolved.position||player.kickbasePosition||player.position);
    if(position){
      player.position=position;
      player.kickbasePosition=position;
    }else{
      repairPlayerPositionV219(player);
    }

    if(!ids.includes(player.id))ids.push(player.id);
  }

  if(unresolved.length)return {ok:false,ids:[],unresolved,message:`Nicht im eigenen Kader gefunden: ${unresolved.join(', ')}`};
  if(ids.length!==11)return {ok:false,ids,unresolved:[],message:`Aufstellung enthält nach Zuordnung nur ${ids.length}/11 eindeutige Spieler.`};

  const validation=lineupValidation(ids,{complete:true});
  if(!validation.ok)return {ok:false,ids,unresolved:[],message:validation.message||'Aufstellung ist nicht gültig.'};

  const record=mdRecord(+md||1);
  record.lineup=[...ids];
  record.lineupInheritedFrom=null;
  record.lineupInheritedAt=null;
  record.lineupScreenshotImportedAt=new Date().toISOString();

  const formation=exactFormation(record.lineup);
  record.formation=formation?.code||'';

  // Verify against the exact source the squad page uses.
  const activeIds=new Set(activePlayers().map(p=>p.id));
  const persisted=record.lineup.filter(id=>activeIds.has(id));
  if(persisted.length!==11){
    return {ok:false,ids:persisted,unresolved:[],message:`Interne Aufstellungsprüfung fehlgeschlagen (${persisted.length}/11 aktive Spieler).`};
  }

  return {ok:true,ids:persisted,formation:record.formation};
}

async function commitAiReview(){
  const r=screenshotImportReview;
  if(!r){toast('Keine AI-Vorschau vorhanden');return}

  // Read the current UI at the moment of clicking, not a potentially stale internal state.
  const targetManagerId=$('#aiTargetManager')?.value||r.managerId||'';
  if(!targetManagerId){toast('Bitte Ziel-Manager auswählen');return}
  r.managerId=targetManagerId;

  const selectedIds=new Set($$('[data-ai]:checked').map(el=>el.dataset.ai));
  const selectedItems=r.items.filter(item=>selectedIds.has(item.id));
  const wantsLineup=Boolean($('#aiLineup')?.checked&&r.lineupReview?.length);
  if(!selectedItems.length&&!wantsLineup){
    const status=$('#screenshotImportStatus');
    if(status)status.textContent='Keine Transferzeile oder Aufstellung ausgewählt – es wurde nichts verändert.';
    toast('Keine Änderung ausgewählt');
    return;
  }

  const btn=$('#aiCommit');
  if(btn){btn.disabled=true;btn.textContent='Übernehme…'}
  window.h2hAiImportBusy=true;

  const row=managerLeagueData(targetManagerId);
  row.transfers=Array.isArray(row.transfers)?row.transfers:[];
  const beforeCount=row.transfers.length;
  let added=0,updated=0,unchanged=0;

  const committed=[];

  for(const item of selectedItems){
    const t=item.t||{};
    const canonical=resolveScreenshotPlayerV216(t.player,{managerId:targetManagerId});
    const player=String(canonical.matched?canonical.name:(t.player||'')).trim();
    const type=t.type==='Verkauf'?'Verkauf':'Kauf';
    const price=Number(t.price)||0;
    if(!player)continue;

    const derivedDate=item.derivedDate||'';
    const clubResolved=item.club||resolvePlayerClubSmart(player).club||'';
    const liveMatch=smartTransferMatch(row.transfers,{player,type,price},derivedDate);

    if(liveMatch.action==='unchanged'&&liveMatch.candidate){
      const exact=liveMatch.candidate;
      if(!exact.club&&clubResolved)exact.club=clubResolved;
      if(!exact.date&&derivedDate)exact.date=derivedDate;
      exact.source=exact.source||'AI Screenshot Import';
      unchanged++;
      committed.push({player,type,price,date:derivedDate,mode:'unchanged'});
      continue;
    }

    if((item.action==='update'||liveMatch.action==='update')&&liveMatch.candidate){
      const old=liveMatch.candidate;
      old.player=player;
      old.type=type;
      old.price=price||old.price;
      old.club=clubResolved||old.club||'';
      old.date=derivedDate||old.date||'';
      old.note=t.counterparty?`Screenshot: ${t.counterparty}`:(old.note||'AI Screenshot Import');
      old.source='AI Screenshot Import';
      updated++;
      committed.push({player,type,price,date:old.date,mode:'updated'});
      continue;
    }

    row.transfers.push({
      id:`ai-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      md:+data.settings.currentMd||1,
      player,
      club:clubResolved,
      price,
      date:derivedDate,
      note:t.counterparty?`Screenshot: ${t.counterparty}`:'AI Screenshot Import',
      source:'AI Screenshot Import'
    });
    added++;
    committed.push({player,type,price,mode:'added'});
  }

  if(wantsLineup){
    const corrected=r.lineupReview.map(x=>{
      const name=String($(`[data-ai-lineup-name="${x.index}"]`)?.value||x.resolved||x.raw||'').trim();
      const manualPos=String($(`[data-ai-lineup-pos="${x.index}"]`)?.value||'').trim();
      const resolved=resolveScreenshotPlayerV216(name,{managerId:targetManagerId});
      const kb=resolved.matched?v219bKickbaseMetadata(resolved.name):null;
      return {name:resolved.matched?resolved.name:name,team:canonicalClubName(kb?.team||resolved.team||x.team||''),position:manualPos||canonicalLineupPosition(kb?.position||resolved.position)||x.position||''};
    }).filter(x=>x.name);
    if(targetManagerId==='me'){
      const ownLineupCommit=commitOwnScreenshotLineupV221a(corrected,+data.settings.currentMd||1);
      if(!ownLineupCommit.ok){
        window.h2hAiImportBusy=false;
        if(btn){btn.disabled=false;btn.textContent='Erneut prüfen'}
        const status=$('#screenshotImportStatus');
        if(status)status.textContent=ownLineupCommit.message;
        toast(ownLineupCommit.message);
        return;
      }
      r.committedOwnLineup={ids:[...ownLineupCommit.ids],formation:ownLineupCommit.formation||''};
    }else{
      const mdRow=managerMatchdayData(targetManagerId,+data.settings.currentMd||1);
      mdRow.lineup=[...new Set(corrected.map(x=>x.name))].slice(0,11);
      mdRow.bank=Array.isArray(mdRow.bank)?mdRow.bank:[];
      for(const x of corrected){
        const t=(row.transfers||[]).find(t=>sameCanonicalIdentity(t.player,x.name,{managerId:targetManagerId}));
        if(t&&x.position)t.position=x.position;
      }
    }
  }

  resetOpponentRosterCache();
  resetOpponentAnalysisCache();
  if(targetManagerId!=='me')syncTransferSingleSource();

  // Verify lineup and transfers in memory before saving.
  if(wantsLineup&&targetManagerId==='me'){
    const record=mdRecord(+data.settings.currentMd||1);
    const activeIds=new Set(activePlayers().map(p=>p.id));
    const validIds=(record.lineup||[]).filter(id=>activeIds.has(id));
    if(validIds.length!==11){
      window.h2hAiImportBusy=false;
      if(btn){btn.disabled=false;btn.textContent='Erneut versuchen'}
      const status=$('#screenshotImportStatus');
      if(status)status.textContent=`Aufstellungsprüfung fehlgeschlagen: ${validIds.length}/11 Spieler im gespeicherten Kader gefunden.`;
      toast('Aufstellung nicht gespeichert');
      return;
    }
  }

  // Verify in memory before saving.
  const verification=committed.filter(c=>c.mode!=='unchanged').every(c=>
    row.transfers.some(x=>
      sameCanonicalIdentity(x.player,c.player,{managerId:targetManagerId}) &&
      String(x.type||'').toLowerCase()===c.type.toLowerCase() &&
      Number(x.price||0)===Number(c.price||0) &&
      (!c.date || !x.date || x.date===c.date)
    )
  );

  if(!verification){
    window.h2hAiImportBusy=false;
    if(btn){btn.disabled=false;btn.textContent='Erneut versuchen'}
    const status=$('#screenshotImportStatus');
    if(status)status.textContent='Interne Prüfung fehlgeschlagen: Transfers wurden nicht vollständig in den Ziel-Datensatz geschrieben.';
    toast('Importprüfung fehlgeschlagen');
    return;
  }

  localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));

  let cloudSaved=false;
  try{
    if(window.cloudFlushSave) cloudSaved=await window.cloudFlushSave();
    else { if(window.cloudQueueSave)window.cloudQueueSave(); cloudSaved=true; }
  }catch(err){
    console.error('AI commit cloud error',err);
  }

  const afterCount=managerLeagueData(targetManagerId).transfers.length;
  const rosterAfter=managerCurrentRoster(targetManagerId,+data.settings.currentMd||1).length;
  const manager=managerById(targetManagerId);

  data.ui=data.ui||{};
  data.ui.lastAiImport={
    managerId:targetManagerId,
    at:new Date().toISOString(),
    added,updated,unchanged,
    beforeCount,afterCount,rosterAfter
  };
  localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));

  screenshotImportReview=null;
  screenshotImportLastResult=null;
  screenshotImportDraft={images:[],names:[],referenceAt:null,referenceTrusted:false};
  screenshotImportSelection=[];
  window.h2hAiImportBusy=false;

  // Open the imported manager directly so the user can verify the result.
  if(targetManagerId!=='me'){
    data.ui.leagueManager=targetManagerId;
    data.ui.leagueTab='managers';
    page='competition';
  }
  render();

  setTimeout(()=>{
    const status=$('#screenshotImportStatus');
    const lineupText=wantsLineup?` · Aufstellung 11/11${r.committedOwnLineup?.formation?` · ${r.committedOwnLineup.formation}`:''}`:'';
    const text=`Import bestätigt: ${manager?.team||targetManagerId} · ${added} neu · ${updated} geändert · ${unchanged} bereits vorhanden · ${beforeCount} → ${afterCount} Transfers${lineupText}${cloudSaved?' · Cloud gespeichert':' · lokal gespeichert'}`;
    if(status)status.textContent=text;
    toast(`${added} neu · ${updated} geändert`);
  },80);
}
async function analyzeSelectedScreenshots(){
  const status=$('#screenshotImportStatus'),btn=$('#analyzeScreenshotFiles');
  const images=[...screenshotImportDraft.images];
  if(!images.length){
    if(status)status.textContent='Bitte zuerst mindestens einen Screenshot auswählen.';
    return;
  }
  if(images.length>10){
    if(status)status.textContent='Maximal 10 Screenshots pro Analyse.';
    return;
  }
  try{
    if(btn){btn.disabled=true;btn.textContent='Analysiere…'}
    if(status)status.textContent=`${images.length} Screenshot${images.length===1?'':'s'} werden an die AI gesendet…`;
    const managerHint=data.ui?.leagueManager?(managerById(data.ui.leagueManager)?.team||''):'';
    screenshotImportStatusText='Supabase/OpenAI wird aufgerufen…';
    if(status)status.textContent=screenshotImportStatusText;
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),45000);
    const res=await fetch(KICKBASE_AI_ENDPOINT,{signal:controller.signal,
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        images,managerHint,
        screenshotReferenceAt:screenshotImportDraft.referenceAt,
        screenshotReferenceTrusted:screenshotImportDraft.referenceTrusted,
        clientVersion:'2.1.7',
        requestedSchema:'kickbase-screenshot-v2',
        supportedScreenshotTypes:['transfers','lineup-own','lineup-manager','points-results'],
        extractionHint:'Return visible manager/team name, transfers (player,type,price,counterparty,relative_time,confidence) and lineup names when present. Preserve truncated/OCR text; do not invent full player names.'
      })
    });
    clearTimeout(timer);const result=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(result?.details||result?.message||result?.error||`HTTP ${res.status}`);
    aiUsageFromResult(result,images.length);screenshotImportLastResult=result;renderScreenshotAiResult(result);renderAiUsage();
    if(status)status.textContent='Analyse abgeschlossen. Bitte Ergebnis prüfen.';
  }catch(e){
    console.error(e);
    screenshotImportStatusText=`Analyse fehlgeschlagen: ${e?.name==='AbortError'?'Zeitüberschreitung nach 45 Sekunden':(e?.message||String(e))}`;if(status)status.textContent=screenshotImportStatusText
  }finally{
    if(btn){btn.disabled=false;btn.textContent='Mit AI analysieren'}
  }
}

function bind(){bindMoneyFields();
if($('#screenshotImportFiles')){
  const input=$('#screenshotImportFiles'),btn=$('#analyzeScreenshotFiles');
  restoreScreenshotImportUi();
  input.onchange=async e=>{
    const files=[...(e.target.files||[])].filter(f=>String(f.type||'').startsWith('image/')).slice(0,10);
    const status=$('#screenshotImportStatus'),result=$('#screenshotImportResult');
    if(btn)btn.disabled=true;
    if(status)status.textContent=files.length?'Screenshot-Auswahl wird gesichert…':'Noch keine Screenshots ausgewählt.';
    if(!files.length){
      screenshotImportDraft={images:[],names:[],referenceAt:null,referenceTrusted:false};
      if(result)result.innerHTML='';
      restoreScreenshotImportUi();
      return;
    }

    try{
      const images=[];
      for(const f of files)images.push(await fileToDataUrl(f));
      const latestModified=Math.max(...files.map(f=>Number(f.lastModified)||0),0);
      const referenceAt=latestModified?new Date(latestModified).toISOString():new Date().toISOString();
      const referenceTrusted=localIsoDateFromDate(referenceAt)===localIsoDateFromDate(new Date());
      screenshotImportDraft={images,names:files.map(f=>f.name),referenceAt,referenceTrusted};window.h2hAiImportBusy=true;
      screenshotImportSelection=files;
      if(result)result.innerHTML='<div class="screenshot-selection-ok">✓ Auswahl gespeichert – bereit zur AI-Analyse.</div>';
      restoreScreenshotImportUi();
    }catch(err){
      screenshotImportDraft={images:[],names:[],referenceAt:null,referenceTrusted:false};
      if(status)status.textContent=`Screenshot konnte nicht gesichert werden: ${err?.message||String(err)}`;
      if(result)result.innerHTML='';
      if(btn)btn.disabled=true;
    }
  };
}
if($('#analyzeScreenshotFiles'))$('#analyzeScreenshotFiles').onclick=analyzeSelectedScreenshots;


if($('#lineupOwner'))$('#lineupOwner').onchange=e=>{
  data.ui.lineupOwner=e.target.value;
  save();render();
};

bindPlayerAutocomplete({inputId:'pfName',clubId:'pfTeam'});

$$('[data-coach-feedback]').forEach(button=>button.onclick=()=>{coachMemory().add(button.dataset.coachFeedback,actualMatchdayContext().md);toast('Feedback gespeichert – der Saisonrückblick wird damit genauer');render()});

$$('[data-check-page]').forEach(button=>button.onclick=()=>{
  if(button.dataset.checkId==='coach'){sessionStorage.setItem(`coachReadMd${actualMatchdayContext().md}`,'1');render();return}
  goPage(button.dataset.checkPage);
});
$$('.coach-ai-card').forEach(button=>button.addEventListener('click',()=>sessionStorage.setItem(`coachReadMd${actualMatchdayContext().md}`,'1')));

if($('#scoutSearch'))$('#scoutSearch').oninput=e=>deferredFilterUpdate({
  key:'scoutSearch',value:e.target.value,inputId:'scoutSearch'
});
if($('#scoutPosition'))$('#scoutPosition').onchange=e=>{data.ui.scoutPosition=e.target.value;save();render()};
if($('#scoutTeam'))$('#scoutTeam').onchange=e=>{data.ui.scoutTeam=e.target.value;save();render()};

$$('[data-go-page]').forEach(b=>b.onclick=()=>{page=b.dataset.goPage;render();window.scrollTo({top:0,behavior:'smooth'})});
$$('[data-rules-section]').forEach(b=>b.onclick=()=>{data.ui.rulesSection=b.dataset.rulesSection;save();render()});

$$('form').forEach(form=>form.addEventListener('submit',event=>event.preventDefault()));
$$('input').forEach(input=>input.addEventListener('keydown',event=>{if(event.key==='Enter'&&input.type!=='textarea')event.preventDefault()}));

$$('[data-bl-tab]').forEach(b=>b.onclick=()=>{data.ui.bundesligaTab=b.dataset.blTab;save();render()});
if($('#liveTeamFilter'))$('#liveTeamFilter').onchange=e=>{data.ui.bundesligaTeam=e.target.value;save();render()};
if($('#livePlayerSearch'))$('#livePlayerSearch').oninput=e=>deferredFilterUpdate({
  key:'bundesligaSearch',value:e.target.value,inputId:'livePlayerSearch'
});
if($('#scoutTarget'))$('#scoutTarget').onchange=e=>{
  data.ui.scoutTarget=e.target.value;save();render();
};
$$('[data-buy-live-player]').forEach(b=>b.onclick=()=>routeLivePlayer(b.dataset.buyLivePlayer));
$$('[data-club-squad]').forEach(b=>b.onclick=()=>{data.ui.bundesligaTeam=b.dataset.clubSquad;data.ui.bundesligaTab='players';save();render()});
$$('[data-bl-md]').forEach(b=>b.onclick=()=>{data.settings.currentMd=+b.dataset.blMd;touch()});
if($('#blMdSelect'))$('#blMdSelect').onchange=e=>{data.settings.currentMd=+e.target.value;touch()};
$$('[data-transfer-filter]').forEach(b=>b.onclick=()=>{data.ui.transferFilter=b.dataset.transferFilter;save();render()});
if($('#transferSearch'))$('#transferSearch').oninput=e=>{data.ui.transferSearch=e.target.value;save();render()};
$$('[data-manage-transfer]').forEach(b=>b.onclick=()=>manageTransfer(b.dataset.manageTransfer));
$$('[data-league-tab]').forEach(b=>b.onclick=()=>{data.ui.leagueTab=b.dataset.leagueTab;save();render()});
$$('[data-select-league-manager]').forEach(b=>b.onclick=()=>{data.ui.leagueManager=b.dataset.selectLeagueManager;save();render()});
$$('[data-edit-manager-md]').forEach(b=>b.onclick=()=>{const [managerId,md]=b.dataset.editManagerMd.split('|');editOpponentMatchday(managerId,+md)});
$$('[data-add-opponent-transfer]').forEach(b=>b.onclick=()=>addOpponentTransfer(b.dataset.addOpponentTransfer));
$$('[data-delete-opponent-transfer]').forEach(b=>b.onclick=()=>{
  const [managerId,transferId]=b.dataset.deleteOpponentTransfer.split('|');
  const row=managerLeagueData(managerId);
  row.transfers=row.transfers.filter(t=>t.id!==transferId);
  touch();toast('Gegnertransfer gelöscht');
});
$$('[data-view-opponent-lineup]').forEach(b=>b.onclick=()=>{
  const [managerId,md]=b.dataset.viewOpponentLineup.split('|');
  showOpponentLineupAnalysis(managerId,+md);
});
$$('[data-edit-opponent-transfer]').forEach(b=>b.onclick=()=>{const [managerId,transferId]=b.dataset.editOpponentTransfer.split('|');editOpponentTransfer(managerId,transferId)});
$$('[data-delete-opponent-md]').forEach(b=>b.onclick=()=>{const [managerId,md]=b.dataset.deleteOpponentMd.split('|');delete managerLeagueData(managerId).matchdays[md];touch();toast(`Spieltagsdaten ST ${md} gelöscht`)});

if($('#dismissLeagueReminder'))$('#dismissLeagueReminder').onclick=()=>{
  ensureLeagueIntel().reminderDismissed[data.settings.currentMd]=true;
  save();render();
};
$$('[data-set-md]').forEach(b=>b.onclick=()=>{data.settings.currentMd=+b.dataset.setMd;data.ui.leagueTab='current';touch()});$$('[data-change-md]').forEach(b=>b.onclick=()=>{data.settings.currentMd=Math.max(1,Math.min(34,(+data.settings.currentMd||1)+(+b.dataset.changeMd||0)));touch()});
$$('[data-h2h-edit]').forEach(b=>b.onclick=()=>{const [md,h,a]=b.dataset.h2hEdit.split('|');editH2H(md,h,a)});
if($('#liAnalyze'))$('#liAnalyze').onclick=()=>{const changes=detectLiChanges($('#liPaste').value);data.lineupIntel.pending=changes;save();render();toast(changes.length?`${changes.length} Änderung(en) erkannt`:'Keine eindeutigen Änderungen erkannt')};
if($('#liClear'))$('#liClear').onclick=()=>{$('#liPaste').value=''};
if($('#liApply'))$('#liApply').onclick=()=>{(data.lineupIntel.pending||[]).forEach(c=>{const p=data.players.find(x=>x.id===c.playerId);if(p){p.liStatus=c.newStatus;p.liUpdatedAt=new Date().toISOString()}});data.lineupIntel.lastImport=new Date().toISOString();data.lineupIntel.pending=[];touch();toast('LigaInsider-Status übernommen')};
$$('[data-li-remove]').forEach(b=>b.onclick=()=>{data.lineupIntel.pending=(data.lineupIntel.pending||[]).filter(x=>x.playerId!==b.dataset.liRemove);touch()});
$$('[data-li-status]').forEach(s=>s.onchange=()=>{const p=data.players.find(x=>x.id===s.dataset.liStatus);if(p){p.liStatus=s.value;p.liUpdatedAt=new Date().toISOString();data.lineupIntel.lastChecked=new Date().toISOString();touch()}});
$$('[data-quick-bonus]').forEach(b=>b.onclick=()=>addQuickBonus(b.dataset.quickBonus,b.dataset.label,+b.dataset.amount));if($('#buyPlayer'))$('#buyPlayer').onclick=()=>{$('#transferForm').innerHTML=playerForm();bindPlayerForm()};if($('#sellPlayerOpen'))$('#sellPlayerOpen').onclick=()=>{const active=activePlayers();if(!active.length)return toast('Kein aktiver Spieler vorhanden');$('#transferForm').innerHTML=`<div class="card" style="margin-top:16px"><h3>Spieler verkaufen</h3><div class="form-grid" style="margin-top:12px"><label class="wide">Spieler<select id="sellSelect">${active.map(p=>`<option value="${p.id}">${esc(p.name)} · Kaufpreis ${euro(p.buyPrice)}</option>`).join('')}</select></label><div class="full"><button class="btn danger" id="continueSell">Verkauf erfassen</button></div></div></div>`;$('#continueSell').onclick=()=>sellPlayer($('#sellSelect').value)};if($('#dismissLineupRepair'))$('#dismissLineupRepair').onclick=()=>{delete mdRecord(data.settings.currentMd).lineupRepairNotice;save();render()};
if($('#saveLineup'))$('#saveLineup').onclick=()=>{
  const r=mdRecord(data.settings.currentMd);
  const validation=lineupValidation(r.lineup,{complete:true});
  if(!validation.ok)return toast(validation.message);
  data.settings.lineupSize=11;
  delete r.lineupInheritedFrom;
  delete r.lineupInheritedAt;
  captureCoachSnapshot(data.settings.currentMd);
  save();render();toast(`Startelf im ${validation.formation.code} gespeichert`);
};if($('#useRecommendation'))$('#useRecommendation').onclick=()=>{
  const recommended=coachOptimizedLineup(data.settings.currentMd);
  if(recommended.length!==11)return toast('Für keine gültige Formation sind aktuell genügend Spieler vorhanden');
  mdRecord(data.settings.currentMd).lineup=recommended.map(p=>p.id);
  delete mdRecord(data.settings.currentMd).lineupInheritedFrom;
  delete mdRecord(data.settings.currentMd).lineupInheritedAt;
  data.settings.lineupSize=11;
  captureCoachSnapshot(data.settings.currentMd);
  touch();
  const formation=exactFormation(mdRecord(data.settings.currentMd).lineup);
  toast(`Coach-Empfehlung ${formation?.code||''} übernommen`);
};$$('[data-squad-view]').forEach(b=>b.onclick=()=>{
  $$('[data-squad-view]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');

  const owner=data.ui?.lineupOwner||'me';
  if(owner!=='me'&&b.dataset.squadView==='coach'){
    renderOpponentCoachTab(owner);
    return;
  }

  const key=b.dataset.squadView[0].toUpperCase()+b.dataset.squadView.slice(1);
  $('#squadView').innerHTML=$(`#view${key}`).innerHTML;
  bindSquadCards();
  bindOpponentSquadCards();
});
bindSquadCards();
bindOpponentSquadCards();$$('[data-sell-player]').forEach(b=>b.onclick=()=>sellPlayer(b.dataset.sellPlayer));$$('[data-edit-transfer]').forEach(b=>b.onclick=()=>editTransfer(b.dataset.editTransfer));$$('[data-delete-transfer]').forEach(b=>b.onclick=()=>deleteTransfer(b.dataset.deleteTransfer));$$('[data-points]').forEach(e=>e.onchange=()=>{mdRecord(data.settings.currentMd).points[e.dataset.points]=e.value===''?null:+e.value;save();render()});if($('#saveMd'))$('#saveMd').onclick=()=>{const r=mdRecord(data.settings.currentMd);Object.assign(r,{mvp:$('#mdMvp').value.trim(),soldPlayer:$('#mdSold').value,soldDate:$('#mdSoldDate').value,soldPrice:+$('#mdSoldPrice').value||0});save();render()};if($('#addFinance'))$('#addFinance').onclick=showFinanceForm;$$('[data-del-fin]').forEach(b=>b.onclick=()=>{data.finances=data.finances.filter(x=>x.id!==b.dataset.delFin);touch()});if($('#addOpponent'))$('#addOpponent').onclick=()=>{const name=prompt('Name des Managers:');if(!name)return;data.opponents.push({id:id(),name,teamName:prompt('Teamname (optional):')||'',squadValue:+prompt('Bekannter Kaderwert (optional):')||0,note:prompt('Notiz (optional):')||''});touch()};$$('[data-del-opp]').forEach(b=>b.onclick=()=>{data.opponents=data.opponents.filter(x=>x.id!==b.dataset.delOpp);touch()});if($('#addH2H'))$('#addH2H').onclick=()=>{const opponent=prompt('Gegner:');if(!opponent)return;data.h2h.push({id:id(),md:data.settings.currentMd,opponent,myPoints:+prompt('Deine Punkte:')||0,oppPoints:+prompt('Gegnerpunkte:')||0});touch()};if($('#resetStrengths'))$('#resetStrengths').onclick=()=>{data.teamStrength={...TEAM_STRENGTH_BASELINE};data.teamStrengthDetails={};data.teamStrengthCloudUpdatedAt='';touch();toast('Basiswerte geladen')};if($('#saveSettings'))$('#saveSettings').onclick=()=>{data.settings.startCapital=parseMoney($('#setCapital').value);data.settings.lineupSize=11;data.settings.homeBonus=+$('#setHome').value;$$('[data-strength]').forEach(x=>data.teamStrength[x.dataset.strength]=+x.value);data.finances.find(x=>x.id==='start').amount=data.settings.startCapital;touch()};$$('[data-strength]').forEach(x=>x.onchange=()=>{data.teamStrength[x.dataset.strength]=+x.value;save()})}
function setLineupState(pid,toLineup){
  const r=mdRecord(data.settings.currentMd);
  if(!Array.isArray(r.lineup))r.lineup=[];

  const player=activePlayers().find(p=>p.id===pid);
  if(!player)return false;
  const isStarter=r.lineup.includes(pid);

  if(toLineup){
    if(isStarter)return false;

    if(r.lineup.length>=11){
      // Smart swap: select the weakest removable starter that creates a valid formation.
      const validSwaps=r.lineup.map(removeId=>{
        const candidate=r.lineup.filter(id=>id!==removeId).concat(pid);
        const formation=exactFormation(candidate);
        const removed=activePlayers().find(p=>p.id===removeId);
        return formation&&removed?{
          candidate,formation,removed,
          removedScore:coachPlayerScore(removed,data.settings.currentMd)
        }:null;
      }).filter(Boolean).sort((a,b)=>a.removedScore-b.removedScore);

      const swap=validSwaps[0];
      if(!swap){
        toast('Mit diesem Spieler ist aus der aktuellen Elf keine gültige Formation möglich.');
        return false;
      }
      r.lineup=swap.candidate;
      r.lastSmartSwap={
        incoming:player.name,
        outgoing:swap.removed.name,
        formation:swap.formation.code,
        date:new Date().toISOString()
      };
      data.settings.lineupSize=11;
      return true;
    }

    const candidate=[...r.lineup,pid];
    const validation=lineupValidation(candidate);
    if(!validation.ok){
      toast(validation.message);
      return false;
    }
    r.lineup=candidate;
  }else{
    if(!isStarter)return false;
    const currentValidation=lineupValidation(r.lineup);
    const candidate=r.lineup.filter(x=>x!==pid);

    // An invalid legacy state must never trap the user.
    if(!currentValidation.ok){
      r.lineup=candidate;
      data.settings.lineupSize=11;
      return true;
    }

    const validation=lineupValidation(candidate);
    if(!validation.ok){
      toast(validation.message);
      return false;
    }
    r.lineup=candidate;
  }
  data.settings.lineupSize=11;
  return true;
}

function swapLineupOrderV219b(sourceId,targetId){
  if(!sourceId||!targetId||sourceId===targetId)return false;
  const active=activePlayers();
  const source=active.find(p=>p.id===sourceId);
  const target=active.find(p=>p.id===targetId);
  if(!source||!target)return false;
  const sp=lineupPositionOf(source);
  const tp=lineupPositionOf(target);
  if(!sp||sp!==tp){
    toast('Optisches Tauschen ist nur innerhalb derselben Position möglich.');
    return false;
  }
  const r=mdRecord(data.settings.currentMd);
  if(!Array.isArray(r.lineup)||!r.lineup.includes(sourceId)||!r.lineup.includes(targetId))return false;
  const a=r.lineup.indexOf(sourceId),b=r.lineup.indexOf(targetId);
  [r.lineup[a],r.lineup[b]]=[r.lineup[b],r.lineup[a]];
  save();render();
  toast(`${source.name} ↔ ${target.name}`);
  return true;
}

function finishLineupMove(pid,zone){
  if(!pid||!zone)return;
  const changed=setLineupState(pid,zone==='lineup');
  if(changed){
    const record=mdRecord(data.settings.currentMd);
    const swap=record.lastSmartSwap;
    save();
    render();
    if(zone==='lineup'&&swap){
      toast(`${swap.incoming} für ${swap.outgoing} · Formation jetzt ${swap.formation}`);
      delete record.lastSmartSwap;
      save();
    }else{
      toast(zone==='lineup'?'Spieler aufgestellt':'Spieler auf die Bank gesetzt');
    }
  }
}

let lineupAutoScrollFrame=null;
let lineupAutoScrollSpeed=0;

function stopLineupAutoScroll(){
  lineupAutoScrollSpeed=0;
  if(lineupAutoScrollFrame!==null)cancelAnimationFrame(lineupAutoScrollFrame);
  lineupAutoScrollFrame=null;
}
function updateLineupAutoScroll(clientY){
  const edge=Math.min(150,Math.max(80,window.innerHeight*.16));
  let speed=0;
  if(clientY<edge){
    const ratio=(edge-clientY)/edge;
    speed=-Math.max(4,Math.round(24*ratio));
  }else if(clientY>window.innerHeight-edge){
    const ratio=(clientY-(window.innerHeight-edge))/edge;
    speed=Math.max(4,Math.round(24*ratio));
  }

  lineupAutoScrollSpeed=speed;
  if(!speed){
    stopLineupAutoScroll();
    return;
  }
  if(lineupAutoScrollFrame!==null)return;

  const step=()=>{
    if(!lineupAutoScrollSpeed){
      lineupAutoScrollFrame=null;
      return;
    }
    window.scrollBy({top:lineupAutoScrollSpeed,left:0,behavior:'auto'});
    lineupAutoScrollFrame=requestAnimationFrame(step);
  };
  lineupAutoScrollFrame=requestAnimationFrame(step);
}

function bindSquadCards(){
  // Tap/click remains the reliable mobile fallback.
  $$('[data-toggle-lineup]').forEach(card=>{
    card.onclick=event=>{
      if(event.defaultPrevented||card.dataset.dragged==='1')return;
      const pid=card.dataset.toggleLineup;
      const r=mdRecord(data.settings.currentMd);
      if(!Array.isArray(r.lineup))r.lineup=[];
      const changed=setLineupState(pid,!r.lineup.includes(pid));
      if(changed){
        const swap=r.lastSmartSwap;
        save();render();
        if(swap){toast(`${swap.incoming} für ${swap.outgoing} · Formation jetzt ${swap.formation}`);delete r.lastSmartSwap;save()}
      }
    };
  });

  // 2.1.9b: Dropping a starter directly onto another starter of the same
  // position only changes their visual order, not the formation.
  $$('[data-swap-target]').forEach(target=>{
    target.addEventListener('dragover',event=>{
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect='move';
      target.classList.add('drag-over');
    });
    target.addEventListener('dragleave',()=>target.classList.remove('drag-over'));
    target.addEventListener('drop',event=>{
      event.preventDefault();
      event.stopPropagation();
      target.classList.remove('drag-over');
      const sourceId=event.dataTransfer.getData('text/plain');
      swapLineupOrderV219b(sourceId,target.dataset.swapTarget);
    });
  });

  // Native drag/drop for laptop browsers.
  $$('[data-drag-player]').forEach(card=>{
    card.addEventListener('dragstart',event=>{
      card.dataset.dragged='1';
      event.dataTransfer.effectAllowed='move';
      event.dataTransfer.setData('text/plain',card.dataset.dragPlayer);
      card.classList.add('dragging');
    });
    card.addEventListener('dragend',()=>{
      stopLineupAutoScroll();
      card.classList.remove('dragging');
      setTimeout(()=>delete card.dataset.dragged,100);
      $$('.drop-zone').forEach(z=>z.classList.remove('drag-over'));
    });
  });
  $$('.drop-zone').forEach(zone=>{
    zone.addEventListener('dragover',event=>{
      event.preventDefault();
      updateLineupAutoScroll(event.clientY);
      event.dataTransfer.dropEffect='move';
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
    zone.addEventListener('drop',event=>{
      event.preventDefault();
      stopLineupAutoScroll();
      zone.classList.remove('drag-over');
      finishLineupMove(event.dataTransfer.getData('text/plain'),zone.dataset.dropZone);
    });
  });

  // Long-press pointer drag for Android/Samsung.
  $$('[data-drag-player]').forEach(card=>{
    let timer=null,active=false,ghost=null,startX=0,startY=0,pointerId=null;
    const clean=()=>{
      stopLineupAutoScroll();
      clearTimeout(timer);timer=null;
      if(ghost)ghost.remove();
      ghost=null;active=false;
      card.classList.remove('dragging');
      document.body.classList.remove('lineup-dragging');
      try{if(pointerId!==null)card.releasePointerCapture(pointerId)}catch{}
      pointerId=null;
    };
    card.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse')return;
      startX=event.clientX;startY=event.clientY;pointerId=event.pointerId;
      timer=setTimeout(()=>{
        active=true;card.dataset.dragged='1';
        card.setPointerCapture(pointerId);
        ghost=card.cloneNode(true);
        ghost.className='drag-ghost';
        ghost.style.left=`${event.clientX}px`;ghost.style.top=`${event.clientY}px`;
        document.body.appendChild(ghost);
        card.classList.add('dragging');
        document.body.classList.add('lineup-dragging');
        navigator.vibrate?.(25);
      },280);
    });
    card.addEventListener('pointermove',event=>{
      if(!active){
        if(Math.hypot(event.clientX-startX,event.clientY-startY)>12)clearTimeout(timer);
        return;
      }
      event.preventDefault();
      updateLineupAutoScroll(event.clientY);
      ghost.style.left=`${event.clientX}px`;ghost.style.top=`${event.clientY}px`;
      $$('.drop-zone').forEach(z=>z.classList.remove('drag-over'));
      const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.drop-zone');
      target?.classList.add('drag-over');
    });
    const end=event=>{
      clearTimeout(timer);
      if(active){
        event.preventDefault();
        const hit=document.elementFromPoint(event.clientX,event.clientY);
        const swapTarget=hit?.closest('[data-swap-target]');
        const target=hit?.closest('.drop-zone');
        const pid=card.dataset.dragPlayer;
        clean();
        setTimeout(()=>delete card.dataset.dragged,120);
        if(swapTarget&&swapTarget.dataset.swapTarget!==pid)swapLineupOrderV219b(pid,swapTarget.dataset.swapTarget);
        else if(target)finishLineupMove(pid,target.dataset.dropZone);
      }else clean();
    };
    card.addEventListener('pointerup',end);
    card.addEventListener('pointercancel',clean);
  });

  const contentRoot=document.getElementById('content');
  if(contentRoot){
    contentRoot.ondragover=event=>{
      if(document.querySelector('.drag-player.dragging')){
        event.preventDefault();
        updateLineupAutoScroll(event.clientY);
      }
    };
    contentRoot.ondrop=()=>stopLineupAutoScroll();
  }
  window.addEventListener('blur',stopLineupAutoScroll,{once:true});

  $$('[data-edit-player]').forEach(button=>button.onclick=event=>{
    event.stopPropagation();
    $('#modalArea').innerHTML=playerForm(data.players.find(p=>p.id===button.dataset.editPlayer));
    bindPlayerForm(button.dataset.editPlayer);
  });
}
function bindPlayerForm(editId){
  bindMoneyFields();
  const teamSelect=$('#pfTeam');
  if(teamSelect){
    teamSelect.addEventListener('change',()=>{
      const holder=document.querySelector('.transfer-form-heading p');
      if(holder)holder.innerHTML=bundesligaIdentity(teamSelect.value,{logoClass:'form-club-crest'});
    });
  }
  bindTransferDraft();
  const button=$('#savePlayer');
  if(!button)return;
  button.type='button';
  button.onclick=()=>{
    const d=readTransferDraft();
    if(!editId&&activePlayers().length>=14)return toast('Maximal 14 aktive Spieler');
    const p=editId?data.players.find(x=>x.id===editId):{id:id()};
    if(!p)return toast('Spieler konnte nicht geladen werden');

    const name=$('#pfName').value.trim();
    const buyDate=$('#pfDate').value;
    const buyPrice=parseMoney($('#pfBuy').value);
    if(!name)return toast('Bitte einen Spielernamen eintragen');
    if(!buyDate)return toast('Bitte das Kaufdatum eintragen');
    if(!buyPrice)return toast('Bitte den Kaufpreis eintragen');const buyReasons=selectedBuyReasons($('#transferForm'));if(!buyReasons.length)return toast('Bitte mindestens einen Kaufgrund auswählen');
    if($('#pfBuySource').value==='Mitspieler'&&!$('#pfBuyCounterparty').value)
      return toast('Bitte den Mitspieler auswählen');

    const wasNew=!editId;
    Object.assign(p,{
      name,
      team:$('#pfTeam').value,
      position:$('#pfPos').value,
      buyDate,
      buyPrice,
      marketAtBuy:parseMoney($('#pfMwb').value),
      marketValue:parseMoney($('#pfMw').value),
      avgPoints:+$('#pfAvg').value||0,
      buySource:$('#pfBuySource').value,
      buyCounterparty:$('#pfBuySource').value==='Mitspieler'?$('#pfBuyCounterparty').value.trim():'',
      buyReasons,buyReason:buyReasons.join(' · '),
      note:$('#pfNote').value,
      liStatus:p.liStatus||'Unbekannt',
      externalPlayerId:p.externalPlayerId||d.externalPlayerId||null,
      photoUrl:p.photoUrl||d.photoUrl||''
    });

    if(wasNew){
      clearTransferDraft();
      data.players.push(p);
      const finance={
        id:id(),date:p.buyDate,type:'Spielerkauf',
        description:`Kauf ${p.name} von ${p.buySource||'Transfermarkt'}${p.buyCounterparty?' ('+p.buyCounterparty+')':''}`,
        amount:-p.buyPrice
      };
      data.finances.push(finance);
      p.buyFinanceId=finance.id;
    }else{
      syncTransferFinance(p);
    }
    touch();
    toast(wasNew?'Spieler gekauft':'Spielerdaten gespeichert');
  };
}
function sellPlayer(pid){const p=data.players.find(x=>x.id===pid);$('#modalArea').innerHTML=`<div class="modal-backdrop"><div class="card modal-card"><div class="section-head"><div><h2>${esc(p.name)} verkaufen</h2><p>Ursprünglicher Kaufpreis: ${euro(p.buyPrice)}</p></div><button class="btn secondary" id="closeSell">Schließen</button></div><div class="form-grid" style="margin-top:14px"><label>Verkaufsdatum<input id="sellDate" type="date" value="${localDateISO()}"></label><label>Verkaufspreis (€)<input id="sellPrice" class="money-field" inputmode="numeric" placeholder="z. B. 11.407.285 €"></label><label>Marktwert beim Verkauf (€)<input id="sellMarketValue" class="money-field" inputmode="numeric" value="${moneyInput(p.marketValue||0)}"></label><label>Verkauft an<select id="sellSource">${TRANSFER_SOURCES.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label>Mitspieler<select id="sellCounterparty"><option value="">Bitte auswählen</option>${otherManagerOptions('')}</select></label><label class="wide">Verkaufsgrund<select id="sellReason">${SELL_REASONS.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><div class="full"><button type="button" class="btn danger" id="confirmSell">Verkauf speichern</button></div></div></div></div>`;bindMoneyFields();$('#closeSell').onclick=()=>{$('#modalArea').innerHTML=''};$('#confirmSell').onclick=()=>{const date=$('#sellDate').value,price=parseMoney($('#sellPrice').value),marketValueAtSale=parseMoney($('#sellMarketValue').value),reason=$('#sellReason').value,source=$('#sellSource').value,counterparty=source==='Mitspieler'?$('#sellCounterparty').value.trim():'';if(!date||!price)return toast('Datum und Verkaufspreis eintragen');if(marketValueAtSale&&price<marketValueAtSale)return toast('Regelverstoß: Verkauf unter aktuellem Marktwert ist nicht erlaubt');if(source==='Mitspieler'&&!counterparty)return toast('Bitte den Mitspieler auswählen');Object.assign(p,{soldDate:date,salePrice:price,marketValueAtSale,saleReason:reason,saleSource:source,saleCounterparty:counterparty});const finance={id:id(),date,type:'Spielerverkauf',description:`Verkauf ${p.name} an ${source}${counterparty?' ('+counterparty+')':''}`,amount:price};data.finances.push(finance);p.saleFinanceId=finance.id;$('#modalArea').innerHTML='';touch()}}
function bindMoneyFields(){$$('.money-field').forEach(el=>{const format=()=>{const n=parseMoney(el.value);el.value=n?`${moneyInput(n)} €`:''};el.addEventListener('focus',()=>{const n=parseMoney(el.value);el.value=n?moneyInput(n):''});el.addEventListener('blur',format);if(el.value)format()})}
function addQuickBonus(kind,label,amount){const date=localDateISO(),type=kind==='daily'?'Tagesanmeldebonus':'Erfolgsbonus';if(kind==='daily'&&data.finances.some(x=>x.date===date&&x.type==='Tagesanmeldebonus')){if(!confirm('Für heute ist bereits ein Tagesanmeldebonus vorhanden. Trotzdem noch einmal buchen?'))return}data.finances.push({id:id(),date,type,description:label,amount});touch();toast(`${label}: ${euro(amount)} gebucht`)}
function showFinanceForm(){$('#financeForm').innerHTML=`<div class="notice" style="margin-top:14px"><div class="form-grid"><label>Datum<input id="ffDate" type="date" value="${localDateISO()}"></label><label>Typ<select id="ffType">${['Tagesanmeldebonus','Erfolgsbonus','Punktebonus','Admin-Gutschrift','Admin-Strafe','Korrektur','Sonstiges'].map(x=>`<option>${x}</option>`).join('')}</select></label><label class="wide">Beschreibung<input id="ffDesc"></label><label>Betrag (+/−) (€)<input id="ffAmount" class="money-field" inputmode="numeric" placeholder="z. B. 1.000.000 €"></label><div><button class="btn" id="saveFinance">Speichern</button></div></div></div>`;bindMoneyFields();$('#saveFinance').onclick=()=>{data.finances.push({id:id(),date:$('#ffDate').value,type:$('#ffType').value,description:$('#ffDesc').value,amount:parseMoney($('#ffAmount').value)});touch()}}
function exportData(){const a=document.createElement('a'),blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});a.href=URL.createObjectURL(blob);a.download=`kickbase-coach-v06-${localDateISO()}.json`;a.click();URL.revokeObjectURL(a.href)}function importData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{data=mergeData(JSON.parse(r.result));save();render();toast('Sicherung geladen')}catch{alert('Ungültige Datei')}};r.readAsText(f)}init();


function debugNormalizeTokens(value){
  return String(value||'').toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function rawMasterDebug(alias){
  const target=debugNormalizeTokens(alias).at(-1)||'';
  const rows=Array.isArray(window.BUNDESLIGA_PLAYERS)?window.BUNDESLIGA_PLAYERS:[];
  const matches=rows.filter(p=>{
    const lastField=debugNormalizeTokens(p.last_name||p.lastName||'').at(-1)||'';
    const lastName=debugNormalizeTokens(p.name||'').at(-1)||'';
    return target && (lastField===target || lastName===target);
  }).map(p=>({
    id:p.external_id ?? p.id ?? null,
    name:p.name||'',
    first_name:p.first_name||p.firstName||'',
    last_name:p.last_name||p.lastName||'',
    team:p.team||'',
    position:p.position||''
  }));
  return {alias,target,count:matches.length,matches};
}

function renderRawMasterDebug(){
  const host=document.querySelector('#canonicalDiagnostics') || document.querySelector('#canonicalCleanupStatus');
  if(!host)return;

  const aliases=['Gosens','Kohr','Tape','García','Deman','Erevbenagie','Anton','Olise','Götze','Pedersen','Lienhart','Kristof','Beste','Conté','Pruhs','Schwolow','Burke'];
  const results=aliases.map(rawMasterDebug);
  const total=(window.BUNDESLIGA_PLAYERS||[]).length;

  host.innerHTML=`
    <div style="margin-top:10px;padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px">
      <b>RAW MASTER DEBUG 2.1.7-debug</b><br>
      <span>${total} rohe BUNDESLIGA_PLAYERS im Browser</span>
      <div style="margin-top:8px;display:grid;gap:6px">
        ${results.map(r=>`
          <div>
            <b>${esc(r.alias)}</b> → ${r.count} Treffer
            ${r.count ? `<span> · ${r.matches.map(x=>`${esc(x.name)} [${esc(String(x.id??'—'))}] · ${esc(x.team||'—')} · ${esc(x.position||'—')}`).join(' | ')}</span>` : ''}
          </div>`).join('')}
      </div>
    </div>`;
}

window.rawMasterDebug=rawMasterDebug;
window.renderRawMasterDebug=renderRawMasterDebug;

document.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#runCanonicalCleanup');
  if(!btn)return;
  setTimeout(()=>{renderRawMasterDebug();setTimeout(()=>renderDirectHandlerTrace(),30)},80);
});


function renderPersistentCleanupPreviewV215s(result){
  const status=document.querySelector('#canonicalCleanupStatus');
  if(!status)return;
  let box=document.querySelector('#persistentCleanupPreviewV215s');
  if(!box){
    box=document.createElement('div');
    box.id='persistentCleanupPreviewV215s';
    box.style.cssText='margin-top:12px;padding:14px;border:1px solid rgba(98,209,146,.45);border-radius:12px;background:rgba(26,60,52,.35);line-height:1.45;font-size:13px';
    status.insertAdjacentElement('afterend',box);
  }
  const aliases=(result.aliasMatches||[]).slice(0,30);
  const unresolved=(result.unresolved||[]).slice(0,30);
  const merged=(result.mergedDetails||[]).slice(0,30);
  box.innerHTML=`
    <div style="font-weight:800;font-size:15px;margin-bottom:6px">2.1.7 – ISOLIERTE VORSCHAU · KEINE DATENÄNDERUNG</div>
    <div><b>Master-Spieler:</b> ${result.masterPlayers||0}</div>
    <div><b>Namen:</b> ${result.renamed||0} · <b>Vereine:</b> ${result.clubs||0}</div>
    <div><b>Transfer-Dubletten:</b> ${result.mergedTransfers||0} · <b>Spieler-Dubletten:</b> ${result.mergedPlayers||0}</div>
    <div><b>Transfers:</b> ${result.beforeTransfers||0} → ${result.afterTransfers||0}</div>
    <div><b>Spielerdatensätze:</b> ${result.beforePlayers||0} → ${result.afterPlayers||0}</div>
    ${aliases.length?`<div style="margin-top:8px"><b>Erkannte Zuordnungen:</b><br>${aliases.map(esc).join(' · ')}</div>`:''}
    ${merged.length?`<div style="margin-top:8px"><b>Würde zusammenführen:</b><br>${merged.map(esc).join(' · ')}</div>`:''}
    ${unresolved.length?`<div style="margin-top:8px"><b>Offen:</b><br>${unresolved.map(x=>esc(`${x.player}${x.reason?` – ${x.reason}`:''}`)).join(' · ')}</div>`:''}
    <div style="margin-top:10px;opacity:.8">Reine Simulation auf einer Kopie. Dieser Kasten bleibt bis zum Neuladen sichtbar.</div>`;
}

document.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#runCanonicalCleanup');
  if(!btn)return;
  e.preventDefault();
  if(window.__v215bCleanupRunning)return;
  btn.disabled=true;btn.textContent='Prüfe Vorschau…';
  const status=$('#canonicalCleanupStatus');
  const diag=canonicalDiagnosticSnapshot();
  if(status)status.textContent=`Prüfe ${diag.masterCount} Master-Spieler · ${diag.matches.filter(x=>x.match!=='—').length}/${diag.matches.length} Diagnose-Nachnamen erkannt…`;
  setTimeout(()=>{
    const result=previewV215sCanonicalCleanup();
    if(result.ok){
      try{renderPersistentCleanupPreviewV215s(result);}catch(e){console.error('persistent preview',e)}
      if(status)status.innerHTML=`<b>Fertig:</b> ${result.renamed} Namen · ${result.clubs} Vereine · ${result.mergedTransfers} Transfer-Dubletten · ${result.mergedPlayers} Spieler-Dubletten<br><span>${result.masterPlayers||0} Bundesliga-Masterspieler · ${result.beforeTransfers}→${result.afterTransfers} Transfers · ${result.beforePlayers}→${result.afterPlayers} Spielerdatensätze</span>${result.aliasMatches?.length?`<br><span>Matches: ${result.aliasMatches.slice(0,10).map(esc).join(' · ')}</span>`:''}${result.unresolved?.length?`<br><span>Offen zur Prüfung: ${result.unresolved.slice(0,10).map(x=>esc(x.player)).join(' · ')}</span>`:''}`;
      toast('Vorschau fertig – keine Daten gespeichert');
      btn.disabled=false;btn.textContent='Vorschau erneut prüfen';
    }else{
      if(status)status.textContent=`Fehler: ${result.message||'Bereinigung fehlgeschlagen'}`;
      btn.disabled=false;btn.textContent='Erneut versuchen';
    }
  },40);
});
