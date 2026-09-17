import breakdown from './stock-picks-breakdown.cjs';
const DAY=86400000;
const shift=(date,n)=>new Date(Date.parse(date+'T00:00:00Z')+n*DAY).toISOString().slice(0,10);
export function stockExit(stock,context){
 const {asof,calendar,historyStart}=context,start=shift(asof,-29),base={code:stock.code,name:stock.name,source:stock.source};
 const unknown=reason=>({...base,status:'unknown',reason,signals:[]});
 if(stock.error)return unknown(stock.error);
 const points=(stock.points||[]).filter(p=>p[0]>=start&&p[0]<=asof),dates=points.map(p=>p[0]);
 if(!points.length||dates.at(-1)!==asof||dates.some((d,i)=>i&&d<=dates[i-1])||points.some(p=>!Number.isFinite(p[1])||p[1]<=0)||calendar.some(d=>d>=start&&d<=asof&&!dates.includes(d))||historyStart>start)return unknown('所选30自然日行情缺失、停牌或历史不足');
 const window=points.filter(p=>p[0]>=start),values=window.map(p=>p[1]);
 if(values.length<2)return unknown('期间不足两个有效观察点');
 const amplitude=Math.max(...values)/Math.min(...values)-1,change=values.at(-1)/values[0]-1,rule1=amplitude<=.1+1e-12&&Math.abs(change)<=.05+1e-12;
 const history=points.map(p=>[Math.round((Date.parse(p[0])-Date.parse(historyStart))/DAY),p[1]]);
 const result=breakdown.evaluateBreakdown({code:stock.code,history},{asof,history_start:historyStart,dates:calendar.filter(d=>d<=asof)}).result;
 if(!result.known)return unknown(result.reason);
 const rule2=result.phase==='confirmed',matched=rule1&&rule2,scale=points[0][1];
 const box=result.box?{...result.box,base:result.box.base*scale,upper:result.box.upper*scale,lower:result.box.lower*scale}:null;
 return {...base,status:matched?'triggered':'clear',asof,start,amplitude,change,rule1,rule2,phase:result.phase,
  signals:matched?[{id:'R01',date:asof},{id:'R02',date:box.confirmDate}]:[],
  ...(matched?{latest:points.at(-1)[1],box,points:points.filter(p=>p[0]>=box.rangeStart),explanation:`近30自然日振幅 ${(amplitude*100).toFixed(2)}%，首尾涨跌幅 ${(change*100).toFixed(2)}%。使用本次30自然日中的前15自然日 ${box.rangeStart}—${box.rangeEnd} 固定横盘上下沿；后15自然日内，${box.firstBreakDate}首次跌破原下沿，${box.confirmDate}第二个连续收盘点确认，截至${asof}未涨回。上下沿只取前半段，不使用所选期间之前的突破信号，也不随后半段走势移动。`}:{explanation:'截至当前，未同时符合30日横盘与向下突破确认条件。'})};
}
export function buildStockExits(raw){
 if(!raw||!Array.isArray(raw.stocks)||!Array.isArray(raw.calendar)||raw.calendar.at(-1)!==raw.asof||new Set(raw.stocks.map(s=>s.code)).size!==raw.stocks.length)throw Error('卖点检查观察池异常');
 const rows=raw.stocks.map(s=>stockExit(s,raw));
 return {market:raw.market||'CN',asof:raw.asof,historyStart:raw.historyStart,start:shift(raw.asof,-29),currency:raw.currency||'CNY',priceBasis:raw.priceBasis||'前复权收盘价',total:rows.length,evaluated:rows.filter(r=>r.status!=='unknown').length,unknown:rows.filter(r=>r.status==='unknown').length,rows};
}
export function buildFundExits(daily){
 const c=daily.context;
 const stocks=daily.rows.map(row=>{
  let value=1,error=row.historyError||row.fetchError||null;
  const history=row.history.filter(p=>shift(c.history_start,p[0])>=shift(c.asof,-29)&&shift(c.history_start,p[0])<=c.asof);
  const points=history.map((p,i)=>{if(!Number.isFinite(p[1])||p[1]<=0||i&&(p[3]||!Number.isFinite(p[2]??0)))error='净值、分红或拆分口径待核实';if(i)value*=(p[1]+(p[2]??0))/history[i-1][1];return [shift(c.history_start,p[0]),value];});
  return {code:row.code,name:row.name,source:row.source,points,error};
 });
 return buildStockExits({market:'FUND',asof:c.asof,historyStart:c.history_start,calendar:c.dates,currency:'CNY',priceBasis:'分红再投净值指数（所选30日首点=1）',stocks});
}
