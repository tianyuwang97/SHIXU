import './motion-smooth.js';
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),seen=new WeakSet();
const selector='.stock-pick,.fund,.company-card,.company-tile,.peer-card,.search-panel,.share-guide,.compare-notes,.event';
const pending=new Set();
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;io.unobserve(e.target);pending.delete(e.target);seen.add(e.target);if(!reduced.matches)e.target.animate([{opacity:.15,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});}),{threshold:.06});
function scan(root){if(reduced.matches||pending.size>=120||!root.querySelectorAll)return;const candidates=[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];for(const el of candidates){if(pending.size>=120)break;if(seen.has(el)||pending.has(el))continue;pending.add(el);io.observe(el);}}
scan(document);
new MutationObserver(records=>{for(const record of records){for(const el of record.removedNodes){if(el.nodeType!==1)continue;for(const item of [el,...el.querySelectorAll(selector)]){if(pending.delete(item))io.unobserve(item);}}for(const el of record.addedNodes){if(el.nodeType===1)scan(el);}}}).observe(document.body,{childList:true,subtree:true});
