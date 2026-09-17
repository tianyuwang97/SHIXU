import {themes,indexGroups,summarize} from './sector-core.mjs';
import {researchButtons,readState,setQueue,visit} from './research-store.mjs';
import {MAX_COMPARE,validSelection,comparisonLink} from './compare-selection.mjs';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),pct=x=>Number.isFinite(x)?`${x>=0?'+':''}${(x*100).toFixed(2)}%`:'—';
let data,companies=[],theme='health',mode='active',days=365,companyQuery='';
let basket=[],fundByCode=new Map();
const basketKey='sector-comparison-selection-v1';
const researchFund=r=>({market:'fund',code:r.code,name:r.name});
function restoreResearch(){if(!data)return;const items=readState().queues.fund?.items||[];for(const i of items)if(!fundByCode.has(i.code))fundByCode.set(i.code,i);basket=items.map(i=>i.code);renderBasket();}
document.addEventListener('research:change',e=>{if(e.detail?.source==='dock')restoreResearch();});
document.addEventListener('research:external',restoreResearch);
function renderBasket(message=''){
 setQueue('fund',basket.map(c=>fundByCode.get(c)).filter(Boolean).map(researchFund),days);
 const tray=$('sectorCompareTray');tray.hidden=!basket.length;document.body.classList.toggle('has-sector-tray',!!basket.length);
 tray.innerHTML=`<div class="sector-tray-top"><strong>基金对比 · ${basket.length}/${MAX_COMPARE}</strong><span>首只为参照 · 沿用当前观察期间</span><button type="button" data-basket-clear>清空</button></div><div class="sector-tray-funds">${basket.map(code=>`<button type="button" data-basket-remove="${code}" aria-label="移除${esc(fundByCode.get(code).name)}">${esc(fundByCode.get(code).name)} ×</button>`).join('')}</div><div class="sector-tray-bottom"><p role="status">${esc(message|| (basket.length<2?'再选1只，就可以开始对比。':'已选基金会在切换板块、搜索公司时保留。'))}</p>${basket.length>=2?`<a class="sector-tray-start" href="${comparisonLink(basket,days)}">开始对比</a>`:'<button class="sector-tray-start" disabled>开始对比</button>'}</div>`;
 document.querySelectorAll('[data-basket-add]').forEach(b=>{const added=basket.includes(b.dataset.basketAdd);b.textContent=added?'已选 · 移除':'＋ 加入对比';b.setAttribute('aria-pressed',String(added));});
 try{sessionStorage.setItem(basketKey,JSON.stringify(basket));}catch{}
}
function toggleBasket(code){
 if(!fundByCode.has(code))return;
 if(basket.includes(code))basket=basket.filter(c=>c!==code);
 else if(basket.length>=MAX_COMPARE)return renderBasket('最多同时对比4只，请先移除一只。');
 else {basket.push(code);visit(researchFund(fundByCode.get(code)));}
 renderBasket();
}
function updateGroups(){updateThemes();const groups=indexGroups(data,theme);$('sectorIndex').innerHTML=groups.map(g=>`<option value="${esc(g.key)}">${esc(g.tracking)} · ${esc(g.structure)}（${g.count}只）</option>`).join('');$('sectorIndexLabel').hidden=mode!=='index';}
function updateThemes(){ $('sectorTheme').innerHTML=themes.map(t=>{const matched=data.rows.filter(r=>r.themes.includes(t.id));const active=matched.filter(r=>r.mode==='active').length,index=matched.filter(r=>r.mode==='index').length;return `<option value="${t.id}">${t.name} · 主动${active} / 指数${index}</option>`;}).join('');$('sectorTheme').value=theme;}
function getRows(t=theme){return summarize(data,companies.filter(c=>c.name.includes(companyQuery)),{theme:t,mode,days,group:$('sectorIndex').value});}
function render(){if(!data)return;
 const rows=getRows().filter(r=>r.total),good=rows.filter(r=>r.count),n=good.reduce((s,r)=>s+r.count,0),window=data.windows[days],unknown=data.rows.filter(r=>r.themes.includes(theme)&&r.error).length;
 const active=data.rows.filter(r=>r.mode==='active').length,index=data.rows.filter(r=>r.mode==='index').length;
 $('sectorCoverage').textContent=`覆盖当前名单中 ${companies.length} 家已核实管理人 · ${active} 只主动主题基金 / ${index} 只指数基金（去重份额） · 名称匹配，不代表全部行业持仓`;
 $('sectorStatus').textContent=`${data.dailyAsOf&&data.dailyAsOf!==data.asof?'板块数据尚未同步至最新日更 · ' : ''}净值截止 ${data.asof} · 共同期间 ${window.start||'—'} 至 ${window.end||'—'} · ${companyQuery?'公司搜索结果 · ':''}${good.length}家公司 / ${n}只有效样本${unknown?' · '+unknown+'只档案未核实，未分类计入':''}`;
 $('sectorMeaning').textContent=mode==='active'?'比较主题名称匹配的主动基金样本，按公司收益中位数排序；持仓、仓位和基准可能不同，不是基金公司的行业选股能力评分。':'仅比较同一个跟踪指数、同一产品结构的样本；收益差异可能来自费用、现金仓位和跟踪情况，不能据此认定公司的行业选股能力。';
 if(good.length===1)$('sectorMeaning').textContent+=' 当前仅1家公司有有效样本，不能据此做跨公司比较。';
 $('sectorResults').innerHTML=rows.length?`<p class="sector-scroll-hint">当前条件下 ${rows.length} 家公司有已收录样本 · 可上下滚动查看全部公司</p><div class="sector-ranks" tabindex="0" role="region" aria-label="全部公司收益对比，可上下滚动">${rows.map(r=>{const value=r.change,scale=Math.max(.01,...good.map(g=>Math.abs(g.change)));return `<article class="sector-rank"><div class="sector-rank-main"><div><a href="/compare.html?q=${encodeURIComponent(r.name.replace(/基金.*$/,''))}">${esc(r.name)}</a><small>${r.count} / ${r.total} 只有效样本${r.count===1?' · 单样本':''}</small></div><div class="sector-value ${value<0?'negative':'positive'}"><strong>${pct(value)}</strong><small>收益中位数</small></div><div class="sector-dd"><b>${r.drawdown===null?'—':(r.drawdown*100).toFixed(2)+'%'}</b><small>样本最大回撤中位数</small></div></div>${value!==null?`<div class="sector-bar" aria-hidden="true"><i class="${value<0?'negative':'positive'}" style="width:${Math.max(1,Math.abs(value)/scale*100)}%"></i></div>`:'<p class="sector-unavailable">'+(r.total?'样本历史不足或数据待核实':'当前样本池未收录该类基金')+'，不参与排序。</p>'}${r.total?`<details><summary>查看 ${r.total} 只样本与统计范围</summary><div class="sector-samples">${r.sample.map(f=>{const m=f.metrics[days];return `<div><div class="sector-sample-title"><a href="/compare.html?code=${f.code}">${esc(f.name)}</a>${researchButtons(researchFund(f))}<button type="button" data-basket-add="${f.code}" aria-label="选择${esc(f.name)}进行对比" aria-pressed="false">＋ 加入对比</button></div><span>${f.code} · ${esc(f.type)}</span><p>${m.error?esc(m.error):'收益 '+pct(m.change)+' · 最大回撤 '+(m.drawdown*100).toFixed(2)+'%'}</p><details><summary>基准、范围与来源</summary><p>业绩比较基准：${esc(f.benchmark||'未取得')}</p><p>投资范围节选：${esc(f.scope||'未取得')}</p><a target="_blank" rel="noopener" href="${f.profileSource}">基金档案</a> · <a target="_blank" rel="noopener" href="${f.navSource}">净值来源</a></details></div>`;}).join('')}</div></details>`:''}</article>`;}).join('')}</div>`:`<div class="sector-empty"><h3>当前条件下没有可比较样本</h3><p>这不表示公司不擅长此领域。${mode==='active'&&indexGroups(data,theme).length?'该板块有指数基金样本，可将比较方式切换为“同指数基金”。':'可切换板块、指数分组或缩短观察期间。'}本页不把缺失数据当成0%收益。</p></div>`;
 $('sectorMatrix').hidden=mode!=='active';
 if(mode==='active'){
  $('sectorMatrixHead').innerHTML='<th scope="col">公司</th>'+themes.map(t=>`<th scope="col">${esc(t.name)}</th>`).join('');
  const matrix=new Map(themes.map(t=>[t.id,new Map(getRows(t.id).map(r=>[r.id,r]))]));
  $('sectorMatrixBody').innerHTML=companies.filter(c=>c.name.includes(companyQuery)&&data.rows.some(r=>r.companyId===c.id&&r.mode==='active')).map(c=>`<tr><th scope="row">${esc(c.short)}</th>${themes.map(t=>{const r=matrix.get(t.id).get(c.id);return `<td><button data-theme="${t.id}" class="${r.change===null?'unavailable':r.change<0?'negative':'positive'}" aria-label="${esc(c.name)} ${esc(t.name)} ${pct(r.change)}，查看板块对比">${pct(r.change)}<small>${r.count?'n='+r.count:'无有效样本'}</small></button></td>`;}).join('')}</tr>`).join('');
 }
 renderBasket();
}
async function boot(){try{const r=await fetch('/sector-data.json');if(!r.ok)throw Error();data=await r.json();if(data.schema!==1||!data.windows||!Array.isArray(data.rows)||!Array.isArray(data.companies))throw Error();companies=data.companies;fundByCode=new Map(data.rows.filter(r=>r.mode==='active'||r.mode==='index').map(r=>[r.code,r]));const saved=readState().queues.fund;if(saved){for(const i of saved.items)if(!fundByCode.has(i.code))fundByCode.set(i.code,i);basket=saved.items.map(i=>i.code);days=[30,180,365].includes(saved.days)?saved.days:365;$('sectorPeriod').value=String(days);}else{try{basket=validSelection(JSON.parse(sessionStorage.getItem(basketKey)||'[]'),c=>fundByCode.has(c));}catch{basket=[];}}$('sectorTheme').innerHTML=themes.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');$('sectorTheme').value=theme;updateGroups();render();$('sectorControls').hidden=false;}
 catch{$('sectorStatus').innerHTML='板块收益数据暂未载入。<button id="retrySector">重试</button>';$('retrySector').onclick=boot;}}
$('sectorResults').addEventListener('click',e=>{const b=e.target.closest('[data-basket-add]');if(b)toggleBasket(b.dataset.basketAdd);});
$('sectorCompareTray').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-basket-clear')){basket=[];renderBasket();}else if(b.dataset.basketRemove)toggleBasket(b.dataset.basketRemove);});
$('sectorCompany').oninput=()=>{companyQuery=$('sectorCompany').value.trim();render();};
$('sectorMode').onchange=()=>{mode=$('sectorMode').value;updateGroups();render();};$('sectorTheme').onchange=()=>{theme=$('sectorTheme').value;updateGroups();render();};$('sectorPeriod').onchange=()=>{days=Number($('sectorPeriod').value);render();};$('sectorIndex').onchange=render;
$('sectorMatrixBody').onclick=e=>{const b=e.target.closest('[data-theme]');if(b){theme=b.dataset.theme;$('sectorTheme').value=theme;updateGroups();render();$('sectorResults').scrollIntoView({behavior:'smooth',block:'start'});}};
boot();
