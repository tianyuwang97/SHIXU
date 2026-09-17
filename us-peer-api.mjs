import {withPeerScreen} from './peer-screen.mjs';
import index from './us-peer-data/index.json';
import {getUSPeerDetails} from './us-peer-provider.mjs';
const codes=new Set(index.stocks.map(s=>s.code)),cache=new Map(),pending=new Map();
export async function usPeerResponse(request){
 const u=new URL(request.url),code=u.searchParams.get('code'),asof=u.searchParams.get('asof');
 const send=(d,status=200)=>new Response(JSON.stringify(d),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store'}});
 if(request.method!=='GET'||!codes.has(code)||asof!==index.asof)return send({error:'代码或行情快照日期无效，请刷新页面'},400);
 const key=code+asof,hit=cache.get(key);if(hit&&Date.now()-hit.at<(hit.value.detailsLoaded?21600000:60000))return send(hit.value);
 if(!pending.has(key))pending.set(key,getUSPeerDetails(code,asof).then(value=>withPeerScreen(value,index)).then(value=>{if(cache.size>=80)cache.delete(cache.keys().next().value);cache.set(key,{value,at:Date.now()});return value;}).finally(()=>pending.delete(key)));
 try{return send(await pending.get(key));}catch{return send({error:'美股资料暂不可用，请稍后重试'},502);}
}
