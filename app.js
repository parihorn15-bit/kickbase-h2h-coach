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
const MANAGER_OPTIONS=LEAGUE_MANAGERS.filter(x=>!x.isMe);
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
const defaults={version:7,ui:{transferFilter:'all',transferSearch:'',leagueTab:'current'},settings:{currentMd:1,mode:'quick',startCapital:200000000,homeBonus:1,lineupSize:11},players:[],finances:[{id:'start',date:'2026-08-01',type:'Startkapital',description:'Start ohne Kader',amount:200000000}],matchdays:[],opponents:[],h2h:[],leagueManagers:LEAGUE_MANAGERS,lineupIntel:{pending:[],lastImport:''},teamStrength:Object.fromEntries(TEAMS.map(t=>[t,5]))};
let data=load(),page='dashboard';function mergeData(x){return {...structuredClone(defaults),...x,version:7,ui:{...defaults.ui,...x.ui},settings:{...defaults.settings,...x.settings},leagueManagers:LEAGUE_MANAGERS,lineupIntel:{...defaults.lineupIntel,...x.lineupIntel},teamStrength:{...defaults.teamStrength,...x.teamStrength}}}function load(){try{const raw=localStorage.getItem('kickbaseCoachV07')||localStorage.getItem('kickbaseCoachV06')||localStorage.getItem('kickbaseCoachV05')||localStorage.getItem('kickbaseCoachV04')||localStorage.getItem('kickbaseCoachV03')||localStorage.getItem('kickbaseCoachV2');return raw?mergeData(JSON.parse(raw)):mergeData(SEEDED_DATA)}catch{return mergeData(SEEDED_DATA)}}function save(){localStorage.setItem('kickbaseCoachV07',JSON.stringify(data));if(window.cloudQueueSave)window.cloudQueueSave();toast('Gespeichert')}function touch(){save();render()}function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1300)}
const activePlayers=()=>data.players.filter(p=>!p.soldDate);const soldPlayers=()=>data.players.filter(p=>p.soldDate);const financeTotal=()=>data.finances.reduce((a,x)=>a+(+x.amount||0),0);const squadValue=()=>activePlayers().reduce((a,p)=>a+(+p.marketValue||0),0);const wealth=()=>financeTotal()+squadValue();const realized=()=>soldPlayers().reduce((a,p)=>a+(+p.salePrice||0)-(+p.buyPrice||0),0);const unrealized=()=>activePlayers().reduce((a,p)=>a+(+p.marketValue||0)-(+p.buyPrice||0),0);
function fixture(team,md=data.settings.currentMd){const f=FIXTURES.find(x=>x.md===md&&(x.home===team||x.away===team));if(!f)return null;return{opp:f.home===team?f.away:f.home,ha:f.home===team?'H':'A',date:f.date}}function strength(t){return +data.teamStrength[t]||5}function matchup(p,md=data.settings.currentMd){const f=fixture(p.team,md);if(!f)return 5;return Math.max(1,Math.min(10,5+strength(p.team)-strength(f.opp)+(f.ha==='H'?+data.settings.homeBonus:0)))}function score(p){return (+p.avgPoints||0)+matchup(p)*10+(LI_SCORE[p.liStatus||'Unbekannt']||0)}function rankPlayers(){return [...activePlayers()].sort((a,b)=>score(b)-score(a))}function mdRecord(md){let x=data.matchdays.find(x=>x.md===md);if(!x){x={id:id(),md,mvp:'',points:{},lineup:[],soldPlayer:'',soldDate:'',soldPrice:0};data.matchdays.push(x)}return x}function top3(md){const r=mdRecord(md);return activePlayers().map(p=>({p,pts:+r.points[p.id]||0})).sort((a,b)=>b.pts-a.pts).slice(0,3)}function mandatoryStatus(md){const r=mdRecord(md),mvpOwned=activePlayers().find(p=>p.name.trim().toLowerCase()===r.mvp.trim().toLowerCase());const top=top3(md);let valid=false,required='';if(!r.mvp)return{state:'waiting',text:'Bundesliga-MVP fehlt'};if(mvpOwned){required=mvpOwned.name;valid=r.soldPlayer===required}else{required='Wahl aus: '+top.map(x=>x.p.name).filter(Boolean).join(', ');valid=top.some(x=>x.p.name===r.soldPlayer)}return{state:valid?'done':'open',text:valid?'Erledigt':required,mvpOwned:!!mvpOwned}}
const nav=[['dashboard','🏠 Dashboard'],['squad','👥 Kader'],['matchday','⚽ Spieltag'],['transfers','💸 Transfers'],['finances','💰 Finanzen'],['analysis','📊 Analyse'],['lineupintel','🩺 LigaInsider'],['competition','🏆 Liga'],['settings','⚙️ Einstellungen']];function init(){const n=$('#nav');n.innerHTML=nav.map(([k,l])=>`<button class="nav-btn" data-page="${k}">${l}</button>`).join('');$$('[data-page]').forEach(b=>b.onclick=()=>{page=b.dataset.page;render();$('#sidebar').classList.remove('open')});$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');$('#currentMd').innerHTML=Array.from({length:34},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('');$('#currentMd').value=data.settings.currentMd;$('#currentMd').onchange=e=>{data.settings.currentMd=+e.target.value;touch()};$$('[data-mode]').forEach(b=>b.onclick=()=>{data.settings.mode=b.dataset.mode;touch()});$('#exportBtn').onclick=exportData;$('#importFile').onchange=importData;$('#resetBtn').onclick=()=>{if(confirm('Wirklich alle Daten löschen?')){localStorage.removeItem('kickbaseCoachV05');localStorage.removeItem('kickbaseCoachV04');localStorage.removeItem('kickbaseCoachV03');localStorage.removeItem('kickbaseCoachV2');data=mergeData(SEEDED_DATA);touch()}};render()}
function render(){document.body.classList.toggle('analysis',data.settings.mode==='analysis');$$('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===data.settings.mode));$$('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));const titles={dashboard:['Dashboard','Schnelle Entscheidungen und offene Aufgaben.'],squad:['Kader','Wen stelle ich auf? Startelf und Bank für jeden Spieltag.'],matchday:['Spieltag','Punkte, Bundesliga-MVP und Pflichtverkauf.'],transfers:['Transfers','Hier kaufst und verkaufst du Spieler. Der Kader aktualisiert sich automatisch.'],finances:['Finanzen','Startkapital, Boni und sämtliche Geldbewegungen.'],analysis:['Analyse','Tiefe Auswertungen, wenn du mehr Zeit hast.'],lineupintel:['LigaInsider-Abgleich','Voraussichtliche Aufstellungen halbautomatisch prüfen und übernehmen.'],competition:['Konkurrenz','Optional: Manager, Kader und H2H-Ergebnisse.'],settings:['Einstellungen','Teamstärken, Matchups und Grundwerte.']};$('#pageTitle').textContent=titles[page][0];$('#pageSub').textContent=titles[page][1];$('#content').innerHTML=({dashboard,squad,matchday,transfers,finances,analysis,lineupintel,competition,settings}[page])();bind()}
function dashboard(){const md=data.settings.currentMd,rank=rankPlayers(),m=mandatoryStatus(md),fx=FIXTURES.filter(x=>x.md===md);const decisions=[];if(activePlayers().length<11)decisions.push(['bad',`Nur ${activePlayers().length} Spieler im Kader – Startelf noch unvollständig.`]);if(m.state==='open')decisions.push(['bad',`Pflichtverkauf offen: ${m.text}`]);if(m.state==='waiting')decisions.push(['warn','Bundesliga-MVP nach dem Spieltag noch eintragen.']);rank.slice(0,3).forEach(p=>decisions.push(['good',`${p.name}: Matchup ${matchup(p).toFixed(1)}/10 gegen ${fixture(p.team)?.opp||'–'}.`]));return `<div class="grid kpis"><div class="card kpi"><span>Kontostand</span><strong>${euro(financeTotal())}</strong><small>Start: ${euro(data.settings.startCapital)}</small></div><div class="card kpi"><span>Teamwert</span><strong>${euro(squadValue())}</strong><small>${activePlayers().length}/14 Spieler</small></div><div class="card kpi"><span>Gesamtvermögen</span><strong>${euro(wealth())}</strong><small>Budget + Teamwert</small></div><div class="card kpi"><span>Pflichtverkauf</span><strong>${m.state==='done'?'✅':m.state==='open'?'🚨':'⏳'}</strong><small>${esc(m.text)}</small></div></div><div class="grid two" style="margin-top:17px"><div class="card"><div class="section-head"><div><h2>Entscheidungs-Center</h2><p>Was jetzt besonders wichtig ist.</p></div></div>${decisions.length?decisions.map(x=>`<div class="decision ${x[0]}">${esc(x[1])}</div>`).join(''):'<div class="empty">Kader anlegen, dann erscheinen Empfehlungen.</div>'}</div><div class="card"><div class="section-head"><div><h2>Empfohlene Startelf</h2><p>Ø Punkte plus Matchup-Score.</p></div></div>${rank.length?rank.slice(0,data.settings.lineupSize).map((p,i)=>`<div class="bar-row"><span>${i+1}. ${esc(p.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,score(p)/2.5)}%"></div></div><b>${score(p).toFixed(0)}</b></div>`).join(''):'<div class="empty">Noch kein Kader vorhanden.</div>'}</div></div><div class="grid two analysis-only" style="margin-top:17px"><div class="card"><h2>Partien – Spieltag ${md}</h2><div class="fixtures" style="margin-top:13px">${fx.map(f=>`<div class="fixture"><span class="home">${esc(f.home)}</span><small>${esc(f.date)}</small><span>${esc(f.away)}</span></div>`).join('')}</div></div><div class="card"><h2>Finanzlage</h2><div class="decision good" style="margin-top:13px">Realisierter Transfergewinn: ${euro(realized())}</div><div class="decision">Unrealisierte Marktwertentwicklung: ${euro(unrealized())}</div><div class="decision ${financeTotal()<0?'bad':''}">Verfügbares Budget: ${euro(financeTotal())}</div></div></div>`}
function squad(){const r=mdRecord(data.settings.currentMd);const active=activePlayers();if(!Array.isArray(r.lineup))r.lineup=[];r.lineup=r.lineup.filter(pid=>active.some(p=>p.id===pid)).slice(0,data.settings.lineupSize);const recommended=rankPlayers().slice(0,data.settings.lineupSize).map(p=>p.id);const displayLineup=r.lineup.length?r.lineup:recommended;const starters=displayLineup.map(pid=>active.find(p=>p.id===pid)).filter(Boolean);const bench=active.filter(p=>!displayLineup.includes(p.id));const card=(p,isStarter)=>{const f=fixture(p.team),gain=(+p.marketValue||0)-(+p.buyPrice||0);return `<article class="player-card clickable ${isStarter?'lineup-card':'bench-card'}" data-toggle-lineup="${p.id}"><span class="pill ${isStarter?'good':'warn'} slot-badge">${isStarter?'STARTELF':'BANK'}</span><div class="name">${esc(p.name)}</div><div class="club">${esc(p.team)} · ${esc(p.position||'')}</div><div style="margin-top:8px"><span class="pill ${liStatusClass(p.liStatus)}">${esc(p.liStatus||'Unbekannt')}</span></div><div class="metrics"><div class="metric"><span>Gegner</span><b>${f?`${esc(f.opp)} (${f.ha})`:'–'}</b></div><div class="metric"><span>Matchup</span><b>${matchup(p).toFixed(1)}/10</b></div><div class="metric"><span>Ø Punkte</span><b>${(+p.avgPoints||0).toFixed(1)}</b></div><div class="metric"><span>Marktwerttrend</span><b class="${gain>=0?'money-pos':'money-neg'}">${euro(gain)}</b></div></div><div class="actions"><button class="btn small secondary" data-edit-player="${p.id}">Details</button><span class="muted" style="font-size:11px">Antippen: ${isStarter?'auf Bank':'in Startelf'}</span></div></article>`};return `<div class="status-strip"><div class="progress-ring" style="--pct:${Math.min(100,starters.length/data.settings.lineupSize*100)}%"><b>${starters.length}/${data.settings.lineupSize}</b></div><div><b>Aufstellung für Spieltag ${data.settings.currentMd}</b><div class="muted" style="font-size:12px">${r.lineup.length?'Manuell gespeichert':'Aktuell wird die Empfehlung angezeigt. Speichern übernimmt sie.'}</div></div><div class="toolbar" style="margin-left:auto"><button class="btn secondary" id="useRecommendation">Empfehlung übernehmen</button><button class="btn" id="saveLineup">Startelf speichern</button></div></div><div class="squad-tabs" style="margin-top:17px"><button class="squad-tab active" data-squad-view="lineup">⭐ Startelf (${starters.length})</button><button class="squad-tab" data-squad-view="bench">🪑 Bank (${bench.length})</button><button class="squad-tab" data-squad-view="all">📋 Gesamtkader (${active.length})</button><button class="squad-tab" data-squad-view="stats">📊 Details</button></div><div id="squadView"><div class="player-grid">${starters.map(p=>card(p,true)).join('')||'<div class="empty-soft">Noch keine Startelf. Nutze die Empfehlung oder tippe Bankspieler an.</div>'}</div></div><template id="viewLineup"><div class="player-grid">${starters.map(p=>card(p,true)).join('')||'<div class="empty-soft">Noch keine Startelf gewählt.</div>'}</div></template><template id="viewBench"><div class="player-grid">${bench.map(p=>card(p,false)).join('')||'<div class="empty-soft">Keine Bankspieler.</div>'}</div></template><template id="viewAll"><div class="player-grid">${active.map(p=>card(p,displayLineup.includes(p.id))).join('')||'<div class="empty-soft">Noch kein Spieler im Kader. Käufe erfasst du unter Transfers.</div>'}</div></template><template id="viewStats"><div class="card"><div class="table-wrap"><table><thead><tr><th>Spieler</th><th>Kaufpreis</th><th>Marktwert</th><th>Unrealisiert</th><th>Ø Punkte</th><th>LigaInsider</th><th>Gegner</th></tr></thead><tbody>${active.map(p=>{const f=fixture(p.team);return `<tr><td><b>${esc(p.name)}</b><br><span class="muted">${esc(p.team)}</span></td><td>${euro(p.buyPrice)}</td><td>${euro(p.marketValue)}</td><td class="${(+p.marketValue-+p.buyPrice)>=0?'money-pos':'money-neg'}">${euro(+p.marketValue-+p.buyPrice)}</td><td>${(+p.avgPoints||0).toFixed(1)}</td><td><span class="pill ${liStatusClass(p.liStatus)}">${esc(p.liStatus||'Unbekannt')}</span></td><td>${f?`${esc(f.opp)} (${f.ha})`:'–'}</td></tr>`}).join('')}</tbody></table></div></div></template><div id="modalArea"></div>`}
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
  const filter=data.ui?.transferFilter||'all';
  const search=(data.ui?.transferSearch||'').trim().toLocaleLowerCase('de-DE');
  const all=[...data.players].sort((a,b)=>(b.buyDate||'').localeCompare(a.buyDate||''));
  const rows=all.filter(p=>{
    const statusOk=filter==='all'||(filter==='active'&&!p.soldDate)||(filter==='sold'&&p.soldDate);
    const text=[p.name,p.team,p.position,p.buyReason,p.saleReason,p.buySource,p.saleSource,p.buyCounterparty,p.saleCounterparty].join(' ').toLocaleLowerCase('de-DE');
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
      <td><b>${esc(p.name)}</b><small>${esc(p.team)} · ${esc(p.position||'')}</small></td>
      <td>${esc(p.buyDate||'–')}</td>
      <td>${esc(p.buySource||'Transfermarkt')}${p.buyCounterparty?`<small>${esc(p.buyCounterparty)}</small>`:''}</td>
      <td>${euro(p.buyPrice)}</td>
      <td class="optional-col">${esc(p.buyReason||'–')}</td>
      <td><span class="pill ${p.soldDate?'neutral':'good'}">${p.soldDate?'Verkauft':'Im Kader'}</span></td>
      <td>${p.soldDate?esc(p.soldDate):'–'}</td>
      <td class="optional-col">${p.soldDate?`${esc(p.saleSource||'Transfermarkt')}${p.saleCounterparty?`<small>${esc(p.saleCounterparty)}</small>`:''}`:'–'}</td>
      <td>${p.soldDate?euro(p.salePrice):'–'}</td>
      <td class="${gain>=0?'money-pos':'money-neg'}">${euro(gain)}</td>
      <td class="action-cell"><button class="gear-button" data-manage-transfer="${p.id}" title="Transfer verwalten" aria-label="Transfer von ${esc(p.name)} verwalten">⚙</button></td>
    </tr>`;
  }).join('');
  return `<div class="transfer-actions">
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
    </div>
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
function finances(){const bonuses=data.finances.filter(x=>!['Startkapital','Spielerkauf','Spielerverkauf'].includes(x.type)).reduce((a,x)=>a+(+x.amount||0),0);return `<div class="grid kpis"><div class="card kpi"><span>Startkapital</span><strong>${euro(data.settings.startCapital)}</strong></div><div class="card kpi"><span>Boni</span><strong>${euro(bonuses)}</strong></div><div class="card kpi"><span>Kontostand</span><strong>${euro(financeTotal())}</strong></div><div class="card kpi"><span>Gesamtvermögen</span><strong>${euro(wealth())}</strong></div></div><div class="grid two" style="margin-top:17px"><div class="card"><div class="section-head"><div><h2>Schnellbonus</h2><p>Ein Klick übernimmt Betrag und Beschreibung.</p></div></div><h3 style="margin:14px 0 8px">Tagesanmeldebonus</h3><div class="quick-grid">${DAILY_BONUSES.map(x=>`<button class="quick-money" data-quick-bonus="daily" data-label="${esc(x.label)}" data-amount="${x.amount}"><span>${esc(x.label)}</span><b>${euro(x.amount)}</b></button>`).join('')}</div><h3 style="margin:18px 0 8px">Erfolgsbonus</h3><div class="quick-grid achievements">${ACHIEVEMENT_BONUSES.map(x=>`<button class="quick-money" data-quick-bonus="achievement" data-label="${esc(x.label)}" data-amount="${x.amount}"><span>${esc(x.label)}</span><b>${euro(x.amount)}</b></button>`).join('')}</div></div><div class="card"><div class="section-head"><div><h2>Finanzbuchungen</h2><p>Boni, Korrekturen und Geldbewegungen.</p></div><button class="btn" id="addFinance">Eigene Buchung</button></div><div class="table-wrap"><table><thead><tr><th>Datum</th><th>Typ</th><th>Beschreibung</th><th>Betrag</th><th></th></tr></thead><tbody>${[...data.finances].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.type)}</td><td>${esc(x.description)}</td><td class="${+x.amount>=0?'money-pos':'money-neg'}">${euro(x.amount)}</td><td>${x.id==='start'?'':`<button class="btn danger small" data-del-fin="${x.id}">×</button>`}</td></tr>`).join('')}</tbody></table></div><div id="financeForm"></div></div></div>`}
function analysis(){const max=Math.max(1,...data.players.map(p=>Math.abs((p.soldDate?+p.salePrice:+p.marketValue)-(+p.buyPrice||0))));return `<div class="grid two"><div class="card"><h2>Spielerwertentwicklung</h2>${data.players.length?data.players.map(p=>{const g=(p.soldDate?+p.salePrice:+p.marketValue)-(+p.buyPrice||0);return `<div class="bar-row"><span>${esc(p.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.abs(g)/max*100}%;background:${g>=0?'linear-gradient(90deg,#22c55e,#22d3ee)':'#ef4444'}"></div></div><b class="${g>=0?'money-pos':'money-neg'}">${euro(g)}</b></div>`}).join(''):'<div class="empty">Keine Daten.</div>'}</div><div class="card"><h2>Kennzahlen</h2><div class="decision good" style="margin-top:13px">Effizientester Spieler: ${esc([...data.players].sort((a,b)=>(+b.avgPoints/(+b.buyPrice||1))-(+a.avgPoints/(+a.buyPrice||1)))[0]?.name||'–')}</div><div class="decision">Bester Matchup-Score: ${esc(rankPlayers()[0]?.name||'–')}</div><div class="decision">Realisierter Gewinn: ${euro(realized())}</div><div class="decision">Unrealisierter Gewinn: ${euro(unrealized())}</div></div></div><div class="card" style="margin-top:17px"><h2>Nächste fünf Spieltage</h2><div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Spieler</th>${[0,1,2,3,4].map(i=>`<th>ST ${data.settings.currentMd+i}</th>`).join('')}</tr></thead><tbody>${activePlayers().map(p=>`<tr><td><b>${esc(p.name)}</b></td>${[0,1,2,3,4].map(i=>{const f=fixture(p.team,data.settings.currentMd+i);return `<td>${f?`${esc(f.opp)} (${f.ha})`:'–'}</td>`}).join('')}</tr>`).join('')}</tbody></table></div></div>`}

function liStatusClass(status){
  if(status==='Voraussichtliche Startelf')return 'good';
  if(status==='Fällt aus'||status==='Ersatzbank')return 'bad';
  if(status==='Fraglich'||status==='Alternative')return 'warn';
  return 'neutral';
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
    id:m.id,team:m.team,manager:m.manager,isMe:m.isMe||false,
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
function competition(){
  const currentMd=+data.settings.currentMd||1;
  const tab=data.ui?.leagueTab||'current';
  const schedule=H2H_SCHEDULE.filter(x=>x.md===currentMd);
  const myGame=schedule.find(x=>x.home==='me'||x.away==='me');
  const otherGames=schedule.filter(x=>x!==myGame);
  const resultFor=g=>(data.h2h||[]).find(x=>+x.md===+g.md&&((x.homeId===g.home&&x.awayId===g.away)||(x.homeId===g.away&&x.awayId===g.home)));
  const matchBlock=(g,featured=false)=>{
    if(!g)return '';
    const result=resultFor(g),home=managerById(g.home),away=managerById(g.away);
    return `<article class="${featured?'featured-match':'small-match'}">
      ${featured?`<div class="featured-label">Dein Duell · Spieltag ${currentMd}</div>`:''}
      <div class="match-row">
        <div class="match-team"><div class="team-monogram">${esc((home?.team||'?').slice(0,2).toUpperCase())}</div><b>${esc(home?.team||g.home)}</b><small>${esc(home?.manager||'')}</small></div>
        <div class="match-score">${result?`${result.homePoints} : ${result.awayPoints}`:'VS'}</div>
        <div class="match-team"><div class="team-monogram">${esc((away?.team||'?').slice(0,2).toUpperCase())}</div><b>${esc(away?.team||g.away)}</b><small>${esc(away?.manager||'')}</small></div>
      </div>
      <button class="btn secondary match-edit" data-h2h-edit="${currentMd}|${g.home}|${g.away}">${result?'Ergebnis bearbeiten':'Ergebnis eintragen'}</button>
    </article>`;
  };
  const currentContent=`<div class="league-current-clean">
    ${matchBlock(myGame,true)}
    <div class="other-matches-head">Weitere Paarungen</div>
    <div class="other-matches-grid">${otherGames.map(g=>matchBlock(g,false)).join('')}</div>
  </div>`;
  const scheduleContent=`<div class="league-schedule-list">${Array.from({length:34},(_,i)=>i+1).map(md=>{
    const game=H2H_SCHEDULE.find(x=>x.md===md&&(x.home==='me'||x.away==='me'));
    const opp=game?(game.home==='me'?game.away:game.home):null;
    const res=game?resultFor(game):null;
    return `<button class="schedule-row ${md===currentMd?'active':''}" data-set-md="${md}">
      <span class="schedule-md">ST ${md}</span>
      <span class="schedule-opponent">${esc(managerById(opp)?.team||'–')}<small>${esc(managerById(opp)?.manager||'')}</small></span>
      <span class="schedule-result">${res?`${res.homePoints} : ${res.awayPoints}`:'–'}</span>
      <span>›</span>
    </button>`;
  }).join('')}</div>`;
  const standings=calculateLeagueTable();
  const teamsContent=`<div class="league-table-wrap"><table class="league-table"><thead><tr><th>#</th><th>Team</th><th>Sp.</th><th>S</th><th>U</th><th>N</th><th>Diff.</th><th>Pkt.</th></tr></thead><tbody>${standings.map((r,i)=>`<tr class="${r.isMe?'my-table-row':''}"><td>${i+1}</td><td><b>${esc(r.team)}</b><small>${esc(r.manager)}${r.isMe?' · Du':''}</small></td><td>${r.played}</td><td>${r.wins}</td><td>${r.draws}</td><td>${r.losses}</td><td>${r.pointsFor-r.pointsAgainst>=0?'+':''}${r.pointsFor-r.pointsAgainst}</td><td><b>${r.tablePoints}</b></td></tr>`).join('')}</tbody></table></div>`;
  const content=tab==='schedule'?scheduleContent:tab==='teams'?teamsContent:currentContent;
  return `<div class="card league-clean-shell">
    <div class="league-clean-header">
      <div><h2>H2H-Liga</h2><p>Spieltag, eigener Spielplan und Tabelle – klar getrennt.</p></div>
      <div class="current-md-badge">Spieltag ${currentMd}</div>
    </div>
    <div class="league-tabs clean-tabs">
      <button data-league-tab="current" class="${tab==='current'?'active':''}">Aktueller Spieltag</button>
      <button data-league-tab="schedule" class="${tab==='schedule'?'active':''}">Mein Spielplan</button>
      <button data-league-tab="teams" class="${tab==='teams'?'active':''}">Tabelle</button>
    </div>
    <div class="league-tab-content">${content}</div>
  </div>
  <div id="competitionModal"></div>`;
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
function settings(){return `<div class="grid two"><div class="card"><h2>Grundlagen</h2><div class="form-grid" style="margin-top:14px"><label>Startkapital (€)<input id="setCapital" class="money-field" inputmode="numeric" value="${moneyInput(data.settings.startCapital)}"></label><label>Startelf-Größe<input id="setLineup" type="number" min="1" max="14" value="${data.settings.lineupSize}"></label><label>Heimbonus<input id="setHome" type="number" step="0.5" value="${data.settings.homeBonus}"></label><div><button class="btn" id="saveSettings">Speichern</button></div></div><div class="notice" style="margin-top:15px">Der Marktwert beim Kauf ist optional. Er ist für den echten Transfergewinn nicht nötig, aber hilfreich zur Bewertung deines Einkaufspreises.</div></div><div class="card"><h2>Teamstärken 1–10</h2><div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Verein</th><th>Stärke</th></tr></thead><tbody>${TEAMS.map(t=>`<tr><td>${esc(t)}</td><td><input type="number" min="1" max="10" data-strength="${esc(t)}" value="${data.teamStrength[t]||5}"></td></tr>`).join('')}</tbody></table></div></div></div>`}

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
      <div><h2>${esc(p.name)}</h2><p>${esc(p.team)} · ${esc(p.position||'')}</p></div>
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
  <label>Kaufgrund<select id="teBuyReason">${BUY_REASONS.map(x=>`<option ${p.buyReason===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
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
    if(!$('#teName').value.trim()||!$('#teBuyDate').value||!parseMoney($('#teBuyPrice').value))return toast('Name, Kaufdatum und Kaufpreis sind erforderlich');
    if((soldDate&&!salePrice)||(!soldDate&&salePrice))return toast('Für einen Verkauf Datum und Preis gemeinsam eintragen');if($('#teBuySource').value==='Mitspieler'&&!$('#teBuyCounterparty').value)return toast('Mitspieler beim Kauf auswählen');if(soldDate&&$('#teSaleSource').value==='Mitspieler'&&!$('#teSaleCounterparty').value)return toast('Mitspieler beim Verkauf auswählen');
    Object.assign(p,{
      name:$('#teName').value.trim(),team:$('#teTeam').value,position:$('#tePos').value,
      buyDate:$('#teBuyDate').value,buyPrice:parseMoney($('#teBuyPrice').value),
      buySource:$('#teBuySource').value,buyCounterparty:$('#teBuySource').value==='Mitspieler'?$('#teBuyCounterparty').value.trim():'',
      buyReason:$('#teBuyReason').value,marketValue:parseMoney($('#teMarketValue').value),
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

function playerForm(p={}){return `<div class="card" style="margin-top:16px"><h3>${p.id?'Spielerdetails bearbeiten':'Spieler kaufen'}</h3><div class="form-grid" style="margin-top:12px"><label>Name<input id="pfName" value="${esc(p.name||'')}"></label><label>Verein<select id="pfTeam">${TEAMS.map(t=>`<option ${p.team===t?'selected':''}>${esc(t)}</option>`).join('')}</select></label><label>Position<select id="pfPos">${['Tor','Abwehr','Mittelfeld','Sturm'].map(x=>`<option ${p.position===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Kaufdatum<input id="pfDate" type="date" value="${esc(p.buyDate||'')}"></label><label>Kaufpreis (€)<input id="pfBuy" class="money-field" inputmode="numeric" value="${p.buyPrice?moneyInput(p.buyPrice):''}" placeholder="z. B. 5.071.935 €"></label><label>Marktwert beim Kauf (€) – optional<input id="pfMwb" class="money-field" inputmode="numeric" value="${p.marketAtBuy?moneyInput(p.marketAtBuy):''}"></label><label>Aktueller Marktwert (€)<input id="pfMw" class="money-field" inputmode="numeric" value="${p.marketValue?moneyInput(p.marketValue):''}"></label><label>Ø Punkte<input id="pfAvg" type="number" step="0.1" value="${p.avgPoints||''}"></label><label>Gekauft von<select id="pfBuySource">${TRANSFER_SOURCES.map(x=>`<option ${p.buySource===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Mitspieler<select id="pfBuyCounterparty"><option value="">Bitte auswählen</option>${otherManagerOptions(p.buyCounterparty||'')}</select></label><label class="wide">Kaufgrund<select id="pfBuyReason">${BUY_REASONS.map(x=>`<option ${p.buyReason===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label class="wide">Notiz<input id="pfNote" value="${esc(p.note||'')}"></label><div class="full"><button class="btn" id="savePlayer">Speichern</button></div></div></div>`}
function bind(){bindMoneyFields();
$$('[data-transfer-filter]').forEach(b=>b.onclick=()=>{data.ui.transferFilter=b.dataset.transferFilter;save();render()});
if($('#transferSearch'))$('#transferSearch').oninput=e=>{data.ui.transferSearch=e.target.value;save();render()};
$$('[data-manage-transfer]').forEach(b=>b.onclick=()=>manageTransfer(b.dataset.manageTransfer));
$$('[data-league-tab]').forEach(b=>b.onclick=()=>{data.ui.leagueTab=b.dataset.leagueTab;save();render()});
$$('[data-set-md]').forEach(b=>b.onclick=()=>{data.settings.currentMd=+b.dataset.setMd;data.ui.leagueTab='current';touch()});
$$('[data-h2h-edit]').forEach(b=>b.onclick=()=>{const [md,h,a]=b.dataset.h2hEdit.split('|');editH2H(md,h,a)});
if($('#liAnalyze'))$('#liAnalyze').onclick=()=>{const changes=detectLiChanges($('#liPaste').value);data.lineupIntel.pending=changes;save();render();toast(changes.length?`${changes.length} Änderung(en) erkannt`:'Keine eindeutigen Änderungen erkannt')};
if($('#liClear'))$('#liClear').onclick=()=>{$('#liPaste').value=''};
if($('#liApply'))$('#liApply').onclick=()=>{(data.lineupIntel.pending||[]).forEach(c=>{const p=data.players.find(x=>x.id===c.playerId);if(p){p.liStatus=c.newStatus;p.liUpdatedAt=new Date().toISOString()}});data.lineupIntel.lastImport=new Date().toISOString();data.lineupIntel.pending=[];touch();toast('LigaInsider-Status übernommen')};
$$('[data-li-remove]').forEach(b=>b.onclick=()=>{data.lineupIntel.pending=(data.lineupIntel.pending||[]).filter(x=>x.playerId!==b.dataset.liRemove);touch()});
$$('[data-li-status]').forEach(s=>s.onchange=()=>{const p=data.players.find(x=>x.id===s.dataset.liStatus);if(p){p.liStatus=s.value;p.liUpdatedAt=new Date().toISOString();touch()}});
$$('[data-quick-bonus]').forEach(b=>b.onclick=()=>addQuickBonus(b.dataset.quickBonus,b.dataset.label,+b.dataset.amount));if($('#buyPlayer'))$('#buyPlayer').onclick=()=>{$('#transferForm').innerHTML=playerForm();bindPlayerForm()};if($('#sellPlayerOpen'))$('#sellPlayerOpen').onclick=()=>{const active=activePlayers();if(!active.length)return toast('Kein aktiver Spieler vorhanden');$('#transferForm').innerHTML=`<div class="card" style="margin-top:16px"><h3>Spieler verkaufen</h3><div class="form-grid" style="margin-top:12px"><label class="wide">Spieler<select id="sellSelect">${active.map(p=>`<option value="${p.id}">${esc(p.name)} · Kaufpreis ${euro(p.buyPrice)}</option>`).join('')}</select></label><div class="full"><button class="btn danger" id="continueSell">Verkauf erfassen</button></div></div></div>`;$('#continueSell').onclick=()=>sellPlayer($('#sellSelect').value)};if($('#saveLineup'))$('#saveLineup').onclick=()=>{const r=mdRecord(data.settings.currentMd);if(!r.lineup.length)r.lineup=rankPlayers().slice(0,data.settings.lineupSize).map(p=>p.id);save();render();toast('Startelf gespeichert')};if($('#useRecommendation'))$('#useRecommendation').onclick=()=>{mdRecord(data.settings.currentMd).lineup=rankPlayers().slice(0,data.settings.lineupSize).map(p=>p.id);touch()};$$('[data-squad-view]').forEach(b=>b.onclick=()=>{$$('[data-squad-view]').forEach(x=>x.classList.remove('active'));b.classList.add('active');const key=b.dataset.squadView[0].toUpperCase()+b.dataset.squadView.slice(1);$('#squadView').innerHTML=$(`#view${key}`).innerHTML;bindSquadCards()});bindSquadCards();$$('[data-sell-player]').forEach(b=>b.onclick=()=>sellPlayer(b.dataset.sellPlayer));$$('[data-edit-transfer]').forEach(b=>b.onclick=()=>editTransfer(b.dataset.editTransfer));$$('[data-delete-transfer]').forEach(b=>b.onclick=()=>deleteTransfer(b.dataset.deleteTransfer));$$('[data-points]').forEach(e=>e.onchange=()=>{mdRecord(data.settings.currentMd).points[e.dataset.points]=e.value===''?null:+e.value;save();render()});if($('#saveMd'))$('#saveMd').onclick=()=>{const r=mdRecord(data.settings.currentMd);Object.assign(r,{mvp:$('#mdMvp').value.trim(),soldPlayer:$('#mdSold').value,soldDate:$('#mdSoldDate').value,soldPrice:+$('#mdSoldPrice').value||0});save();render()};if($('#addFinance'))$('#addFinance').onclick=showFinanceForm;$$('[data-del-fin]').forEach(b=>b.onclick=()=>{data.finances=data.finances.filter(x=>x.id!==b.dataset.delFin);touch()});if($('#addOpponent'))$('#addOpponent').onclick=()=>{const name=prompt('Name des Managers:');if(!name)return;data.opponents.push({id:id(),name,teamName:prompt('Teamname (optional):')||'',squadValue:+prompt('Bekannter Kaderwert (optional):')||0,note:prompt('Notiz (optional):')||''});touch()};$$('[data-del-opp]').forEach(b=>b.onclick=()=>{data.opponents=data.opponents.filter(x=>x.id!==b.dataset.delOpp);touch()});if($('#addH2H'))$('#addH2H').onclick=()=>{const opponent=prompt('Gegner:');if(!opponent)return;data.h2h.push({id:id(),md:data.settings.currentMd,opponent,myPoints:+prompt('Deine Punkte:')||0,oppPoints:+prompt('Gegnerpunkte:')||0});touch()};if($('#saveSettings'))$('#saveSettings').onclick=()=>{data.settings.startCapital=parseMoney($('#setCapital').value);data.settings.lineupSize=+$('#setLineup').value;data.settings.homeBonus=+$('#setHome').value;$$('[data-strength]').forEach(x=>data.teamStrength[x.dataset.strength]=+x.value);data.finances.find(x=>x.id==='start').amount=data.settings.startCapital;touch()};$$('[data-strength]').forEach(x=>x.onchange=()=>{data.teamStrength[x.dataset.strength]=+x.value;save()})}
function bindSquadCards(){$$('[data-toggle-lineup]').forEach(c=>c.onclick=e=>{if(e.target.closest('button'))return;const r=mdRecord(data.settings.currentMd),pid=c.dataset.toggleLineup;if(!Array.isArray(r.lineup)||!r.lineup.length)r.lineup=rankPlayers().slice(0,data.settings.lineupSize).map(p=>p.id);if(r.lineup.includes(pid))r.lineup=r.lineup.filter(x=>x!==pid);else{if(r.lineup.length>=data.settings.lineupSize)return toast(`Maximal ${data.settings.lineupSize} Spieler in der Startelf`);r.lineup.push(pid)}touch()});$$('[data-edit-player]').forEach(b=>b.onclick=e=>{e.stopPropagation();$('#modalArea').innerHTML=playerForm(data.players.find(p=>p.id===b.dataset.editPlayer));bindPlayerForm(b.dataset.editPlayer)})}
function bindPlayerForm(editId){$('#savePlayer').onclick=()=>{if(!editId&&activePlayers().length>=14)return toast('Maximal 14 aktive Spieler');const p=editId?data.players.find(x=>x.id===editId):{id:id()};const wasNew=!editId;if($('#pfBuySource').value==='Mitspieler'&&!$('#pfBuyCounterparty').value)return toast('Bitte den Mitspieler auswählen');Object.assign(p,{name:$('#pfName').value.trim(),team:$('#pfTeam').value,position:$('#pfPos').value,buyDate:$('#pfDate').value,buyPrice:parseMoney($('#pfBuy').value),marketAtBuy:parseMoney($('#pfMwb').value),marketValue:parseMoney($('#pfMw').value),avgPoints:+$('#pfAvg').value||0,buySource:$('#pfBuySource').value,buyCounterparty:$('#pfBuySource').value==='Mitspieler'?$('#pfBuyCounterparty').value.trim():'',buyReason:$('#pfBuyReason').value,note:$('#pfNote').value,liStatus:p.liStatus||'Unbekannt'});if(wasNew){data.players.push(p);const finance={id:id(),date:p.buyDate,type:'Spielerkauf',description:`Kauf ${p.name} von ${p.buySource||'Transfermarkt'}${p.buyCounterparty?' ('+p.buyCounterparty+')':''}`,amount:-p.buyPrice};data.finances.push(finance);p.buyFinanceId=finance.id}else syncTransferFinance(p);touch()}}
function sellPlayer(pid){const p=data.players.find(x=>x.id===pid);$('#modalArea').innerHTML=`<div class="modal-backdrop"><div class="card modal-card"><div class="section-head"><div><h2>${esc(p.name)} verkaufen</h2><p>Ursprünglicher Kaufpreis: ${euro(p.buyPrice)}</p></div><button class="btn secondary" id="closeSell">Schließen</button></div><div class="form-grid" style="margin-top:14px"><label>Verkaufsdatum<input id="sellDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>Verkaufspreis (€)<input id="sellPrice" class="money-field" inputmode="numeric" placeholder="z. B. 11.407.285 €"></label><label>Verkauft an<select id="sellSource">${TRANSFER_SOURCES.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label>Mitspieler<select id="sellCounterparty"><option value="">Bitte auswählen</option>${otherManagerOptions('')}</select></label><label class="wide">Verkaufsgrund<select id="sellReason">${SELL_REASONS.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><div class="full"><button class="btn danger" id="confirmSell">Verkauf speichern</button></div></div></div></div>`;bindMoneyFields();$('#closeSell').onclick=()=>{$('#modalArea').innerHTML=''};$('#confirmSell').onclick=()=>{const date=$('#sellDate').value,price=parseMoney($('#sellPrice').value),reason=$('#sellReason').value,source=$('#sellSource').value,counterparty=source==='Mitspieler'?$('#sellCounterparty').value.trim():'';if(!date||!price)return toast('Datum und Verkaufspreis eintragen');if(source==='Mitspieler'&&!counterparty)return toast('Bitte den Mitspieler auswählen');Object.assign(p,{soldDate:date,salePrice:price,saleReason:reason,saleSource:source,saleCounterparty:counterparty});const finance={id:id(),date,type:'Spielerverkauf',description:`Verkauf ${p.name} an ${source}${counterparty?' ('+counterparty+')':''}`,amount:price};data.finances.push(finance);p.saleFinanceId=finance.id;$('#modalArea').innerHTML='';touch()}}
function bindMoneyFields(){$$('.money-field').forEach(el=>{const format=()=>{const n=parseMoney(el.value);el.value=n?`${moneyInput(n)} €`:''};el.addEventListener('focus',()=>{const n=parseMoney(el.value);el.value=n?moneyInput(n):''});el.addEventListener('blur',format);if(el.value)format()})}
function addQuickBonus(kind,label,amount){const date=new Date().toISOString().slice(0,10),type=kind==='daily'?'Tagesanmeldebonus':'Erfolgsbonus';if(kind==='daily'&&data.finances.some(x=>x.date===date&&x.type==='Tagesanmeldebonus')){if(!confirm('Für heute ist bereits ein Tagesanmeldebonus vorhanden. Trotzdem noch einmal buchen?'))return}data.finances.push({id:id(),date,type,description:label,amount});touch();toast(`${label}: ${euro(amount)} gebucht`)}
function showFinanceForm(){$('#financeForm').innerHTML=`<div class="notice" style="margin-top:14px"><div class="form-grid"><label>Datum<input id="ffDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>Typ<select id="ffType">${['Tagesanmeldebonus','Erfolgsbonus','Punktebonus','Admin-Gutschrift','Admin-Strafe','Korrektur','Sonstiges'].map(x=>`<option>${x}</option>`).join('')}</select></label><label class="wide">Beschreibung<input id="ffDesc"></label><label>Betrag (+/−) (€)<input id="ffAmount" class="money-field" inputmode="numeric" placeholder="z. B. 1.000.000 €"></label><div><button class="btn" id="saveFinance">Speichern</button></div></div></div>`;bindMoneyFields();$('#saveFinance').onclick=()=>{data.finances.push({id:id(),date:$('#ffDate').value,type:$('#ffType').value,description:$('#ffDesc').value,amount:parseMoney($('#ffAmount').value)});touch()}}
function exportData(){const a=document.createElement('a'),blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});a.href=URL.createObjectURL(blob);a.download=`kickbase-coach-v06-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)}function importData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{data=mergeData(JSON.parse(r.result));save();render();toast('Sicherung geladen')}catch{alert('Ungültige Datei')}};r.readAsText(f)}init();
