const nav=document.querySelector('.market-navigation'),indicator=document.getElementById('homeMarketIndicator');
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),panels=[...document.querySelectorAll('[data-market-panel]')];
const colors={fund:'#d3ef9a',cn:'#b4d8ff',us:'#e1d8ff',hk:'#ffe2c3'};
let panelAnimation,lastIndex=panels.findIndex(p=>!p.hidden);
function align(){const b=nav.querySelector('[aria-selected=true]');if(!b)return;indicator.style.width=b.offsetWidth+'px';indicator.style.transform=`translateX(${b.offsetLeft}px)`;indicator.style.background=colors[b.dataset.homeMarket];document.getElementById('coinStage').dataset.market=b.dataset.homeMarket;}
document.addEventListener('demo:market',e=>{
 align();const index=panels.findIndex(p=>p.dataset.marketPanel===e.detail.market),panel=panels[index];
 panelAnimation?.cancel();
 if(panel&&!reduced.matches){panelAnimation=panel.animate([{opacity:.3,transform:`translateX(${index>=lastIndex?12:-12}px)`},{opacity:1,transform:'translateX(0)'}],{duration:330,easing:'cubic-bezier(.22,1,.36,1)'});}
 lastIndex=index;
});
new ResizeObserver(align).observe(nav);align();
document.querySelectorAll('.market-action').forEach(a=>a.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch')return;const r=a.getBoundingClientRect();a.style.setProperty('--x',e.clientX-r.left+'px');a.style.setProperty('--y',e.clientY-r.top+'px');},{passive:true}));