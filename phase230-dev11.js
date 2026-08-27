(() => {
  const VERSION='2.3.0-dev11.8';
  const STYLE_ID='phase230OpponentAnalysisPolish';

  function installStyle(){
    let style=document.getElementById(STYLE_ID);
    if(!style){style=document.createElement('style');style.id=STYLE_ID;document.head.appendChild(style)}
    if(style.dataset.version===VERSION)return false;
    style.dataset.version=VERSION;
    style.textContent=`
      #phase230OpponentPitch.phase230-opponent-pitch-wrap{margin:16px 0;padding:16px;border-radius:20px;background:linear-gradient(180deg,rgba(15,24,31,.92),rgba(10,18,24,.94));border:1px solid rgba(255,255,255,.10);box-shadow:0 16px 42px rgba(0,0,0,.18)}
      #phase230OpponentPitch .phase230-opponent-pitch-head{align-items:center;margin-bottom:12px}
      #phase230OpponentPitch .phase230-opponent-pitch-head span{font-size:10px;letter-spacing:.14em;opacity:.55}
      #phase230OpponentPitch .phase230-opponent-pitch-head h3{font-size:18px;line-height:1.2;margin:4px 0 0}
      #phase230OpponentPitch .phase230-opponent-pitch-head small{max-width:360px;text-align:right;line-height:1.35;opacity:.55}
      #phase230OpponentPitch .phase230-opponent-pitch{min-height:440px;padding:26px 18px;gap:16px;border-radius:18px;background:linear-gradient(180deg,rgba(25,119,75,.82),rgba(12,78,49,.92));box-shadow:inset 0 0 0 1px rgba(255,255,255,.11),inset 0 0 50px rgba(0,0,0,.08)}
      #phase230OpponentPitch .phase230-pitch-row{min-height:70px;gap:10px}
      #phase230OpponentPitch .phase230-row-label{font-size:9px;letter-spacing:.08em;opacity:.38}
      #phase230OpponentPitch .phase230-opp-player{min-width:128px;max-width:168px;padding:9px 11px;gap:2px;border-radius:12px;background:rgba(5,18,14,.76);border-color:rgba(255,255,255,.15);box-shadow:0 6px 18px rgba(0,0,0,.16);transition:transform .12s ease,border-color .12s ease,background .12s ease}
      #phase230OpponentPitch .phase230-opp-player:hover{transform:translateY(-1px);border-color:rgba(255,255,255,.28);background:rgba(5,18,14,.88)}
      #phase230OpponentPitch .phase230-opp-player b{font-size:13px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #phase230OpponentPitch .phase230-opp-player small{font-size:9px;line-height:1.25;opacity:.58;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #phase230OpponentPitch .phase230-opponent-bank{margin-top:10px;min-height:56px;padding:8px 10px;border-radius:12px;gap:7px;opacity:.84}
      #phase230OpponentPitch .phase230-opponent-bank>b{font-size:11px;opacity:.65}
      #phase230OpponentPitch .phase230-bank-player{min-width:112px;max-width:150px;background:rgba(31,42,48,.84)}
      [role="dialog"] .opponent-analysis,[role="dialog"] [data-opponent-analysis],.modal .opponent-analysis,.modal [data-opponent-analysis]{display:grid;gap:10px}
      [role="dialog"] .opponent-analysis-card,[role="dialog"] .analysis-player-card,.modal .opponent-analysis-card,.modal .analysis-player-card{position:relative;border-radius:14px!important;padding:12px 14px!important;line-height:1.28;box-shadow:0 8px 22px rgba(0,0,0,.10)}
      [role="dialog"] .opponent-analysis-card h4,[role="dialog"] .analysis-player-card h4,.modal .opponent-analysis-card h4,.modal .analysis-player-card h4{margin:0 72px 3px 0!important;line-height:1.15;font-size:15px;font-weight:800}
      [role="dialog"] .opponent-analysis-card small,[role="dialog"] .analysis-player-card small,.modal .opponent-analysis-card small,.modal .analysis-player-card small{line-height:1.3;opacity:.66}
      [role="dialog"] .opponent-analysis-card p,[role="dialog"] .analysis-player-card p,.modal .opponent-analysis-card p,.modal .analysis-player-card p{margin:5px 0 0;line-height:1.32}
      [role="dialog"] .opponent-analysis-card [class*="score"],[role="dialog"] .analysis-player-card [class*="score"],.modal .opponent-analysis-card [class*="score"],.modal .analysis-player-card [class*="score"]{font-size:20px;font-weight:850;line-height:1;letter-spacing:-.02em}
      [role="dialog"] .opponent-analysis-card [class*="confidence"],[role="dialog"] .analysis-player-card [class*="confidence"],.modal .opponent-analysis-card [class*="confidence"],.modal .analysis-player-card [class*="confidence"]{font-size:10px;opacity:.58}
      [role="dialog"] .opponent-analysis-card ul,[role="dialog"] .analysis-player-card ul,.modal .opponent-analysis-card ul,.modal .analysis-player-card ul{margin:6px 0 0;padding-left:16px;font-size:11px;line-height:1.32;opacity:.76}
      [role="dialog"] .opponent-analysis-card li+li,[role="dialog"] .analysis-player-card li+li,.modal .opponent-analysis-card li+li,.modal .analysis-player-card li+li{margin-top:2px}
      @media(min-width:980px){[role="dialog"] .opponent-analysis,.modal .opponent-analysis,[role="dialog"] [data-opponent-analysis],.modal [data-opponent-analysis]{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}}
      @media(max-width:720px){#phase230OpponentPitch.phase230-opponent-pitch-wrap{padding:13px}#phase230OpponentPitch .phase230-opponent-pitch-head{align-items:flex-start}#phase230OpponentPitch .phase230-opponent-pitch-head small{text-align:left;max-width:none}#phase230OpponentPitch .phase230-opponent-pitch{min-height:350px;padding:18px 7px;gap:11px}#phase230OpponentPitch .phase230-pitch-row{gap:7px}#phase230OpponentPitch .phase230-opp-player{min-width:94px;max-width:122px;padding:7px 8px}#phase230OpponentPitch .phase230-opp-player b{font-size:11px}#phase230OpponentPitch .phase230-opp-player small{font-size:8px}[role="dialog"] .opponent-analysis-card,[role="dialog"] .analysis-player-card,.modal .opponent-analysis-card,.modal .analysis-player-card{padding:11px 12px!important}}
    `;
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

  function markRuntime(){
    const brand=document.querySelector('#sidebar .brand small');
    if(brand)brand.textContent='Version 2.3.0 TEST · Runtime dev14.0 · Cloud-Schreiben AKTIV · 2026/27';
  }
  function apply(){installStyle();polishPitchCopy();markRuntime()}

  apply();
  setTimeout(apply,600);
  document.addEventListener('change',event=>{if(event.target?.matches?.('[data-opponent-player-state]'))setTimeout(apply,0)});
  window.h2h230PolishOpponentAnalysis=apply;
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
