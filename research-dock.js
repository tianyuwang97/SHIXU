import {STORAGE_KEY,markets,readState,writeState,itemKey,groupKey,groupURL,itemURL,limitFor,setQueue,visit,cleanItem,researchButtons} from './research-store.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let market=new URL(location.href).searchParams.get('market')||(/funds|compare|companies|portfolio/.test(location.pathname)?'fund':'cn'),panel='',activeGroup='',lastFocus;
if(!Object.hasOwn(markets,market))market='cn';
const dock=document.createElement('aside');dock.className='research-dock';dock.setAttribute('aria-label','研究工具栏');
dock.innerHTML=`<div class="research-context"><span class="research-dot"></span><div><b id="researchMarket"></b><small>研究台</small></div></div><nav aria-label="研究记录"><button data-panel="watch" aria-controls="researchPanel" aria-expanded="false"><i aria-hidden="true">☆</i>自选 <span></span></button><button data-panel="queue" aria-controls="researchPanel" aria-expanded="false"><i aria-hidden="true">⇄</i>待对比 <span></span></button><button data-panel="recent" aria-controls="researchPanel" aria-expanded="false"><i aria-hidden="true">◷</i>最近 <span></span></button><a id="researchHoldings" class="research-holdings" href="/portfolio"><i aria-hidden="true">▥</i>持仓</a></nav><button class="research-start" id="researchStart">对比</button>`;
const sheet=document.createElement('section');sheet.id='researchPanel';sheet.className='research-panel';sheet.hidden=true;sheet.setAttribute('role','region');sheet.setAttribute('aria-label','研究记录');
const live=document.createElement('div');live.className='research-toast';live.setAttribute('role','status');live.hidden=true;
const launcher=document.createElement('button');launcher.className='research-launcher';launcher.textContent='研究';launcher.setAttribute('aria-label','展开研究工具栏');launcher.setAttribute('aria-expanded','false');dock.id='researchDock';launcher.setAttribute('aria-controls',dock.id);launcher.onclick=()=>{const on=document.body.classList.toggle('research-open');launcher.setAttribute('aria-expanded',String(on));launcher.setAttribute('aria-label',on?'收起研究工具栏':'展开研究工具栏');if(!on&&panel)close();};
document.body.append(sheet,dock,live,launcher);document.body.classList.add('has-research-dock');

const aiEgg=document.createElement('dialog');aiEgg.id='holdingsAiEgg';aiEgg.setAttribute('aria-labelledby','holdingsAiTitle');aiEgg.setAttribute('aria-describedby','holdingsAiDescription');
aiEgg.innerHTML=`<button class="ai-egg-close" aria-label="关闭持仓彩蛋" autofocus>×</button><div class="ai-egg-art" aria-hidden="true"><span>✦</span><i></i><b>AI</b></div><span class="ai-egg-label">A LITTLE PREVIEW / 时序彩蛋</span><h2 id="holdingsAiTitle">你的持仓。<br>你的 AI。</h2><p id="holdingsAiDescription">未来，你可以接入自己的大模型 API Key，让熟悉的模型帮你分析持仓。</p><div class="ai-egg-note"><strong>自己的密钥，自己的模型账户。</strong><p>模型调用费用由你向服务商支付，按实际用量计费。</p></div><p class="ai-egg-status"><span></span>AI 分析尚未开放，目前仍是规则分析。<br>这里暂不收集或保存 API Key。</p><a id="holdingsAiContinue" class="ai-egg-continue" href="/portfolio">先用规则分析</a>`;
document.body.append(aiEgg);
const holdingsEntry=document.getElementById('researchHoldings');holdingsEntry.setAttribute('aria-haspopup','dialog');holdingsEntry.setAttribute('aria-controls',aiEgg.id);
holdingsEntry.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();if(panel)close();document.getElementById('holdingsAiContinue').href=holdingsEntry.href;aiEgg.showModal();});
aiEgg.querySelector('.ai-egg-close').onclick=()=>aiEgg.close();
aiEgg.addEventListener('click',e=>{if(e.target!==aiEgg)return;const r=aiEgg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)aiEgg.close();});

