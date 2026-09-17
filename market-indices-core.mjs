export const INDICES=[
 {id:'sh000001',name:'上证指数',short:'SSE',market:'cn',zone:'Asia/Shanghai',zoneLabel:'北京时间'},
 {id:'sh000688',name:'科创50',short:'STAR 50',market:'cn',zone:'Asia/Shanghai',zoneLabel:'北京时间'},
 {id:'hkHSI',name:'恒生指数',short:'HSI',market:'hk',zone:'Asia/Hong_Kong',zoneLabel:'香港时间'},
 {id:'hkHSTECH',name:'恒生科技',short:'HSTECH',market:'hk',zone:'Asia/Hong_Kong',zoneLabel:'香港时间'},
 {id:'usNDX',name:'纳斯达克100',short:'NASDAQ 100',market:'us',zone:'America/New_York',zoneLabel:'纽约时间'},
 {id:'usINX',name:'标普500',short:'S&P 500',market:'us',zone:'America/New_York',zoneLabel:'纽约时间'}
];
export const quoteURL='https://qt.gtimg.cn/q='+INDICES.map(i=>i.id).join(',');
export const historyURL=i=>'https://web.ifzq.gtimg.cn/appstock/app/'+({cn:'fqkline',hk:'hkfqkline',us:'usfqkline'}[i.market])+'/get?param='+i.id+',day,,,40,qfq';
export const sourceURL=i=>'https://gu.qq.com/'+i.id;
const positive=n=>Number.isFinite(n)&&n>0;
export function localStamp(time,zone){return new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date(time));}
export function parseTime(value,zone){
 const v=String(value).replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,'$1-$2-$3 $4:$5:$6').replaceAll('/','-');
 if(!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v))throw Error('行情时间未识别');
 const wall=Date.parse(v.replace(' ','T')+'Z');let utc=wall;
 for(let j=0;j<3;j++){const local=Date.parse(localStamp(utc,zone).replace(' ','T')+'Z');utc+=wall-local;}
 if(!Number.isFinite(utc)||localStamp(utc,zone)!==v)throw Error('行情时间无效');return utc;
}
export function parseQuote(text,index,now=Date.now()){
 const match=text.match(new RegExp('v_'+index.id+'="([^"\\r\\n]+)"'));if(!match)throw Error('行情暂未取得');
 const a=match[1].split('~'),price=Number(a[3]),previous=Number(a[4]);
 if(a[2].replace(/^\./,'')!==index.id.replace(/^(sh|hk|us)/,'')||!positive(price)||!positive(previous))throw Error('指数行情字段无效');
 const time=parseTime(a[30],index.zone);if(time>now+300000)throw Error('行情时间异常');
 return {price,previous,change:price-previous,percent:(price/previous-1)*100,time,quoteDate:localStamp(time,index.zone).slice(0,10)};
}
export function parseHistory(data,index){
 const rows=data?.data?.[index.id]?.day||data?.data?.[index.id]?.qfqday;if(!Array.isArray(rows))throw Error('历史走势暂未取得');
 const points=rows.filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r[0])&&positive(Number(r[2]))).map(r=>[r[0],Number(r[2])]);
 if(points.length<2||points.some((p,j)=>j&&p[0]<=points[j-1][0]))throw Error('历史走势不足或日期异常');return points;
}
export function chartPoints(row){
 if(!row.quote)return [];const end=row.quote.quoteDate,start=new Date(Date.parse(end+'T00:00:00Z')-29*86400000).toISOString().slice(0,10);
 const points=(row.points||[]).filter(p=>p[0]>=start&&p[0]<=end).map(p=>[...p]);
 if(points.length){if(points.at(-1)[0]===end)points[points.length-1]=[end,row.quote.price];else points.push([end,row.quote.price]);}return points;
}
export function quoteStatus(row,index,now=Date.now()){
 if(!row.quote)return '暂未取得';if(row.fallback)return '更新失败 · 旧快照';
 const stamp=localStamp(now,index.zone),date=stamp.slice(0,10);if(row.quote.quoteDate!==date)return '最近行情';
 const m=Number(stamp.slice(11,13))*60+Number(stamp.slice(14,16));
 if(m<570)return '盘前快照';
 if(index.market!=='us'&&m>=(index.market==='hk'?720:690)&&m<780)return '午间休市';
 if(m>=(index.market==='us'?960:index.market==='hk'?970:900))return '收盘后快照';
 return '盘中快照';
}
