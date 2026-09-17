(() => {
 const image=document.getElementById('goldCoin'),flight=document.getElementById('coinFlight');
 const tilt=document.getElementById('coinTilt'),button=document.getElementById('coinButton'),stage=document.getElementById('coinStage');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const turn=document.getElementById('coinTurn'),caption=document.getElementById('coinCaption');
 const themes={fund:['/coin-fund.png','基金 · 北京中轴线'],cn:['/coin-cn.png','A股 · 浦东建筑群'],us:['/coin-us.png','美股 · 自由女神像'],hk:['/coin-hk.png','港股 · 维多利亚港']};
 const assets=new Map();let wanted=image.dataset?.market||'fund',shown=wanted,changeId=0,turnAnimation=null;
 const swipeHint=document.createElement('span');
 swipeHint.className='coin-swipe-hint';swipeHint.setAttribute('aria-hidden','true');
 const hintArrow='<svg viewBox="0 0 32 28" fill="none" aria-hidden="true"><path d="M26 14H7M12 9l-5 5 5 5" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="m27 12 2 2-2 2-2-2Z" fill="currentColor" opacity=".5"/></svg>';
 swipeHint.innerHTML='<span class="coin-swipe-left">'+hintArrow+'</span><span class="coin-swipe-right">'+hintArrow+'</span>';
 stage.append(swipeHint);
 const dismissSwipeHint=()=>stage.classList.add('coin-hint-used');
 // Keep the original coin artwork on both faces without an extra rim overlay.
 const rotor=document.createElement('span'),back=image.cloneNode(false);
 rotor.className='coin-rotor';
 back.removeAttribute('id');back.removeAttribute('data-market');back.alt='';back.setAttribute('aria-hidden','true');
 back.className='coin-back';back.draggable=false;
 image.classList.add('coin-front');button.append(rotor);rotor.append(image,back);
 function sizeCoin(){
  const w=button.clientWidth,depth=Math.max(14,w*.065);
  stage.style.setProperty('--coin-hint-span',w+44+'px');
  rotor.style.setProperty('--coin-half-depth',depth/2+'px');
 }
 new ResizeObserver(sizeCoin).observe(button);sizeCoin();
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
   image.src=back.src=asset.src;image.alt=themes[key][1]+'主题的纯色立体金币';if(caption)caption.textContent=themes[key][1];shown=key;
   turnAnimation?.cancel();turnAnimation=null;
   if(!reduced.matches){
    turnAnimation=turn.animate([{transform:'rotateY(-42deg)',opacity:.12},{transform:'rotateY(5deg)',opacity:1,offset:.78},{transform:'rotateY(0deg)',opacity:1}],{duration:330,easing:'cubic-bezier(.22,1,.36,1)'});
    await turnAnimation.finished;if(id===changeId)turnAnimation=null;
   }
  }catch(error){if(id!==changeId||error?.name==='AbortError')return;if(caption)caption.textContent=themes[key][1]+' · 图案暂未载入';}
 }
 let loaded=false,entrance=null,response=null,version=0,frame=0,point=null;
 function cancelMotion(){version++;entrance?.cancel();response?.cancel();entrance=response=null;resetSpin();}
 // Y is the upright axis: the artwork never rolls around the screen-facing Z axis.
 let angle=0,velocity=0,spinFrame=0,gesture=null,suppressClickUntil=0;
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 function paintSpin(){
  // Cancel the existing decorative -8 degree tilt around the vertical spin axis.
  rotor.style.transform=`rotateZ(8deg) rotateY(${angle}deg) rotateZ(-8deg)`;
 }
 function stopFrame(){cancelAnimationFrame(spinFrame);spinFrame=0;}
 function releaseGesture(){
  const id=gesture?.id;gesture=null;button.classList.remove('dragging');
  if(id!==undefined&&button.hasPointerCapture(id))button.releasePointerCapture(id);
 }
 function resetSpin(){
  stopFrame();releaseGesture();angle=velocity=0;rotor.style.transform='';button.classList.remove('spinning');stage.classList.remove('coin-hint-used');
 }
 function settleSpin(){
  stopFrame();
  if(reduced.matches){resetSpin();return;}
  const from=angle,to=Math.round(angle/360)*360,start=performance.now();
  velocity=0;
  function settle(now){
   const p=clamp((now-start)/650,0,1),ease=1-(1-p)**3;
   angle=from+(to-from)*ease;paintSpin();
   if(p<1)spinFrame=requestAnimationFrame(settle);else resetSpin();
  }
  spinFrame=requestAnimationFrame(settle);
 }
 function coast(){
  stopFrame();button.classList.add('spinning');
  if(reduced.matches){resetSpin();return;}
  let last=performance.now();
  function tick(now){
   const dt=Math.min(now-last,40);last=now;
   const decay=Math.exp(-dt/540);
   angle+=velocity*540*(1-decay);velocity*=decay;paintSpin();
   if(Math.abs(velocity)>.035)spinFrame=requestAnimationFrame(tick);else settleSpin();
  }
  spinFrame=requestAnimationFrame(tick);
 }
 button.setAttribute('aria-label','拨动金币旋转，可左右滑动或使用左右方向键');
 image.draggable=false;
 button.addEventListener('dragstart',e=>e.preventDefault());
 button.addEventListener('pointerdown',e=>{
  if(!loaded||turnAnimation||!e.isPrimary||e.button!==0||gesture)return;
  // Take over any ongoing animation immediately, without waiting for the entrance.
  entrance?.cancel();entrance=null;flight.classList.remove('arriving');
  response?.cancel();response=null;stopFrame();velocity=0;tilt.style.transform='';
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastTime:performance.now(),axis:null,
   sensitivity:360/Math.max(160,button.getBoundingClientRect().width)};
 },{passive:true});
 button.addEventListener('pointermove',e=>{
  if(!gesture||gesture.id!==e.pointerId)return;
  const g=gesture,dx=e.clientX-g.x,dy=e.clientY-g.y,now=performance.now();
  if(!g.axis){
   if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;
   if(Math.abs(dy)>Math.abs(dx)){releaseGesture();settleSpin();return;}
   g.axis='x';dismissSwipeHint();button.setPointerCapture(e.pointerId);button.classList.add('dragging','spinning');
  }
  e.preventDefault();
  const delta=(e.clientX-g.lastX)*g.sensitivity,dt=Math.max(8,now-g.lastTime);
  angle+=delta;velocity=clamp(delta/dt,-2.4,2.4);
  g.lastX=e.clientX;g.lastTime=now;paintSpin();
 },{passive:false});
 function finishGesture(e,cancelled=false){
  if(!gesture||gesture.id!==e.pointerId)return;
  const moved=gesture.axis==='x';
  // A held finger brakes the coin instead of replaying an old flick velocity.
  velocity*=Math.exp(-Math.max(0,performance.now()-gesture.lastTime-40)/75);
  releaseGesture();
  if(moved){suppressClickUntil=performance.now()+500;cancelled?settleSpin():coast();}
  else if(cancelled)settleSpin();
 }
 button.addEventListener('pointerup',e=>finishGesture(e));
 button.addEventListener('pointercancel',e=>finishGesture(e,true));
 button.addEventListener('lostpointercapture',e=>finishGesture(e,true));
 button.addEventListener('pointerleave',e=>{if(gesture&&!gesture.axis)finishGesture(e,true);});
 button.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight'].includes(e.key)||!loaded||turnAnimation)return;
  e.preventDefault();dismissSwipeHint();entrance?.cancel();entrance=null;flight.classList.remove('arriving');
  stopFrame();velocity=e.key==='ArrowLeft'?-1.1:1.1;coast();
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)resetSpin();});
 window.addEventListener('blur',resetSpin);
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
 button.addEventListener('click',e=>{
  if(performance.now()<suppressClickUntil){e.preventDefault();return;}
  if(!loaded||turnAnimation||reduced.matches)return;
  dismissSwipeHint();
  entrance?.cancel();entrance=null;flight.classList.remove('arriving');
  stopFrame();velocity=1.15;coast();
 });
 document.addEventListener('demo:market',e=>changeTheme(e.detail.market));
 document.getElementById('replay')?.addEventListener('click',replay);
 stage.addEventListener('pointermove',e=>{
  if(reduced.matches||entrance||gesture||spinFrame||e.pointerType==='touch')return;
  const r=stage.getBoundingClientRect();point={x:Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)),y:Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1))};
  if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(point&&!reduced.matches&&!entrance&&!gesture&&!spinFrame)tilt.style.transform=`translate(${point.x*7}px,${point.y*5}px) rotateX(${-point.y*3}deg) rotateY(${point.x*4}deg)`;});
 },{passive:true});
 stage.addEventListener('pointerleave',()=>{point=null;tilt.style.transform='';});
 reduced.addEventListener('change',()=>{cancelMotion();flight.classList.remove('arriving');tilt.style.transform='';changeTheme(wanted);});
 image.decode().then(()=>{const selected=document.querySelector?.('[data-home-market][aria-selected="true"]');if(selected)wanted=selected.dataset.homeMarket;loaded=true;replay();stage.classList.add('coin-hint-ready');Object.keys(themes).forEach(key=>prepare(key).catch(()=>{}));if(wanted!==shown)changeTheme(wanted);}).catch(()=>{document.getElementById('coinError').hidden=false;if(caption)caption.hidden=true;});
})();
