import {INDICES,quoteURL,historyURL,parseQuote,parseHistory} from './market-indices-core.mjs';
import snapshot from './market-indices-snapshot.json' with {type:'json'};
let memory=null,pending=null;const histories=new Map();
const headers={'User-Agent':'Mozilla/5.0','Referer':'https://gu.qq.com/'};
async function get(url){const r=await fetch(url,{headers,signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('来源响应失败');return r;}
async function refresh(){
 let text='';try{text=new TextDecoder('gb18030').decode(await(await get(quoteURL)).arrayBuffer());}catch{}
 const rows=await Promise.all(INDICES.map(async index=>{
  const old=memory?.rows.find(r=>r.id===index.id)||snapshot.rows.find(r=>r.id===index.id);let quote,fallback=false,historyFailed=false,points=[];
  try{quote=parseQuote(text,index);}catch{quote=old?.quote||null;fallback=!!quote;}
  const h=histories.get(index.id);
  if(h&&Date.now()-h.fetched<900000)points=h.points;
  else try{points=parseHistory(await(await get(historyURL(index))).json(),index);histories.set(index.id,{points,fetched:Date.now()});}catch{points=h?.points||old?.points||[];historyFailed=true;}
  return {id:index.id,quote,points,fallback,historyFailed};
 }));memory={checkedAt:Date.now(),rows};return memory;
}
export async function indicesResponse(request){
 if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{Allow:'GET'}});
 if(!memory||Date.now()-memory.checkedAt>60000){pending??=refresh().finally(()=>pending=null);await pending;}
 return Response.json(memory,{headers:{'Cache-Control':'public, max-age=30','X-Content-Type-Options':'nosniff'}});
}
