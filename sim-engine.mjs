import {buildRehearsalReport} from './sim-report.mjs';
export const addDays=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export const dayDiff=(a,b)=>(Date.parse(a)-Date.parse(b))/86400000;
const sum=a=>a.reduce((s,v)=>s+v,0),mean=a=>sum(a)/a.length;
const lastBefore=(a,d)=>{let l=0,h=a.length;while(l<h){let m=(l+h)>>1;if(a[m][0]<d)l=m+1;else h=m}return a[l-1]};
export const targets={strong:[.03,.05,.08],rising:[.01,.03,.05],range:[0,.01,.02],weak:[0,.005,.015]};
export const durations=[30,90,180,365];
export function periodTargets(regime,duration=30){
 const table={30:targets,90:{strong:[.05,.10,.16],rising:[.03,.06,.10],range:[.01,.03,.05],weak:[0,.01,.03]},180:{strong:[.08,.15,.23],rising:[.05,.10,.16],range:[.02,.05,.09],weak:[0,.02,.05]},365:{strong:[.10,.20,.30],rising:[.08,.15,.23],range:[.03,.08,.14],weak:[0,.03,.08]}};
 return table[duration]?.[regime]||targets[regime];
}
export const regimeNames={strong:'强势上涨',rising:'温和上涨',range:'横盘震荡',weak:'趋势偏弱'};
export const defaultRules={enabled:['rule1'],days:15,amp:10,min:-5,max:5,stage:'confirmed'};
export const assumptions='教学参数：申购费0.15%（价外计费）；赎回按先进先出，持有不足7自然日1.5%，否则0.5%；买入T+1交易日确认，赎回T+2交易日到账；现金不计息、分红现金入账。非各基金真实历史费率。';
export function validateRules(r){if(!r||!Array.isArray(r.enabled)||!r.enabled.length||r.enabled.some(v=>!['rule1','rule2'].includes(v))||new Set(r.enabled).size!==r.enabled.length||!Number.isInteger(r.days)||r.days<2||r.days>30||!Number.isFinite(r.amp)||r.amp<0||r.amp>1000||!(r.min===null||Number.isFinite(r.min))||!(r.max===null||Number.isFinite(r.max))||(r.min!==null&&r.max!==null&&r.min>r.max)||!['confirmed','newBuy','pending','exited'].includes(r.stage))throw Error('筛选条件无效');return structuredClone(r)}
export function createEngine(data,events=[],holdingsData={}){
 const funds=new Map(data.funds.map(f=>[f.code,f]));const marketDays=data.indices[0].points.map(p=>p[0]);
 const trading=d=>marketDays.includes(d),nextTrading=(d,n=0)=>marketDays.filter(x=>x>=d)[n];
 const nav=(code,date)=>lastBefore(funds.get(code)?.points||[],date);
 const latestMarket=date=>lastBefore(data.indices[0].points,date);
 const startMaxFor=duration=>[data.startMax,addDays(data.historyEnd,-duration-7)].sort()[0];
 function market(date,duration=30){
  const indices=data.indices.map(index=>{const points=index.points.filter(p=>p[0]<date),values=points.map(p=>p[1]),close=values.at(-1),r20=close/values.at(-21)-1,ma20=mean(values.slice(-20)),ma60=mean(values.slice(-60)),returns=values.slice(-21).slice(1).map((x,i)=>Math.log(x/values.slice(-21)[i])),avg=mean(returns),vol=Math.sqrt(mean(returns.map(r=>(r-avg)**2))*252);return {code:index.code,name:index.name,date:points.at(-1)[0],close,r20,ma20,ma60,vol,chart:points.slice(-60).map(p=>[p[0],p[1]])}});
  const m=indices[0],positive=indices.filter(i=>i.r20>0).length;let regime='range';
  if(m.close>m.ma60&&m.r20>=.06&&positive>=2)regime='strong';else if(m.close>m.ma60&&m.r20>.015)regime='rising';else if(m.close<m.ma60&&m.r20<-.02)regime='weak';
  return {date,asof:m.date,regime,label:regimeNames[regime],targets:periodTargets(regime,duration),sentiment:positive>=2&&m.r20>.02?'偏乐观':positive<=1&&m.r20<-.02?'偏谨慎':'中性／分化',volatility:m.vol>.28?'偏高':'常态',positive,indices,events:events.filter(e=>e.available<=date).slice(-8).reverse(),basis:'以沪深300为趋势锚，近20个交易日收益与60日均线判断；上证、创业板用于三指数共振参考，不等于全市场上涨家数。情绪为价格指标代理，非调查结果。强势：20日≥6%、高于60日线、至少2个指数上涨；温和：20日>1.5%且高于60日线；偏弱：20日<−2%且低于60日线；其余震荡。年化波动率>28%标为偏高。'};
 }
 function composition(code,date){
  const history=holdingsData[code];
  const report=history?.reports.filter(r=>r.available<=date&&r.period<date).sort((a,b)=>a.period.localeCompare(b.period)).at(-1);
  if(!report)return {status:'unavailable',isLink:!!history?.isLink,message:'此日期之前尚无已核验的持仓报告'};
  return {...report,isLink:!!history.isLink,status:report.stocks.length||report.bonds.length||report.funds.length?'available':'unavailable',message:'该期持仓明细暂未取得'};
 }
 function candidates(date,rules=defaultRules){
  const cutoff=latestMarket(date)[0],start=addDays(cutoff,1-rules.days),expected=marketDays.filter(d=>d>=start&&d<=cutoff);
  return data.funds.map(f=>{const raw=f.points.filter(p=>p[0]>=start&&p[0]<date),present=new Set(raw.map(p=>p[0])),valid=raw.length>=2&&expected.every(d=>present.has(d));let value=1;const chart=[];raw.forEach((p,i)=>{if(i)value*=(p[1]+p[2])/raw[i-1][1];chart.push([p[0],value])});const vals=chart.map(p=>p[1]),amp=valid?Math.max(...vals)/Math.min(...vals)-1:null,change=valid?value-1:null;
   const signal=f.signals?.filter(s=>s.date<date).at(-1)||{phase:'watch'},b=nav(f.code,date),known=b?.[0]===cutoff;
   const rule1=valid&&amp<=rules.amp/100+1e-12&&change>=(rules.min===null?-Infinity:rules.min/100)-1e-12&&change<=(rules.max===null?Infinity:rules.max/100)+1e-12;
   const rule2=known&&(rules.stage==='newBuy'?signal.phase==='confirmed'&&signal.confirmDate===cutoff:signal.phase===rules.stage);
   return {code:f.code,name:f.name,type:f.type,nav:b?.[1],navDate:b?.[0],amp,change,chart,rule1,rule2,known:valid&&known,match:rules.enabled.every(id=>id==='rule1'?rule1:rule2),signal:known?signal:{phase:'unknown'},source:f.source,composition:composition(f.code,date)};
  });
 }
 function portfolio(r){
  const holdings=Object.entries(r.lots).filter(([,lots])=>lots.length).map(([code,lots])=>{const f=funds.get(code),units=sum(lots.map(l=>l.units)),reserved=sum(r.orders.filter(o=>o.code===code&&o.side==='sell'&&o.status==='queued').map(o=>o.units)),confirmed=sum(lots.filter(l=>l.confirm<=r.date).map(l=>l.units)),p=nav(code,r.date),cost=sum(lots.map(l=>l.cost));return {code,name:f.name,units,available:Math.max(0,confirmed-reserved),locked:units-confirmed,reserved,nav:p[1],navDate:p[0],value:units*p[1],cost,change:units*p[1]/cost-1}});
  const pending=sum(r.orders.filter(o=>o.side==='buy'&&o.status==='queued').map(o=>o.amount)),receivable=sum(r.receivables.map(x=>x.amount)),held=sum(holdings.map(h=>h.value)),total=r.cash+pending+receivable+held;
  const benchmark=latestMarket(r.date)[1]/r.benchmarkStart-1;
  return {cash:r.cash,pending,receivable,held,total,return:total/r.initial-1,benchmark,excess:total/r.initial-1-benchmark,holdings,fees:r.fees,drawdown:r.maxDrawdown};
 }
 function start({id,date,capital,level,duration=30}){
  if(!durations.includes(duration))throw Error('演练期限无效');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<data.startMin||date>startMaxFor(duration)||addDays(date,0)!==date)throw Error('请选择可用的历史日期');
  if(!Number.isFinite(capital)||capital<1000||capital>100000000)throw Error('初始金额应为1,000—100,000,000元');if(!Number.isInteger(level)||level<0||level>2)throw Error('挑战等级无效');
  const m=market(date,duration);return {id,date,duration,start:date,end:addDays(date,duration-1),elapsed:0,initial:capital,cash:capital,level,target:m.targets[level],openingRegime:m.label,benchmarkStart:latestMarket(date)[1],rules:structuredClone(defaultRules),lots:{},orders:[],receivables:[],journal:[],curve:[{date,total:capital,benchmark:capital}],fees:0,peak:capital,maxDrawdown:0,completed:false,version:0,lastActionId:null};
 }
 function log(r,type,text,extra={}){r.journal.push({date:r.date,type,text,...extra})}
 function settleDue(r,through){
  const remaining=[];
  for(const item of r.receivables){
   if(item.date && item.date<=through){
    r.cash+=item.amount;
    const order=r.orders.find(o=>o.id===item.orderId);if(order)order.settledAt=item.date;
    r.journal.push({date:item.date,type:'settle',text:'赎回款到账'+(order?'：'+order.name:''),amount:item.amount,orderId:item.orderId});
   }else remaining.push(item);
  }
  r.receivables=remaining;
 }
 function action(original,input){
  if(input.type==='advance'){
   if(original.completed)throw Error('演练已结束');
   if(![1,7,30].includes(input.days))throw Error('推进步长无效');
   let current=original,advanced=0,reason='已完成本次推进';
   for(let i=0;i<input.days&&!current.completed;i++){
    const previous=current,journalLength=current.journal.length;
    current=action(current,{type:'next',actionId:input.actionId});advanced++;
    const newLogs=current.journal.slice(journalLength);
    if(current.completed){reason='演练期限已完成';break}
    if(input.pause!==false&&input.days>1){
     if(newLogs.some(j=>['settle','dividend','rejected'].includes(j.type))){reason='有资金到账、分红或订单未成交，已暂停';break}
     if(events.some(e=>e.available===current.date)){reason='有新的市场事件可见，已暂停';break}
     const changed=Object.keys(current.lots).some(code=>{const list=funds.get(code)?.signals||[],now=list.filter(v=>v.date<current.date).at(-1),before=list.filter(v=>v.date<previous.date).at(-1);return now&&['confirmed','exited'].includes(now.phase)&&now.phase!==before?.phase});
     if(changed){reason='持仓基金出现突破或退出筛选信号，已暂停';break}
    }
   }
   current.advanceSummary={requested:input.days,advanced,reason};return current;
  }

  const r=structuredClone(original);if(r.completed&&!['note','settle'].includes(input.type))throw Error('本次演练已结算，请新建演练');
  const note=String(input.reason||'').trim().slice(0,1000);
  if(['buy','sell','note'].includes(input.type)&&!note)throw Error('请记录这次决定的理由');
  if(input.type==='settle'){
   if(!r.completed)throw Error('演练中请通过“下一天”推进至到账日');
   const dates=r.receivables.map(c=>c.date).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')).sort();
   if(!dates.length)throw Error('没有可处理的待到账赎回款');
   r.settlementDate=dates[0]>r.date?dates[0]:r.date;
   settleDue(r,r.settlementDate);
   // Settlement only transfers an existing receivable; the 30-day valuation stays frozen.
  }else if(input.type==='rules'){r.rules=validateRules(input.rules);log(r,'rules','调整筛选策略',{rules:r.rules})}
  else if(input.type==='note'){log(r,'note',note)}
  else if(input.type==='buy'||input.type==='sell'){
   const code=String(input.code),f=funds.get(code);if(!f)throw Error('基金不在历史演练池中');const p=nav(code,r.date);if(!p)throw Error('当时没有可用净值');
   const execute=nextTrading(r.date);if(!execute||execute>r.end)throw Error('挑战结束前已无可成交交易日');
   const o={id:input.actionId,side:input.type,code,name:f.name,submitted:r.date,execute,status:'queued',reason:note,rules:structuredClone(r.rules)};
   if(input.type==='buy'){const amount=Number(input.amount);if(!Number.isFinite(amount)||amount<100||amount>r.cash+1e-8)throw Error('买入金额至少100元，且不能超过可用现金');o.amount=Math.round(amount*100)/100;if(o.amount>r.cash+1e-8)throw Error('可用现金不足');r.cash-=o.amount}
   else {const available=portfolio(r).holdings.find(h=>h.code===code)?.available||0;const units=Number(input.units);if(!Number.isFinite(units)||units<=0||units>available+1e-8)throw Error('卖出份额超过已确认且未冻结的份额');o.units=Math.min(units,available)}
   r.orders.push(o);log(r,'order',`${input.type==='buy'?'提交买入':'提交卖出'} ${f.name}`,{orderId:o.id,reason:note,rules:o.rules})
  }else if(input.type==='cancel'){
   const o=r.orders.find(o=>o.id===input.orderId&&o.status==='queued');if(!o)throw Error('订单已成交或已撤销');o.status='cancelled';if(o.side==='buy')r.cash+=o.amount;log(r,'cancel','撤销 '+o.name,{orderId:o.id})
  }else if(input.type==='next'){
   const today=r.date;
   if(trading(today)){
    for(const [code,lots] of Object.entries(r.lots)){const point=funds.get(code).points.find(p=>p[0]===today);if(point?.[2]>0&&lots.length){const cash=sum(lots.map(l=>l.units))*point[2];r.cash+=cash;log(r,'dividend',funds.get(code).name+' 现金分红入账',{amount:cash})}}
    for(const o of r.orders.filter(o=>o.status==='queued'&&o.execute===today)){
     const point=funds.get(o.code).points.find(p=>p[0]===today);if(!point){o.status='rejected';if(o.side==='buy')r.cash+=o.amount;log(r,'rejected','当日净值缺失，订单撤回：'+o.name);continue}
     const price=point[1];o.price=price;o.filled=today;o.status='filled';
     if(o.side==='buy'){const invested=o.amount/1.0015,fee=o.amount-invested,units=invested/price;o.units=units;o.fee=fee;o.confirm=nextTrading(addDays(today,1));(r.lots[o.code]??=[]).push({units,date:today,confirm:o.confirm,cost:o.amount});r.fees+=fee}
     else {let left=o.units,fee=0;for(const lot of r.lots[o.code]){if(left<=1e-10)break;if(lot.confirm>today)continue;const used=Math.min(left,lot.units);fee+=used*price*(dayDiff(today,lot.date)<7?.015:.005);lot.cost*=1-used/lot.units;lot.units-=used;left-=used}if(left>1e-6)throw Error('份额核对失败');r.lots[o.code]=r.lots[o.code].filter(l=>l.units>1e-8);o.fee=fee;o.amount=o.units*price-fee;o.settle=nextTrading(addDays(today,1),1);r.receivables.push({orderId:o.id,amount:o.amount,date:o.settle});r.fees+=fee}
     log(r,'fill',(o.side==='buy'?'买入成交 ':'卖出成交 ')+o.name,{orderId:o.id,price,units:o.units,fee:o.fee})
    }
   }
   if(note)log(r,'note',note);log(r,'day','结束今天'+(trading(today)?'':' · 休市日'));
   r.date=addDays(today,1);r.elapsed++;
   settleDue(r,r.date);
   const p=portfolio(r);r.peak=Math.max(r.peak,p.total);r.maxDrawdown=Math.max(r.maxDrawdown,1-p.total/r.peak);r.curve.push({date:r.date,total:p.total,benchmark:r.initial*(1+p.benchmark)});r.completed=r.elapsed>=(r.duration||30);
  }else throw Error('不支持的操作');
  if(r.cash<-.01)throw Error('现金余额异常');r.version++;r.lastActionId=input.actionId;return r;
 }
 function view(r){const p=portfolio(r);for(const h of p.holdings){const raw=funds.get(h.code).points.filter(v=>v[0]<r.date);let total=1;h.history=raw.map((v,i)=>{if(i)total*=(v[1]+v[2])/raw[i-1][1];return [v[0],total]});h.firstHeld=r.lots[h.code].map(l=>l.date).sort()[0]}return {run:r,portfolio:p,report:buildRehearsalReport(r,p,data),market:market(r.date,r.duration||30),funds:candidates(r.date,r.rules),isTrading:trading(r.date),assumptions,limitations:data.limitations}}
 return {market,candidates,composition,portfolio,start,action,view,trading,metadata:{durations,startMaxByDuration:Object.fromEntries(durations.map(d=>[d,startMaxFor(d)])),startMin:data.startMin,startMax:data.startMax,fundCount:data.funds.length,historyEnd:data.historyEnd,limitations:data.limitations,assumptions}};
}
