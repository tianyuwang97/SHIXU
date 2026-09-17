// A factual, deterministic reading of one rehearsal, not a psychological assessment.
const sum=a=>a.reduce((s,n)=>s+n,0),mean=a=>a.length?sum(a)/a.length:null;
const add=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
const num=n=>Number.isFinite(n)?n:0;
export function buildRehearsalReport(r,p,data){
 const fundMap=new Map(data.funds.map(f=>[f.code,f]));
 const nav=(code,date)=>{const a=fundMap.get(code)?.points||[];let lo=0,hi=a.length;while(lo<hi){const m=(lo+hi)>>1;if(a[m][0]<date)lo=m+1;else hi=m}return a[lo-1]?.[1]||0};
 const fills=r.orders.filter(o=>o.status==='filled'),buys=fills.filter(o=>o.side==='buy'),sells=fills.filter(o=>o.side==='sell');
 const codes=[...new Set(fills.map(o=>o.code))],book=Object.fromEntries(codes.map(code=>[code,{code,name:fundMap.get(code)?.name||code,units:0,bought:0,sold:0,dividends:0,fees:0}]));
 const curve=r.curve?.length?r.curve:[{date:r.start,total:r.initial,benchmark:r.initial}],daily=[];
 const fillsByDay=new Map();for(const o of fills){if(!fillsByDay.has(o.filled))fillsByDay.set(o.filled,[]);fillsByDay.get(o.filled).push(o)}
 const divByCode=new Map(codes.map(code=>[code,new Map(fundMap.get(code).points.filter(v=>v[2]>0).map(v=>[v[0],v[2]]))]));
 const exposureAt=point=>{const values=codes.map(code=>Math.max(0,book[code].units)*nav(code,point.date)),held=sum(values);return {date:point.date,exposure:point.total>0?held/point.total:0,largestShare:held>1e-6?Math.max(...values)/held:null,positions:values.filter(v=>v>.01).length}};
 daily.push(exposureAt(curve[0]));
 for(let i=1;i<curve.length;i++){
  const day=add(curve[i].date,-1);
  for(const code of codes){book[code].dividends+=Math.max(0,book[code].units)*(divByCode.get(code).get(day)||0);if(r.asset==='stock'){const bonus=fundMap.get(code).points.find(p=>p[0]===day)?.[3]||0;if(bonus)book[code].units=Math.floor(book[code].units*(1+bonus)+1e-7)}}
  for(const o of fillsByDay.get(day)||[]){const b=book[o.code];b.fees+=num(o.fee);if(o.side==='buy'){b.units+=o.units;b.bought+=o.amount}else{b.units-=o.units;b.sold+=o.amount}}
  daily.push(exposureAt(curve[i]));
 }
 const contributors=Object.values(book).map(b=>({...b,value:Math.max(0,b.units)*nav(b.code,r.date),profit:b.sold+b.dividends+Math.max(0,b.units)*nav(b.code,r.date)-b.bought})).sort((a,b)=>b.profit-a.profit);
 const reconciled=Math.abs(sum(contributors.map(c=>c.profit))-(p.total-r.initial))<.03;
 const observations=daily.slice(1),avgExposure=mean(observations.map(d=>d.exposure)),concentration=mean(observations.map(d=>d.largestShare).filter(v=>v!==null));
 const decisionDays=new Set(fills.map(o=>o.submitted)).size,notes=(r.journal||[]).filter(j=>j.type==='note'),noteDays=new Set(notes.map(j=>j.date)).size;
 const gaps=curve.slice(1).map((v,i)=>({date:v.date,change:v.total/curve[i].total-1,amount:v.total-curve[i].total}));
 const best=gaps.length?[...gaps].sort((a,b)=>b.amount-a.amount)[0]:null,worst=gaps.length?[...gaps].sort((a,b)=>a.amount-b.amount)[0]:null;
 let peak=curve[0],drawdown={depth:0,peakDate:curve[0].date,troughDate:curve[0].date};
 for(const v of curve){if(v.total>peak.total)peak=v;const dd=1-v.total/peak.total;if(dd>drawdown.depth)drawdown={depth:dd,peakDate:peak.date,troughDate:v.date}}
 const activeRatio=r.elapsed?decisionDays/r.elapsed:0,reflectionRatio=r.elapsed?Math.min(1,noteDays/r.elapsed):0;
 const waiting=avgExposure===null||avgExposure<.5,focused=concentration!==null&&concentration>=.65,active=activeRatio>=.3,reflective=reflectionRatio>=.2;
 let role=buys.length===0?{name:'静候的观星者',icon:'◌',line:'这一局，你把选择权留在了现金里。',strength:'等待也是一种可以记录和检验的决定。',blindspot:'没有成交，无法观察你在持仓涨跌时怎样应对。'}:
 active?{name:'机动的领航员',icon:'',line:'你习惯在旅途中不断调整航向。',strength:'多次决策留下了可比较的理由与结果。',blindspot:'每次调整都有成本。频率本身不能证明判断更准确。'}:
 focused?{name:waiting?'谨慎的狙击手':'专注的掌舵者',icon:'◎',line:waiting?'你只让一部分资金，跟随一个主要判断。':'你让少数判断，承担了这一局的大部分波动。',strength:'主要持仓集中，收益来源容易追踪。',blindspot:'单一基金会让结果更依赖一种暴露；基金名称不同也未必底层分散。'}:
 {name:waiting?'留白的探路者':'组合的建筑师',icon:'◇',line:waiting?'你保留了一块空白，再用持仓探索市场。':'你把这一局，搭成了多只基金共同参与的组合。',strength:'多个基金代码提供了比较不同选择的机会。',blindspot:'分散到不同基金代码，不等于分散到不同股票或行业。'};
 const sample=buys.length===0?'未发生买入，保留观察者画像':r.elapsed<7||fills.length<3?'样本较少 · 画像仍在形成':'仅描述这一局 · 不代表长期能力';
 const dimensions=[
  {name:'资金参与',left:'现金留白',right:'持仓参与',value:avgExposure,display:avgExposure===null?'尚未推进一天':(avgExposure*100).toFixed(1)+'% 平均持仓',evidence:'按每天结束后的基金市值 ÷ 账户总资产取平均；包括休市日。冻结申购款、待到账款不算基金持仓。',reading:waiting?'这一局，大部分时间保留了较多现金。':'这一局，基金持仓承担了较多市场波动。'},
  {name:'配置方式',left:'多点配置',right:'单点聚焦',value:concentration,display:concentration===null?'尚无持仓':(concentration*100).toFixed(1)+'% 最大单基金占比均值',evidence:'仅在有持仓的日子，计算最大单基金市值占全部基金市值的比例，再取均值；按基金代码统计，未穿透底层。',reading:concentration===null?'成交后才会形成这条观察。':focused?'组合中的主要方向较集中。':'多只基金共同影响了结果。'},
  {name:'操作节奏',left:'低频等待',right:'频繁调整',value:r.elapsed?Math.min(1,activeRatio):null,display:decisionDays+' 天有已成交决策 / '+r.elapsed+' 天',evidence:'按已成交订单的提交日期去重，除以已走过的自然日；撤销和待成交订单不计。',reading:active?'你在较多日子作出了买卖决定。':'你把较多日子留给了观察。'},
  {name:'主动复盘',left:'记录较少',right:'持续记录',value:r.elapsed?reflectionRatio:null,display:noteDays+' 天主动留了笔记',evidence:'只统计主动保存的复盘笔记日期；下单必填理由不计入。它衡量记录频率，不评价文字质量。',reading:reflective?'你留下了多天可回看的思路。':'增加事前预期和事后检查，会让下一份报告有更多证据。'}
 ];
 const first=buys[0];let alternate=null;
 if(first){const f=fundMap.get(first.code);let units=first.units,dividends=0;for(const point of f.points.filter(v=>v[0]>first.filled&&v[0]<r.date)){dividends+=point[2]*units;if(r.asset==='stock'&&point[3])units=Math.floor(units*(1+point[3])+1e-7)}const total=r.initial-first.amount+units*nav(first.code,r.date)+dividends;alternate={code:first.code,name:first.name,date:first.filled,amount:first.amount,total,return:total/r.initial-1,difference:p.total-total,dividends,fee:first.fee};}
 const moments=[];
 if(first)moments.push({date:first.submitted,title:'你第一次选择了出发',body:'提交买入 '+first.name+'，金额 '+first.amount.toFixed(2)+' 元。',quote:first.reason||'',kind:'choice'});
 if(drawdown.depth>1e-10)moments.push({date:drawdown.troughDate,title:'这一局最深的低谷',body:'相对 '+drawdown.peakDate+' 的账户高点回撤 '+(drawdown.depth*100).toFixed(2)+'%。这是已实现与浮动结果共同形成的账户变化。',kind:'pressure'});
 if(best&&best.amount>.005)moments.push({date:best.date,title:'账户上升最多的一天',body:'这一天账户比上一个披露观察点增加 '+best.amount.toFixed(2)+' 元（'+(best.change*100).toFixed(2)+'%）。日期为次日09:00账户可见时点，不代表当日新交易创造全部收益。',kind:'rise'});
 if(notes.length)moments.push({date:notes.at(-1).date,title:'你留给未来的一句话',body:'最近一次主动复盘记录',quote:notes.at(-1).text,kind:'note'});
 const badge=(name,icon,earned,reason)=>({name,icon,earned,reason});
 const badges=[badge('走完这一程','✦',r.completed,`已推进 ${r.elapsed}/${r.duration||30} 个自然日`),badge('留下坐标','✎',noteDays>=3,`${noteDays} 个日期有主动笔记；需至少3天`),badge('现金观察窗','◌',r.elapsed>=7&&buys.length===0,'至少观察7天且没有买入成交；只记录经历，不判定优劣'),badge('完成一轮观察','↻',contributors.some(c=>c.bought>0&&c.sold>0&&Math.abs(c.units)<1e-6),'至少一只基金完成买入与全部卖出；不要求重复交易'),badge('这一局领先','◇',r.completed&&p.excess>1e-10,'演练结束且账户收益高于同期沪深300价格收益；不是未来能力证明')];
 const missions=[
  {title:'把退出条件写在买入之前',body:'下一局第一次下单前，在理由中写清：为什么买、什么情况复核或退出、何时检查。结束后逐条核对。'},
  {title:focused?'检查“不同名字”的相同持仓':'给自己的等待设一个检查点',body:focused?'挑出你关注的基金，比较当时已披露的前三大持仓，记录重合项。是否买入由你决定。':'在第一次决策后，预先约定一个复核日期和观察指标；到那一天先读旧理由，再决定。'},
  {title:active?'追踪每次调仓的成本':'为同一起点做一次对照',body:active?'下一局每次卖出前，写下这次改变的目的与预计费用；复盘时检查目的是否实现。':'选择同一个起点，只改变一个事先写下的操作条件，比较两次结果。知道历史结果后重做存在学习效应，不当作独立验证。'}
 ];
 const closing=r.completed?(p.return>=r.target?'你达到了这次的游戏目标。接下来值得看的是：结果依赖了哪些具体选择。':'这次没有达到游戏目标。报告会保留所有决定，让下一次有明确的比较对象。'):'这一局还在进行。以下只读取已经走过的日子，不提前揭晓后续行情。';
 return {version:1,role,sample,dimensions,daily,avgExposure,concentration,decisionDays,noteDays,filledCount:fills.length,buyCount:buys.length,sellCount:sells.length,contributors:reconciled?contributors:[],reconciled,alternate,moments:moments.sort((a,b)=>a.date.localeCompare(b.date)),badges,missions,best,worst,drawdown,closing,feeDrag:p.fees/r.initial,profit:p.total-r.initial,code:buys.length?[waiting?'C':'P',focused?'F':'M',active?'A':'W',reflective?'R':'O'].join(''):'WAIT'};
}
