// Public periodic direct-stock holdings. Never execute the vendor's JavaScript.
const clean=s=>s.replace(/<[^>]*>/g,'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&#(\d+);/g,(_,v)=>String.fromCodePoint(Number(v))).replace(/\s+/g,'').trim();
export function parseHoldings(text,code,today=new Date().toISOString().slice(0,10)){
 const literal=text.match(/\bcontent\s*:\s*("(?:\\.|[^"\\])*")/s)?.[1];
 if(!literal)throw Error('持仓接口格式异常');
 const html=JSON.parse(literal),reports=[];
 const sections=[...html.matchAll(/<h4\b[^>]*>([\s\S]*?)<\/h4>[\s\S]*?<table\b[^>]*>([\s\S]*?)<\/table>/gi)];
 if(!sections.length){if(!html.trim()||/暂无/.test(clean(html)))return {status:'unavailable',items:[]};throw Error('持仓表格未识别');}
 for(const [,heading,table] of sections){
  if(!new RegExp('fund\\.eastmoney\\.com/'+code+'\\.html').test(heading))throw Error('持仓基金代码不匹配');
  const date=heading.match(/\d{4}-\d{2}-\d{2}/)?.[0];if(!date||date>today)throw Error('持仓报告日期异常');
  const headers=[...table.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(m=>clean(m[1]));
  const ni=headers.indexOf('股票名称'),ci=headers.indexOf('股票代码'),wi=headers.indexOf('占净值比例');
  if(Math.min(ni,ci,wi)<0)throw Error('持仓列名未识别');
  const items=[];
  for(const [,row] of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
   const cells=[...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>clean(m[1]));if(!cells.length)continue;
   if(cells.length<=Math.max(ni,ci,wi)||!cells[ni]||!cells[ci])throw Error('持仓行不完整');
   const weight=/^\d+(?:\.\d+)?%$/.test(cells[wi])?Number(cells[wi].slice(0,-1)):null;
   if(weight!==null&&(weight<0||weight>100))throw Error('持仓占比异常');
   items.push({name:cells[ni],code:cells[ci],weight});
  }
  reports.push({status:items.length?'ok':'unavailable',date,items:items.slice(0,3)});
 }
 return reports.sort((a,b)=>b.date.localeCompare(a.date))[0];
}
const cached=new Map();
export async function holdingsResponse(request){
 const url=new URL(request.url),code=url.searchParams.get('code'),source=`https://fundf10.eastmoney.com/ccmx_${code}.html`;
 if(request.method!=='GET'||!/^\d{6}$/.test(code||''))return Response.json({error:'请输入六位基金代码'},{status:400});
 const old=cached.get(code);if(url.searchParams.get('refresh')!=='1'&&old&&Date.now()-old.time<21600000)return Response.json(old.data);
 try{
  const r=await fetch(`https://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=${code}&topline=3&year=&month=`,{headers:{'User-Agent':'Mozilla/5.0','Referer':source},signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('持仓来源响应失败');const text=await r.text();if(text.length>2000000)throw Error('持仓响应异常');
  const data={code,...parseHoldings(text,code),source,checked_on:new Date().toISOString().slice(0,10)};
  if(old?.data.items?.length&&(!data.items.length||data.date<old.data.date))throw Error('持仓报告倒退或数据缺失');
  if(cached.size>=200)cached.delete(cached.keys().next().value);cached.set(code,{time:Date.now(),data});
  return Response.json(data,{headers:{'Cache-Control':'public, max-age=3600'}});
 }catch(e){console.error('compare_holdings_failed',code,e.message);return Response.json({code,status:'error',error:'持仓获取失败，请重试或查看公开来源。',source},{status:502,headers:{'Cache-Control':'no-store'}});}
}
