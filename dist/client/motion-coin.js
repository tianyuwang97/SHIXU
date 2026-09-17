(() => {
 const image=document.getElementById('goldCoin'),flight=document.getElementById('coinFlight');
 const tilt=document.getElementById('coinTilt'),button=document.getElementById('coinButton'),stage=document.getElementById('coinStage');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const turn=document.getElementById('coinTurn'),caption=document.getElementById('coinCaption');
 const themes={fund:['/coin-fund.png','基金 · 北京中轴线'],cn:['/coin-cn.png','A股 · 浦东建筑群'],us:['/coin-us.png','美股 · 自由女神像'],hk:['/coin-hk.png','港股 · 维多利亚港']};
 const assets=new Map();let wanted=image.dataset?.market||'fund',shown=wanted,changeId=0,turnAnimation=null;
 function prepare(key){
  if(!assets.has(key)){const asset=new Image();asset.src=themes[key][0];assets.set(key,asset.decode().then(()=>asset).catch(error=>{assets.delete(key);throw error;}));}
  return assets.get(key);
 }
 async function changeTheme(key){
  if(!themes[key])return;
  wanted=key;const id=++changeId;turnAnimation?.cancel();turnAnimation=null;
  if(!loaded)return;
  if(key===shown){if(caption)caption.textContent=themes[key][1];return;}
  try{
   const asset=await prepare(key);if(id!==changeId)return;
   cancelMotion();flight.classList.remove('arriving');tilt.style.transform='';
   if(!reduced.matches){
    turnAnimation=turn.animate([{transform:'rotateY(0deg)',opacity:1},{transform:'rotateY(48deg)',opacity:.12}],{duration:180,easing:'cubic-bezier(.45,0,.8,.5)',fill:'forwards'});
    await turnAnimation.finished;if(id!==changeId)return;
   }
   image.src=asset.src;image.alt=themes[key][1]+'主题的纯色立体金币';if(caption)caption.textContent=themes[key][1];shown=key;
   turnAnimation?.cancel();turnAnimation=null;
   if(!reduced.matches){
    turnAnimation=turn.animate([{transform:'rotateY(-42deg)',opacity:.12},{transform:'rotateY(5deg)',opacity:1,offset:.78},{transform:'rotateY(0deg)',opacity:1}],{duration:330,easing:'cubic-bezier(.22,1,.36,1)'});
    await turnAnimation.finished;if(id===changeId)turnAnimation=null;
   }
  }catch(error){if(id!==changeId||error?.name==='AbortError')return;if(caption)caption.textContent=themes[key][1]+' · 图案暂未载入';}
 }
 let loaded=false,entrance=null,response=null,version=0,frame=0,point=null;
 function cancelMotion(){version++;entrance?.cancel();response?.cancel();entrance=response=null;}
 function replay(){
  if(!loaded)return;
  cancelMotion();const current=version;flight.classList.add('ready');flight.classList.remove('arriving');
  tilt.style.transform='';button.style.transform='';
  if(reduced.matches)return;
  flight.classList.add('arriving');
  entrance=flight.animate([
   {transform:'translate3d(110vw,65px,0) rotate(42deg) scale(.82)',opacity:0,offset:0},
   {transform:'translate3d(70vw,35px,0) rotate(25deg) scale(.9)',opacity:1,offset:.16},
   {transform:'translate3d(-30px,-12px,0) rotate(-13deg) scale(1.015)',opacity:1,offset:.63},
   {transform:'translate3d(12px,5px,0) rotate(-5deg) scale(.996)',opacity:1,offset:.8},
   {transform:'translate3d(-4px,-2px,0) rotate(-9deg) scale(1)',opacity:1,offset:.92},
   {transform:'translate3d(0,0,0) rotate(-8deg) scale(1)',opacity:1,offset:1}
  ],{duration:1450,delay:200,easing:'cubic-bezier(.2,.65,.3,1)',fill:'backwards'});
  entrance.finished.then(()=>{if(current===version){flight.classList.remove('arriving');entrance=null;}}).catch(()=>{});
 }
 function nod(){
  if(!loaded||reduced.matches||entrance)return;
  response?.cancel();
  response=button.animate([
   {transform:'translateY(0) rotate(0deg)'},
   {transform:'translateY(-18px) rotate(5deg)',offset:.35},
   {transform:'translateY(3px) rotate(-2deg)',offset:.72},
   {transform:'translateY(0) rotate(0deg)'}
  ],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
  response.finished.catch(()=>{});
 }
 button.addEventListener('click',nod);
 document.addEventListener('demo:market',e=>changeTheme(e.detail.market));
 document.getElementById('replay')?.addEventListener('click',replay);
 stage.addEventListener('pointermove',e=>{
  if(reduced.matches||entrance||e.pointerType==='touch')return;
  const r=stage.getBoundingClientRect();point={x:Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)),y:Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1))};
  if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(point&&!reduced.matches&&!entrance)tilt.style.transform=`translate(${point.x*7}px,${point.y*5}px) rotateX(${-point.y*3}deg) rotateY(${point.x*4}deg)`;});
 },{passive:true});
 stage.addEventListener('pointerleave',()=>{point=null;tilt.style.transform='';});
 reduced.addEventListener('change',()=>{cancelMotion();flight.classList.remove('arriving');tilt.style.transform='';changeTheme(wanted);});
 image.decode().then(()=>{const selected=document.querySelector?.('[data-home-market][aria-selected="true"]');if(selected)wanted=selected.dataset.homeMarket;loaded=true;replay();Object.keys(themes).forEach(key=>prepare(key).catch(()=>{}));if(wanted!==shown)changeTheme(wanted);}).catch(()=>{document.getElementById('coinError').hidden=false;if(caption)caption.hidden=true;});
})();
