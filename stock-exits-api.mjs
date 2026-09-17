import {authenticatedUser,authJSON} from './admin-auth.mjs';
export const EXIT_RULES=[
 {id:'R01',name:'30日横盘',description:'近30自然日收盘价区间振幅≤10%，首尾涨跌幅在−5%至+5%；基金使用分红再投净值指数。'},
 {id:'R02',name:'向下突破确认',description:'此前15自然日横盘，连续两个收盘点低于原区间下沿，截至当前收盘尚未涨回。区间下沿在首次跌破前固定；基金使用已披露净值观察点。'}
];
export function exitView(snapshot,member,codes=null){
 if(!member)return {authenticated:false,error:'请先登录。'};
 return {...Object.fromEntries(Object.entries(snapshot).filter(([key])=>key!=='rows')),authenticated:member,rules:member?EXIT_RULES:EXIT_RULES.map(({id})=>({id})),
  matched:snapshot.rows.filter(r=>r.status==='triggered').length,rows:snapshot.rows.filter(r=>codes?codes.has(r.code):r.status==='triggered').map(({code,name,source,status,asof,start,latest,change,amplitude,rule1,rule2,signals,box,points,explanation})=>({code,name,source,status,asof,start,change,signals:signals.map(s=>({id:s.id,date:s.date})),...(status==='unknown'?{reason:'行情不足或待核实'}:{}),...(member&&status!=='unknown'?{latest,amplitude,rule1,rule2,box,points,explanation}:{})}))};
}
export async function exitsResponse(request,env,snapshots){
 if(request.method!=='GET')return authJSON({error:'请求方式无效'},405);
 const params=new URL(request.url).searchParams,market=params.get('market')?.toUpperCase()||'CN';
 if(!snapshots[market])return authJSON({error:'市场无效'},400);
 const user=await authenticatedUser(request,env);
 if(!user)return authJSON({authenticated:false,error:'请先登录。'},401);
 const codes=params.has('codes')?new Set(params.get('codes').split(',').filter(c=>/^[A-Z0-9.^-]{1,16}$/.test(c)).slice(0,300)):null;
 return authJSON(exitView(snapshots[market],!!user,codes));
}
