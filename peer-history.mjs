import {withPeerScreen} from './peer-screen.mjs';
import {parseSinaHistory} from './peer-history-core.mjs';
import index from './stock-peer-data/index.json';
const allowed=new Set(index.stocks.map(s=>s.code)),cache=new Map(),pending=new Map();
export async function getPeerHistory(code,asof,fetcher=fetch){
 const symbol=(code.startsWith('6')?'sh':'sz')+code,start=new Date(Date.parse(asof+'T00:00:00Z')-369*86400000).toISOString().slice(0,10);
 const urls=[`https://quotes.sina.cn/cn/api/jsonp_v2.php/var%20k=/CN_MarketDataService.getKLineData?symbol=${symbol}&scale=240&ma=no&datalen=500`,`https://finance.sina.com.cn/realstock/company/${symbol}/qfq.js`];
 const texts=await Promise.all(urls.map(async url=>{const r=await fetcher(url,{headers:{'Referer':'https://finance.sina.com.cn/','User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error('公开行情源暂不可用');return r.text();}));
 return {code,asof,points:parseSinaHistory(texts[0],texts[1],symbol,start,asof),source:`https://finance.sina.com.cn/realstock/company/${symbol}/nc.shtml`,basis:'新浪日收盘价 / 新浪前复权因子'};
}
export async function peerHistoryResponse(request){
 const url=new URL(request.url),code=url.searchParams.get('code'),asof=url.searchParams.get('asof');
 const send=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store'}});
 if(request.method!=='GET'||!allowed.has(code)||asof!==index.asof)return send({error:'股票代码或快照日期无效，请刷新同行页面。'},400);
 const key=code+':'+asof,cached=cache.get(key);if(cached&&Date.now()-cached.at<21600000)return send(cached.data);
 try{
  if(!pending.has(key)){const promise=getPeerHistory(code,asof).then(value=>withPeerScreen(value,index)).then(data=>{if(cache.size>=80)cache.delete(cache.keys().next().value);cache.set(key,{at:Date.now(),data});return data;}).finally(()=>pending.delete(key));pending.set(key,promise);}
  return send(await pending.get(key));
 }catch{return send({error:'该股票的一年行情暂未取得，可稍后重试。'},502);}
}
