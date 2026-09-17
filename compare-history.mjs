// Public NAV only. A bounded year, verified pagination, and a shared disclosure calendar.
const DAY=86400000;
export const dateShift=(date,days)=>new Date(Date.parse(date+'T00:00:00Z')+days*DAY).toISOString().slice(0,10);
export function normalizeHistory(raw,start,end){
 const rows=[...raw].sort((a,b)=>a.FSRQ.localeCompare(b.FSRQ));let previous=null;const history=[];
 for(const r of rows){
  if(r.FSRQ>end)continue;
  const nav=Number.parseFloat(r.DWJZ),cum=Number.parseFloat(r.LJJZ);let cash=0,issue=0;
  if(!Number.isFinite(nav)||nav<=0||!Number.isFinite(cum)){issue=3;previous=null;}
  else {
   if(previous){cash=(cum-nav)-(previous.cum-previous.nav);cash=Math.abs(cash)<1e-6?0:Number(cash.toFixed(8));const ratio=(nav+cash)/previous.nav,reported=Number.parseFloat(r.JZZZL);
    if(Number.isFinite(reported)&&Math.abs((ratio-1)*100-reported)>.035)issue=1;
    if(cash<-.00001)issue=2;if(!Number.isFinite(ratio)||ratio<=0)issue=3;
   }previous={nav,cum};
  }
  if(r.FSRQ>=start){const point=[Math.round((Date.parse(r.FSRQ+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/DAY),Number.isFinite(nav)?nav:null];if(cash||issue)point.push(cash);if(issue)point.push(issue);history.push(point);}
 }
 return history;
}
const memo=new Map(),inflight=new Map();
export async function fetchNavRows(code,start,end,fetcher=fetch){
 async function page(index){
  const url=new URL('https://api.fund.eastmoney.com/f10/lsjz');url.search=new URLSearchParams({fundCode:code,pageIndex:String(index),pageSize:'20',startDate:start,endDate:end});
  const response=await fetcher(url,{headers:{'User-Agent':'Mozilla/5.0',Referer:'https://fundf10.eastmoney.com/'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('历史净值来源暂不可用');const data=await response.json();
  if(![0,null,undefined].includes(data.ErrCode)||!Array.isArray(data.Data?.LSJZList)||!Number.isInteger(data.TotalCount)||data.TotalCount<0||data.TotalCount>400)throw Error('历史净值响应异常');
  return {rows:data.Data.LSJZList,total:data.TotalCount};
 }
 const first=await page(1),rows=[...first.rows],pages=Math.ceil(first.total/20);
 for(let i=2;i<=pages;i+=3){const batches=await Promise.all(Array.from({length:Math.min(3,pages-i+1)},(_,j)=>page(i+j)));for(const b of batches){if(b.total!==first.total)throw Error('历史净值正在更新，请重试');rows.push(...b.rows);}}
 if(rows.length!==first.total||new Set(rows.map(r=>r.FSRQ)).size!==first.total||rows.some(r=>!/^\d{4}-\d{2}-\d{2}$/.test(r.FSRQ)||r.FSRQ<start||r.FSRQ>end))throw Error('历史净值分页缺失或重复');
 return rows;
}
async function cachedHistory(code,asof,origin){
 const id=code+':'+asof,hit=memo.get(id);if(hit&&Date.now()-hit.time<3600000)return hit.data;
 if(inflight.has(id))return inflight.get(id);
 const task=(async()=>{
  // Sites dispatch Workers cannot access caches.default. Optional caching must
  // never prevent a public-data request; use the bounded in-memory cache above.
  const start=dateShift(asof,-364),fetchStart=dateShift(start,-10);
  // Reference fund supplies the same conservative required disclosure days as the daily screener.
  const [raw,reference]=await Promise.all([fetchNavRows(code,fetchStart,asof),code==='000001'?Promise.resolve(null):cachedHistory('000001',asof,origin)]);
  const history=normalizeHistory(raw,start,asof),calendar=reference?.context.calendar_offsets||history.map(p=>p[0]);
  if(!calendar.length||calendar.at(-1)!==364)throw Error('共同净值截止日暂未取得');
  const data={code,context:{asof,history_start:start,max_calendar_days:365,calendar_offsets:calendar},history,checkedAt:new Date().toISOString(),source:'https://fundf10.eastmoney.com/jjjz_'+code+'.html'};
  if(memo.size>=200)memo.clear();memo.set(id,{time:Date.now(),data});
  return data;
 })();inflight.set(id,task);try{return await task;}finally{inflight.delete(id);}
}
export async function historyResponse(request){
 const url=new URL(request.url),code=url.searchParams.get('code'),asof=url.searchParams.get('asof'),today=new Date(Date.now()+8*3600000).toISOString().slice(0,10);
 if(request.method!=='GET'||!/^\d{6}$/.test(code||'')||!/^\d{4}-\d{2}-\d{2}$/.test(asof||'')||!Number.isFinite(Date.parse(asof))||dateShift(asof,0)!==asof||asof>today||asof<dateShift(today,-730))return Response.json({error:'基金代码或净值截止日无效'},{status:400});
 try{return Response.json(await cachedHistory(code,asof,url.origin),{headers:{'Cache-Control':'public, max-age=3600'}});}
 catch(error){console.error('compare_history_failed',code,asof,error.message);return Response.json({error:'历史净值加载失败，请重试；这不代表基金历史不足。'},{status:502,headers:{'Cache-Control':'no-store'}});}
}
