import {US_TYPES,parseUSFinance,parseUSPrices} from './us-peer-provider.mjs';
const shift=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export const hkSymbol=code=>{if(!/^\d{5}$/.test(code)||Number(code)===0)throw Error('港股代码无效');return String(Number(code)).padStart(4,'0')+'.HK'};
async function read(url,fetcher){const r=await fetcher(url,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error(r.status===429?'公开来源繁忙，请稍后重试':'公开来源暂不可用');return r.json();}
export async function getHKPeerDetails(code,asof,fetcher=fetch){
 const symbol=hkSymbol(code),today=new Date().toISOString().slice(0,10),start=shift(asof,-369),errors=[];
 const out={code,asof,points:[],finance:null,previous:null,annual:[],checkedAt:new Date().toISOString(),source:`https://finance.yahoo.com/quote/${symbol}/history/`};
 try{out.points=parseUSPrices(await read(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=2y&interval=1d&events=div%2Csplits`,fetcher),symbol,asof,start,{currency:'HKD',timeZone:'Asia/Hong_Kong'});}catch(e){errors.push('走势：'+e.message);}
 try{const p=new URLSearchParams({symbol,type:US_TYPES.join(','),period1:String(Math.floor(Date.parse(shift(today,-1700))/1000)),period2:String(Math.floor(Date.parse(shift(today,1))/1000))});Object.assign(out,parseUSFinance(await read(`https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${symbol}?${p}`,fetcher),symbol,today,'AUTO'));}catch(e){errors.push('财务：'+e.message);}
 out.detailsLoaded=errors.length===0;out.detailsErrors=errors;return out;
}
