(() => {
  const load=(src,tag)=>new Promise((resolve,reject)=>{
    if(document.querySelector(`script[data-${tag}]`)){resolve();return;}
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.dataset[tag]='1';
    s.onload=resolve;
    s.onerror=reject;
    document.head.appendChild(s);
  });
  load('phase230-dev1.js?v=230dev1','phase230dev1')
    .then(()=>load('phase230-dev2.js?v=230dev2','phase230dev2'))
    .then(()=>load('phase230-dev3.js?v=230dev3','phase230dev3'))
    .then(()=>load('phase230-dev4.js?v=230dev4','phase230dev4'))
    .then(()=>load('phase230-dev5.js?v=230dev5_1','phase230dev5'))
    .then(()=>load('phase230-dev6.js?v=230dev6','phase230dev6'))
    .then(()=>load('phase230-dev7.js?v=230dev7','phase230dev7'))
    .then(()=>load('phase230-dev8.js?v=230dev8_3','phase230dev8'))
    .then(()=>load('phase230-dev9.js?v=230dev9_3','phase230dev9'))
    .then(()=>load('phase230-dev10.js?v=230dev10_4','phase230dev10'))
    .then(()=>load('phase230-dev11.js?v=230dev11_7','phase230dev11'))
    .then(()=>load('phase230-dev12.js?v=230dev12_1','phase230dev12'))
    .then(()=>load('phase230-dev13.js?v=230dev13_0','phase230dev13'))
    .catch(error=>console.error('2.3 runtime load failed',error));
})();
