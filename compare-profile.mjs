const decode=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,' ').replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
export function parseProfile(html,code,checkedAt=new Date().toISOString()){
 const table=html.match(/<table\b[^>]*class=["']info\s[^"']*["'][^>]*>([\s\S]*?)<\/table>/i)?.[1];if(!table)throw Error('基本资料表暂不可读取');
 const fields={};for(const m of table.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>\s*<td\b[^>]*>([\s\S]*?)(?=<th\b|<\/tr>|<\/table>|$)/gi))fields[decode(m[1])]=decode(m[2]);
 if(!fields['基金代码']?.includes(code)||!fields['基金管理人'])throw Error('基金代码或管理人未核实');
 const value=k=>{const s=fields[k];return s&&!/^--$|暂无数据/.test(s)?s:null;};
 const rate=k=>{const m=value(k)?.match(/^(\d+(?:\.\d+)?)%/);return m?Number(m[1]):null;};
 const section=k=>{const m=html.match(new RegExp('<label[^>]*>'+k+'<\\/label>[\\s\\S]*?<p[^>]*>([\\s\\S]*?)<\\/p>','i'));return m?decode(m[1]).slice(0,240):null;};
 return {code,name:value('基金简称'),fullName:value('基金全称'),company:value('基金管理人'),manager:value('基金经理人'),type:value('基金类型'),size:value('净资产规模'),inception:value('成立日期/规模'),tracking:value('跟踪标的'),benchmark:value('业绩比较基准'),management:rate('管理费率'),custody:rate('托管费率'),service:rate('销售服务费率'),objective:section('投资目标'),scope:section('投资范围'),checkedAt,source:`https://fundf10.eastmoney.com/jbgk_${code}.html`,feeSource:`https://fundf10.eastmoney.com/jjfl_${code}.html`};
}
const local=new Map();
export async function profileResponse(request){
 const url=new URL(request.url),code=url.searchParams.get('code');if(request.method!=='GET'||!/^\d{6}$/.test(code||''))return Response.json({error:'请输入六位基金代码'},{status:400});
 const refresh=url.searchParams.get('refresh')==='1';const cached=local.get(code);if(!refresh&&cached&&Date.now()-cached.time<86400000)return Response.json(cached.data,{headers:{'Cache-Control':'public, max-age=3600'}});
 // The Sites dispatch runtime disallows caches.default; keep this optional
 // optimization within the bounded in-memory map, never on the critical path.
 try{
  const result=await fetch(`https://fundf10.eastmoney.com/jbgk_${code}.html`,{headers:{'User-Agent':'Mozilla/5.0','Referer':'https://fundf10.eastmoney.com/'},signal:AbortSignal.timeout(12000)});
  if(!result.ok)throw Error('资料来源暂时不可用');const html=await result.text();if(html.length>600000)throw Error('资料响应异常');const data=parseProfile(html,code);if(local.size>150)local.clear();local.set(code,{time:Date.now(),data});
  return Response.json(data,{headers:{'Cache-Control':'public, max-age=86400'}});
 }catch(e){console.error('compare_profile_failed',code,e.message);return Response.json({error:'暂未取得最新公司与费率资料，请稍后重试或查看来源。'},{status:502,headers:{'Cache-Control':'no-store'}});}
}
