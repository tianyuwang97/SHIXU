export const MARKETS={fund:{name:'基金',currency:'CNY',unit:'人民币'},cn:{name:'A股',currency:'CNY',unit:'人民币'},us:{name:'美股',currency:'USD',unit:'美元'},hk:{name:'港股',currency:'HKD',unit:'港币'}};
export const finite=n=>typeof n==='number'&&Number.isFinite(n);
const sum=a=>a.reduce((n,v)=>n+v,0),round=n=>Math.round((n+Number.EPSILON)*100)/100;
export const emptyBook=()=>({date:new Date().toISOString().slice(0,10),cash:0,horizon:'',reserve:null,singleLimit:null,sectorLimit:null,rows:[]});
export function validCode(m,c){return (m==='fund'||m==='cn'?/^\d{6}$/:m==='hk'?/^\d{5}$/:/^[A-Z0-9.^-]{1,16}$/).test(c);}
export function familyKey(r,m){return m==='fund'&&r.known?r.name.replace(/(?:[A-Z])(?:类|份额)?(?:[（(][^）)]*[）)])?$/,''):r.code;}
export function validateBook(book,market){
 const errors=[];if(!Object.hasOwn(MARKETS,market))return ['市场无效'];
 if(!book||!Array.isArray(book.rows))return ['持仓格式无效'];
 if(!/^\d{4}-\d{2}-\d{2}$/.test(book.date||'')||!Number.isFinite(Date.parse(book.date+'T00:00:00Z'))||new Date(book.date+'T00:00:00Z').toISOString().slice(0,10)!==book.date)errors.push('请填写有效的持仓估值日期');
 if(!finite(book.cash)||book.cash<0||book.cash>1e12)errors.push('可用现金应为0到一万亿之间的金额');
 if(book.rows.length>50)errors.push('每个市场最多保存50只持仓');
 if(!['','1','6','12','36'].includes(String(book.horizon)))errors.push('持有计划无效');
 for(const key of ['singleLimit','sectorLimit'])if(book[key]!==null&&(!finite(book[key])||book[key]<=0||book[key]>100))errors.push('仓位上限应大于0且不超过100%');
 if(book.reserve!==null&&(!finite(book.reserve)||book.reserve<0||book.reserve>1e12))errors.push('现金保留金额无效');
 const seen=new Set();for(const r of book.rows){
  if(!r||typeof r!=="object"){errors.push("持仓格式无效");continue;}
  if(!validCode(market,r.code||'')||!String(r.name||'').trim()||String(r.name).length>100)errors.push('请核对持仓代码和名称');
  if(seen.has(r.code))errors.push('同一代码请合并成一条持仓');seen.add(r.code);
  if(!finite(r.value)||r.value<=0||r.value>1e12)errors.push('持仓市值必须大于0且不超过一万亿');
  if(r.cost!==null&&(!finite(r.cost)||r.cost<=0||r.cost>1e12))errors.push('成本留空或填写大于0的剩余持仓成本');
  if(r.target!==null&&(!finite(r.target)||r.target<0||r.target>100))errors.push('目标仓位应为0到100%');
  if(typeof r.sector!=='string'||r.sector.length>60)errors.push('板块名称不能超过60字');
 }
 return [...new Set(errors)];
}
function groups(rows,key){const result=new Map();rows.forEach((r,i)=>{const k=key(r);if(!k)return;if(!result.has(k))result.set(k,[]);result.get(k).push(i);});return result;}
export function analyzePortfolio(book,market){
 const errors=validateBook(book,market);if(errors.length)return {errors};
 const rows=book.rows,held=sum(rows.map(r=>r.value)),total=held+book.cash,knownCost=rows.filter(r=>r.cost!==null),cost=sum(knownCost.map(r=>r.cost)),profit=sum(knownCost.map(r=>r.value-r.cost));
 const products=groups(rows,r=>familyKey(r,market)),sectors=groups(rows,r=>r.sector.trim());
 const distribution=[...sectors].map(([name,ids])=>({name,value:sum(ids.map(i=>rows[i].value)),count:ids.length})).sort((a,b)=>b.value-a.value);
 const unknownValue=sum(rows.filter(r=>!r.sector.trim()).map(r=>r.value));
 const issues=[],blocks=[],reasons=rows.map(()=>new Set()),remaining=rows.map(r=>r.value);
 if(!rows.length)blocks.push('先录入至少一只持仓');
 if(!book.horizon)blocks.push('补充计划持有时间，再生成金额方案');
 const targets=rows.filter(r=>r.target!==null);const fullTargets=rows.length>0&&targets.length===rows.length;
 if(targets.length&&!fullTargets)blocks.push('已填写部分目标仓位：请为每只填写目标，或全部清空后按仓位上限分析');
 if(!targets.length&&book.reserve===null&&book.singleLimit===null&&book.sectorLimit===null)blocks.push('填写现金保留金额或仓位上限，才能计算调整金额');
 if(book.date>new Date().toISOString().slice(0,10))blocks.push('估值日期在未来，请核对');
 const age=Math.floor((Date.now()-Date.parse(book.date+'T00:00:00Z'))/86400000);
 if(age>7)blocks.push('这份持仓已超过7个自然日，请更新市值和估值日期后生成金额方案');
 if(book.reserve!==null&&book.reserve>total+.01)blocks.push('现金保留金额超过本账户总资产，需要补充资金或修改目标');
 const cap=book.singleLimit===null?null:total*book.singleLimit/100,sectorCap=book.sectorLimit===null?null:total*book.sectorLimit/100;
 for(const [name,ids]of products){const v=sum(ids.map(i=>rows[i].value));if(cap!==null&&v>cap+.01)issues.push({type:'single',title:name+' 超过单一产品上限',amount:round(v-cap),text:`当前 ${(total?v/total*100:0).toFixed(1)}%，你设定 ${book.singleLimit}%${ids.length>1?'；同名基金份额合并统计':''}`});}
 for(const d of distribution)if(sectorCap!==null&&d.value>sectorCap+.01)issues.push({type:'sector',title:d.name+' 超过板块上限',amount:round(d.value-sectorCap),text:`当前 ${(total?d.value/total*100:0).toFixed(1)}%，你设定 ${book.sectorLimit}%`});
 if(book.reserve!==null&&book.cash<book.reserve-.01)issues.push({type:'cash',title:'可用现金低于保留金额',amount:round(book.reserve-book.cash),text:'卖出或赎回后的资金，仍需等待实际到账'});
 if(unknownValue>0)issues.push({type:'unknown',title:'有持仓未填写板块',amount:unknownValue,text:'板块集中度只统计已确认分类，不能据此判断整个账户已分散'});
 if(unknownValue>0&&sectorCap!==null)blocks.push('先填写全部持仓的主板块，才能按板块上限计算完整方案');
 if(String(book.horizon)==='1'&&held>0)issues.push({type:'horizon',title:'一个月内计划用钱或退出',amount:null,text:'先核实资金用途、产品风险和交易到账时间；如果是刚性支出，请把需要的金额填入现金保留要求'});
 if(fullTargets){
  const targetSum=sum(rows.map(r=>r.target));if(targetSum>100+1e-8)blocks.push('目标仓位合计超过100%');
  rows.forEach((r,i)=>remaining[i]=total*r.target/100);
  if(book.reserve!==null&&total-sum(remaining)<book.reserve-.01)blocks.push('目标仓位留下的现金不足，请降低目标仓位或调整现金要求');
  for(const [name,ids]of products)if(cap!==null&&sum(ids.map(i=>remaining[i]))>cap+.01)blocks.push(name+' 的目标与单一产品上限冲突');
  for(const [name,ids]of sectors)if(sectorCap!==null&&sum(ids.map(i=>remaining[i]))>sectorCap+.01)blocks.push(name+' 的目标与板块上限冲突');
  if(unknownValue&&sectorCap!==null)blocks.push('填写全部板块后，才能核对目标仓位是否满足板块上限');
  rows.forEach((r,i)=>{if(Math.abs(remaining[i]-r.value)>.01)reasons[i].add('调整至你填写的目标仓位 '+r.target+'%');});
 }else if(!targets.length){
  const reduce=(ids,amount,reason)=>{const base=sum(ids.map(i=>remaining[i]));if(base<=0)return;const ratio=Math.max(0,Math.min(1,amount/base));ids.forEach(i=>{const reduction=remaining[i]*ratio;if(reduction>.005){remaining[i]-=reduction;reasons[i].add(reason);}});};
  if(cap!==null)for(const [,ids]of products){const value=sum(ids.map(i=>remaining[i]));if(value>cap)reduce(ids,value-cap,'回到单一产品上限 '+book.singleLimit+'%');}
  if(sectorCap!==null)for(const [name,ids]of sectors){const value=sum(ids.map(i=>remaining[i]));if(value>sectorCap)reduce(ids,value-sectorCap,name+' 回到板块上限 '+book.sectorLimit+'%');}
  const cashAfterCaps=total-sum(remaining),need=Math.max(0,(book.reserve??0)-cashAfterCaps);
  if(need>.005)reduce(rows.map((_,i)=>i),need,'按剩余市值比例补足现金要求');
 }
 // Round the target value, then derive every trade from it. This keeps the ledger balanced.
 const plan=rows.map((r,i)=>{const targetValue=round(remaining[i]),delta=round(targetValue-r.value);return {...r,weight:total?r.value/total:0,profit:r.cost!==null?r.value-r.cost:null,return:r.cost!==null?r.value/r.cost-1:null,targetValue,delta,reasons:[...reasons[i]],action:delta>.005?'增加':delta<-.005?'减少':'观察'};});
 const buy=round(sum(plan.map(r=>Math.max(0,r.delta)))),sell=round(sum(plan.map(r=>Math.max(0,-r.delta)))),cashAfter=round(book.cash+sell-buy);
 if(cashAfter<0)blocks.push('目标金额取整后超出可用资产，请略微降低目标仓位');
 return {errors:[],total,held,cost,profit,profitRate:cost?profit/cost:null,costCoverage:knownCost.length,issues,blocks:[...new Set(blocks)],plan,fullTargets,distribution,unknownValue,buy,sell,cashAfter,allowed:blocks.length===0,stressLoss:held*.1,stressRate:total?held*.1/total:0,productCount:products.size};
}
export function holdingOverlap(rows,evidence){
 const pairs=[];for(let a=0;a<rows.length;a++)for(let b=a+1;b<rows.length;b++){
  const x=evidence[rows[a].code]?.holdings,y=evidence[rows[b].code]?.holdings;if(x?.status!=='ok'||y?.status!=='ok')continue;
  const names=x.items.filter(p=>y.items.some(q=>q.code===p.code&&q.name===p.name)).map(p=>p.name);
  if(names.length)pairs.push({a:rows[a].name,b:rows[b].name,names,dateA:x.date,dateB:y.date,sameDate:x.date===y.date});
 }return pairs;
}
