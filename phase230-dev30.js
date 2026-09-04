(()=>{
  const VERSION='3.0.1-transfer-screenshot-import-core2';
  function currentPage(){try{return page}catch{return null}}
  function inject(){
    if(currentPage()!=='transfers')return;
    const content=document.getElementById('content');if(!content)return;
    let card=document.getElementById('h2hTransferScreenshotImport300');
    if(!card){
      card=document.createElement('section');card.id='h2hTransferScreenshotImport300';card.className='card screenshot-import-card';
      card.innerHTML=`<div class="section-head"><div><span class="eyebrow">AI TRANSFER-IMPORT</span><h2>Transfer-Screenshots einlesen</h2><p>Kickbase-Screenshots werden analysiert, mit Horn Capital FC abgeglichen und erst nach deiner Bestätigung übernommen. Danach synchronisiert der zentrale 3.0-State-Core Transferhistorie, Kader, Aufstellung, Finanzen und Ownership – ohne Browser-Reload.</p></div></div>
        <div class="screenshot-import-actions"><label class="btn secondary">Screenshots auswählen<input id="screenshotImportFiles" type="file" accept="image/*" multiple hidden></label><button type="button" class="btn" id="analyzeScreenshotFiles">Mit AI analysieren</button></div>
        <div id="screenshotImportStatus" class="screenshot-import-status">Noch keine Screenshots ausgewählt.</div>
        <div class="notice" style="margin-top:10px">Vor der Übernahme: Spieler · Kauf/Verkauf · Preis · Gegenpartei · Zeitpunkt prüfen. Dubletten werden erkannt; unsichere Treffer werden nicht still überschrieben.</div><div id="aiUsageBox" class="ai-usage-box"></div><div id="screenshotImportResult" class="screenshot-import-result"></div>`;
      content.prepend(card);try{data.ui=data.ui||{};data.ui.leagueManager='me'}catch{}try{bind()}catch(e){console.warn('[H2H] transfer screenshot bind failed',e)}
    }
  }
  function afterCommit(){setTimeout(()=>{try{window.H2H_STATE_CORE?.syncAll({reason:'ai-transfer-import',render:true})||window.h2h300SyncAllDerivedState?.({reason:'ai-transfer-import',render:true})}catch(e){console.warn('Central state sync',e)}},250)}
  document.addEventListener('click',e=>{if(e.target?.id==='aiCommit')afterCommit();if(e.target?.closest?.('[data-page="transfers"],a[href*="transfers"],button'))setTimeout(inject,60)},true);
  window.addEventListener('hashchange',()=>setTimeout(inject,60));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(inject,100),{once:true});
  setTimeout(inject,250);
  console.info(`[H2H] ${VERSION} loaded`)
})();