export const STORAGE_KEY='shixu-research-v1';
export const markets={cn:'A股',us:'美股',hk:'港股',fund:'基金'};
export function cleanItem(v){
 if(!v||!Object.hasOwn(markets,v.market)||!String(v.code||'').match(v.market==='fund'||v.market==='cn'?/^\d{6}$/:v.market==='hk'?/^\d{5}$/:/^[A-Z0-9.^-]{1,16}$/))return null;
 return {market:v.market,code:String(v.code),name:String(v.name||v.code).slice(0,100),industry:String(v.industry||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,60),industryName:String(v.industryName||'').slice(0,80),note:String(v.note||'').slice(0,180)};
}
export const itemKey=i=>i.market+':'+i.code;
export const groupKey=i=>i.market==='fund'?'fund':i.industry?i.market+':'+i.industry:'';
export const limitFor=g=>g==='fund'?4:5;
export function cleanState(v){
 const list=(a,max)=>{const seen=new Set();return (Array.isArray(a)?a:[]).map(cleanItem).filter(i=>i&&!seen.has(itemKey(i))&&seen.add(itemKey(i))).slice(0,max);};
 const queues={};for(const [key,g] of Object.entries(v?.queues||{}).slice(0,60)){if(!g||!Array.isArray(g.items))continue;const items=list(g.items.filter(i=>{const c=cleanItem(i);return c&&groupKey(c)===key;}),limitFor(key));if(items.length)queues[key]={items,days:(key==='fund'?[7,15,30,180,365]:[30,90,180,365]).includes(g.days)?g.days:30};}
 return {version:1,watch:list(v?.watch,200),recent:list(v?.recent,30),queues};
}
const memory=()=>globalThis.__shixuResearchMemory||cleanState(null);
export function readState(){if(globalThis.__shixuResearchSaved===false)return memory();try{const raw=localStorage.getItem(STORAGE_KEY);return raw?cleanState(JSON.parse(raw)):cleanState(null);}catch{return memory();}}
export function writeState(state,detail={}){
 const next=cleanState(state);globalThis.__shixuResearchMemory=next;let saved=true;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}catch{saved=false;}
 globalThis.__shixuResearchSaved=saved;globalThis.document?.dispatchEvent(new CustomEvent('research:change',{detail}));return saved;
}
export function setQueue(key,items,days=30,source='page'){
 const s=readState(),next=cleanState({queues:{[key]:{items,days}}}).queues[key];
 if(JSON.stringify(s.queues[key])===JSON.stringify(next))return;
 if(next)s.queues[key]=next;else delete s.queues[key];writeState(s,{group:key,source});
}
export function visit(item){const i=cleanItem(item);if(!i)return;const s=readState(),old=s.recent.find(x=>itemKey(x)===itemKey(i));if(!i.industry&&old?.industry){i.industry=old.industry;i.industryName=old.industryName;}s.recent=[i,...s.recent.filter(x=>itemKey(x)!==itemKey(i))].slice(0,30);const watched=s.watch.find(x=>itemKey(x)===itemKey(i));if(watched&&i.industry){watched.industry=i.industry;watched.industryName=i.industryName;}writeState(s,{source:'visit'});}
export function itemURL(i){return i.market==='fund'?'/compare?code='+encodeURIComponent(i.code):'/stock-peers?'+new URLSearchParams({market:i.market,code:i.code});}
export function groupURL(key,g){if(!g||g.items.length<2)return null;const first=g.items[0],p=new URLSearchParams({codes:g.items.map(i=>i.code).join(','),days:String(g.days)});if(key==='fund')return '/compare?'+p+'#selection';p.set('market',first.market);p.set('industry',first.industry);return '/stock-peers?'+p+'#comparison';}
export function researchButtons(item){const i=cleanItem(item);if(!i)return '';const encoded=encodeURIComponent(JSON.stringify(i)),watched=readState().watch.some(x=>itemKey(x)===itemKey(i));return `<span class="research-actions"><button type="button" data-research-watch="${encoded}" aria-pressed="${watched}">${watched?'★ 已自选':'☆ 自选'}</button></span>`;}
