(() => {
  const VERSION='2.3.0-dev12.1';
  let editContext=null;

  function selectedLineup(){
    return [...document.querySelectorAll('[data-opponent-player-state]')]
      .filter(select=>select.value==='lineup')
      .map(select=>String(select.dataset.opponentPlayerState||'').trim())
      .filter(Boolean)
      .slice(0,11);
  }

  function currentFormation(){
    return String(document.getElementById('oppMdFormation')?.value||'');
  }

  function syncLiveStore(players,{clear=false}={}){
    const ctx=editContext;
    if(!ctx?.managerId)return false;
    try{
      if(typeof writeLiveLineupV1==='function'){
        writeLiveLineupV1(ctx.managerId,clear?[]:players,{
          source:'manual-opponent-edit',
          formation:clear?'':currentFormation(),
          snapshotMd:Number(ctx.md)||Number(data?.settings?.currentMd)||1
        });
        return true;
      }
    }catch(error){console.warn('[H2H] dev12 live-store sync failed',error)}
    return false;
  }

  if(typeof editOpponentMatchday==='function'){
    const priorEdit=editOpponentMatchday;
    editOpponentMatchday=function(managerId,md,...rest){
      editContext={managerId:String(managerId||''),md:Number(md)||Number(data?.settings?.currentMd)||1};
      return priorEdit.call(this,managerId,md,...rest);
    };
  }

  document.addEventListener('click',event=>{
    const target=event.target?.closest?.('#saveOpponentMd,#viewOpponentLineupAnalysis,#clearOpponentMd');
    if(!target)return;
    if(target.id==='clearOpponentMd')syncLiveStore([],{clear:true});
    else syncLiveStore(selectedLineup());
  },true);

  function markRuntime(){
    const brand=document.querySelector('#sidebar .brand small');
    if(brand)brand.textContent='Version 2.3.0 TEST · Runtime dev12.1 · Cloud-Schreiben AKTIV · 2026/27';
  }
  markRuntime();
  setTimeout(markRuntime,700);
  window.h2h230SyncOpponentLiveBeforeSave=()=>syncLiveStore(selectedLineup());
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
