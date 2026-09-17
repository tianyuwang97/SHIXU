const finite=n=>typeof n==='number'&&Number.isFinite(n);
const shift=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export const US_TYPES=['trailingTotalRevenue','trailingNetIncome','trailingGrossProfit','trailingOperatingCashFlow','quarterlyStockholdersEquity','annualTotalRevenue','annualNetIncome'];
export function parseUSFinance(body,code,today,currency='USD'){
 if(body.timeseries?.error||!Array.isArray(body.timeseries?.result))throw Error('财务来源响应异常');
 if(currency==='AUTO'){
  const revenue=body.timeseries.result.find(r=>r.meta?.symbol?.[0]===code&&r.meta?.type?.[0]==='trailingTotalRevenue');
  currency=(revenue?.trailingTotalRevenue||[]).filter(p=>p.periodType==='TTM'&&p.asOfDate<=today&&finite(p.reportedValue?.raw)&&/^[A-Z]{3}$/.test(p.currencyCode)).sort((a,b)=>a.asOfDate.localeCompare(b.asOfDate)).at(-1)?.currencyCode||null;
 }
 const fields={};
 for(const item of body.timeseries.result){
  if(item.meta?.symbol?.[0]!==code)throw Error('财务证券身份异常');
  const type=item.meta.type?.[0];if(!US_TYPES.includes(type))continue;
  fields[type]=(item[type]||[]).filter(p=>/^\d{4}-\d{2}-\d{2}$/.test(p.asOfDate)&&p.asOfDate<=today&&p.currencyCode===currency&&p.periodType===(type.startsWith('trailing')?'TTM':type.startsWith('annual')?'12M':'3M')&&finite(p.reportedValue?.raw)).map(p=>({date:p.asOfDate,value:p.reportedValue.raw})).sort((a,b)=>a.date.localeCompare(b.date));
 }
 const revenues=fields.trailingTotalRevenue||[],period=revenues.at(-1)?.date;
 if(!period)return {finance:null,previous:null,annual:[],financeNote:currency==='USD'?'暂未取得美元口径的最近十二个月财务数据':'暂未取得明确报表币种的最近十二个月财务数据'};
 const value=(type,date)=>fields[type]?.find(p=>p.date===date)?.value??null;
 const snapshot=date=>({period:date,currency,published:null,revenue:value('trailingTotalRevenue',date),profit:value('trailingNetIncome',date),cashflow:value('trailingOperatingCashFlow',date)});
 const f=snapshot(period),previousDate=revenues.filter(p=>{const gap=(Date.parse(period)-Date.parse(p.date))/86400000;return gap>=350&&gap<=380}).at(-1)?.date;
 const gross=value('trailingGrossProfit',period),equity=value('quarterlyStockholdersEquity',period);
 const oldEquity=(fields.quarterlyStockholdersEquity||[]).filter(p=>{const gap=(Date.parse(period)-Date.parse(p.date))/86400000;return gap>=350&&gap<=380}).at(-1)?.value;
 f.grossMargin=finite(gross)&&f.revenue>0?gross/f.revenue*100:null;
 f.bps=equity;f.roe=equity>0&&oldEquity>0&&finite(f.profit)?f.profit/((equity+oldEquity)/2)*100:null;
 const annual=(fields.annualTotalRevenue||[]).slice(-3).reverse().map(p=>({period:p.date,currency,revenue:p.value,profit:value('annualNetIncome',p.date),published:null}));
 return {finance:f,previous:previousDate?snapshot(previousDate):null,annual,financeNote:'最新TTM；各公司截止日可能不同，来源未提供公告时间'};
}
export function parseUSPrices(body,code,asof,start,{currency='USD',timeZone='America/New_York'}={}){
 const rows=body.chart?.result;if(body.chart?.error||!Array.isArray(rows)||rows.length!==1)throw Error('行情来源响应异常');
 const d=rows[0],m=d.meta;if(m?.symbol!==code||m.currency!==currency||m.instrumentType!=='EQUITY'||m.exchangeTimezoneName!==timeZone)throw Error('行情证券身份、币种或时区异常');
 const timestamps=d.timestamp,prices=d.indicators?.adjclose?.[0]?.adjclose;
 if(!Array.isArray(timestamps)||!Array.isArray(prices)||timestamps.length!==prices.length)throw Error('调整收盘价不完整');
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}),points=[];
 timestamps.forEach((t,i)=>{const day=formatter.format(new Date(t*1000)),v=prices[i];if(day<start||day>asof||v===null)return;if(!finite(v)||v<=0||(points.length&&day<=points.at(-1)[0]))throw Error('价格或日期异常');points.push([day,v]);});
 if(points.length<2)throw Error('历史行情不足');return points;
}
async function read(url,fetcher){const r=await fetcher(url,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error(r.status===429?'公开来源繁忙，请稍后重试':'公开来源暂不可用');return r.json();}
export async function getUSPeerDetails(code,asof,fetcher=fetch){
 const today=new Date().toISOString().slice(0,10),start=shift(asof,-369),errors=[];
 const out={code,asof,points:[],finance:null,previous:null,annual:[],checkedAt:new Date().toISOString(),source:`https://finance.yahoo.com/quote/${code}/history/`};
 try{out.points=parseUSPrices(await read(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(code)}?range=2y&interval=1d&events=div%2Csplits`,fetcher),code,asof,start);}catch(e){errors.push('走势：'+e.message);}
 try{const p=new URLSearchParams({symbol:code,type:US_TYPES.join(','),period1:String(Math.floor(Date.parse(shift(today,-1700))/1000)),period2:String(Math.floor(Date.parse(shift(today,1))/1000))});Object.assign(out,parseUSFinance(await read(`https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(code)}?${p}`,fetcher),code,today));}catch(e){errors.push('财务：'+e.message);}
 try{const p=await read(`https://api.nasdaq.com/api/company/${encodeURIComponent(code.replace('-','.'))}/company-profile`,fetcher);if(p.data?.Symbol?.value?.replace('.','-')===code)out.businessEnglish=(p.data.CompanyDescription?.value||'').trim().split(/\s+/).slice(0,24).join(' ')+'…';}catch{}
 out.detailsLoaded=errors.length===0;out.detailsErrors=errors;return out;
}
