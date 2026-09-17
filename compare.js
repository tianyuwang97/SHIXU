import {readComparisonLink} from './compare-selection.mjs';
import {researchButtons,readState,setQueue,visit} from './research-store.mjs';
import {sectors,tagsFor,shareClass,productKind,matchSearch,peerRows,compareSeries,indexKey,fixedFee} from './compare-core.mjs';
import {companyFor} from './company-data.mjs';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors=['#176b58','#7160b6','#dc702a','#327ca5'],pct=x=>Number.isFinite(x)?`${x>=0?'+':''}${(x*100).toFixed(2)}%`:'—',rate=x=>Number.isFinite(x)?x.toFixed(2)+'% / 年':'未取得';
let D,byCode,anchor=null,selected=[],sector='',peerLimit=9,searchLimit=20,days=30,profiles={},seed={},profileErrors={},loading=new Set(),noticeTimer;
const histories={},historyErrors={},historyLoading=new Set();
const holdingData={},holdingErrors={},holdingLoading=new Set();
const researchFund=r=>({market:'fund',code:r.code,name:r.name});
document.addEventListener('research:change',e=>{if(e.detail?.source==='dock')restoreResearch();});
document.addEventListener('research:external',restoreResearch);
function restoreResearch(){if(!byCode)return;const codes=(readState().queues.fund?.items||[]).map(i=>i.code).filter(c=>byCode.has(c));if(JSON.stringify(codes)===JSON.stringify(selected))return;if(codes.length)chooseAnchor(codes[0],codes,false);else{selected=[];anchor=null;$('workbench').hidden=true;refreshSearch();}}
async function loadHoldings(code,force=false){
 if(holdingLoading.has(code)||(!force&&holdingData[code]))return;
 holdingLoading.add(code);delete holdingErrors[code];renderComparison();
 try{
  const r=await fetch('/api/compare/holdings?code='+code+(force?'&refresh=1':''),{signal:AbortSignal.timeout(20000)}),h=await r.json();
  if(!r.ok||h.code!==code||!['ok','unavailable'].includes(h.status)||!Array.isArray(h.items))throw Error();
  const old=holdingData[code]||byCode.get(code)?.holdings;
  if(old?.items?.length&&(!h.items.length||h.date<old.date))throw Error();
  holdingData[code]=h;
 }catch{holdingErrors[code]='本次持仓获取失败';}
 finally{holdingLoading.delete(code);if(selected.includes(code))renderComparison();}
}
async function loadHistory(code){
 if(histories[code]||historyLoading.has(code))return;
 historyLoading.add(code);delete historyErrors[code];renderComparison();
 try{const response=await fetch('/api/compare/history?code='+code+'&asof='+D.context.asof,{signal:AbortSignal.timeout(65000)}),data=await response.json();
  if(!response.ok||data.code!==code||data.context?.asof!==D.context.asof||data.context?.max_calendar_days!==365||!Array.isArray(data.history))throw Error(data.error||'历史净值响应异常');histories[code]=data;
 }catch{historyErrors[code]='历史净值加载失败，请重试（并非历史不足）';}
 finally{historyLoading.delete(code);if(selected.includes(code))renderComparison();}
}
function ensureHistory(){if(days>30)selected.forEach(loadHistory);}
function comparisonResult(rows){
 if(days<=30)return compareSeries(rows,D.context,days);
 const context=selected.map(code=>histories[code]?.context).find(Boolean)||{...D.context,max_calendar_days:365,calendar_offsets:[]};
 return compareSeries(rows.map(r=>({...r,history:histories[r.code]?.history||[],historyError:histories[r.code]?null:historyErrors[r.code]||(historyLoading.has(r.code)?'正在载入一年历史净值…':'等待历史净值…')})),context,days);
}
function notice(text){$('compareNotice').textContent=text;$('compareNotice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('compareNotice').hidden=true,3500);}
function refreshSearch(){if(!D)return;const q=$('fundQuery').value,rows=matchSearch(D.rows,q);$('searchResults').innerHTML=!q.trim()?'':`<p class="search-count">找到 ${rows.length.toLocaleString()} 个基金份额，选择一只作为参照。</p><div class="search-result-list">${rows.slice(0,searchLimit).map(r=>`<div class="search-result"><button class="choose-anchor" data-anchor="${r.code}"><span>${esc(r.name)}<small>${r.code} · ${esc(r.type)}</small></span><span>作为参照</span></button>${researchButtons(researchFund(r))}${anchor?`<button data-add="${r.code}" ${selected.includes(r.code)?"disabled":""}>${selected.includes(r.code)?"已加入":"＋ 加入对比"}</button>`:""}</div>`).join('')}</div>${rows.length>searchLimit?'<button id="moreSearch" style="margin-top:12px">显示更多结果</button>':''}${!rows.length?'<p class="hint">试试六位代码或更短的关键词。当前名单不含货币基金及场内ETF。</p>':''}`;}
async function loadProfile(code,force=false){if(loading.has(code)||(!force&&profiles[code]&&!profiles[code].fallback))return;loading.add(code);delete profileErrors[code];renderComparison();
 try{const response=await fetch('/api/compare/profile?code='+code+(force?'&refresh=1':''),{signal:AbortSignal.timeout(16000),cache:force?'reload':'default'});const p=await response.json();if(!response.ok||p.code!==code||!p.company)throw Error(p.error||'资料暂不可用');profiles[code]=p;}
 catch(e){if(seed[code])profiles[code]={...seed[code],fallback:true};profileErrors[code]=profiles[code]?'最新资料获取失败，以下保留已核验快照。':'公司与费率资料暂未取得。';}
 finally{loading.delete(code);if(selected.includes(code)){renderPeers();renderComparison();}}
}
function chooseAnchor(code,initialCodes=[code],scroll=true){anchor=byCode.get(code);visit(researchFund(anchor));selected=initialCodes;sector=tagsFor(anchor)[0]||'';peerLimit=9;$('peerQuery').value='';$('kind').value='same';$('share').value=shareClass(anchor)==='未标明'?'all':'same';$('workbench').hidden=false;
 $('sector').innerHTML='<option value="">手动选择对比方向</option>'+sectors.map(s=>`<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('');$('sector').value=sector;
 $('anchorCard').innerHTML=`<div class="anchor-card"><div><span class="pill">参照基金</span><h2>${esc(anchor.name)}</h2><p>${anchor.code} · ${esc(anchor.type)} · ${esc(shareClass(anchor))}份额</p>${researchButtons(researchFund(anchor))}</div><p>${tagsFor(anchor).length?'名称包含的方向：'+esc(tagsFor(anchor).join(' / ')):'名称无法确定板块，请从下方选择对比方向。'}</p></div>`;
 refreshSearch();renderPeers();renderComparison();selected.forEach(c=>{loadProfile(c);loadHoldings(c);});ensureHistory();if(scroll)$('workbench').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderPeers(){if(!anchor)return;const rows=peerRows(D.rows,anchor,sector,{kind:$('kind').value,share:$('share').value,query:$('peerQuery').value.trim()});$('peerList').innerHTML=!sector?'<div class="empty-compare">先选择对比方向。无法从名称判断的基金不会被自动归入某个板块。</div>':`<div class="peer-heading"><p class="hint">${esc(sector)} · ${rows.length} 个名称匹配候选 · 按基金代码排列</p><a class="jump-compare" href="#comparison">查看已选对比（${selected.length}/4）↓</a></div><div class="peers">${rows.slice(0,peerLimit).map(r=>{const p=profiles[r.code]||seed[r.code],added=selected.includes(r.code);return `<article class="peer"><small>${r.code}${p?.company?' · '+esc(p.company):''}</small><h3>${esc(r.name)}</h3>${researchButtons(researchFund(r))}<div class="tags"><span class="pill">${esc(productKind(r))}</span><span class="pill blue">${esc(shareClass(r))}份额</span></div><p>${p?.tracking?'跟踪：'+esc(p.tracking):esc(r.type)}</p><button data-add="${r.code}" ${added?'disabled':''}>${added?'已加入':'＋ 加入对比'}</button></article>`;}).join('')}</div>${!rows.length?'<div class="empty-compare">没有符合这些条件的候选。可放宽产品结构、份额限制或切换细分方向。</div>':''}`;$('morePeers').hidden=rows.length<=peerLimit;}
const getP=r=>profiles[r.code];
function companyMarkup(r){const name=getP(r)?.company,c=companyFor(name);return profileValue(r,'company')+(c?`<small><a href="/companies.html#${c.id}">了解公司风格与特色</a></small>`:'');}
function profileValue(r,k){return getP(r)?.[k]?esc(getP(r)[k]):`<span class="muted">${loading.has(r.code)?'读取中…':'未取得'}</span>`;}
function heldMarkup(r){
 const h=holdingData[r.code]||r.holdings,busy=holdingLoading.has(r.code),error=holdingErrors[r.code]||h?.status==='error';
 const source=`<a href="https://fundf10.eastmoney.com/ccmx_${r.code}.html" target="_blank" rel="noopener">持仓来源</a>`;
 const action=busy?'<small>正在核验最新已披露持仓…</small>':`<br><button data-holdings-retry="${r.code}" style="margin-top:8px">${error?'重试持仓':'更新持仓'}</button>`;
 const linkHint=/联接/.test(r.name)?'<small>ETF联接未穿透目标ETF</small>':'';
 if(!h?.items?.length)return `<span class="muted">${busy?'正在加载已披露持仓…':error?'持仓获取失败，并非没有持仓':h?.status==='unavailable'?'公开来源暂未返回直接股票持仓':'持仓尚未加载'}</span>${linkHint}<br>${source}${action}`;
 return `<ul class="hold-list">${h.items.slice(0,3).map(p=>`<li><span>${esc(p.name)}</span><strong>${Number.isFinite(p.weight)?p.weight.toFixed(2)+'%':'未披露占比'}</strong></li>`).join('')}</ul><small>占基金净值 · 报告期 ${esc(h.date||'未知')}${error?' · 更新失败，保留已取得数据':''}</small>${linkHint}${source}${action}`;
}
function chartMarkup(rows,result){const good=result.metrics.filter(m=>!m.error);if(!good.length){const pending=days>30&&rows.some(r=>historyLoading.has(r.code)),failed=days>30&&rows.some(r=>historyErrors[r.code]);return `<div class="empty-compare" role="status">${pending?'正在载入历史净值，请稍候…':failed?'历史净值加载失败，暂时无法绘图；这不代表基金历史不足。请点击下方“重试历史净值”。':'当前所选基金没有足够的可比净值，暂不绘制走势图；具体原因见下方收益行。'}</div>`;}
 const all=good.flatMap(m=>m.series.map(p=>p[1]-1)),lo=Math.min(0,...all),hi=Math.max(0,...all),pad=Math.max((hi-lo)*.12,.003),min=lo-pad,max=hi+pad;
 const width=Math.max(280,$('comparison').clientWidth-48),right=width-20;const first=Math.min(...good.flatMap(m=>m.series.map(p=>p[0]))),last=Math.max(...good.flatMap(m=>m.series.map(p=>p[0]))),x=v=>62+(v-first)/Math.max(1,last-first)*(right-62),y=v=>230-(v-min)/(max-min)*205;
 const grid=[min,(max+min)/2,max].map(v=>`<line x1="62" x2="${right}" y1="${y(v)}" y2="${y(v)}" stroke="#dce5dd"/><text x="52" y="${y(v)+4}" text-anchor="end" fill="#60766d" font-size="14">${(v*100).toFixed(1)}%</text>`).join('');
 return `<section class="comparison-chart"><h3>从同一天、同一个起点看走势</h3><p>${result.start} — ${result.end} · 以共同首日为0% · 分红再投资口径</p><svg class="compare-svg" viewBox="0 0 ${width} 275" preserveAspectRatio="none" role="img" aria-label="${esc(rows.map(r=>r.name).join('、'))}共同期间收益走势"><title>横轴为实际净值日期，纵轴为相对共同首日的累计收益；缺失数据不补点。</title>${grid}<line x1="62" x2="${right}" y1="${y(0)}" y2="${y(0)}" stroke="#90a79b" stroke-dasharray="4 5"/>${good.map(m=>{const i=rows.findIndex(r=>r.code===m.code);return `<polyline points="${m.series.map(p=>`${x(p[0])},${y(p[1]-1)}`).join(' ')}" stroke="${colors[i]}" stroke-width="3" stroke-linejoin="round" fill="none" vector-effect="non-scaling-stroke"><title>${esc(rows[i].name)}：${pct(m.change)}</title></polyline>`;}).join('')}<text x="62" y="263" fill="#60766d" font-size="14">${result.start}</text><text x="${right}" y="263" text-anchor="end" fill="#60766d" font-size="14">${result.end}</text></svg><div class="chart-legend">${good.map(m=>{const i=rows.findIndex(r=>r.code===m.code);return `<span><i class="color-dot" style="background:${colors[i]}"></i>${esc(rows[i].name)} <b>${pct(m.change)}</b></span>`;}).join('')}</div>${good.length<rows.length?'<p>部分基金因数据不足未绘制；原因列在下方收益行。</p>':''}</section>`;
}
function renderComparison(){if(!D||!anchor)return;const rows=selected.map(c=>byCode.get(c)),result=comparisonResult(rows),metrics=new Map(result.metrics.map(m=>[m.code,m]));
 setQueue('fund',rows.map(researchFund),days);
 $('selection').innerHTML=`<div class="selection">${rows.map((r,i)=>`<button ${i?`data-remove="${r.code}"`:'disabled'}><i class="color-dot" style="background:${colors[i]}"></i><span>${esc(r.name)}${i?' ×':' · 参照'}</span></button>`).join('')}</div>`;
 const feeRows=rows.map(r=>({r,fee:fixedFee(getP(r))})).filter(r=>r.fee!==null),companies=new Set(rows.map(r=>getP(r)?.company).filter(Boolean)),indices=rows.map(r=>indexKey(getP(r))),knownIndices=indices.filter(Boolean),sameIndex=rows.length>1&&knownIndices.length===rows.length&&new Set(knownIndices).size===1;
 const summary=rows.length>1?`<div class="comparison-summary"><div class="summary-item"><b>${companies.size?companies.size+' 家已核验基金公司':rows.some(r=>loading.has(r.code))?'正在读取基金公司…':'基金公司资料待取得'}</b><p>${companies.size===1&&rows.every(r=>getP(r))?'目前选中产品属于同一家公司，可以再加入其他公司的候选。':rows.some(r=>!getP(r))?'部分公司资料仍待取得。':'可以结合费用、投资范围与持仓判断差异。'}</p></div><div class="summary-item"><b>${sameIndex?'跟踪标的相同':new Set(knownIndices).size>1?'跟踪标的不同':'核对产品投资范围'}</b><p>${sameIndex?esc(knownIndices[0])+'；结构、份额和费用仍可能不同。':'同板块不等于同一指数；主动基金也可能调整持仓。'}</p></div><div class="summary-item"><b>${feeRows.length>1?Math.min(...feeRows.map(v=>v.fee)).toFixed(2)+'%—'+Math.max(...feeRows.map(v=>v.fee)).toFixed(2)+'% / 年':'固定年费率待比较'}</b><p>已取得产品的公布管理、托管、销售服务费率之和，不代表全部费用或实际扣费金额。</p></div></div>`:'<div class="empty-compare">参照基金已加入。再加入至少一只候选，即可查看公司间差异。</div>';
 const fields=[
 ['基金管理公司',companyMarkup],['基金经理',r=>profileValue(r,'manager')],['产品结构 / 份额',r=>`${esc(productKind(r))} · ${esc(shareClass(r))}份额<small>${esc(r.type)}</small>`],
 ['跟踪标的',r=>profileValue(r,'tracking')],['业绩比较基准',r=>profileValue(r,'benchmark')],
 ['共同期间收益',r=>{const m=metrics.get(r.code);return m.error?`<span class="muted">${esc(m.error)}</span>${days>30&&historyErrors[r.code]?`<br><button data-history-retry="${r.code}">重试历史净值</button>`:""}`:`<strong class="metric-value">${pct(m.change)}</strong><small>${result.start} — ${result.end}</small>`;}],
 ['区间最大回撤',r=>{const m=metrics.get(r.code);return m.error?'—':`${(m.drawdown*100).toFixed(2)}%<small>仅此比较区间内的峰值到谷值跌幅</small>`;}],
 ['区间振幅',r=>{const m=metrics.get(r.code);return m.error?'—':(m.amplitude*100).toFixed(2)+'%';}],
 ['管理费率',r=>rate(getP(r)?.management)],['托管费率',r=>rate(getP(r)?.custody)],['销售服务费率',r=>rate(getP(r)?.service)],
 ['公布固定年费率合计',r=>`${rate(fixedFee(getP(r)))}<small>ETF联接等产品的计费基数可能不同，详见法律文件。</small>`],
 ['申购 / 赎回费用',r=>`随平台、金额、持有天数变化<small><a href="https://fundf10.eastmoney.com/jjfl_${r.code}.html" target="_blank" rel="noopener">查看完整费率表</a></small>`],
 ['净资产规模',r=>profileValue(r,'size')],['成立日期 / 初始规模',r=>profileValue(r,'inception')],['前三大直接股票持仓',heldMarkup],
 ['投资目标与范围',r=>getP(r)?`<details><summary>展开档案节选</summary><p>${esc(getP(r).objective||'投资目标未取得')}</p><p>${esc(getP(r).scope||'投资范围未取得')}</p><small>节选可能省略后续内容，请以完整文件为准。</small><a href="https://fundf10.eastmoney.com/jbgk_${r.code}.html" target="_blank" rel="noopener">查看完整档案</a></details>`:'未取得'],
 ['资料来源 / 检查时间',r=>{const p=getP(r);return `<a href="https://fundf10.eastmoney.com/jbgk_${r.code}.html" target="_blank" rel="noopener">天天基金公开档案</a><small>${p?esc(p.checkedAt.replace('T',' ').slice(0,16))+' UTC':'尚未取得'}</small>${profileErrors[r.code]?`<small class="error">${esc(profileErrors[r.code])}</small>`:''}${loading.has(r.code)?'<small>正在核验最新资料…</small>':`<button data-retry="${r.code}" style="margin-top:8px">重新核验</button>`}`;}]
 ];
 $('comparison').innerHTML=summary+(days>30?`<p class="hint" role="status">${days===180?'最近半年 · 180':'最近一年 · 365'}自然日 · 截止 ${D.context.asof}${rows.some(r=>historyLoading.has(r.code))?' · 正在载入历史净值…':''} · 数据不足的基金不参与收益比较。</p>`:'')+chartMarkup(rows,result)+`<div class="compare-table-wrap"><table class="compare-table" style="min-width:${165+rows.length*250}px"><thead><tr><th scope="col">对比项目</th>${rows.map((r,i)=>`<th scope="col"><i class="color-dot" style="background:${colors[i]}"></i> ${esc(r.name)}<small>${r.code}</small></th>`).join('')}</tr></thead><tbody>${fields.map(([label,cell])=>`<tr><th scope="row">${label}</th>${rows.map(r=>`<td>${cell(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.query){$('fundQuery').value=b.dataset.query;searchLimit=20;refreshSearch();}if(b.dataset.anchor)chooseAnchor(b.dataset.anchor);if(b.id==='moreSearch'){searchLimit+=20;refreshSearch();}if(b.dataset.add){const code=b.dataset.add;if(selected.includes(code))return;if(selected.length>=4)return notice('最多同时比较4只，请先移除一只。');selected.push(code);visit(researchFund(byCode.get(code)));refreshSearch();renderPeers();renderComparison();loadProfile(code);loadHoldings(code);ensureHistory();notice('已加入下方对比表');}if(b.dataset.remove){selected=selected.filter(c=>c!==b.dataset.remove);refreshSearch();renderPeers();renderComparison();}if(b.dataset.holdingsRetry)loadHoldings(b.dataset.holdingsRetry,true);if(b.dataset.retry)loadProfile(b.dataset.retry,true);if(b.dataset.historyRetry)loadHistory(b.dataset.historyRetry);});
 $('searchForm').onsubmit=e=>{e.preventDefault();searchLimit=20;refreshSearch();};let searchTimer;$('fundQuery').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{searchLimit=20;refreshSearch();},180);};
 for(const id of ['sector','kind','share'])$(id).onchange=()=>{sector=$('sector').value;peerLimit=9;renderPeers();};$('peerQuery').oninput=()=>{peerLimit=9;renderPeers();};$('morePeers').onclick=()=>{peerLimit+=9;renderPeers();};$('period').onchange=()=>{days=Number($('period').value);renderComparison();ensureHistory();};
 async function boot(){try{const r=await fetch('/compare-data.json');if(!r.ok)throw Error();D=await r.json();byCode=new Map(D.rows.map(r=>[r.code,r]));try{const p=await fetch('/compare-profiles.json');if(p.ok)seed=await p.json();}catch{}$('fundQuery').disabled=false;$('searchButton').disabled=false;$('dataStatus').textContent=`${D.rows.length.toLocaleString()} 个场外基金份额 · 正式净值截止 ${D.context.asof} · 当前资料对比，不用于历史演练判定`;
 const params=new URL(location.href).searchParams,initial=readComparisonLink(params,c=>byCode.has(c));if(!initial.codes.length&&!params.has('q')){const saved=readState().queues.fund;if(saved){initial.codes=saved.items.map(i=>i.code).filter(c=>byCode.has(c));initial.days=saved.days;}}days=initial.days;$('period').value=String(days);if(initial.codes.length){chooseAnchor(initial.codes[0],initial.codes,false);$('fundQuery').value=initial.codes[0];$(location.hash==='#share-guide'?'share-guide':initial.codes.length>1?'selection':'workbench').scrollIntoView({block:'start'});}else if(params.get('q'))$('fundQuery').value=params.get('q').slice(0,80);refreshSearch();
 }catch{$('dataStatus').innerHTML='基金数据暂未载入。<button id="retryData">重试</button>';$('retryData').onclick=boot;}}
 boot();

let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(!D||!anchor)return;const rows=selected.map(c=>byCode.get(c)),chart=document.querySelector('.comparison-chart');if(chart)chart.outerHTML=chartMarkup(rows,comparisonResult(rows));},150);});
