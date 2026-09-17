import breakout from './stock-picks-breakout.cjs';
const shift=(date,n)=>new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export function stockPick(stock,context){
 const {asof,historyStart,calendar}=context,start=shift(asof,-29);
 const base={code:stock.code,name:stock.name,source:stock.source};
 if(stock.error)return {...base,error:stock.error};
 const points=stock.points.filter(p=>p[0]<=asof),dates=points.map(p=>p[0]);
 if(!points.length||dates.at(-1)!==asof||dates.some((d,i)=>i&&d<=dates[i-1])||points.some(p=>!Number.isFinite(p[1])||p[1]<=0)||calendar.some(d=>d<=asof&&!dates.includes(d)))return {...base,error:'行情缺失、停牌或历史不足，未参与匹配'};
 const window=points.filter(p=>p[0]>=start),values=window.map(p=>p[1]);
 if(window.length<2)return {...base,error:'30自然日内不足两个收盘价'};
 const amplitude=Math.max(...values)/Math.min(...values)-1,change=values.at(-1)/values[0]-1;
 const rule1=amplitude<=.1+1e-12&&Math.abs(change)<=.05+1e-12;
 const history=points.map(p=>[Math.round((Date.parse(p[0])-Date.parse(historyStart))/86400000),p[1]]);
 // The established fixed 15-calendar-day breakout algorithm consumes adjusted
 // closes here, with zero cash adjustments because the source is already qfq.
 const signal=breakout.evaluateBreakout({code:stock.code,history},{asof,history_start:historyStart,dates:calendar.filter(d=>d<=asof)}).result;
 return {...base,asof,start,amplitude,change,rule1,rule2:signal.known&&signal.phase==='confirmed',signal,points:window.map(p=>[p[0],p[1]/values[0]])};
}
export function buildStockPicks(raw,dailyAsOf){
 if(!raw||!Array.isArray(raw.stocks)||!Array.isArray(raw.calendar)||raw.calendar.at(-1)!==raw.asof||new Set(raw.stocks.map(s=>s.code)).size!==raw.stocks.length)throw Error('股票观察池数据异常');
 const all=raw.stocks.map(s=>stockPick(s,raw)),unknown=all.filter(s=>s.error||!s.signal?.known);
 return {expectedAsOf:raw.expectedAsOf||null,market:raw.market||'CN',currency:raw.currency||'CNY',priceBasis:raw.priceBasis||'前复权收盘价',universeSources:raw.universeSources||[],asof:raw.asof,dailyAsOf,historyStart:raw.historyStart,checkedAt:raw.checkedAt,universe:raw.universe,universeAsOf:raw.universeAsOf,universeSource:raw.universeSource,total:all.length,evaluated:all.length-unknown.length,unknown:unknown.length,rule1Count:all.filter(s=>s.rule1).length,rule2Count:all.filter(s=>s.rule2).length,matches:all.filter(s=>s.rule1&&s.rule2).sort((a,b)=>b.change-a.change||a.code.localeCompare(b.code)),excluded:unknown.map(s=>({code:s.code,name:s.name,reason:s.error||s.signal?.reason}))};
}
