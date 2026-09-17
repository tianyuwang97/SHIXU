import profiles from './us-company-profiles.json';
import {researchButtons,visit} from './research-store.mjs';
import {initExitMode} from './exit-mode.js';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),pct=n=>(n>=0?'+':'')+(n*100).toFixed(2)+'%';
const PREVIEW_COUNT=3;
let data,limit=PREVIEW_COUNT,market='CN',requestVersion=0;
const tabs=[...document.querySelectorAll('[data-home-market]')];
const panels=[...document.querySelectorAll('[data-market-panel]')];
const exitMode=initExitMode(()=>setMarket(initialMarket(),false));
function initialMarket(){const url=new URL(location.href),m=url.searchParams.get('market')?.toLowerCase();return ['cn','us','hk','fund'].includes(m)?m:'cn';}
const marketName=()=>({CN:'A股',US:'美股',HK:'港股'})[market];
function setMarket(next,writeURL=true){
 if(!['cn','us','hk','fund'].includes(next))return;
 ++requestVersion;limit=PREVIEW_COUNT;
 tabs.forEach(b=>{const active=b.dataset.homeMarket===next;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
 panels.forEach(p=>p.hidden=p.dataset.marketPanel!==next);
 document.dispatchEvent(new CustomEvent('demo:market',{detail:{market:next}}));
 const hasPicks=['cn','us','hk'].includes(next);$('stock-picks').hidden=!hasPicks||exitMode.active;
 if(writeURL){const url=new URL(location.href);url.searchParams.set('market',next);if(!hasPicks&&url.hash==='#stock-picks')url.hash='';history.replaceState(null,'',url);}
 exitMode.setMarket(next);
 if(hasPicks){market=next.toUpperCase();$('stockPickTitle').textContent=`近30天 · ${marketName()}双规则候选`;if(!exitMode.active)load();}
}

function chart(s){const p=s.points,vals=p.map(v=>(v[1]-1)*100),lo=Math.min(0,...vals),hi=Math.max(0,...vals),span=Math.max(hi-lo,.1),start=Date.parse(s.start),x=i=>8+(Date.parse(p[i][0])-start)/(29*86400000)*284,y=v=>72-(v-lo)/span*60;return `<svg viewBox="0 0 300 88" role="img" aria-label="${esc(s.name)}近30自然日调整收盘走势"><title>${esc(s.name)} · ${s.start}—${s.asof} · ${pct(s.change)}</title><path d="M8 ${y(0)}H292" stroke="#d1dfd8" stroke-dasharray="3 3"/><polyline fill="none" stroke="#237b65" stroke-width="2.5" points="${vals.map((v,i)=>x(i).toFixed(2)+','+y(v).toFixed(2)).join(' ')}"/></svg>`;}
function companyHeading(s){const p=market==='US'?profiles[s.code]:null;return `<h3>${esc(p?.name||s.name)}</h3>${p?`<p class="company-english">${esc(s.name)}</p>`:''}${researchButtons({market:market.toLowerCase(),code:s.code,name:p?.name||s.name})}`;}
document.addEventListener('click',e=>{const a=e.target.closest('.peer-entry');if(!a||!data)return;const code=new URL(a.href).searchParams.get('code'),s=data.matches.find(s=>s.code===code);if(s)visit({market:market.toLowerCase(),code:s.code,name:s.name});});
function companyIntro(s){
 if(market!=='US')return '';
 const p=profiles[s.code];
 if(!p)return '<section class="company-intro company-intro-pending"><p>这家公司的中文业务简介待补充。</p></section>';
 return `<section class="company-intro" aria-label="${esc(p.name)}公司简介"><span class="company-industry">${esc(p.industry)}</span><p>${esc(p.summary)}</p><details class="company-sources"><summary>简介来源 · ${esc(p.checkedAt)}核对</summary><p>按公开公司资料整理的业务介绍；核对日期独立于行情截止日。</p>${p.sources.map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a>`).join(' · ')}</details></section>`;
}
const loginURL=()=>'/login?return_to='+encodeURIComponent(location.pathname+location.search+'#stock-picks');
function renderRules(){
 $('stockRuleGuide').innerHTML=(data.rules||[{id:'R01'},{id:'R02'}]).map(r=>`<span>${esc(r.id)}${r.description?' · '+esc(r.description):''}</span>`).join('')+(data.authenticated?'':`<a href="${loginURL()}">登录查看完整规则</a>`);
 document.querySelectorAll('.hd-login').forEach(a=>{a.textContent=data.authenticated?'账号':'登录';a.href=loginURL();});
}
function render(){
 renderRules();
 $('stockPickMeta').textContent=`行情截止 ${data.asof} · ${data.total}只${marketName()}观察池 · ${data.evaluated}只完成判断 · ${data.unknown}只待核实${market==='CN'&&data.asof<data.dailyAsOf?' · 股票快照更新滞后':''}${market==='US'&&data.expectedAsOf&&data.asof<data.expectedAsOf?' · '+data.expectedAsOf+'交易日数据尚未齐备':''} · ${({CN:'中国交易日 / 人民币口径',US:'美国交易日 / 美元口径',HK:'香港交易日 / 港币口径'})[market]}`;
 $('stockPickCount').textContent=`${data.matches.length}只同时符合`;
 $('stockPickCards').innerHTML=data.matches.length?data.matches.slice(0,limit).map(s=>`<article class="stock-pick"><header><div><span>${esc(s.code)} · ${marketName()}</span>${companyHeading(s)}</div><strong>${pct(s.change)}<small>30日首尾涨跌幅</small></strong></header>${companyIntro(s)}<div class="pick-tags"><span>R01 ✓</span><span>R02 ✓</span></div>${chart(s)}<div class="pick-dates"><span>${s.start}</span><span>${s.asof}</span></div><p>区间振幅 ${(s.amplitude*100).toFixed(2)}%</p><details><summary>为什么入选？</summary>${data.authenticated&&s.explanation?`<p>${esc(s.explanation)}</p>`:`<p>同时符合 R01、R02。<a href="${loginURL()}">登录查看具体条件</a></p>`}</details><a class="peer-entry" href="/stock-peers.html?market=${market.toLowerCase()}&code=${esc(s.code)}">同板块对比</a><a href="${esc(s.source)}" target="_blank" rel="noopener noreferrer">查看行情来源</a></article>`).join(''):`<p class="pick-empty">截至${data.asof}，已完成判断的${data.evaluated}只股票中，没有同时满足两条规则的候选。${data.unknown?'另有'+data.unknown+'只数据待核实。':''}</p>`;
 $('stockPickMore').hidden=data.matches.length<=PREVIEW_COUNT;
 $('stockPickMore').textContent=limit===PREVIEW_COUNT?`查看全部 ${data.matches.length} 只候选`:'收起，保留3只预览';
 $('stockPickMore').setAttribute('aria-expanded',String(limit>PREVIEW_COUNT));
 $('stockPickCoverage').innerHTML=`按30日首尾涨跌幅从高到低展示。${market==='HK'?`观察池为<a href="${esc(data.universeSource)}" target="_blank" rel="noopener noreferrer">港交所港币主板及GEM普通股名单（${esc(data.universeAsOf)}）</a>，共${data.total}只；有完整收盘序列的${data.evaluated}只参与判断，停牌、历史不足及数据未取得的股票单列待核实。使用Yahoo Finance股息与拆股调整收盘序列，港币计价，不含汇率变化和交易费用。`:market==='US'?`观察池为SPY官方股票持仓与纳斯达克100成分的去重合集，不是全美股。${data.universeSources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}（${esc(s.asof)}）</a>`).join(' · ')}。使用Yahoo Finance提供的股息与拆股调整收盘序列，美元计价，不含人民币汇率变化及交易费用；不含盘前、盘后或未收盘日。`:`观察池为<a href="${esc(data.universeSource)}" target="_blank" rel="noopener noreferrer">中证指数官方沪深300成分（名单日期${esc(data.universeAsOf)}）</a>，不是全A股。使用前复权日收盘价（非分红再投资收益），`}截至${data.asof}的最近30个自然日；周末不补点。完整规则及个股入选依据登录后可见。页面展示规则匹配候选，不含收益预测或自动交易。${data.unknown?'<details><summary>查看待核实股票</summary><p>'+data.excluded.map(s=>esc(s.code+' '+s.name+'：'+s.reason)).join('<br>')+'</p></details>':''}`;
}
async function load(){
 const version=++requestVersion,selectedMarket=market;
 $('stockRuleGuide').innerHTML='<span>规则 R01</span><span>规则 R02</span>';
 $('stockPickMeta').textContent=`正在读取${marketName()}筛选快照…`;$('stockPickCount').textContent='正在加载';$('stockPickCards').innerHTML='';$('stockPickCoverage').innerHTML='';$('stockPickMore').hidden=true;
 try{
  const r=await fetch('/api/stock-picks?market='+selectedMarket,{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw Error();const next=await r.json();if(!Array.isArray(next.matches)||!next.asof||next.market!==selectedMarket)throw Error();
  if(version!==requestVersion)return;data=next;render();
 }catch{if(version!==requestVersion)return;$('stockPickMeta').textContent=`${marketName()}候选暂未载入，请稍后重试。`;$('stockPickCount').textContent='数据待加载';$('stockPickCards').innerHTML='<button id="retryStockPicks">重新加载</button>';$('retryStockPicks').onclick=load;}
}
$('stockPickMore').onclick=()=>{const collapse=limit>PREVIEW_COUNT;limit=collapse?PREVIEW_COUNT:data.matches.length;render();if(collapse)$('stock-picks').scrollIntoView({block:'start'});};
tabs.forEach((b,index)=>{
 b.onclick=()=>setMarket(b.dataset.homeMarket);
 b.onkeydown=e=>{let i;if(e.key==='ArrowRight')i=(index+1)%tabs.length;else if(e.key==='ArrowLeft')i=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else return;e.preventDefault();tabs[i].focus();setMarket(tabs[i].dataset.homeMarket);};
});
window.addEventListener('popstate',()=>{exitMode.syncURL();setMarket(initialMarket(),false);});
window.addEventListener('hashchange',()=>{if(location.hash==='#stock-picks'&&$('stock-picks').hidden)setMarket('cn');});
setMarket(initialMarket(),false);

// Do not retain member explanations after navigating back or returning from logout.
window.addEventListener('pageshow',e=>{if(e.persisted&&!exitMode.active&&!$('stock-picks').hidden)load();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){data=null;$('stockPickCards').innerHTML='';$('stockRuleGuide').innerHTML='<span>规则 R01</span><span>规则 R02</span>';}else if(!$('stock-picks').hidden)load();});
