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
    .then(()=>load('phase230-dev5.js?v=230dev5','phase230dev5'))
    .then(()=>load('phase230-dev6.js?v=230dev6','phase230dev6'))
    .catch(error=>console.error('2.3 runtime load failed',error));
})();
