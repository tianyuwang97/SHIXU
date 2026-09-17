import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const buttons=[...document.querySelectorAll('[data-scroll-feel]')];
const media=matchMedia('(prefers-reduced-motion: reduce)');
const modalOpen=()=>Boolean(document.querySelector('dialog[open]'));
let mode='soft',lenis=null;
const regions=new Map(),owners=new WeakMap();
const nativeControl=node=>node.matches?.('textarea,select,[contenteditable=true],input[type=range]');
const horizontal=e=>e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY);
const tuning={soft:{lerp:.13,wheelMultiplier:1},jelly:{lerp:.065,wheelMultiplier:.9}};
function release(){lenis?.destroy();lenis=null;for(const [el,scroll] of regions){scroll.destroy();el.removeAttribute('data-smooth-region');}regions.clear();}
// Capture chooses the innermost live scroll region before Lenis handles the
// bubbling wheel event. This also covers lists inserted or expanded later.
function routeWheel(event){
 if(!lenis||media.matches||event.ctrlKey||event.metaKey)return;
 const path=event.composedPath();
 if(horizontal(event)||path.some(nativeControl)){owners.set(event,false);return;}
 for(const el of path){
  if(el===document.body||el===document.documentElement)break;
  if(!(el instanceof HTMLElement)||el.clientHeight===0)continue;
  if(el.hasAttribute('data-lenis-prevent')||el.hasAttribute('data-lenis-prevent-wheel')){owners.set(event,false);return;}
  if(el.scrollHeight<=el.clientHeight+1||!['auto','scroll'].includes(getComputedStyle(el).overflowY))continue;
  owners.set(event,el);
  // Stop residual movement behind the active list when the pointer changes regions.
  for(const scroll of [lenis,...regions.values()]){
   if(scroll.options.wrapper!==el&&scroll.isScrolling==='smooth')scroll.scrollTo(scroll.actualScroll,{immediate:true});
  }
  if(!regions.has(el)){
   el.setAttribute('data-smooth-region','');
   const scroll=new Lenis({wrapper:el,content:el,eventsTarget:el,autoRaf:true,smoothWheel:true,syncTouch:false,naiveDimensions:true,overscroll:false,...tuning[mode],
    virtualScroll:({event:e})=>e.type==='wheel'&&owners.get(e)===el,
   });
   regions.set(el,scroll);
  }
  // If a list has become shorter, discard an old target beyond its new limit.
  const scroll=regions.get(el);if(scroll.targetScroll>scroll.limit)scroll.resize();
  return;
 }
}
document.addEventListener('wheel',routeWheel,{capture:true,passive:true});
function apply(){
 release();
 if(mode!=='native'&&!media.matches){
  lenis=new Lenis({autoRaf:true,smoothWheel:true,syncTouch:false,allowNestedScroll:true,anchors:{offset:-120},...tuning[mode],
   prevent:node=>node.tagName==='DIALOG'||nativeControl(node),
   virtualScroll:({event})=>event.type!=='wheel'||(!owners.has(event)&&!horizontal(event)&&!event.metaKey),
  });
  if(modalOpen())lenis.stop();
 }
 buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scrollFeel===mode)));
 const status=document.getElementById('scrollFeelStatus');if(status)status.textContent=media.matches?'已跟随系统减少动态效果':mode==='native'?'原生滚轮，直接停稳':mode==='soft'?'轻缓跟随，短距离收尾':'柔和跟随，带一点惯性';
}
buttons.forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.scrollFeel;apply();}));
const modalObserver=new MutationObserver(()=>{
 if(lenis){if(modalOpen())lenis.stop();else lenis.start();}
 for(const [el,scroll] of regions){if(!el.isConnected||!el.getClientRects().length){scroll.destroy();el.removeAttribute('data-smooth-region');regions.delete(el);}}
});
modalObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden']});
const backTop=document.getElementById('backTop');if(backTop)backTop.onclick=()=>{
 const nav=document.getElementById('marketNav');
 if(lenis)lenis.scrollTo(nav,{offset:-18});else nav.scrollIntoView({behavior:media.matches?'instant':'smooth',block:'start'});
};
media.addEventListener('change',apply);
document.addEventListener('shixu:scroll-reset',()=>{lenis?.scrollTo(window.scrollY,{immediate:true,force:true});});
addEventListener('pagehide',release);
addEventListener('pageshow',e=>{if(e.persisted)apply();});
apply();
