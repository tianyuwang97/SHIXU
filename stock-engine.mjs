import stockData from './stock-data.mjs';
import fundData from './sim-data.mjs';
import events from './sim-events.mjs';
import {createEngine,addDays,defaultRules,durations,periodTargets} from './sim-engine.mjs';
import {buildRehearsalReport} from './sim-report.mjs';
const common=createEngine(fundData,events),stocks=new Map(stockData.stocks.map(s=>[s.code,s])),days=fundData.indices[0].points.map(p=>p[0]);
const sum=a=>a.reduce((s,n)=>s+n,0),round=n=>Math.round((n+1e-9)*100)/100;
const before=(a,d)=>a.filter(p=>p[0]<d).at(-1),next=(d,n=0)=>days.filter(x=>x>=d)[n];
const rulesDefault={...defaultRules,enabled:['rule1'],volume:1.2};
const assumptions='日线教学成交：09:00决策，只看前一交易日及更早行情；下一天按当日真实开盘价模拟成交，单边滑点0.05%（限制在当日高低价内）。买入100股整数倍；T+1可卖。开盘涨停拒绝买入、开盘跌停拒绝卖出；停牌、数据缺失或订单超过当日成交量1%时拒绝。佣金双边0.03%、每笔最低5元（含其他交易费用的统一教学参数），卖出另计0.05%印花税。分红按税前额在除息日现金入账，送转按除权日增加股数；未模拟真实派息到账延迟、差别红利税及送转股上市等待。';
const maxFor=d=>addDays(stockData.historyEnd,-d-7);
function market(date,duration=90){return {...common.market(date,duration),targets:periodTargets(common.market(date).regime,duration)}}
function validate(r){if(!r||!Array.isArray(r.enabled)||!r.enabled.length||r.enabled.some(id=>!['rule1','rule2','rule3'].includes(id))||new Set(r.enabled).size!==r.enabled.length||!Number.isInteger(r.days)||r.days<5||r.days>180||!Number.isFinite(r.amp)||r.amp<0||r.amp>1000||!Number.isFinite(r.min)||!Number.isFinite(r.max)||r.min>r.max||!Number.isFinite(r.volume)||r.volume<0||r.volume>20)throw Error('筛选参数无效');return structuredClone(r)}
function signals(s,date,rules){
 const bars=s.bars.filter(b=>b[0]<date),points=s.points.filter(p=>p[0]<date),latest=bars.at(-1);if(!latest)return null;
 const start=addDays(latest[0],1-rules.days),window=points.filter(p=>p[0]>=start),vals=window.map(p=>p[4]),amp=vals.length>1?Math.max(...vals)/Math.min(...vals)-1:null,change=vals.length>1?vals.at(-1)/vals[0]-1:null;
 let lock=null;
 for(let i=1;i<points.length;i++){
  const p=points[i];
  if(lock){if(p[4]<=lock.high+1e-10){lock.phase='exited';lock.exit=p[0];lock=null}else if(lock.phase==='pending'){lock.phase='confirmed';lock.confirm=p[0]}continue}
  const base=points.slice(0,i).filter(x=>x[0]>=addDays(p[0],-rules.days));if(base.length<5)continue;
  const a=base.map(x=>x[4]),hi=Math.max(...a),lo=Math.min(...a),delta=a.at(-1)/a[0]-1;
  if(hi/lo-1<=rules.amp/100&&delta>=rules.min/100&&delta<=rules.max/100&&p[4]>hi+1e-10)lock={high:hi,low:lo,from:base[0][0],to:base.at(-1)[0],first:p[0],phase:'pending'};
 }
 const prev=bars.slice(-21,-1),vol=prev.length===20?latest[5]/(sum(prev.map(b=>b[5]))/20):null;
 const known=latest[0]===before(fundData.indices[0].points,date)[0],rule1=known&&amp!==null&&amp<=rules.amp/100&&change>=rules.min/100&&change<=rules.max/100,rule2=known&&lock?.phase==='confirmed',rule3=known&&vol!==null&&vol>=rules.volume;
 return {code:s.code,name:s.name,sector:s.sector,close:latest[2],asof:latest[0],amp,change,volumeRatio:vol,rule1,rule2:!!rule2,rule3,known,match:rules.enabled.every(id=>({rule1,rule2,rule3})[id]),signal:lock||{phase:'watch'},bars:bars.slice(-130),source:s.source,actionsSource:s.actionsSource,actions:s.actions.filter(a=>a.announced<date&&a.ex<date).slice(-3)};
}
function portfolio(r){const holdings=Object.entries(r.lots).filter(([,l])=>l.length).map(([code,lots])=>{const s=stocks.get(code),b=before(s.bars,r.date),units=sum(lots.map(l=>l.units)),reserved=sum(r.orders.filter(o=>o.side==='sell'&&o.code===code&&o.status==='queued').map(o=>o.units)),confirmed=sum(lots.filter(l=>l.confirm<=r.date).map(l=>l.units)),cost=sum(lots.map(l=>l.cost));return {code,name:s.name,units,available:Math.max(0,confirmed-reserved),reserved,locked:units-confirmed,cost,nav:b[2],navDate:b[0],value:units*b[2],change:units*b[2]/cost-1}}),pending=sum(r.orders.filter(o=>o.side==='buy'&&o.status==='queued').map(o=>o.amount)),held=sum(holdings.map(h=>h.value)),total=r.cash+pending+held,benchmark=before(fundData.indices[0].points,r.date)[1]/r.benchmarkStart-1;return {cash:r.cash,pending,receivable:0,held,total,return:total/r.initial-1,benchmark,excess:total/r.initial-1-benchmark,holdings,fees:r.fees,drawdown:r.maxDrawdown}}
function start(input){const duration=input.duration??90;if(!durations.includes(duration))throw Error('期限无效');if(!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||input.date<stockData.startMin||input.date>maxFor(duration)||addDays(input.date,0)!==input.date)throw Error('日期超出当前期限的数据范围');if(!Number.isFinite(input.capital)||input.capital<1000||input.capital>100000000||!Number.isInteger(input.level)||input.level<0||input.level>2)throw Error('初始设置无效');const m=market(input.date,duration);return {id:input.id,asset:'stock',date:input.date,start:input.date,end:addDays(input.date,duration-1),duration,elapsed:0,initial:input.capital,cash:input.capital,level:input.level,target:m.targets[input.level],openingRegime:m.label,benchmarkStart:before(fundData.indices[0].points,input.date)[1],rules:structuredClone(rulesDefault),lots:{},orders:[],receivables:[],journal:[],curve:[{date:input.date,total:input.capital,benchmark:input.capital}],fees:0,peak:input.capital,maxDrawdown:0,completed:false,version:0,lastActionId:null}}
const log=(r,type,text,extra={})=>r.journal.push({date:r.date,type,text,...extra});
function action(original,input){
 if(input.type==='advance'){if(![1,7,30].includes(input.days)||original.completed)throw Error('推进参数无效');let r=original,advanced=0,reason='已完成本次推进';for(let i=0;i<input.days&&!r.completed;i++){const old=r,from=r.journal.length;r=action(r,{type:'next',actionId:input.actionId});advanced++;if(r.completed){reason='演练期限已完成';break}if(input.pause!==false&&input.days>1){if(r.journal.slice(from).some(j=>['dividend','corporate','rejected'].includes(j.type))||events.some(e=>e.available===r.date)){reason='公司行动、订单结果或市场事件需要复核，已暂停';break}if(Object.keys(r.lots).some(code=>{const a=signals(stocks.get(code),old.date,r.rules),b=signals(stocks.get(code),r.date,r.rules);return a.rule2!==b.rule2})){reason='持仓突破信号变化，已暂停';break}}}r.advanceSummary={advanced,requested:input.days,reason};return r}
 const r=structuredClone(original);if(r.completed&&input.type!=='note')throw Error('演练已结束');const reason=String(input.reason||'').trim().slice(0,1000);if(['buy','sell','note'].includes(input.type)&&!reason)throw Error('请记录决定的理由');
 if(input.type==='rules'){r.rules=validate(input.rules);log(r,'rules','调整股票筛选策略',{rules:r.rules})}
 else if(input.type==='note')log(r,'note',reason);
 else if(['buy','sell'].includes(input.type)){
  const s=stocks.get(input.code);if(!s)throw Error('股票不在样本池');const execute=next(r.date);if(!execute||execute>r.end)throw Error('演练结束前没有可交易日');const o={id:input.actionId,code:s.code,name:s.name,side:input.type,submitted:r.date,execute,status:'queued',reason,rules:structuredClone(r.rules)};
  if(input.type==='buy'){const amount=round(Number(input.amount));if(!Number.isFinite(amount)||amount<100||amount>r.cash)throw Error('买入预算不足或超过可用现金');o.amount=amount;r.cash-=amount}else{const available=portfolio(r).holdings.find(h=>h.code===s.code)?.available||0,units=Number(input.units);if(!Number.isInteger(units)||units<=0||units>available||(units%100!==0&&units!==available))throw Error('卖出须为100股整数倍，或一次卖出全部剩余可卖股数');o.units=units}
  r.orders.push(o);log(r,'order',(o.side==='buy'?'提交买入 ':'提交卖出 ')+s.name,{orderId:o.id,reason})
 }else if(input.type==='cancel'){const o=r.orders.find(o=>o.id===input.orderId&&o.status==='queued');if(!o)throw Error('订单不能撤销');o.status='cancelled';if(o.side==='buy')r.cash+=o.amount;log(r,'cancel','撤销 '+o.name)}
 else if(input.type==='next'){
  const today=r.date;
  for(const [code,lots] of Object.entries(r.lots)){if(!lots.length)continue;const a=stocks.get(code).actions.find(a=>a.ex===today);if(!a)continue;const units=sum(lots.map(l=>l.units));if(a.cash){const cash=units*a.cash;r.cash+=cash;log(r,'dividend',stocks.get(code).name+' 税前分红按教学假设入账',{amount:cash})}if(a.bonus){let rest=Math.floor(units*(1+a.bonus)+1e-7);lots.forEach((l,i)=>{l.units=i===lots.length-1?rest:Math.floor(l.units*(1+a.bonus)+1e-7);rest-=l.units});log(r,'corporate',stocks.get(code).name+' 送转股调整',{ratio:a.bonus})}}
  for(const o of r.orders.filter(o=>o.status==='queued'&&o.execute===today)){
   const s=stocks.get(o.code),b=s.bars.find(b=>b[0]===today),prior=before(s.bars,today),a=s.actions.find(a=>a.ex===today),reference=prior?(prior[2]-(a?.cash||0))/(1+(a?.bonus||0)):null,upper=reference?round(reference*1.1):null,lower=reference?round(reference*.9):null;
   let rejection=!b||!b[5]?'停牌或行情缺失':o.side==='buy'&&b[1]>=upper-.001?'开盘涨停，保守假设不成交':o.side==='sell'&&b[1]<=lower+.001?'开盘跌停，保守假设不成交':null;
   const price=b?round(o.side==='buy'?Math.min(b[3],b[1]*1.0005):Math.max(b[4],b[1]*.9995)):0;
   let units=o.units,fee=0,amount=0;
   if(!rejection&&o.side==='buy'){units=Math.floor((o.amount-5)/price/100)*100;while(units>0&&units*price+Math.max(5,units*price*.0003)>o.amount)units-=100;if(units<100)rejection='预算不足以买入100股及支付费用';fee=Math.max(5,units*price*.0003);amount=units*price+fee}
   if(!rejection&&units>b[5]*100*.01)rejection='订单超过当日成交股数1%，不模拟无限流动性';
   if(rejection){o.status='rejected';o.rejection=rejection;if(o.side==='buy')r.cash+=o.amount;log(r,'rejected',o.name+'：'+rejection,{orderId:o.id});continue}
   if(o.side==='buy'){r.cash+=o.amount-amount;o.budget=o.amount;o.amount=amount;o.units=units;o.confirm=next(addDays(today,1));(r.lots[o.code]??=[]).push({units,date:today,confirm:o.confirm,cost:amount})}
   else{let left=units;for(const lot of r.lots[o.code]){if(left<=0)break;if(lot.confirm>today)continue;const used=Math.min(left,lot.units);lot.cost*=1-used/lot.units;lot.units-=used;left-=used}if(left>0)throw Error('卖出股数核对失败');r.lots[o.code]=r.lots[o.code].filter(l=>l.units>0);const gross=units*price;fee=Math.max(5,gross*.0003)+gross*.0005;amount=gross-fee;o.amount=amount;r.cash+=amount;o.settle=today;o.settledAt=today}
   o.price=price;o.filled=today;o.fee=fee;o.status='filled';r.fees+=fee;log(r,'fill',(o.side==='buy'?'买入成交 ':'卖出成交 ')+s.name,{orderId:o.id,price,units,fee,amount})
  }
  log(r,'day','结束今天');r.date=addDays(today,1);r.elapsed++;const p=portfolio(r);r.peak=Math.max(r.peak,p.total);r.maxDrawdown=Math.max(r.maxDrawdown,1-p.total/r.peak);r.curve.push({date:r.date,total:p.total,benchmark:r.initial*(1+p.benchmark)});r.completed=r.elapsed>=r.duration;
 }else throw Error('操作无效');
 if(!Number.isFinite(r.cash)||r.cash<-.001)throw Error('现金核对失败');r.version++;r.lastActionId=input.actionId;return r;
}
function view(r){const p=portfolio(r),report=buildRehearsalReport(r,p,{funds:stockData.stocks});return {run:r,portfolio:p,report,market:market(r.date,r.duration),stocks:stockData.stocks.map(s=>signals(s,r.date,r.rules)),isTrading:days.includes(r.date),assumptions,limitations:stockData.limitations}}
export const stockEngine={start,action,view,portfolio,market,metadata:{asset:'stock',durations,startMin:stockData.startMin,startMax:maxFor(30),startMaxByDuration:Object.fromEntries(durations.map(d=>[d,maxFor(d)])),historyEnd:stockData.historyEnd,stockCount:stocks.size,assumptions,limitations:stockData.limitations}};
