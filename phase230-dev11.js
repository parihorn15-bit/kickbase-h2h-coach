(() => {
  const VERSION='2.3.0-dev11.4';
  const STYLE_ID='phase230OpponentAnalysisPolish';

  function installStyle(){
    if(document.getElementById(STYLE_ID))return false;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      /* Phase 2.3 dev11.4 — freeze-safe visual-only polish. */
      #phase230OpponentPitch.phase230-opponent-pitch-wrap{margin:20px 0;padding:18px;border-radius:20px;background:linear-gradient(180deg,rgba(15,24,31,.92),rgba(10,18,24,.94));border:1px solid rgba(255,255,255,.10);box-shadow:0 16px 42px rgba(0,0,0,.18)}
      #phase230OpponentPitch .phase230-opponent-pitch-head{align-items:center;margin-bottom:14px}
      #phase230OpponentPitch .phase230-opponent-pitch-head span{font-size:10px;letter-spacing:.14em;opacity:.55}
      #phase230OpponentPitch .phase230-opponent-pitch-head h3{font-size:18px;line-height:1.2;margin:4px 0 0}
      #phase230OpponentPitch .phase230-opponent-pitch-head small{max-width:360px;text-align:right;line-height:1.35;opacity:.55}
      #phase230OpponentPitch .phase230-opponent-pitch{min-height:390px;padding:24px 20px;gap:14px;border-radius:18px;background:linear-gradient(180deg,rgba(25,119,75,.82),rgba(12,78,49,.92));box-shadow:inset 0 0 0 1px rgba(255,255,255,.11),inset 0 0 50px rgba(0,0,0,.08)}
      #phase230OpponentPitch .phase230-pitch-row{min-height:66px;gap:10px}
      #phase230OpponentPitch .phase230-row-label{font-size:9px;letter-spacing:.08em;opacity:.38}
      #phase230OpponentPitch .phase230-opp-player{min-width:132px;max-width:174px;padding:9px 12px;gap:2px;border-radius:12px;background:rgba(5,18,14,.76);border-color:rgba(255,255,255,.15);box-shadow:0 6px 18px rgba(0,0,0,.16);transition:transform .12s ease,border-color .12s ease,background .12s ease}
      #phase230OpponentPitch .phase230-opp-player:hover{transform:translateY(-1px);border-color:rgba(255,255,255,.28);background:rgba(5,18,14,.88)}
      #phase230OpponentPitch .phase230-opp-player b{font-size:13px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #phase230OpponentPitch .phase230-opp-player small{font-size:9px;line-height:1.25;opacity:.58;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #phase230OpponentPitch .phase230-opponent-bank{margin-top:10px;min-height:58px;padding:9px 11px;border-radius:12px;gap:8px;opacity:.88}
      #phase230OpponentPitch .phase230-opponent-bank>b{font-size:11px;opacity:.65}
      #phase230OpponentPitch .phase230-bank-player{min-width:118px;max-width:156px;background:rgba(31,42,48,.84)}

      /* Generic analysis modal polish: CSS only, no DOM traversal. */
      [role="dialog"] .opponent-analysis-card,[role="dialog"] .analysis-player-card,.modal .opponent-analysis-card,.modal .analysis-player-card{border-radius:14px!important;padding:12px 14px!important;line-height:1.3}
      [role="dialog"] .opponent-analysis-card h4,[role="dialog"] .analysis-player-card h4,.modal .opponent-analysis-card h4,.modal .analysis-player-card h4{margin:0 0 4px!important;line-height:1.15;font-size:15px}
      [role="dialog"] .opponent-analysis-card small,[role="dialog"] .analysis-player-card small,.modal .opponent-analysis-card small,.modal .analysis-player-card small{line-height:1.3;opacity:.68}

      @media(max-width:720px){
        #phase230OpponentPitch.phase230-opponent-pitch-wrap{padding:13px}
        #phase230OpponentPitch .phase230-opponent-pitch-head{align-items:flex-start}
        #phase230OpponentPitch .phase230-opponent-pitch-head small{text-align:left;max-width:none}
        #phase230OpponentPitch .phase230-opponent-pitch{min-height:350px;padding:18px 7px;gap:11px}
        #phase230OpponentPitch .phase230-pitch-row{gap:7px}
        #phase230OpponentPitch .phase230-opp-player{min-width:94px;max-width:122px;padding:7px 8px}
        #phase230OpponentPitch .phase230-opp-player b{font-size:11px}
        #phase230OpponentPitch .phase230-opp-player small{font-size:8px}
      }
    `;
    document.head.appendChild(style);
    return true;
  }

  function polishPitchCopy(){
    const box=document.getElementById('phase230OpponentPitch');
    if(!box)return false;
    const hint=box.querySelector('.phase230-opponent-pitch-head small');
    if(!hint)return false;
    const target='Klick oder Drag & Drop verschiebt Spieler zwischen Startelf und Bank.';
    const current=hint.textContent||'';
    if(current===target)return false;
    if(/Drag\s*&\s*Drop|verschieben/i.test(current)){hint.textContent=target;return true}
    return false;
  }

  function apply(){
    installStyle();
    polishPitchCopy();
  }

  apply();
  setTimeout(apply,600);
  document.addEventListener('change',event=>{
    if(event.target?.matches?.('[data-opponent-player-state]'))setTimeout(apply,0);
  });
  window.h2h230PolishOpponentAnalysis=apply;
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
