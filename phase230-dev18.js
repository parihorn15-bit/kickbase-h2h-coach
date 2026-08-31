(() => {
  const VERSION='2.3.0-dev18.0';
  let ctx=null;
  function rowFor(){try{return managerMatchdayData(ctx.managerId,ctx.md)}catch{return null}}
  function saveData(){try{save()}catch{try{localStorage.setItem('kickbaseCoachV07',JSON.stringify(data))}catch{}}try{window.cloudQueueSave?.()}catch{}}
  function isFinal(row){return row?.pointsFinal230===true}
  function finalValue(row){return Number.isFinite(Number(row?.pointsFinalValue230))?Number(row.pointsFinalValue230):Number(row?.points)}
  function pointsInput(){return document.getElementById('oppMdPoints')}
  function ensureMeta(row){if(!row)return; if(row.pointsFinal230!==true&&row.pointsFinal230!==false)row.pointsFinal230=false}
  function statusText(row){if(isFinal(row)){const when=row.pointsFinalizedAt230?new Date(row.pointsFinalizedAt230).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'}):'';return `🔒 Final · ${finalValue(row)} Punkte${when?` · bestätigt ${when}`:''}`;}return '🟡 Vorläufig · bis zur finalen Kickbase/Opta-Korrektur änderbar';}
  function render(){
    if(!ctx)return;const input=pointsInput(),row=rowFor();if(!input||!row)return;ensureMeta(row);
    let box=document.getElementById('phase230PointsFinalBox');
    if(!box){box=document.createElement('section');box.id='phase230PointsFinalBox';box.className='phase230-points-final';input.closest('label')?.insertAdjacentElement('afterend',box)||input.insertAdjacentElement('afterend',box)}
    const locked=isFinal(row);if(locked){input.value=String(finalValue(row));input.disabled=true;input.setAttribute('aria-disabled','true')}else{input.disabled=false;input.removeAttribute('aria-disabled')}
    box.innerHTML=`<div class="phase230-points-status" data-final="${locked?'1':'0'}">${statusText(row)}</div><button type="button" class="btn ${locked?'secondary':''}" id="phase230TogglePointsFinal">${locked?'Finalisierung aufheben':'Punkte finalisieren'}</button><small>${locked?'Änderungen sind gesperrt. Entsperren nur bei einer nachträglichen offiziellen Korrektur.':'Erst finalisieren, wenn Kickbase/Opta die Punkte endgültig bestätigt hat.'}</small>`;
  }
  function finalize(){
    const row=rowFor(),input=pointsInput();if(!row||!input)return;const value=Number(input.value);if(input.value===''||!Number.isFinite(value)){typeof toast==='function'&&toast('Bitte zuerst gültige Punkte eintragen.');return}
    row.points=value;row.pointsFinal230=true;row.pointsFinalValue230=value;row.pointsFinalizedAt230=new Date().toISOString();row.pointsFinalizedSource230='manual-kickbase-opta-final';saveData();render();typeof toast==='function'&&toast(`${value} Punkte finalisiert`);
  }
  function unlock(){
    const row=rowFor();if(!row)return;const ok=window.confirm('Finalisierung wirklich aufheben? Nutze das nur, wenn Kickbase/Opta die Punkte nachträglich korrigiert hat.');if(!ok)return;
    row.pointsFinal230=false;row.pointsFinalUnlockedAt230=new Date().toISOString();row.pointsFinalUnlockReason230='manual-official-correction';saveData();render();typeof toast==='function'&&toast('Punkte wieder zur Bearbeitung freigegeben');
  }
  if(typeof editOpponentMatchday==='function'){
    const prior=editOpponentMatchday;editOpponentMatchday=function(managerId,md,...rest){ctx={managerId:String(managerId||''),md:Number(md)||Number(data?.settings?.currentMd)||1};const out=prior.call(this,managerId,md,...rest);setTimeout(render,0);setTimeout(render,120);return out};
  }
  document.addEventListener('click',event=>{
    if(event.target?.closest?.('#phase230TogglePointsFinal')){const row=rowFor();if(isFinal(row))unlock();else finalize();return}
    const saveBtn=event.target?.closest?.('#saveOpponentMd');if(saveBtn&&ctx){const row=rowFor(),input=pointsInput();if(isFinal(row)&&input){input.value=String(finalValue(row));}}
  },true);
  document.addEventListener('input',event=>{if(event.target?.id==='oppMdPoints'&&ctx){const row=rowFor();if(isFinal(row)){event.target.value=String(finalValue(row));}}});
  if(!document.getElementById('phase230PointsFinalStyle')){const s=document.createElement('style');s.id='phase230PointsFinalStyle';s.textContent=`.phase230-points-final{margin:8px 0 14px;padding:11px 12px;border:1px solid rgba(255,255,255,.12);border-radius:13px;display:grid;gap:8px;background:rgba(10,20,36,.72)}.phase230-points-status{font-weight:700}.phase230-points-status[data-final="1"]{color:#bbf7d0}.phase230-points-final small{opacity:.68;line-height:1.35}@media(max-width:760px){.phase230-points-final{padding:12px}.phase230-points-final .btn{width:100%;min-height:48px}}`;document.head.appendChild(s)}
  window.h2h230PointsFinalized=(managerId,md)=>{try{return managerMatchdayData(String(managerId),Number(md))?.pointsFinal230===true}catch{return false}};
  window.h2h230FinalizePoints=(managerId,md,value)=>{ctx={managerId:String(managerId),md:Number(md)};const row=rowFor();if(!row||!Number.isFinite(Number(value)))return false;row.points=Number(value);row.pointsFinal230=true;row.pointsFinalValue230=Number(value);row.pointsFinalizedAt230=new Date().toISOString();row.pointsFinalizedSource230='manual-kickbase-opta-final';saveData();return true};
  window.H2H_PHASE230_POINTS_FINALIZATION='provisional-to-final-with-explicit-unlock';
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
