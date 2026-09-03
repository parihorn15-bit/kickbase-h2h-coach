(()=>{
  const VERSION='3.0.0-horn-transfer-history30';
  const TEAM_ID='team::horn-capital-fc';
  const EXPECTED_UNIQUE=72;
  const EXPECTED_LIFECYCLES=43;
  const EXPECTED_ACTIVE=14;
  const EXPECTED_SOLD=29;
  const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const seq=e=>{const m=String(e?.event_id||'').match(/(\d+)$/);return m?Number(m[1]):0};
  function eventKey(e){const d=e?.relative_time?.days_ago!=null?`d${e.relative_time.days_ago}`:e?.relative_time?.hours_ago!=null?`h${e.relative_time.hours_ago}`:String(e?.absolute_time||'');return [norm(e?.player_name),e?.direction,Number(e?.price)||0,d,norm(e?.counterparty_name)].join('|')}
  function events(){const all=(window.H2H_CANONICAL_MODEL?.events?.transfers||[]).filter(e=>e?.manager_team_id===TEAM_ID);const seen=new Set(),out=[];for(const e of all){const k=eventKey(e);if(seen.has(k))continue;seen.add(k);out.push(e)}return out}
  function dateOf(e){const d=new Date(e?.absolute_time||'');return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10)}
  function lifecycles(){
    const ordered=events().sort((a,b)=>{const ta=Date.parse(a?.absolute_time||'')||0,tb=Date.parse(b?.absolute_time||'')||0;if(ta!==tb)return ta-tb;return seq(b)-seq(a)});
    const open=new Map(),out=[];
    for(const e of ordered){const key=norm(e.player_name);if(e.direction==='BUY'){
      const row={id:`canonical-horn-${e.event_id}`,name:e.player_name,buyDate:dateOf(e),buyPrice:Number(e.price)||0,buyCounterparty:e.counterparty_name||'Kickbase',buyEventId:e.event_id,soldDate:'',salePrice:0,saleCounterparty:'',saleEventId:null};
      out.push(row);if(!open.has(key))open.set(key,[]);open.get(key).push(row);
    }else if(e.direction==='SELL'){
      const stack=open.get(key)||[];const row=stack.length?stack.pop():null;if(row){row.soldDate=dateOf(e);row.salePrice=Number(e.price)||0;row.saleCounterparty=e.counterparty_name||'Kickbase';row.saleEventId=e.event_id}
    }}
    return out.sort((a,b)=>(b.buyDate||'').localeCompare(a.buyDate||'')||a.name.localeCompare(b.name,'de'));
  }
  function report(){const ev=events(),life=lifecycles(),active=life.filter(x=>!x.soldDate).length,sold=life.filter(x=>x.soldDate).length;const r={version:VERSION,teamId:TEAM_ID,expectedUniqueEvents:EXPECTED_UNIQUE,canonicalUniqueEvents:ev.length,expectedLifecycles:EXPECTED_LIFECYCLES,canonicalLifecycles:life.length,expectedActive:EXPECTED_ACTIVE,active,expectedSold:EXPECTED_SOLD,sold,complete:ev.length===EXPECTED_UNIQUE&&life.length===EXPECTED_LIFECYCLES&&active===EXPECTED_ACTIVE&&sold===EXPECTED_SOLD,checkedAt:new Date().toISOString(),source:'Horn Capital FC.zip · 24 Screenshots'};window.H2H_HORN_TRANSFER_COMPLETENESS=r;const m=window.H2H_CANONICAL_MODEL;if(m){m.data_quality=m.data_quality||{};m.data_quality.horn_transfer_history=r}return r}
  function metadataFor(name){try{const p=(data.players||[]).find(x=>norm(x.name)===norm(name)&&!x.h2hCanonicalHornHistory);if(p)return {team:p.team||'',position:p.position||'',marketValue:Number(p.marketValue)||0,avgPoints:Number(p.avgPoints)||0};}catch{}const m=window.H2H_CANONICAL_MODEL,ids=m?.indexes?.player_ids_by_normalized_name?.[norm(name)]||[];for(const id of ids){const p=m?.entities?.players?.[id];if(p&&!p.historical_only)return {team:p.club_name||p.club||p.team||'',position:p.position||'',marketValue:Number(p.market_value||p.marketValue)||0,avgPoints:Number(p.avg_points||p.avgPoints)||0}}return {team:'',position:'',marketValue:0,avgPoints:0}}
  function syncIntoExistingTable(){
    let d;try{d=data}catch{return false}if(!d||!Array.isArray(d.players))return false;
    const life=lifecycles(),r=report();if(!r.complete)return false;
    const signature=`horn72:${r.canonicalUniqueEvents}:${r.canonicalLifecycles}:${r.active}:${r.sold}:v2`;
    if(d.ui?.hornCanonicalHistorySignature===signature)return true;
    const previous=d.players.filter(p=>p?.h2hCanonicalHornHistory);d.players=d.players.filter(p=>!p?.h2hCanonicalHornHistory);
    const used=new Set();
    for(const row of life){
      let target=d.players.find(p=>!used.has(p.id)&&norm(p.name)===norm(row.name)&&Number(p.buyPrice||0)===row.buyPrice);
      if(target){used.add(target.id);target.buyDate=row.buyDate||target.buyDate;target.buyPrice=row.buyPrice;target.buySource=row.buyCounterparty==='Kickbase'?'Transfermarkt':'Mitspieler';target.buyCounterparty=row.buyCounterparty;target.soldDate=row.soldDate||'';target.salePrice=row.salePrice||0;target.saleSource=row.soldDate?(row.saleCounterparty==='Kickbase'?'Transfermarkt':'Mitspieler'):'';target.saleCounterparty=row.saleCounterparty||'';target.h2hCanonicalHornVerified=true;target.h2hCanonicalBuyEventId=row.buyEventId;target.h2hCanonicalSaleEventId=row.saleEventId||null;
      }else{
        const meta=metadataFor(row.name);d.players.push({id:row.id,name:row.name,team:meta.team,position:meta.position,buyDate:row.buyDate,buyPrice:row.buyPrice,marketAtBuy:0,marketValue:row.soldDate?0:meta.marketValue,avgPoints:meta.avgPoints,note:'Historischer Horn-Transfer aus verifiziertem Screenshot-Archiv',buySource:row.buyCounterparty==='Kickbase'?'Transfermarkt':'Mitspieler',buyCounterparty:row.buyCounterparty,buyReason:'',buyReasons:[],soldDate:row.soldDate||'',salePrice:row.salePrice||0,saleReason:'',saleSource:row.soldDate?(row.saleCounterparty==='Kickbase'?'Transfermarkt':'Mitspieler'):'',saleCounterparty:row.saleCounterparty||'',h2hCanonicalHornHistory:true,h2hCanonicalHornVerified:true,h2hCanonicalBuyEventId:row.buyEventId,h2hCanonicalSaleEventId:row.saleEventId||null});
      }
    }
    d.ui=d.ui||{};d.ui.hornCanonicalHistorySignature=signature;
    try{save()}catch(e){console.warn('[H2H] Horn history save failed',e)}
    console.info(`[H2H] ${VERSION}: existing transfer table synced`,{rows:d.players.length,canonicalLifecycles:life.length,removedPreviousSynthetic:previous.length});
    return true;
  }
  function removeDuplicateCard(){document.getElementById('h2hHornCanonicalTransfers300')?.remove()}
  window.h2h300HornTransferCompleteness=report;window.h2h300SyncHornHistoryIntoTransfers=syncIntoExistingTable;
  let tries=0,t=setInterval(()=>{tries++;if(events().length>=EXPECTED_UNIQUE&&syncIntoExistingTable()){clearInterval(t);try{if(typeof page!=='undefined'&&page==='transfers'&&typeof render==='function')render()}catch{}setTimeout(removeDuplicateCard,50)}else if(tries>40)clearInterval(t)},250);
  document.addEventListener('click',()=>setTimeout(removeDuplicateCard,60),true);setTimeout(()=>{syncIntoExistingTable();removeDuplicateCard()},1800);
  console.info(`[H2H] ${VERSION} loaded`);
})();