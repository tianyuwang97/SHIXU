import {indicesResponse} from './market-indices-api.mjs';
import {authResponse} from './admin-auth.mjs';
import {rulesResponse,picksResponse} from './stock-rule-access.mjs';
import privatePicks from './.generated/stock-picks.json';
import {exitsResponse} from './stock-exits-api.mjs';
import privateExits from './.generated/stock-exits.json';
import {stockEngine} from './stock-engine.mjs';
import {profileResponse} from './compare-profile.mjs';
import {historyResponse} from './compare-history.mjs';
import {holdingsResponse} from './compare-holdings.mjs';
import {peerHistoryResponse} from './peer-history.mjs';
import {usPeerResponse} from './us-peer-api.mjs';
import {hkPeerResponse} from './hk-peer-api.mjs';
import data from './sim-data.mjs';
import events from './sim-events.mjs';
import holdings from './sim-holdings.mjs';
import {createEngine,addDays} from './sim-engine.mjs';
const fundEngine=createEngine(data,events,holdings);
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',...headers}});
const cookieName='fund_sim_visitor';
async function visitor(request){let token=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.split('=')[1];let fresh=false;if(!/^[a-f0-9]{64}$/.test(token||'')){token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');fresh=true}const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');return {owner:hash,headers:fresh?{'Set-Cookie':`${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${new URL(request.url).protocol==='https:'?'; Secure':''}`}:{}}}
async function readRun(db,id,owner,asset){if(!/^[\w-]{16,64}$/.test(id||''))return null;const found=await db.prepare('SELECT state, version FROM simulation_runs WHERE id = ? AND owner = ?').bind(id,owner).first();return found&&(JSON.parse(found.state).asset||'fund')===asset?found:null}
export default {async fetch(request,env){
 const url=new URL(request.url),asset=url.pathname.startsWith('/api/stock/')?'stock':'fund',engine=asset==='stock'?stockEngine:fundEngine;
 if(url.pathname.startsWith('/api/auth/'))return authResponse(request,env);
 if(url.pathname==='/api/stock-rules')return rulesResponse(request,env);
 if(url.pathname==='/api/stock-picks')return picksResponse(request,env,privatePicks);
 if(url.pathname==='/api/stock-exits')return exitsResponse(request,env,privateExits);
 if(url.pathname==='/api/market-indices')return indicesResponse(request);
 if(url.pathname==='/api/compare/profile')return profileResponse(request);
 if(url.pathname==='/api/compare/history')return historyResponse(request);
 if(url.pathname==='/api/compare/holdings')return holdingsResponse(request);
 if(url.pathname==='/api/peers/history')return peerHistoryResponse(request);
 if(url.pathname==='/api/peers/us')return usPeerResponse(request);
 if(url.pathname==='/api/peers/hk')return hkPeerResponse(request);
 if(!url.pathname.startsWith('/api/sim/')&&!url.pathname.startsWith('/api/stock/')){return env.ASSETS?env.ASSETS.fetch(request):new Response('Not found',{status:404})}
 try{
  if(!env.DB)throw Error('演练存档暂不可用，请稍后重试');
  if(request.method!=='GET'&&(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site'))return json({error:'请求来源不匹配'},403);
  const who=await visitor(request),send=(v,status=200)=>json(v,status,who.headers),route=url.pathname.split('/').slice(3).join('/');
  if(request.method==='GET'&&route==='bootstrap'){
   const rows=await env.DB.prepare('SELECT id, state FROM simulation_runs WHERE owner = ? ORDER BY updated DESC LIMIT 100').bind(who.owner).all();
   return send({...engine.metadata,runs:rows.results.filter(row=>(JSON.parse(row.state).asset||'fund')===asset).slice(0,12).map(row=>{const r=JSON.parse(row.state),p=engine.portfolio(r);return {id:r.id,start:r.start,date:r.date,completed:r.completed,elapsed:r.elapsed,initial:r.initial,duration:r.duration||30,target:r.target,return:p.return,profit:p.total-r.initial,total:p.total,drawdown:p.drawdown,benchmark:p.benchmark}})});
  }
  if(request.method==='GET'&&(route==='preview'||route==='calendar')){
   const date=url.searchParams.get('date'),duration=Number(url.searchParams.get('duration')||30);if(!engine.metadata.durations.includes(duration))return send({error:'期限无效'},400);if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||date<engine.metadata.startMin||date>engine.metadata.startMaxByDuration[duration])return send({error:'日期超出历史范围'},400);
   if(route==='preview')return send(engine.market(date,duration));
   const first=date.slice(0,7)+'-01',days=[];for(let d=first;d.slice(0,7)===first.slice(0,7);d=addDays(d,1)){if(d>=engine.metadata.startMin&&d<=engine.metadata.startMaxByDuration[duration]){const m=engine.market(d,duration);days.push({date:d,regime:m.regime,label:m.label,events:events.filter(e=>e.available===d).length})}}return send({days});
  }
  if(request.method==='GET'&&route==='state'){
   const found=await readRun(env.DB,url.searchParams.get('id'),who.owner,asset);return found?send(engine.view(JSON.parse(found.state))):send({error:'未找到此浏览器的演练存档'},404);
  }
  if(request.method==='POST'){
   const text=await request.text();if(text.length>16000)return send({error:'输入过长'},400);const input=JSON.parse(text);
   if(!/^[\w-]{16,64}$/.test(input.id||''))return send({error:'存档标识无效'},400);
   if(route==='start'){
    const previous=await readRun(env.DB,input.id,who.owner,asset);if(previous)return send(engine.view(JSON.parse(previous.state)));
    const count=await env.DB.prepare('SELECT COUNT(*) AS count FROM simulation_runs WHERE owner = ?').bind(who.owner).first();if(count.count>=100)return send({error:'此浏览器已保存100次演练，请先导出已有复盘记录'},400);
    const run=engine.start(input);await env.DB.prepare('INSERT INTO simulation_runs (id,owner,state,version,updated) VALUES (?,?,?,?,?)').bind(run.id,who.owner,JSON.stringify(run),0,Date.now()).run();return send(engine.view(run));
   }
   if(route==='action'){
    if(!/^[\w-]{16,64}$/.test(input.actionId||''))return send({error:'操作标识无效'},400);
    const found=await readRun(env.DB,input.id,who.owner,asset);if(!found)return send({error:'未找到演练'},404);const original=JSON.parse(found.state);
    if(original.lastActionId===input.actionId)return send(engine.view(original));
    if(found.version!==input.version)return send({error:'存档已在其他页面更新，请重新载入本次演练'},409);
    if(original.orders.length>=500&&['buy','sell'].includes(input.type))return send({error:'本次演练已达到500笔订单上限'},400);
    const run=engine.action(original,input);const result=await env.DB.prepare('UPDATE simulation_runs SET state = ?, version = ?, updated = ? WHERE id = ? AND owner = ? AND version = ?').bind(JSON.stringify(run),run.version,Date.now(),run.id,who.owner,found.version).run();
    if(result.meta.changes!==1)return send({error:'存档发生并发更新，请重新载入'},409);return send(engine.view(run));
   }
  }
  return send({error:'未找到此功能'},404);
 }catch(error){console.error('Simulation request failed',error.message);return json({error:error.message||'暂时无法保存操作，请稍后重试'},400)}
}};
