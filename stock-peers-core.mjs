export const PERIODS=[30,90,180,365];
export const RANKS={scale:[['revenue','营业收入'],['profit','归母净利润'],['marketCap','总市值']],quality:[['roe','加权净资产收益率'],['grossMargin','销售毛利率'],['netMargin','归母净利润 / 营收'],['cashflow','经营现金流净额']],growth:[['revenueGrowth','营收同比增长'],['profitGrowth','归母净利润同比增长']],strength:[['change','区间涨跌幅'],['excess','超越同行参考'],['drawdown','最大回撤（越小越靠前）'],['turnover','最新换手率']]};
export const finite=v=>typeof v==='number'&&Number.isFinite(v);
export const dateShift=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export function priceMetrics(stock,calendar,asof,days){
 if(!PERIODS.includes(days))throw Error('不支持的观察期间');
 const start=dateShift(asof,1-days),dates=calendar.filter(d=>d>=start&&d<=asof),empty=reason=>({known:false,reason,start:dates[0]||start,end:asof,points:[],change:null,drawdown:null});
 if(dates.length<2||dates.at(-1)!==asof)return empty('共同交易日历不足');
 const points=(stock.points||[]).filter(p=>p[0]>=dates[0]&&p[0]<=asof);
 if(points.length!==dates.length||points.some((p,i)=>p[0]!==dates[i]||!finite(p[1])||p[1]<=0))return empty('观察期行情不完整、上市不足或存在缺失交易日');
 const first=points[0][1],normalized=points.map(p=>[p[0],p[1]/first]);let peak=1,drawdown=0;
 for(const [,v]of normalized){peak=Math.max(peak,v);drawdown=Math.max(drawdown,1-v/peak);}
 return {known:true,start:dates[0],end:asof,points:normalized,change:normalized.at(-1)[1]-1,drawdown};
}
export function financialMetrics(stock,sector){
 const f=stock.finance||{},p=stock.previous||{},bank=/银行|非银金融|^金融$/.test(sector||'');
 let growthCurrent=f,growthPrevious=p;
 if(stock.market==='HK'){
  const [a,b]=stock.annual||[],gap=a&&b?(Date.parse(a.period)-Date.parse(b.period))/86400000:0;
  growthCurrent=a||{};growthPrevious=a&&b&&a.currency===b.currency&&gap>=350&&gap<=380?b:{};
 }
 const growth=(a,b)=>finite(a)&&finite(b)&&a>0&&b>0?(a/b-1)*100:null;
 const profitNote=!finite(growthPrevious.profit)?'上年同期数据缺失':growthPrevious.profit<=0?(finite(growthCurrent.profit)&&growthCurrent.profit>0?'扭亏为盈，增长率不排名':'上年同期亏损或为零，增长率不排名'):finite(growthCurrent.profit)&&growthCurrent.profit<=0?'本期亏损或为零，增长率不排名':growthPrevious.profit<1e7?'上年同期利润不足1000万报表货币单位，留意低基数':'';
 return {revenue:f.revenue??null,profit:f.profit??null,marketCap:stock.quote?.marketCap??null,turnover:stock.quote?.turnover??null,roe:finite(f.bps)&&f.bps>0?f.roe??null:null,
 grossMargin:bank?null:f.grossMargin??null,netMargin:!bank&&finite(f.profit)&&finite(f.revenue)&&f.revenue>0?f.profit/f.revenue*100:null,cashflow:bank?null:f.cashflow??null,
 revenueGrowth:growth(growthCurrent.revenue,growthPrevious.revenue),profitGrowth:growth(growthCurrent.profit,growthPrevious.profit),profitNote,bank};
}
export function currencyRankRows(rows,metric,currency){
 return rankRows(rows.map(s=>['revenue','profit','cashflow'].includes(metric)&&s.finance?.currency!==currency?{...s,currencyExcluded:true,metrics:{...s.metrics,[metric]:null}}:s),metric);
}
export function analyzeIndustry(data,days){
 const rows=data.stocks.map(s=>({...s,metrics:financialMetrics(s,data.sector),price:priceMetrics(s,data.calendar,data.asof,days)}));
 const eligible=rows.filter(s=>s.price.known);let benchmark=null;
 if(eligible.length>=2&&!data.historyPending){const points=eligible[0].price.points.map(([d],i)=>[d,eligible.reduce((sum,s)=>sum+s.price.points[i][1],0)/eligible.length]);benchmark={points,change:points.at(-1)[1]-1,count:eligible.length,total:rows.length,start:points[0][0],end:points.at(-1)[0]};}
 for(const r of rows)Object.assign(r.metrics,{change:r.price.change,drawdown:r.price.drawdown,excess:r.price.known&&benchmark?r.price.change-benchmark.change:null});
 return {rows,benchmark};
}
export function rankRows(rows,metric){
 if(!Object.values(RANKS).flat().some(([key])=>key===metric))throw Error('未知排序指标');
 const sorted=[...rows].sort((a,b)=>{const x=a.metrics[metric],y=b.metrics[metric];return finite(x)&&finite(y)?(metric==='drawdown'?x-y:y-x)||a.code.localeCompare(b.code):finite(x)?-1:finite(y)?1:a.code.localeCompare(b.code)});
 let rank=0,last;
 return sorted.map((r,i)=>{const v=r.metrics[metric];if(finite(v)&&v!==last)rank=i+1;last=v;return {...r,rank:finite(v)?rank:null}});
}
export function validSelection(codes,rows){
 const available=new Set(rows.map(r=>r.code));return [...new Set(codes)].filter(c=>/^(?:\d{5,6}|[A-Z][A-Z0-9.-]{0,9})$/.test(c)&&available.has(c)).slice(0,5);
}
