const header=document.querySelector('.hd-island');let frame=0;
function measure(){document.body.style.setProperty('--live-header-h',Math.ceil(header.offsetTop+header.offsetHeight)+'px');}
function scroll(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;document.body.classList.toggle('is-compact',scrollY>90);measure();});}
new ResizeObserver(measure).observe(header);addEventListener('scroll',scroll,{passive:true});measure();scroll();
const dialog=document.getElementById('hdPracticeDialog');document.querySelector('[data-hd-practice]').onclick=()=>dialog.showModal();document.getElementById('hdClose').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
function links(market){const exit=document.body.classList.contains('exit-mode');document.querySelector('[data-hd-screen]').href=exit?'#exit-workspace':market==='fund'?'/funds.html':'#stock-picks';document.querySelector('[data-hd-screen]').textContent=exit?'卖点':'筛选';document.querySelector('[data-hd-compare]').href=market==='fund'?'/compare.html':'/stock-peers.html?market='+market;}
document.addEventListener('demo:market',e=>links(e.detail.market));links(document.querySelector('[data-home-market][aria-selected=true]')?.dataset.homeMarket||'cn');
document.addEventListener('shixu:mode',()=>links(document.querySelector('[data-home-market][aria-selected=true]')?.dataset.homeMarket||'cn'));
