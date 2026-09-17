// Names supply discovery clues only; profiles and disclosures supply comparison facts.
export const sectors=[
 ['半导体 / 芯片','半导体|芯片'],['医药','医药|制药|生物科技|生物医'],['医疗','医疗|创新药'],['中药','中药'],
 ['新能源','新能源|光伏|风电|储能|锂电'],['新能源汽车','新能源车|新能源汽车|电动车|智能汽车'],['光伏','光伏'],
 ['银行','银行'],['证券','证券|券商'],['金融','金融|保险'],['白酒','白酒'],['消费','消费|食品饮料|食品|饮料'],
 ['科技','科技|信息技术|计算机|软件|电子|人工智能|通信'],['人工智能','人工智能|机器人'],['军工','军工|国防|航空航天'],
 ['有色金属','有色|稀土|金属'],['黄金','黄金'],['煤炭','煤炭'],['石油 / 油气','石油|油气'],['房地产','房地产|地产'],
 ['农业','农业|农牧|畜牧|养殖'],['环保','环保|环境'],['电力','电力|公用事业'],['基建','基建|基础设施|工程机械'],
 ['传媒 / 游戏','传媒|游戏|动漫'],['沪深300','沪深300'],['中证500','中证500'],['中证1000','中证1000'],
 ['科创50','科创50|科创板50'],['创业板','创业板'],['红利','红利|股息'],['港股','港股|恒生'],['美股','标普|纳斯达克|美国'],
 ['债券','债|纯债']
].map(([name,pattern])=>({name,pattern}));
const matchers=sectors.map(s=>({...s,test:new RegExp(s.pattern,'i')}));
export const tagsFor=r=>{const name=r.name.replace(/^农银(?:汇理)?/,'').replace(/银行间/g,'');const bond=/债券|固收/.test(r.type);return matchers.filter(s=>(!bond||s.name==='债券')&&s.test.test(name)).map(s=>s.name);};
export const shareClass=r=>r.name.match(/(?:^|[^A-Z])([ACEIY])(?:类|份额)?(?:[（(][^）)]*[）)])?$/i)?.[1]?.toUpperCase()||'未标明';
export const productKind=r=>/联接/.test(r.name)?'ETF联接':/指数/.test(r.type+' '+r.name)?'其他指数':/债/.test(r.type)?'债券':/股票|混合/.test(r.type)?'主动权益 / 混合':'其他';
export const indexKey=p=>p?.tracking&&!/暂无|无跟踪|不适用|^无$|--/.test(p.tracking)?p.tracking.replace(/\s/g,''):null;
export const fixedFee=p=>p&&['management','custody','service'].every(k=>Number.isFinite(p[k]))?p.management+p.custody+p.service:null;
export function matchSearch(rows,q){q=q.trim().toLowerCase();if(!q)return [];const parts=q.split(/\s+/);return rows.filter(r=>parts.every(p=>(r.code+' '+r.name).toLowerCase().includes(p))).sort((a,b)=>(a.code===q?-1:b.code===q?1:0)||a.code.localeCompare(b.code));}
export function peerRows(rows,anchor,sector,{kind='all',share='all',query=''}={}){if(!anchor||!sector)return [];return rows.filter(r=>r.code!==anchor.code&&tagsFor(r).includes(sector)&&(kind==='all'||productKind(r)===productKind(anchor))&&(share==='all'||shareClass(r)===shareClass(anchor))&&(!query||(r.name+' '+r.code).toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>a.code.localeCompare(b.code));}
export function compareSeries(rows,c,days){
 if(![7,15,30,180,365].includes(days))throw Error('比较期间无效');
 const begin=c.max_calendar_days-days,required=c.calendar_offsets.filter(x=>x>=begin),dateAt=x=>new Date(Date.parse(c.history_start+'T00:00:00Z')+x*86400000).toISOString().slice(0,10);
 const pending=rows.map(r=>{const points=r.history.filter(p=>p[0]>=begin),present=new Set(points.map(p=>p[0]));let error=null;
  if(r.historyError)error=r.historyError;
  else if(days>c.max_calendar_days)error='所选期间历史净值尚未载入';
  else if(points.length<2)error='期间内不足两个净值观察点';
  else if(required.some(x=>!present.has(x)))error='期间存在应披露日缺失，暂不比较收益';
  else if(points.some(p=>!Number.isFinite(p[1])||p[1]<=0)||points.slice(1).some(p=>p[3]))error='分红、拆分或净值口径待核实';
  return {code:r.code,points,error};});
 const good=pending.filter(p=>!p.error);let common=good.length?good[0].points.map(p=>p[0]):[];
 for(const r of good)common=common.filter(x=>r.points.some(p=>p[0]===x));
 const first=common[0],last=common.at(-1);
 const metrics=pending.map(r=>{if(r.error)return {code:r.code,error:r.error};if(common.length<2)return {code:r.code,error:'共同净值日期不足，暂不比较'};
  const points=r.points.filter(p=>p[0]>=first&&p[0]<=last);let value=1,peak=1,drawdown=0;const series=[[points[0][0],1]];
  for(let i=1;i<points.length;i++){value*=((points[i][1]+(points[i][2]||0))/points[i-1][1]);peak=Math.max(peak,value);drawdown=Math.max(drawdown,1-value/peak);series.push([points[i][0],value]);}
  const values=series.map(p=>p[1]);return {code:r.code,change:value-1,amplitude:Math.max(...values)/Math.min(...values)-1,drawdown,series};});
 return {metrics,start:common.length>=2?dateAt(first):null,end:common.length>=2?dateAt(last):null,dateAt};
}