let toastTimer;
function tell(text){live.textContent=text;live.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>live.hidden=true,3200);}
const encode=i=>encodeURIComponent(JSON.stringify(i));
function decode(s){try{return cleanItem(JSON.parse(decodeURIComponent(s)));}catch{return null;}}
function groupLabel(key,g){const i=g.items[0];return markets[i.market]+(key==='fund'?' · 基金对比':' · '+(i.industryName||'同行'));}
function row(i,type){const watched=readState().watch.some(x=>itemKey(x)===itemKey(i));return `<article class="research-row"><div><a href="${esc(itemURL(i))}" data-research-visit="${encode(i)}">${esc(i.name)}</a><small>${markets[i.market]} · ${esc(i.code)}${i.industryName?' · '+esc(i.industryName):''}</small>${type==='watch'?`<label class="research-note">关注理由<input maxlength="180" data-note="${encode(i)}" value="${esc(i.note)}" placeholder="记下想验证的判断…"></label>`:''}</div><div class="research-row-actions">${type!=='queue'?`<button data-queue-add="${encode(i)}">${groupKey(i)?'加入对比':'选同行对比'}</button>`:''}${type!=='watch'?`<button data-research-watch="${encode(i)}" aria-pressed="${watched}">${watched?'★ 已自选':'☆ 自选'}</button>`:''}<button data-list-remove="${encode(i)}" data-list="${type}" aria-label="移除${esc(i.name)}">移除</button></div></article>`;}
function selectedGroup(s){if(s.queues[activeGroup])return activeGroup;return Object.keys(s.queues).find(k=>s.queues[k].items[0].market===market)||Object.keys(s.queues)[0]||'';}
function render(){
 const s=readState();activeGroup=selectedGroup(s);
 document.getElementById('researchMarket').textContent=markets[market];
 document.getElementById('researchHoldings').href='/portfolio?market='+market;
 const counts={watch:s.watch.length,recent:s.recent.length,queue:Object.values(s.queues).reduce((n,g)=>n+g.items.length,0)};
 dock.querySelectorAll('[data-panel]').forEach(b=>{b.querySelector('span').textContent=counts[b.dataset.panel];b.setAttribute('aria-expanded',String(panel===b.dataset.panel));b.classList.toggle('active',panel===b.dataset.panel);});
 document.querySelectorAll('[data-research-watch]').forEach(b=>{const i=decode(b.dataset.researchWatch);if(!i)return;const on=s.watch.some(x=>itemKey(x)===itemKey(i));b.textContent=on?'★ 已自选':'☆ 自选';b.setAttribute('aria-pressed',String(on));});
 if(!panel||document.activeElement?.hasAttribute('data-note'))return;
 const title={watch:'我的自选',queue:'待对比',recent:'最近浏览'}[panel];
 const hint=panel==='watch'?'留下值得继续观察的标的，也留下当时的理由。':panel==='queue'?'股票按市场与行业分组；基金最多4只，股票每组最多5只。':'保留最近30个主动查看或选择的标的。';
 let content='';
 if(panel==='queue'){
 const groups=Object.entries(s.queues);const g=s.queues[activeGroup];
 content=groups.length?`<div class="research-groups">${groups.map(([key,value])=>`<button data-group="${esc(key)}" aria-pressed="${key===activeGroup}">${esc(groupLabel(key,value))} <span>${value.items.length}</span></button>`).join('')}</div>${g.items.map(i=>row(i,'queue')).join('')}<div class="research-group-footer"><span>观察期 ${g.days} 自然日 · ${g.items.length}/${limitFor(activeGroup)} 已选</span>${groupURL(activeGroup,g)?`<a class="research-primary" href="${esc(groupURL(activeGroup,g))}">比较这一组</a>`:'<span>再选择1只即可比较</span>'}</div>`:'<div class="research-empty">还没有待对比标的。<br>在基金或股票列表里点击“加入对比”或勾选公司。</div>';
 }else {const list=s[panel];content=list.length?list.map(i=>row(i,panel)).join(''):`<div class="research-empty">${panel==='watch'?'看到想继续研究的标的，点击“☆ 自选”。':'打开一只基金或选择一家股票后，会在这里留下记录。'}</div>`;}
 sheet.innerHTML=`<header><div><span class="research-eyebrow">YOUR RESEARCH / 时序</span><h2>${title}</h2><p>${hint}</p></div><button data-close aria-label="关闭研究面板">×</button></header><div class="research-scroll" tabindex="0">${content}</div><footer>${globalThis.__shixuResearchSaved===false?'浏览器未允许保存，当前记录仅保留到本页关闭。':'仅保存在当前浏览器 · 清理网站数据后会丢失'}${panel==='recent'&&s.recent.length?'<button data-clear-recent>清空最近浏览</button>':''}</footer>`;
}
function open(which,trigger){lastFocus=trigger||document.activeElement;panel=which;sheet.hidden=false;render();sheet.querySelector('[data-close]').focus({preventScroll:true});}
function close(){panel='';sheet.hidden=true;render();if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});}
dock.addEventListener('click',e=>{const b=e.target.closest('[data-panel]');if(b){panel===b.dataset.panel?close():open(b.dataset.panel,b);return;}if(e.target.closest('#researchStart')){const s=readState(),key=selectedGroup(s),g=s.queues[key],href=groupURL(key,g);if(href)location.href=href;else{open('queue',e.target);tell('选择同一组内至少2只标的，即可开始对比。');}}});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-research-watch],[data-queue-add],[data-list-remove],[data-group],[data-close],[data-clear-recent],[data-research-visit]');if(!b)return;
 if(b.hasAttribute('data-close'))return close();
 if(b.dataset.group){activeGroup=b.dataset.group;render();return;}
 if(b.hasAttribute('data-clear-recent')){const s=readState();s.recent=[];writeState(s);return;}
 if(b.dataset.researchVisit){visit(decode(b.dataset.researchVisit));return;}
 const i=decode(b.dataset.researchWatch||b.dataset.queueAdd||b.dataset.listRemove);if(!i)return;const s=readState(),key=itemKey(i),gkey=groupKey(i);
 if(b.dataset.researchWatch){const exists=s.watch.some(x=>itemKey(x)===key);if(!exists&&s.watch.length>=200)return tell('自选已满200只，请先移除一些。');s.watch=exists?s.watch.filter(x=>itemKey(x)!==key):[i,...s.watch];writeState(s);tell(exists?'已移出自选':'已加入自选，稍后可以写下关注理由。');}
 else if(b.dataset.queueAdd){if(!gkey){visit(i);location.href=itemURL(i);return;}const g=s.queues[gkey]||{items:[],days:30};if(g.items.some(x=>itemKey(x)===key))return tell('已在这一组待对比中。');if(g.items.length>=limitFor(gkey))return tell(`这一组最多${limitFor(gkey)}只，请先移除一只。`);activeGroup=gkey;setQueue(gkey,[...g.items,i],g.days,'dock');tell('已加入待对比');}
 else if(b.dataset.listRemove){if(b.dataset.list==='queue'){const g=s.queues[gkey];if(g)setQueue(gkey,g.items.filter(x=>itemKey(x)!==key),g.days,'dock');}else{s[b.dataset.list]=s[b.dataset.list].filter(x=>itemKey(x)!==key);writeState(s);}}
});
sheet.addEventListener('input',e=>{if(!e.target.dataset.note)return;const i=decode(e.target.dataset.note);if(!i)return;const s=readState(),found=s.watch.find(x=>itemKey(x)===itemKey(i));if(found){found.note=e.target.value.slice(0,180);writeState(s,{source:'note'});}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(panel){e.preventDefault();close();}else if(document.body.classList.contains('research-open')){launcher.click();launcher.focus();}}});
document.addEventListener('pointerdown',e=>{if(panel&&!sheet.contains(e.target)&&!dock.contains(e.target)&&!e.target.closest('[data-research-watch]'))close();});
document.addEventListener('research:change',e=>{if(e.detail?.source!=='note')render();});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){render();document.dispatchEvent(new CustomEvent('research:external'));}});
document.addEventListener('demo:market',e=>{if(Object.hasOwn(markets,e.detail?.market)){market=e.detail.market;activeGroup='';render();}});
document.addEventListener('research:context',e=>{if(e.detail?.group){activeGroup=e.detail.group;render();}});
// The daily screener is a classic script. Enrich only its currently rendered rows.
const dataset=document.getElementById('dataset'),fundBody=document.getElementById('body');
if(dataset&&fundBody){
 const funds=new Map(JSON.parse(dataset.textContent).rows.map(r=>[r.code,r]));
 function decorate(){fundBody.querySelectorAll('.detail-link[data-code]').forEach(b=>{const r=funds.get(b.dataset.code),host=b.closest('tr')?.querySelector('.row-actions');if(!r||!host||host.querySelector('[data-research-watch]'))return;const i={market:'fund',code:r.code,name:r.name};host.insertAdjacentHTML('beforeend',researchButtons(i)+`<button data-queue-add="${encode(i)}">＋ 加入对比</button>`);});}
 new MutationObserver(decorate).observe(fundBody,{childList:true,subtree:true});decorate();
 fundBody.addEventListener('click',e=>{const b=e.target.closest('.detail-link[data-code]');if(b){const r=funds.get(b.dataset.code);if(r)visit({market:'fund',code:r.code,name:r.name});}});
}
render();
