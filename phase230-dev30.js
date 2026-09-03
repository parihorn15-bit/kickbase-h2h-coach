(()=>{
  const VERSION='3.0.0-transfer-screenshot-import30';
  function currentPage(){try{return page}catch{return null}}
  function inject(){
    if(currentPage()!=='transfers')return;
    const content=document.getElementById('content');if(!content)return;
    let card=document.getElementById('h2hTransferScreenshotImport300');
    if(!card){
      card=document.createElement('section');
      card.id='h2hTransferScreenshotImport300';
      card.className='card screenshot-import-card';
      card.innerHTML=`<div class="section-head"><div><span class="eyebrow">AI TRANSFER-IMPORT</span><h2>Transfer-Screenshots einlesen</h2><p>Kickbase-Screenshots werden analysiert, mit Horn Capital FC abgeglichen und erst nach deiner Bestätigung in die bestehende Transferhistorie übernommen.</p></div></div>
        <div class="screenshot-import-actions">
          <label class="btn secondary">Screenshots auswählen<input id="screenshotImportFiles" type="file" accept="image/*" multiple hidden></label>
          <button type="button" class="btn" id="analyzeScreenshotFiles">Mit AI analysieren</button>
        </div>
        <div id="screenshotImportStatus" class="screenshot-import-status">Noch keine Screenshots ausgewählt.</div>
        <div class="notice" style="margin-top:10px">Vor der Übernahme: Spieler · Kauf/Verkauf · Preis · Gegenpartei · Zeitpunkt prüfen. Dubletten werden erkannt; unsichere Treffer werden nicht still überschrieben.</div>
        <div id="aiUsageBox" class="ai-usage-box"></div>
        <div id="screenshotImportResult" class="screenshot-import-result"></div>`;
      content.prepend(card);
      try{data.ui=data.ui||{};data.ui.leagueManager='me'}catch{}
      try{bind()}catch(e){console.warn('[H2H] transfer screenshot bind failed',e)}
    }
  }
  function afterCommit(){
    setTimeout(()=>{
      try{window.h2h300SyncHornHistoryToLegacyTable?.()}catch(e){console.warn('Horn table sync',e)}
      try{window.h2h300ReconcileOwnership?.()}catch(e){console.warn('Ownership reconcile',e)}
      try{window.h2h300HornTransferCompleteness?.()}catch(e){console.warn('Horn completeness',e)}
      try{render()}catch{}
    },900);
  }
  document.addEventListener('click',e=>{
    if(e.target?.id==='aiCommit')afterCommit();
    setTimeout(inject,80);
  },true);
  window.addEventListener('hashchange',()=>setTimeout(inject,80));
  setInterval(inject,1200);
  setTimeout(inject,1400);
  console.info(`[H2H] ${VERSION} loaded`);
})();