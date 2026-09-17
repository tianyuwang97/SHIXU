// Shared with the comparison page's one-year history API. No short-window fallback.
const SCREEN_MAX_DAYS=360;
function screeningStart(asof,days){return new Date(Date.parse(asof+'T00:00:00Z')-(days-1)*86400000).toISOString().slice(0,10)}
function validateScreenHistory(data,code,asof){
 const c=data?.context;
 if(data?.code!==code||c?.asof!==asof||c?.max_calendar_days!==365||c?.history_start!==screeningStart(asof,365)||!Array.isArray(c.calendar_offsets)||!c.calendar_offsets.length||c.calendar_offsets.at(-1)!==364||!Array.isArray(data.history))throw Error('历史净值响应异常');
 for(const values of [c.calendar_offsets,data.history.map(p=>p?.[0])])if(values.some((n,i)=>!Number.isInteger(n)||n<0||n>364||(i&&n<=values[i-1])))throw Error('历史日期不完整或重复');
 return data;
}
function screeningLongWindow(row,entry,asof,days,calculate){
 if(!Number.isInteger(days)||days<2||days>SCREEN_MAX_DAYS)throw new RangeError('自然日天数必须为2—360的整数');
 const base={...row,amplitude:undefined,change:undefined,series:undefined,dividends:undefined,fetchError:undefined,breakout:{known:false,phase:'unknown',reason:'所选期间历史净值待加载'},windowStart:screeningStart(asof,days),windowEnd:asof,periodDays:days,dates:[],pointCount:0};
 if(entry?.phase==='ready')return calculate({...base,history:entry.data.history},entry.data.context,days);
 return {...base,result:'数据待核实',reason:entry?.phase==='error'?'历史净值加载失败，请重试；并非历史不足':entry?.phase==='loading'?'正在加载所选期间的历史净值':'所选期间的历史净值尚未加载'};
}
class ScreenerHistoryStore{
 constructor(asof,{fetcher=fetch,changed=()=>{}}={}){this.asof=asof;this.fetcher=fetcher;this.changed=changed;this.entries=new Map();this.generation=0;this.running=false;this.controller=null;}
 stop(){this.generation++;this.controller?.abort();this.controller=null;this.running=false;for(const [code,e] of this.entries)if(e.phase==='loading')this.entries.delete(code);}
 async run(codes,{retry=false}={}){
  this.stop();const generation=this.generation,controller=this.controller=new AbortController();
  const queue=[...new Set(codes)].filter(code=>/^\d{6}$/.test(code)&&(!this.entries.has(code)||(retry&&this.entries.get(code).phase==='error')));let next=0;
  this.running=queue.length>0;this.changed();
  const worker=async()=>{while(generation===this.generation&&next<queue.length){
   const code=queue[next++];this.entries.set(code,{phase:'loading'});this.changed();
   try{
    const response=await this.fetcher('/api/compare/history?'+new URLSearchParams({code,asof:this.asof}),{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(65000)])});
    if(!response.ok)throw Error('历史净值加载失败');const data=validateScreenHistory(await response.json(),code,this.asof);
    if(generation!==this.generation)return;this.entries.set(code,{phase:'ready',data});
   }catch(error){if(generation!==this.generation)return;this.entries.set(code,{phase:'error'});}
   this.changed();
  }};
  await Promise.all([worker(),worker()]);if(generation===this.generation){this.running=false;this.changed();}
 }
}
if(typeof module!=='undefined')module.exports={SCREEN_MAX_DAYS,screeningStart,validateScreenHistory,screeningLongWindow,ScreenerHistoryStore};
