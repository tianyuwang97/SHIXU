import {authenticatedUser,authJSON} from './admin-auth.mjs';
export const STOCK_RULES=[
 {id:'R01',name:'30日横盘',description:'最近30自然日收盘价区间振幅≤10%，首尾涨跌幅在−5%至+5%。'},
 {id:'R02',name:'确认突破',description:'所选30自然日的前15自然日形成横盘区间并固定上下沿；仅在后15自然日内，连续两个收盘点高于上沿确认向上突破，截至当前收盘尚未跌回。'}
];
const publicMatch=({code,name,source,asof,start,amplitude,change,points})=>({code,name,source,asof,start,amplitude,change,points,matchedRules:['R01','R02']});
export function publicPicks(snapshot){
 const keys=['expectedAsOf','market','currency','priceBasis','universeSources','asof','dailyAsOf','checkedAt','universe','universeAsOf','universeSource','total','evaluated','unknown'];
 return {...Object.fromEntries(keys.map(k=>[k,snapshot[k]])),matches:snapshot.matches.map(publicMatch),excluded:snapshot.excluded.map(({code,name})=>({code,name,reason:'数据不足或待核实'}))};
}
export function memberPicks(snapshot){return {...publicPicks(snapshot),authenticated:true,rules:STOCK_RULES,matches:snapshot.matches.map(s=>({...publicMatch(s),explanation:`最近30自然日振幅≤10%，首尾涨跌幅在−5%至+5%。使用本次30自然日中的前15自然日 ${s.signal.box.rangeStart}—${s.signal.box.rangeEnd} 固定横盘上下沿；后15自然日内，${s.signal.box.firstBreakDate}首次突破；下一交易日收盘继续高于原上沿，${s.signal.box.confirmDate}确认，截至${s.asof}仍未跌回。上下沿只取前半段，不使用所选期间之前的突破信号，也不随后半段走势移动。`}))};}
export async function rulesResponse(request,env){
 if(request.method!=='GET')return authJSON({error:'请求方式无效'},405);
 const user=await authenticatedUser(request,env);return authJSON({authenticated:!!user,rules:user?STOCK_RULES:STOCK_RULES.map(({id})=>({id}))});
}
export async function picksResponse(request,env,snapshots){
 if(request.method!=='GET')return authJSON({error:'请求方式无效'},405);
 const market=new URL(request.url).searchParams.get('market')?.toUpperCase()||'CN',snapshot=snapshots[market];
 if(!snapshot)return authJSON({error:'市场无效'},400);
 const user=await authenticatedUser(request,env);
 return authJSON(user?memberPicks(snapshot):{...publicPicks(snapshot),authenticated:false,rules:STOCK_RULES.map(({id})=>({id}))});
}
