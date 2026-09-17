import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {normalizeHistory,dateShift} from './compare-history.mjs';
import {parseProfile} from './compare-profile.mjs';
import {compareSeries,indexKey} from './compare-core.mjs';
import {companies} from './company-data.mjs';
const source=JSON.parse(fs.readFileSync('../sector-cache/input.json','utf8'));
if(source.reference.error)throw Error('Reference calendar failed');
const start=dateShift(source.asof,-364),reference=normalizeHistory(source.reference.raw,start,source.asof);
const context={asof:source.asof,history_start:start,max_calendar_days:365,calendar_offsets:reference.map(p=>p[0])};
if(context.calendar_offsets.at(-1)!==364)throw Error('Incomplete reference cutoff');
const rows=source.rows.map(r=>{
 const base={code:r.code,name:r.name,type:r.type,themes:r.themes};
 if(r.error)return {...base,error:'取数失败，暂不纳入计算',history:[]};
 try{
  const profile=parseProfile(r.profileHtml,r.code,r.checkedAt);if(!profile.company||/^--$|暂无/.test(profile.company))throw Error('company missing');
  const editorial=companies.find(c=>c.name===profile.company);
  base.company=profile.company;base.companyId=editorial?.id||'manager-'+createHash('sha256').update(profile.company).digest('hex').slice(0,16);
  const index=/指数|ETF/.test(r.type+' '+r.name),enhanced=/增强/.test(r.name),tracking=indexKey(profile);
  return {...base,history:normalizeHistory(r.raw,start,source.asof),mode:index?(enhanced?'enhanced':'index'):'active',tracking,structure:/联接/.test(r.name)?'ETF联接':'普通指数',scope:profile.scope,benchmark:profile.benchmark,profileSource:profile.source,navSource:'https://fundf10.eastmoney.com/jjjz_'+r.code+'.html',checkedAt:r.checkedAt};
 }catch{return {...base,error:'公司或产品档案未核实，暂不纳入计算',history:[]};}
});
if(!rows.length||rows.filter(r=>!r.error).length<rows.length*.8)throw Error('Too many unverified records; preserve previous sector snapshot');
// One fixed shared date window per period; unavailable records remain visible, never zero-filled.
const windows={};
for(const days of [30,180,365]){const result=compareSeries(rows.map(r=>({...r,historyError:r.error})),context,days);windows[days]={start:result.start,end:result.end};for(const m of result.metrics){const r=rows.find(r=>r.code===m.code);if(m.error?.startsWith('期间存在')&&r.history[0]?.[0]>context.calendar_offsets.find(x=>x>=365-days))m.error='净值记录自'+dateShift(start,r.history[0][0])+'开始，未覆盖所选期间';(r.metrics??={})[days]=m.error?{error:m.error}:{change:m.change,drawdown:m.drawdown};}}
const managers=[...new Map(rows.filter(r=>!r.error&&r.mode!=='enhanced').map(r=>[r.companyId,{id:r.companyId,name:r.company,short:r.company,profileId:companies.find(c=>c.id===r.companyId)?.id||null}])).values()].sort((a,b)=>a.name.localeCompare(b.name,'zh'));
const data={schema:1,coverage:'all-managers-in-current-name-matched-universe',companies:managers,asof:source.asof,checkedAt:source.checkedAt,windows,rows:rows.map(({history,...r})=>r)};
fs.writeFileSync('sector-data.json',JSON.stringify(data));
console.log(JSON.stringify({rows:rows.length,companies:managers.length,active:rows.filter(r=>r.mode==='active').length,index:rows.filter(r=>r.mode==='index').length,enhanced:rows.filter(r=>r.mode==='enhanced').length,unverified:rows.filter(r=>r.error).length,availableYear:rows.filter(r=>!r.metrics[365].error).length}));
