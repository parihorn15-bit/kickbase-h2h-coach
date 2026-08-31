(() => {
  const VERSION='2.3.0-dev17.0';
  let ctx=null;
  const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const pos=v=>{const k=norm(v);if(/tor|goal|keeper|gk/.test(k))return'Tor';if(/abwehr|defence|defender|verteid|back/.test(k))return'Abwehr';if(/mittel|midfield|midfielder|mid/.test(k))return'Mittelfeld';if(/sturm|angriff|offence|forward|striker|attack/.test(k))return'Sturm';return''};
  const FORMS=[['3-4-3',3,4,3],['3-5-2',3,5,2],['4-3-3',4,3,3],['4-4-2',4,4,2],['4-5-1',4,5,1],['5-2-3',5,2,3],['5-3-2',5,3,2],['5-4-1',5,4,1]];
  function resolveName(name){
    const raw=String(name||'').trim();if(!raw)return null;
    let r=null;try{r=window.h2h230CanonicalIdentity?.(raw)||null}catch{}
    if(!r?.name)try{r=window.h2h230MasterResolve?.(raw,{})||null}catch{}
    if(!r?.name){const rows=Array.isArray(window.BUNDESLIGA_PLAYERS)?window.BUNDESLIGA_PLAYERS:[];const exact=rows.filter(p=>norm(p.name)===norm(raw)||norm(p.last_name)===norm(raw));if(exact.length===1)r=exact[0]}
    if(!r?.name)return {raw,name:raw,resolved:false,position:'',team:''};
    return {raw,name:String(r.name),resolved:true,position:pos(r.kickbase_position||r.kickbasePosition||r.position||''),team:String(r.team||''),externalPlayerId:r.externalPlayerId??r.external_id??r.id??null};
  }
  function parseNames(text){return String(text||'').split(/\n|,|;|\t/).map(s=>s.replace(/^[-•\d.)\s]+/,'').trim()).filter(Boolean)}
  function buildLogical(names){
    const resolved=names.map(resolveName),unresolved=resolved.filter(x=>!x.resolved),by={Tor:[],Abwehr:[],Mittelfeld:[],Sturm:[]};
    resolved.filter(x=>x.resolved).forEach(x=>{if(by[x.position])by[x.position].push(x)});
    let best=null;
    for(const [code,d,m,s] of FORMS){if(by.Tor.length<1||by.Abwehr.length<d||by.Mittelfeld.length<m||by.Sturm.length<s)continue;const lineup=[by.Tor[0],...by.Abwehr.slice(0,d),...by.Mittelfeld.slice(0,m),...by.Sturm.slice(0,s)];const used=new Set(lineup.map(x=>norm(x.name)));const bank=resolved.filter(x=>x.resolved&&!used.has(norm(x.name)));const candidate={code,lineup,bank,resolved,unresolved};if(!best||bank.length<best.bank.length)best=candidate}
    if(!best&&resolved.filter(x=>x.resolved).length===11&&by.Tor.length===1){const code=`${by.Abwehr.length}-${by.Mittelfeld.length}-${by.Sturm.length}`;best={code,lineup:[...by.Tor,...by.Abwehr,...by.Mittelfeld,...by.Sturm],bank:[],resolved,unresolved,nonStandard:true}}
    return best||{code:'',lineup:[],bank:resolved.filter(x=>x.resolved),resolved,unresolved,error:'Keine plausible vollständige Formation aus den erkannten Positionen möglich.'};
  }
  function rowFor(){try{return managerMatchdayData(ctx.managerId,ctx.md)}catch{return null}}
  function saveData(){try{save()}catch{try{localStorage.setItem('kickbaseCoachV07',JSON.stringify(data))}catch{}}try{window.cloudQueueSave?.()}catch{}}
  function status(msg,kind='neutral'){const el=document.getElementById('phase230ManualLineupStatus');if(!el)return;el.textContent=msg;el.dataset.kind=kind}
  function applyCurrent(){
    if(!ctx)return;const text=document.getElementById('phase230ManualLineupNames')?.value||'',built=buildLogical(parseNames(text));
    if(built.unresolved.length){status(`Nicht eindeutig erkannt: ${built.unresolved.map(x=>x.raw).join(', ')}`,'bad');return}
    if(built.lineup.length!==11){status(built.error||`Nur ${built.lineup.length}/11 plausibel aufstellbar.`,'bad');return}
    const lineup=built.lineup.map(x=>x.name),bank=built.bank.map(x=>x.name);
    writeLiveLineupV1?.(ctx.managerId,lineup,{source:'manual-names-auto-formation',formation:built.code,bank,snapshotMd:ctx.md,playerSnapshots:built.resolved.map(x=>({...x,state:'secure',teamAtImport:x.team,confidence:1,linkedAt:new Date().toISOString()}))});
    const store=data?.settings?.phase230LiveLineups?.[ctx.managerId];if(store){store.bank=[...bank];store.formation=built.code}
    saveData();status(`✓ ${built.code} erstellt · ${lineup.length} Startelf${bank.length?` · ${bank.length} Bank`:''}`,'good');
    if(typeof toast==='function')toast(`Aufstellung ${built.code} erstellt`);
    setTimeout(()=>{try{editOpponentMatchday(ctx.managerId,ctx.md)}catch{}},120);
  }
  function saveReconstruction(){
    if(!ctx)return;const text=document.getElementById('phase230ManualLineupNames')?.value||'',built=buildLogical(parseNames(text));
    if(built.unresolved.length){status(`Nicht eindeutig erkannt: ${built.unresolved.map(x=>x.raw).join(', ')}`,'bad');return}
    if(built.lineup.length!==11){status(built.error||'Für eine historische Rekonstruktion brauche ich 11 plausible Spieler.','bad');return}
    const pointsRaw=document.getElementById('oppMdPoints')?.value??'';if(pointsRaw===''||!Number.isFinite(Number(pointsRaw))){status('Für die Rekonstruktion bitte die Spieltagspunkte eintragen.','bad');return}
    const lineup=built.lineup.map(x=>x.name),bank=built.bank.map(x=>x.name),row=rowFor();if(!row)return;
    const capturedAt=new Date().toISOString();
    row.points=Number(pointsRaw);row.lineup=[...lineup];row.bank=[...bank];row.formation=built.code;
    row.lineupSnapshot=built.resolved.map(x=>({...x,state:'secure',teamAtImport:x.team,confidence:1,linkedAt:capturedAt,source:'manual-reconstruction'}));
    row.historicalLineup230={lineup:[...lineup],bank:[...bank],formation:built.code,capturedAt,source:'manual-reconstruction',lockReason:'manual-reconstruction',firstKickoffAt:window.h2h230OpponentFirstKickoffMs?.(ctx.md)?new Date(window.h2h230OpponentFirstKickoffMs(ctx.md)).toISOString():null,evidence:'manually-entered-player-list'};
    row.historicalLineupLocked230=true;row.historicalLineupLockedAt230=capturedAt;row.historicalLineupLockReason230='manual-reconstruction';row.reconstruction230={source:'manual-reconstruction',createdAt:capturedAt,noOriginalLineupScreenshot:true};
    saveData();status(`✓ Spieltag ${ctx.md} als historische Rekonstruktion gespeichert · ${built.code} · ${Number(pointsRaw)} Punkte`,'good');if(typeof toast==='function')toast(`Spieltag ${ctx.md} rekonstruiert`);
  }
  function panel(){
    if(!ctx||document.getElementById('phase230ManualLineupPanel'))return;
    const anchor=document.querySelector('.opponent-roster-picker')||document.getElementById('oppMdFormation')?.closest?.('label')?.parentElement||document.querySelector('[role="dialog"] .modal-card,.modal .modal-card,.modal');if(!anchor)return;
    const live=window.h2h230OpponentCurrentLineup?.(ctx.managerId)||readLiveLineupV1?.(ctx.managerId)||{};const row=rowFor();const seed=(live.players?.length?live.players:row?.historicalLineup230?.lineup||row?.lineup||[]).join('\n');
    const wrap=document.createElement('section');wrap.id='phase230ManualLineupPanel';wrap.className='phase230-manual-lineup-panel';wrap.innerHTML=`<div class="phase230-manual-head"><div><b>Aufstellung per Namen</b><small>Smartphone: Namen untereinander einfügen. Die App ordnet Positionen zu und baut eine plausible Formation.</small></div></div><textarea id="phase230ManualLineupNames" rows="8" placeholder="z. B.\nManuel Neuer\nJonathan Tah\n...">${seed.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</textarea><div class="phase230-manual-actions"><button type="button" class="btn" id="phase230BuildLogicalLineup">Plausible Aufstellung erstellen</button><button type="button" class="btn secondary" id="phase230SaveHistoricalReconstruction">Als historischen Spieltag rekonstruieren</button></div><div id="phase230ManualLineupStatus" class="notice" data-kind="neutral">Für aktuelle Aufstellungen den ersten Button nutzen. Für ST1 ohne Original-Screenshot Punkte eintragen und den zweiten Button nutzen.</div>`;
    anchor.parentNode.insertBefore(wrap,anchor);
  }
  if(typeof editOpponentMatchday==='function'){const prior=editOpponentMatchday;editOpponentMatchday=function(managerId,md,...rest){ctx={managerId:String(managerId||''),md:Number(md)||Number(data?.settings?.currentMd)||1};const result=prior.call(this,managerId,md,...rest);setTimeout(panel,0);setTimeout(panel,100);return result}}
  document.addEventListener('click',e=>{if(e.target?.closest?.('#phase230BuildLogicalLineup'))applyCurrent();if(e.target?.closest?.('#phase230SaveHistoricalReconstruction'))saveReconstruction()});

  function classifyReview(){let r=null;try{r=screenshotImportReview||null}catch{};if(!r)return null;const types=[];if(Array.isArray(r.lineupReview)&&r.lineupReview.length)types.push('Aufstellung');if(Array.isArray(r.items)&&r.items.length)types.push('Transfers');if(r.managerId||r.manager)types.push('Manager erkannt');if(r.points||r.matchdayPoints)types.push('Punkte');return {types,recognized:types.length>0,lineupCount:r.lineupReview?.length||0,transferCount:r.items?.length||0}}
  function markScreenshotClassification(){const c=classifyReview(),statusEl=document.getElementById('screenshotImportStatus');if(!c||!statusEl)return;let badge=document.getElementById('phase230ScreenshotClass');if(!badge){badge=document.createElement('div');badge.id='phase230ScreenshotClass';badge.className='notice phase230-screen-class';statusEl.parentNode?.insertBefore(badge,statusEl)}badge.textContent=c.recognized?`Screenshot erkannt: ${c.types.join(' · ')}. Vor dem Speichern bitte Vorschau prüfen.`:'Neuer/unklarer Screenshot-Typ: Es werden keine Daten automatisch bestätigt. Bitte Vorschau prüfen oder manuell erfassen.';badge.dataset.kind=c.recognized?'good':'warn';if(!c.recognized){const commit=document.getElementById('aiCommit');if(commit){commit.disabled=true;commit.title='Unklarer Screenshot-Typ – erst erkannte Daten prüfen.'}}}
  if(typeof renderScreenshotAiResult==='function'){const prior=renderScreenshotAiResult;renderScreenshotAiResult=function(...args){const out=prior.apply(this,args);setTimeout(markScreenshotClassification,0);return out}}

  if(!document.getElementById('phase230ManualLineupStyle')){const s=document.createElement('style');s.id='phase230ManualLineupStyle';s.textContent=`.phase230-manual-lineup-panel{margin:12px 0;padding:13px;border:1px solid rgba(255,255,255,.13);border-radius:15px;background:rgba(10,20,36,.82);display:grid;gap:9px}.phase230-manual-head small{display:block;margin-top:4px;opacity:.7;line-height:1.35}.phase230-manual-lineup-panel textarea{width:100%;min-height:150px;resize:vertical}.phase230-manual-actions{display:flex;gap:8px;flex-wrap:wrap}.phase230-manual-actions .btn{flex:1 1 220px}.phase230-manual-lineup-panel .notice[data-kind="good"],#phase230ScreenshotClass[data-kind="good"]{border-color:#166534;background:#0c2a1a;color:#bbf7d0}.phase230-manual-lineup-panel .notice[data-kind="bad"]{border-color:#7f1d1d;background:#35151a;color:#fecaca}@media(max-width:760px){.phase230-manual-lineup-panel{margin:10px -2px;padding:11px}.phase230-manual-lineup-panel textarea{font-size:16px;min-height:190px}.phase230-manual-actions{display:grid}.phase230-manual-actions .btn{width:100%;min-height:48px}}`;document.head.appendChild(s)}
  window.h2h230BuildLogicalLineup=buildLogical;window.h2h230ClassifyScreenshotReview=classifyReview;window.H2H_PHASE230_MANUAL_RECONSTRUCTION=true;console.info(`[H2H] Phase ${VERSION} loaded`);
})();
