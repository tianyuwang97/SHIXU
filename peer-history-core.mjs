export function parseSinaHistory(text,factorText,symbol,start,end){
 const match=text.match(/var\s+k\s*=\s*\((\[[\s\S]*\])\)\s*;?\s*$/);
 const factors=factorText.match(new RegExp('var\\s+'+symbol+'qfq\\s*=\\s*(\\{[\\s\\S]*\\})\\s*;?\\s*(?:/\\*[\\s\\S]*?\\*/\\s*)?$'));
 if(!match||!factors)throw Error('历史数据格式或股票身份异常');
 const raw=JSON.parse(match[1]),factorData=JSON.parse(factors[1]);
 if(!Array.isArray(raw)||!Array.isArray(factorData.data)||!factorData.data.length)throw Error('历史数据或复权因子缺失');
 const fs=factorData.data.map(p=>[p.d,Number(p.f)]).sort((a,b)=>a[0].localeCompare(b[0]));
 if(fs.some(([d,f],i)=>!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(f)||f<=0||(i&&d<=fs[i-1][0])))throw Error('复权因子异常');
 const points=[];
 for(const p of raw){
  const d=p.day?.slice(0,10);if(!d||d<start||d>end)continue;
  const c=Number(p.close),factor=fs.filter(([date])=>date<=d).at(-1)?.[1],volume=Number(p.volume);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(c)||c<=0||!factor||!Number.isFinite(volume)||volume<0||(points.length&&d<=points.at(-1)[0]))throw Error('历史数据日期或价格异常');
  points.push([d,c/factor,volume]);
 }
 if(points.length<2)throw Error('观察期历史行情不足');
 return points;
}
