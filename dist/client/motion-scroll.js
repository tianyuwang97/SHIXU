// Scroll-driven effects follow native scrolling; no wheel interception or scroll lock.
(() => {
 const root=document.documentElement,bar=document.getElementById('scrollProgress');
 const intro=document.querySelector('.intro'),ribbon=document.querySelector('.scroll-ribbon');
 const track=document.querySelector('.ribbon-track'),cards=document.getElementById('cards');
 const samples=[...cards.querySelectorAll('.sample')],stage=document.querySelector('.closing-stage');
 const closing=stage.querySelector('.closing'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
 let frame=0;
 function draw(){
  frame=0;
  if(document.hidden)return;
  const height=innerHeight,small=innerWidth<=760,y=Math.max(0,scrollY);
  const total=Math.max(0,root.scrollHeight-height),progress=total?clamp(y/total):0;
  // Read the stationary containers before changing their children's transforms.
  const ir=intro.getBoundingClientRect(),rr=ribbon.getBoundingClientRect();
  const cr=cards.getBoundingClientRect(),sr=stage.getBoundingClientRect();
  const visible=r=>r.bottom>0&&r.top<height;
  const through=r=>clamp((height-r.top)/(height+r.height));
  bar.style.transform=`scaleX(${progress})`;
  if(reduced.matches){
   intro.style.setProperty('--intro-shift','0px');track.style.transform='none';
   samples.forEach(el=>el.style.setProperty('--depth','0px'));
   closing.style.setProperty('--panel-scale','1');closing.style.setProperty('--panel-radius','30px');
   return;
  }
  if(visible(ir))intro.style.setProperty('--intro-shift',`${clamp(-ir.top,0,400)*(small?.025:.065)}px`);
  if(visible(rr))track.style.transform=`translateX(${-through(rr)*(small?130:290)}px)`;
  if(visible(cr)){
   const p=through(cr)-.5;
   samples.forEach((el,i)=>el.style.setProperty('--depth',`${p*(small?12:[-70,50,-40][i])}px`));
  }
  if(visible(sr)){
   const enter=clamp((height-sr.top)/(height*.7));
   closing.style.setProperty('--panel-scale',String(.955+.045*enter));
   closing.style.setProperty('--panel-radius',`${52-22*enter}px`);
  }
 }
 function schedule(){if(!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
 addEventListener('pageshow',schedule);document.addEventListener('visibilitychange',schedule);
 reduced.addEventListener('change',schedule);
 new ResizeObserver(schedule).observe(document.body);
 schedule();
})();
