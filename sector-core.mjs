import themeDefinitions from './sector-themes.json' with {type:'json'};
export const themes=themeDefinitions;
export const median=values=>{if(!values.length)return null;const a=[...values].sort((x,y)=>x-y),n=a.length;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2;};
export const groupKey=r=>JSON.stringify([r.tracking,r.structure]);
export function indexGroups(data,theme){const groups=new Map();for(const r of data.rows){if(r.mode!=='index'||!r.tracking||!r.themes.includes(theme))continue;const key=groupKey(r);const g=groups.get(key)||{key,tracking:r.tracking,structure:r.structure,count:0};g.count++;groups.set(key,g);}return [...groups.values()].sort((a,b)=>b.count-a.count||a.tracking.localeCompare(b.tracking,'zh'));}
export function summarize(data,companies,{theme,mode,days,group}){
 const rows=data.rows.filter(r=>r.themes.includes(theme)&&r.mode===mode&&(mode!=='index'||groupKey(r)===group));
 const result=companies.map(c=>{const sample=rows.filter(r=>r.companyId===c.id),eligible=sample.filter(r=>!r.metrics?.[days]?.error&&Number.isFinite(r.metrics?.[days]?.change)&&Number.isFinite(r.metrics?.[days]?.drawdown));return {id:c.id,name:c.name,short:c.short,total:sample.length,count:eligible.length,change:median(eligible.map(r=>r.metrics[days].change)),drawdown:median(eligible.map(r=>r.metrics[days].drawdown)),sample,eligible};});
 return result.sort((a,b)=>a.change===null?(b.change===null?0:1):b.change===null?-1:b.change-a.change);
}
