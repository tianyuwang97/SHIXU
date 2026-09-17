import {companyProfile,companyIntro} from './company-intro.mjs';
import {createCandidateOrder} from './candidate-order.mjs';
import {researchButtons} from './research-store.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={cn:'A股',us:'美股',hk:'港股',fund:'基金'};
const pct=n=>Number.isFinite(n)?(n>=0?'+':'')+(n*100).toFixed(2)+'%':'—';
const mysteryMark='<img class="mystery-mark" src="/mystery-mark.svg" width="64" height="80" alt="?" draggable="false">';
const num=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:3});
export function initExitMode(onChange){
 const orderCandidates=createCandidateOrder();
 const nav=document.querySelector('.market-navigation');
 nav.insertAdjacentHTML('afterend',`<section class="decision-mode" aria-label="研究模式"><div class="decision-caption"><h2 class="decision-title" id="decisionTitle" tabindex="-1"><span class="decision-kicker">留意</span><span>这些股票或基金</span><span class="decision-emphasis">机会正在浮现</span></h2><p id="decisionHint" role="status" hidden></p></div><div id="decisionInvitation" class="decision-invitation" role="status" hidden></div><div class="decision-switch" role="group" aria-label="切换研究模式"><i aria-hidden="true"></i><div class="decision-label"><span id="decisionLabel">${mysteryMark}</span><small id="decisionLabelEnglish" hidden>DISCOVER</small></div><button type="button" data-decision="exit" aria-pressed="false" aria-label="查看卖出候选（需要登录）"><span class="portal-aura" aria-hidden="true"></span><span class="portal-art" aria-hidden="true"><img class="portal-mark portal-closed" src="/stone-portal.png" width="142" height="164" alt="" draggable="false"><img class="portal-mark portal-open" src="/stone-portal-open.png" width="142" height="164" alt="" draggable="false"></span></button></div></section>
 <section class="exit-workspace" id="exit-workspace" hidden aria-labelledby="exitTitle"><header class="exit-heading"><div><h2 id="exitTitle">A股</h2><p>查看出现退出信号的股票和基金，辅助判断减仓与离场时机。</p></div><a id="exitHoldingsLink" href="/portfolio?market=cn">管理我的持仓</a></header><div class="exit-toolbar"><div class="exit-scope" role="group" aria-label="检查范围"><button data-exit-scope="market" aria-pressed="true">市场观察池</button><button data-exit-scope="holdings" aria-pressed="false">我的持仓</button></div><label><span id="exitSearchLabel">搜索股票</span><input id="exitSearch" type="search" placeholder="名称或代码" autocomplete="off"></label></div><p id="exitMeta" class="exit-meta" role="status"></p><div id="exitStats" class="exit-stats"></div><div id="exitRules" class="exit-rules"></div><div id="exitCards" class="exit-grid"></div><button id="exitMore" hidden>查看更多</button><p class="exit-footnote" id="exitFootnote">市场候选每次打开随机展示，顺序不代表卖出优先级。只展示同时符合 R01 与向下 R02 的卖出候选，使用最近30自然日的行情观察期。候选不等于必须卖出；未入选也不代表可以放心持有。规则尚未完成收益回测，不自动执行交易。</p></section>`);
 document.body.insertAdjacentHTML('beforeend',`<dialog id="exitTransition" aria-labelledby="exitQuote"><span class="transition-brand">时序 <small>SHIXU</small></span><div class="exit-quote" id="exitQuote"><span>投资的远见</span><span>不止于发现价值</span><strong>更在于进退有据</strong></div><div class="transition-bottom"><span>KNOW WHEN TO EXIT</span><button id="skipExitTransition" type="button" disabled aria-hidden="true">看见另一面</button></div></dialog>`);
 const $=id=>document.getElementById(id),dialog=$('exitTransition'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const openGate=document.querySelector('.portal-open');
 openGate.decode().then(()=>openGate.parentElement.classList.add('open-ready')).catch(()=>{});
 const requestedExit=new URL(location.href).searchParams.get('view')==='exit';
 let active=false,market='cn',data=null,scope='market',limit=9,version=0,busy=false,skip=null,animations=[];
 const loginURL=()=>'/login?return_to='+encodeURIComponent('/?market='+market+'&view=exit');
 function paint(){
  document.querySelector('.decision-caption').classList.remove('has-error');
  document.querySelector('.decision-mode').classList.remove('has-invitation');
  $('decisionInvitation').hidden=true;$('decisionInvitation').textContent='';
  $('decisionHint').hidden=true;$('decisionHint').textContent='';
  document.body.classList.toggle('exit-mode',active);
  $('exit-workspace').hidden=!active;
  document.querySelector('.decision-switch').classList.toggle('is-exit',active);
  document.querySelector('[data-decision=exit]').setAttribute('aria-pressed',String(active));
  $('decisionLabel').innerHTML=active?'寻找机会':mysteryMark;
  $('decisionLabelEnglish').hidden=!active;
  document.querySelector('[data-decision=exit]').setAttribute('aria-label',active?'返回寻找机会':'查看卖出候选（需要登录）');
  $('decisionTitle').innerHTML=active?'<span class="decision-kicker">醒醒</span><span>持有这些股票或基金</span><span class="decision-emphasis">该准备退出了</span>':'<span class="decision-kicker">留意</span><span>这些股票或基金</span><span class="decision-emphasis">机会正在浮现</span>';
  document.getElementById('marketWorkspaces').hidden=active;
  document.dispatchEvent(new CustomEvent('shixu:mode',{detail:{exit:active}}));
 }
 function persist(){const u=new URL(location.href);if(active)u.searchParams.set('view','exit');else u.searchParams.delete('view');u.hash='';history.replaceState(null,'',u);}
 function scrollToWorkspace(){const y=document.querySelector('.market-navigation').getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(document.body).getPropertyValue('--live-header-h')||'132')-14;window.scrollTo({top:Math.max(0,y),behavior:'instant'});document.dispatchEvent(new Event('shixu:scroll-reset'));}
 const pause=ms=>new Promise(resolve=>{const timer=setTimeout(resolve,ms);skip=()=>{clearTimeout(timer);resolve();};});
 async function change(next,trigger=null){
  if(busy||next===active)return;busy=true;skip=null;
  const action=$('skipExitTransition');action.disabled=true;action.setAttribute('aria-hidden','true');
  let guestReturn=false;
  const returning=!next;
  const buttons=[...document.querySelectorAll('[data-decision]')];buttons.forEach(b=>b.disabled=true);
  document.querySelector('.decision-caption').classList.remove('has-error');
  document.querySelector('.decision-mode').classList.remove('has-invitation');
  $('decisionInvitation').hidden=true;$('decisionInvitation').textContent='';
  try{
   dialog.classList.toggle('is-returning',returning);
   if(returning){
    dialog.removeAttribute('aria-labelledby');dialog.setAttribute('aria-label','返回寻找机会');
    dialog.showModal();
    if(!reduced.matches){
     const cover=dialog.animate([{opacity:0},{opacity:1}],{duration:320,easing:'ease-out',fill:'forwards'});
     animations.push(cover);await cover.finished;
    }
   }else{
    dialog.removeAttribute('aria-label');dialog.setAttribute('aria-labelledby','exitQuote');
   }
   if(next){
    const sessionPromise=fetch('/api/auth/session',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(10000)}).then(r=>r.ok?r.json():null).catch(()=>null);
    const bounds=document.querySelector('[data-decision=exit]').getBoundingClientRect();
    const cx=bounds.left+bounds.width/2,cy=bounds.top+bounds.height/2,radius=Math.hypot(innerWidth,innerHeight);
    $('exitQuote').hidden=false;$('skipExitTransition').textContent='看见另一面';
    dialog.showModal();
    const quoteAnimations=[];
    if(!reduced.matches){
     animations.push(dialog.animate([{clipPath:'circle(0px at '+cx+'px '+cy+'px)'},{clipPath:'circle('+radius+'px at '+cx+'px '+cy+'px)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}));
     [...dialog.querySelectorAll('.exit-quote>*')].forEach((el,i)=>quoteAnimations.push(el.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:1100,delay:[600,1950,3700][i],easing:'cubic-bezier(.22,1,.36,1)',fill:'both'})));
    }
    animations.push(...quoteAnimations);
    // Reveal the action only after every line has actually finished animating.
    if(reduced.matches)await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    else await Promise.all(quoteAnimations.map(animation=>animation.finished));
    action.removeAttribute('aria-hidden');action.disabled=false;
    if(!reduced.matches)animations.push(action.animate([{opacity:0},{opacity:1}],{duration:450,easing:'ease-out',fill:'both'}));
    await pause(reduced.matches?3800:2800);
    const session=await sessionPromise;
    guestReturn=session?.authenticated===false;
    if(!session?.authenticated)next=false;
   }
   active=next;paint();persist();onChange();scrollToWorkspace();
   if(dialog.open&&!reduced.matches){
    if(returning){
     // Keep the changed theme behind an opaque curtain until layout has settled.
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
     await dialog.animate([{opacity:1},{opacity:0}],{duration:1100,easing:'ease-in-out',fill:'forwards'}).finished;
    }else{
     await dialog.animate([{transform:'translateY(0)',borderRadius:'0'},{transform:'translateY(-105%)',borderRadius:'0 0 48px 48px'}],{duration:820,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'}).finished;
    }
   }
  }catch{
   $('decisionHint').hidden=false;$('decisionHint').textContent='暂时无法验证登录，请稍后再试。';
   document.querySelector('.decision-caption').classList.add('has-error');
  }finally{
   skip=null;action.disabled=true;action.setAttribute('aria-hidden','true');animations.forEach(a=>a.cancel());animations=[];
   if(dialog.open)dialog.close();dialog.getAnimations().forEach(a=>a.cancel());
   buttons.forEach(b=>b.disabled=false);busy=false;
   if(active)$('decisionTitle').focus({preventScroll:true});else (trigger||document.querySelector('[data-decision="exit"]')).focus({preventScroll:true});
   if(guestReturn&&!active){
    $('decisionInvitation').innerHTML='<a href="'+loginURL()+'"><strong>登录时序</strong><span>看见投资的另一面<span aria-hidden="true"> ↗</span></span></a>';
    $('decisionInvitation').hidden=false;
    document.querySelector('.decision-mode').classList.add('has-invitation');
    if(!reduced.matches)$('decisionInvitation').animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:800,easing:'cubic-bezier(.22,1,.36,1)'});
   }
  }
 }
 $('skipExitTransition').onclick=()=>{if(!$('skipExitTransition').disabled)skip?.();};dialog.addEventListener('cancel',e=>{e.preventDefault();if(!$('skipExitTransition').disabled)skip?.();});
 const gateButton=document.querySelector('[data-decision=exit]');
 gateButton.onclick=()=>change(!active,gateButton);
 const holdings=()=>{try{const raw=JSON.parse(localStorage.getItem('shixu-holdings-v1')||'{}');return Array.isArray(raw[market]?.rows)?raw[market].rows.filter(r=>typeof r.code==='string'&&r.value>0):[];}catch{return [];}};
 function plot(row){
  if(!data.authenticated||!row.points?.length)return '';
  const p=row.points,values=p.map(p=>p[1]),lo=Math.min(...values,row.box?.lower??Infinity),hi=Math.max(...values,row.box?.upper??-Infinity),span=Math.max(hi-lo,.01),x=i=>10+i/Math.max(1,p.length-1)*340,y=v=>108-(v-lo)/span*88;
  const lines=row.box?`<rect x="10" y="${y(row.box.upper)}" width="340" height="${Math.max(1,y(row.box.lower)-y(row.box.upper))}" fill="#edac7220"/><path d="M10 ${y(row.box.upper)}H350 M10 ${y(row.box.lower)}H350" stroke="#eeb47f" stroke-dasharray="4 5"/>`:'';
  return `<figure class="exit-chart"><svg viewBox="0 0 360 128" role="img" aria-label="${esc(row.name)}调整收盘走势与原固定区间"><title>${esc(p[0][0])} 至 ${esc(p.at(-1)[0])}，虚线为原区间上下沿</title>${lines}<polyline points="${values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="#e8eee5" stroke-width="2.2"/><circle cx="350" cy="${y(values.at(-1))}" r="3" fill="#f1b57b"/></svg><figcaption><span>${esc(p[0][0])}</span><span>${esc(p.at(-1)[0])}</span></figcaption></figure>`;
 }
 function card(r){
  const profile=companyProfile(r,market),displayName=profile?.name||r.name;
  const signals=r.signals||[],triggered=signals.length>0,title=r.status==='unknown'?'数据待核实':triggered?'符合卖出筛选':'未同时符合两条规则';
  return `<article class="exit-card ${triggered?'is-triggered':''}"><header><div><span>${esc(r.code)} · ${names[market]}</span><h2>${esc(displayName)}</h2>${profile?`<p class="company-english">${esc(r.name)}</p>`:''}</div><span class="exit-state">${title}</span></header>${companyIntro(r,market)}<div class="exit-return"><b>${pct(r.change)}</b><span>近30日区间涨跌 · 非持仓盈亏</span></div>${signals.length?`<div class="exit-signals">${signals.map(s=>`<span>${esc(s.id)}${data.authenticated?' · '+esc(data.rules.find(r=>r.id===s.id)?.name||''):''}<small>${esc(s.date)} 触发</small></span>`).join('')}</div>`:''}${plot(r)}${r.status==='unknown'?`<p>${esc(r.reason||'未覆盖此股票，暂不能判断。')}</p>`:data.authenticated?`<details><summary>查看判断依据</summary><p>${esc(r.explanation)}</p>${r.box?`<p>原上沿 ${num(r.box.upper)} · 原下沿 ${num(r.box.lower)}<br>最新观察值 ${num(r.latest)} · ${esc(data.priceBasis)}<br>以上为同一调整口径，不是实时委托价。</p>`:''}<p>两条规则必须同时满足。</p></details>`:`<p><a href="${loginURL()}">登录查看条件、关键位置与走势图</a></p>`}<footer>${researchButtons({market,code:r.code,name:displayName})}<a href="${market==='fund'?'/compare?code='+encodeURIComponent(r.code):'/stock-peers?market='+market+'&code='+encodeURIComponent(r.code)}">同板块对比</a></footer></article>`;
 }
 function render(){
  if(!data)return;
  const triggered=data.rows.filter(r=>r.signals.length),q=$('exitSearch').value.trim().toLowerCase(),owned=holdings();
  let rows=scope==='holdings'?owned.map(r=>data.rows.find(s=>s.code===r.code)||{code:r.code,name:r.name,status:'unknown',signals:[],reason:'不在当前行情观察池中，暂不能检查退出条件。'}):triggered;
  rows=rows.filter(r=>!q||[r.code,r.name,companyProfile(r,market)?.name].join(' ').toLowerCase().includes(q));
  $('exitMeta').textContent=`${market==='fund'?'净值':'行情'}截止 ${data.asof} · ${data.total}只观察池 · ${data.evaluated}只完成判断 · ${data.unknown}只待核实 · ${scope==='holdings'?owned.length+'只本地持仓 / ':''}非实时行情 · 可用历史 ${data.historyStart} 起`;
  $('exitStats').innerHTML=`<div><span>同时符合两条</span><b>${data.matched}<small>只</small></b></div><div><span>待核实</span><b>${data.unknown}<small>只</small></b></div><div><span>观察期间</span><b>30<small>自然日</small></b></div>`;
  $('exitRules').innerHTML=data.rules.map(r=>`<span>${esc(r.id)}${r.description?' · '+esc(r.description):''}</span>`).join('')+(data.authenticated?'':`<a href="${loginURL()}">登录查看完整规则</a>`);
  $('exitCards').innerHTML=rows.length?rows.slice(0,limit).map(card).join(''):`<div class="exit-empty"><h2>${q?'没有匹配的产品':scope==='holdings'?'还没有录入这个市场的持仓':'没有同时符合两条规则的候选'}</h2><p>${q?'换一个名称或代码试试。':scope==='holdings'?'录入持仓后，可以在这里一起检查已符合、未符合和资料不足的产品。':'本观察池当前没有同时符合 R01 与向下 R02 的卖出候选。数据不足的产品不参与匹配。'}</p>${scope==='holdings'&&!q?`<a href="/portfolio?market=${market}">录入我的持仓</a>`:''}</div>`;
  $('exitMore').hidden=rows.length<=limit;$('exitMore').textContent=`再看 ${Math.min(9,rows.length-limit)} 只`;
  document.querySelectorAll('.hd-login').forEach(a=>{a.textContent=data.authenticated?'账号':'登录';a.href=loginURL();});
 }
 async function load(){
  const id=++version,selected=market;data=null;limit=9;
  $('exitTitle').textContent=names[market];$('exitHoldingsLink').href='/portfolio?market='+market;
  $('exitStats').innerHTML='';$('exitRules').innerHTML='';$('exitCards').innerHTML='';$('exitMore').hidden=true;
  $('exitSearchLabel').textContent=market==='fund'?'搜索基金':'搜索股票';
  $('exitMeta').textContent='正在检查'+names[market]+'退出信号…';$('exitCards').innerHTML='<div class="exit-loading" role="status">正在读取行情快照与触发记录…</div>';
  try{const response=await fetch('/api/stock-exits?'+new URLSearchParams({market,...(scope==='holdings'?{codes:holdings().map(r=>r.code).join(',')}:{})}),{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(20000)});if(response.status===401){if(id===version&&active){active=false;paint();persist();onChange();$('decisionHint').hidden=false;$('decisionHint').innerHTML='登录已失效，请重新登录。 <a href="'+loginURL()+'">去登录</a>';document.querySelector('.decision-caption').classList.add('has-error');}return;}if(!response.ok)throw Error();const next=await response.json();if(next.market!==selected.toUpperCase()||!Array.isArray(next.rows))throw Error();if(id!==version||!active)return;data={...next,rows:orderCandidates(next.rows,selected+':'+scope)};render();}catch{if(id!==version||!active)return;$('exitMeta').textContent='退出检查暂未载入';$('exitCards').innerHTML='<div class="exit-empty"><p>暂时无法读取行情，请重试。</p><button id="retryExit">重新加载</button></div>';$('retryExit').onclick=load;}
 }
 document.querySelectorAll('[data-exit-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.exitScope;limit=9;document.querySelectorAll('[data-exit-scope]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));load();});
 $('exitSearch').oninput=()=>{limit=9;render();};$('exitMore').onclick=()=>{limit+=9;render();};
 window.addEventListener('storage',e=>{if(e.key==='shixu-holdings-v1'&&active&&scope==='holdings')load();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){++version;data=null;$('exitCards').innerHTML='';$('exitRules').innerHTML='';}else if(active)load();});
 window.addEventListener('pageshow',e=>{if(e.persisted&&active)load();});
 paint();
 if(requestedExit)queueMicrotask(()=>change(true));
 return {get active(){return active;},setMarket(next){market=next;paint();$('exitSearch').value='';if(active)load();else ++version;},syncURL(){change(new URL(location.href).searchParams.get('view')==='exit');}};
}
