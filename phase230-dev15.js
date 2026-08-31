(() => {
  const VERSION='2.3.0-dev15.1';
  const STYLE_ID='phase230OpponentShirtsStyle';
  const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const clubKey=v=>norm(v).replace(/\b(fc|sv|sc|tsg|rb|1|04|07|1899)\b/g,' ').replace(/\s+/g,' ').trim();
  const sameClub=(a,b)=>{const x=norm(a),y=norm(b);if(!x||!y)return false;if(x===y)return true;const cx=clubKey(a),cy=clubKey(b);return cx&&cy&&(cx===cy||cx.includes(cy)||cy.includes(cx))};

  const PALETTES=[['bayern',['#d0021b','#ffffff','#171717']],['dortmund',['#fdeb00','#111111','#ffffff']],['leverkusen',['#e32219','#111111','#ffffff']],['leipzig',['#ffffff','#d71920','#001f5b']],['stuttgart',['#ffffff','#e30613','#111111']],['hoffenheim',['#0066b3','#ffffff','#0b1e3a']],['freiburg',['#e30613','#111111','#ffffff']],['frankfurt',['#111111','#e1000f','#ffffff']],['mainz',['#e30613','#ffffff','#111111']],['augsburg',['#ffffff','#ba0c2f','#1f6b45']],['gladbach',['#ffffff','#111111','#38a169']],['union berlin',['#c8102e','#ffffff','#f6d04d']],['werder',['#008c55','#ffffff','#111111']],['hamburg',['#ffffff','#005ca9','#111111']],['schalke',['#0066b3','#ffffff','#111111']],['elversberg',['#ffffff','#111111','#f2c500']],['koln',['#ffffff','#e30613','#111111']],['paderborn',['#00529f','#111111','#ffffff']]];
  function palette(team){const key=norm(team);for(const [needle,colors] of PALETTES)if(key.includes(needle))return colors;return ['#34495e','#ffffff','#111111']}

  // Wikimedia Commons 2026/27 Bundesliga kit patterns (CC0 file assets).
  // Keys are normalized club-name needles; home/away contain MediaWiki kit pattern names.
  const KIT_PATTERNS=[
    ['augsburg',{home:'augsburg2627h',away:'augsburg2627a'}],
    ['leverkusen',{home:'bayer2627h',away:'bayer2627a'}],
    ['bayern',{home:'bayern2627h',away:'bayern2627a'}],
    ['dortmund',{home:'bvb2627h',away:'bvb2627a'}],
    ['gladbach',{home:'gladbach2627h',away:'gladbach2627a'}],
    ['frankfurt',{home:'frankfurt2627h',away:'frankfurt2627a'}],
    ['elversberg',{home:'elvesberg2627h',away:'elversberg2627a'}],
    ['freiburg',{home:'freiburg2627h',away:'freiburg2627a'}],
    ['hamburg',{home:'hsv2627h',away:'hsv2627a'}],
    ['hoffenheim',{home:'hoffenheim2627h',away:'hoffenheim2627a'}],
    ['koln',{home:'koeln2627h',away:'koeln2627a'}],
    ['mainz',{home:'mainz2627h',away:'mainz2627a'}],
    ['paderborn',{home:'paderborn2627h',away:'paderborn2627a'}],
    ['leipzig',{home:{arm:'rbl2627h',body:'rbl2627hh'},away:'rbl2627a'}],
    ['schalke',{home:'schalke2627h',away:'schalke2627a'}],
    ['stuttgart',{home:'stuttgart2627h',away:'stuttgart2627a'}],
    ['union berlin',{home:'unionberlin2627h',away:'unionberlin2627a'}],
    ['werder',{home:'werder2627h',away:'werder2627a'}]
  ];
  function patterns(team){const key=norm(team);for(const [needle,value] of KIT_PATTERNS)if(key.includes(needle))return value;return null}
  const commons=(part,pattern)=>`https://commons.wikimedia.org/wiki/Special:Redirect/file/Kit_${part}_${encodeURIComponent(pattern)}.png`;
  function kitParts(team,side){const cfg=patterns(team);if(!cfg||!['home','away'].includes(side))return null;const selected=cfg[side];if(typeof selected==='string')return{arm:selected,body:selected};return selected}

  function fixtureForTeam(team,md){const fixtures=Array.isArray(window.FIXTURES)?window.FIXTURES:[];return fixtures.find(f=>Number(f?.md)===Number(md)&&(sameClub(team,f?.home)||sameClub(team,f?.away)))||null}
  function sideForTeam(team,md){const f=fixtureForTeam(team,md);if(!f)return 'unknown';return sameClub(team,f.home)?'home':'away'}
  function clubData(team){return (Array.isArray(window.BUNDESLIGA_CLUBS)?window.BUNDESLIGA_CLUBS:[]).find(c=>sameClub(team,c?.team))||null}

  function installStyle(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}if(s.dataset.version===VERSION)return;s.dataset.version=VERSION;s.textContent=`
    .phase230-opp-player{position:relative;padding-left:58px!important;min-height:64px}
    .phase230-shirt{position:absolute;left:6px;top:50%;width:47px;height:56px;transform:translateY(-50%);pointer-events:none;filter:drop-shadow(0 4px 5px rgba(0,0,0,.35))}
    .phase230-shirt-fallback{position:absolute;left:10px;top:9px;width:27px;height:38px;border-radius:5px 5px 9px 9px;background:var(--shirt-main);border:1px solid rgba(255,255,255,.3);z-index:0}
    .phase230-kit-img{position:absolute;top:0;height:56px;object-fit:fill;image-rendering:auto;z-index:2}
    .phase230-kit-left{left:0;width:15px}.phase230-kit-body{left:14px;width:20px}.phase230-kit-right{right:0;width:15px}
    .phase230-shirt[data-kit-loaded="true"] .phase230-shirt-fallback{opacity:0}
    .phase230-shirt-side{position:absolute;right:-2px;bottom:0;z-index:4;font-size:7px;font-weight:900;line-height:1;padding:2px 3px;border-radius:4px;background:rgba(0,0,0,.72);color:#fff}
    .phase230-shirt-source{position:absolute;left:1px;bottom:0;z-index:4;font-size:6px;font-weight:800;padding:2px;border-radius:3px;background:rgba(0,0,0,.55);color:#fff;opacity:.72}
    @media(max-width:760px){.phase230-opp-player{padding-left:45px!important;min-height:54px}.phase230-shirt{left:4px;width:38px;height:46px}.phase230-kit-img{height:46px}.phase230-kit-left{width:12px}.phase230-kit-body{left:11px;width:17px}.phase230-kit-right{width:12px}.phase230-shirt-fallback{left:8px;top:7px;width:22px;height:32px}.phase230-shirt-source{display:none}}
  `}

  function teamFromCard(card){const drag=card.dataset.phase230OppDrag||'';try{return window.h2h230OpponentPickerIdentity?.(drag)?.team||''}catch{}const small=card.querySelector('small')?.textContent||'';return small.split('·')[0]?.trim()||''}
  function realKitHtml(team,side){const parts=kitParts(team,side);if(!parts)return'';const arm=parts.arm,body=parts.body||arm;return `<img class="phase230-kit-img phase230-kit-left" src="${commons('left_arm',arm)}" alt="" loading="lazy"><img class="phase230-kit-img phase230-kit-body" src="${commons('body',body)}" alt="" loading="lazy"><img class="phase230-kit-img phase230-kit-right" src="${commons('right_arm',arm)}" alt="" loading="lazy">`}
  function decorate(){installStyle();const md=Number(data?.settings?.currentMd)||1;let changed=0;document.querySelectorAll('#phase230OpponentPitch .phase230-opp-player').forEach(card=>{const team=teamFromCard(card);if(!team)return;const side=sideForTeam(team,md),colors=palette(team),club=clubData(team);let shirt=card.querySelector('.phase230-shirt');if(!shirt){shirt=document.createElement('span');shirt.className='phase230-shirt';card.prepend(shirt);changed++}shirt.dataset.side=side;shirt.dataset.kitLoaded='false';shirt.style.setProperty('--shirt-main',side==='away'?colors[2]:colors[0]);shirt.title=side==='home'?`${team} · Heimtrikot 2026/27`:side==='away'?`${team} · Auswärtstrikot 2026/27`:team;shirt.innerHTML=`<span class="phase230-shirt-fallback"></span>${realKitHtml(team,side)}<span class="phase230-shirt-source">26/27</span><span class="phase230-shirt-side">${side==='home'?'H':side==='away'?'A':'–'}</span>`;const imgs=[...shirt.querySelectorAll('.phase230-kit-img')];if(imgs.length){let loaded=0;imgs.forEach(img=>{img.addEventListener('load',()=>{loaded++;if(loaded===imgs.length)shirt.dataset.kitLoaded='true'},{once:true});img.addEventListener('error',()=>{shirt.dataset.kitLoaded='false';img.style.display='none'},{once:true})})}card.dataset.phase230KitSide=side;card.dataset.phase230KitSeason='2026-27';if(club?.crest_url)card.dataset.phase230ClubCrest=club.crest_url});return changed}

  const priorPatch=window.h2h230PatchOpponentPitchCanonical;if(typeof priorPatch==='function')window.h2h230PatchOpponentPitchCanonical=function(...args){const result=priorPatch.apply(this,args);decorate();return result};
  const priorRebuild=window.h2h230RebuildOpponentPitch;if(typeof priorRebuild==='function')window.h2h230RebuildOpponentPitch=function(...args){const result=priorRebuild.apply(this,args);decorate();return result};
  document.addEventListener('change',e=>{if(e.target?.id==='currentMd'||e.target?.matches?.('[data-opponent-player-state]'))setTimeout(decorate,0)});
  window.addEventListener('h2h:kickoff-schedule',()=>setTimeout(decorate,0));setTimeout(decorate,700);
  window.h2h230DecorateOpponentShirts=decorate;window.h2h230OpponentKitSide=(team,md=Number(data?.settings?.currentMd)||1)=>sideForTeam(team,md);window.h2h230BundesligaKitPatterns=KIT_PATTERNS;
  console.info(`[H2H] Phase ${VERSION} loaded`);
})();
