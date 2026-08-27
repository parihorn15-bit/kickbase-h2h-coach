(() => {
  const VERSION='2.3.0-dev15.0';
  const STYLE_ID='phase230OpponentShirtsStyle';
  const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const clubKey=v=>norm(v).replace(/\b(fc|sv|sc|tsg|rb|1|04|07|1899)\b/g,' ').replace(/\s+/g,' ').trim();
  const sameClub=(a,b)=>{const x=norm(a),y=norm(b);if(!x||!y)return false;if(x===y)return true;const cx=clubKey(a),cy=clubKey(b);return cx&&cy&&(cx===cy||cx.includes(cy)||cy.includes(cx))};

  // Stylised club palettes. This is visual metadata only; player identity and
  // position logic remain untouched. Away shirts deliberately contrast strongly.
  const PALETTES=[
    ['bayern',['#d0021b','#ffffff','#171717']],['dortmund',['#fdeb00','#111111','#ffffff']],['leverkusen',['#e32219','#111111','#ffffff']],
    ['leipzig',['#ffffff','#d71920','#001f5b']],['stuttgart',['#ffffff','#e30613','#111111']],['hoffenheim',['#0066b3','#ffffff','#0b1e3a']],
    ['freiburg',['#e30613','#111111','#ffffff']],['frankfurt',['#111111','#e1000f','#ffffff']],['mainz',['#e30613','#ffffff','#111111']],
    ['augsburg',['#ffffff','#ba0c2f','#1f6b45']],['gladbach',['#ffffff','#111111','#38a169']],['union berlin',['#c8102e','#ffffff','#f6d04d']],
    ['werder',['#008c55','#ffffff','#111111']],['hamburg',['#ffffff','#005ca9','#111111']],['schalke',['#0066b3','#ffffff','#111111']],
    ['elversberg',['#ffffff','#111111','#f2c500']],['koln',['#ffffff','#e30613','#111111']],['paderborn',['#00529f','#111111','#ffffff']]
  ];
  function palette(team){const key=norm(team);for(const [needle,colors] of PALETTES)if(key.includes(needle))return colors;return ['#34495e','#ffffff','#111111']}
  function fixtureForTeam(team,md){const fixtures=Array.isArray(window.FIXTURES)?window.FIXTURES:[];return fixtures.find(f=>Number(f?.md)===Number(md)&&(sameClub(team,f?.home)||sameClub(team,f?.away)))||null}
  function sideForTeam(team,md){const f=fixtureForTeam(team,md);if(!f)return 'unknown';return sameClub(team,f.home)?'home':'away'}
  function clubData(team){return (Array.isArray(window.BUNDESLIGA_CLUBS)?window.BUNDESLIGA_CLUBS:[]).find(c=>sameClub(team,c?.team))||null}

  function installStyle(){
    let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}
    if(s.dataset.version===VERSION)return;s.dataset.version=VERSION;s.textContent=`
      .phase230-opp-player{position:relative;padding-left:45px!important;min-height:54px}
      .phase230-shirt{position:absolute;left:9px;top:50%;width:27px;height:31px;transform:translateY(-50%);border-radius:5px 5px 8px 8px;background:var(--shirt-main);border:1px solid rgba(255,255,255,.38);box-shadow:0 3px 9px rgba(0,0,0,.25);pointer-events:none;overflow:visible}
      .phase230-shirt:before,.phase230-shirt:after{content:'';position:absolute;top:2px;width:10px;height:13px;background:var(--shirt-main);border:1px solid rgba(255,255,255,.28);z-index:-1}
      .phase230-shirt:before{left:-7px;transform:skewY(-28deg);border-radius:5px 1px 3px 5px}.phase230-shirt:after{right:-7px;transform:skewY(28deg);border-radius:1px 5px 5px 3px}
      .phase230-shirt[data-side="home"]{background:linear-gradient(90deg,var(--shirt-main) 0 42%,var(--shirt-accent) 42% 58%,var(--shirt-main) 58% 100%)}
      .phase230-shirt[data-side="away"]{background:linear-gradient(135deg,var(--shirt-away) 0 62%,var(--shirt-main) 62% 72%,var(--shirt-away) 72%)}
      .phase230-shirt[data-side="away"]:before,.phase230-shirt[data-side="away"]:after{background:var(--shirt-away)}
      .phase230-shirt-crest{position:absolute;left:50%;top:8px;width:12px;height:12px;transform:translateX(-50%);object-fit:contain;border-radius:50%;background:rgba(255,255,255,.88);padding:1px}
      .phase230-shirt-side{position:absolute;right:-4px;bottom:-6px;font-size:7px;font-weight:900;line-height:1;padding:2px 3px;border-radius:4px;background:rgba(0,0,0,.72);color:#fff;letter-spacing:.03em}
      @media(max-width:760px){.phase230-opp-player{padding-left:36px!important;min-height:48px}.phase230-shirt{left:7px;width:22px;height:26px}.phase230-shirt:before,.phase230-shirt:after{width:8px;height:11px}.phase230-shirt:before{left:-6px}.phase230-shirt:after{right:-6px}.phase230-shirt-crest{width:10px;height:10px;top:7px}.phase230-shirt-side{font-size:6px}}
    `
  }
  function teamFromCard(card){const drag=card.dataset.phase230OppDrag||'';try{return window.h2h230OpponentPickerIdentity?.(drag)?.team||''}catch{}const small=card.querySelector('small')?.textContent||'';return small.split('·')[0]?.trim()||''}
  function decorate(){
    installStyle();const md=Number(data?.settings?.currentMd)||1;let changed=0;
    document.querySelectorAll('#phase230OpponentPitch .phase230-opp-player').forEach(card=>{
      const team=teamFromCard(card);if(!team)return;const side=sideForTeam(team,md),colors=palette(team),club=clubData(team);let shirt=card.querySelector('.phase230-shirt');
      if(!shirt){shirt=document.createElement('span');shirt.className='phase230-shirt';card.prepend(shirt);changed++}
      shirt.dataset.side=side;shirt.style.setProperty('--shirt-main',colors[0]);shirt.style.setProperty('--shirt-accent',colors[1]);shirt.style.setProperty('--shirt-away',colors[2]);shirt.title=side==='home'?`${team} · Heimtrikot`:side==='away'?`${team} · Auswärtstrikot`:team;
      const crest=club?.crest_url||'';shirt.innerHTML=`${crest?`<img class="phase230-shirt-crest" src="${String(crest).replace(/"/g,'&quot;')}" alt="">`:''}<span class="phase230-shirt-side">${side==='home'?'H':side==='away'?'A':'–'}</span>`;
      card.dataset.phase230KitSide=side;
    });
    return changed;
  }

  const priorPatch=window.h2h230PatchOpponentPitchCanonical;
  if(typeof priorPatch==='function')window.h2h230PatchOpponentPitchCanonical=function(...args){const result=priorPatch.apply(this,args);decorate();return result};
  const priorRebuild=window.h2h230RebuildOpponentPitch;
  if(typeof priorRebuild==='function')window.h2h230RebuildOpponentPitch=function(...args){const result=priorRebuild.apply(this,args);decorate();return result};
  document.addEventListener('change',e=>{if(e.target?.id==='currentMd'||e.target?.matches?.('[data-opponent-player-state]'))setTimeout(decorate,0)});
  window.addEventListener('h2h:kickoff-schedule',()=>setTimeout(decorate,0));
  setTimeout(decorate,700);
  window.h2h230DecorateOpponentShirts=decorate;
  window.h2h230OpponentKitSide=(team,md=Number(data?.settings?.currentMd)||1)=>sideForTeam(team,md);
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
