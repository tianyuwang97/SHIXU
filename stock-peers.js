import {PERIODS,RANKS,finite,analyzeIndustry,rankRows,currencyRankRows,validSelection} from './stock-peers-core.mjs';
import {researchButtons,readState,setQueue,visit} from './research-store.mjs';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const marketKey=new URL(location.href).searchParams.get('market'),isUS=marketKey==='us',isHK=marketKey==='hk',isForeign=isUS||isHK,dataRoot=isHK?'/hk-peer-data':isUS?'/us-peer-data':'/stock-peer-data';
const normalizeCode=c=>isHK&&/^\d{1,5}(?:\.HK)?$/i.test(c)?c.replace(/\.HK$/i,'').padStart(5,'0'):c;
const currencyName=c=>({CNY:'人民币',HKD:'港币',USD:'美元',EUR:'欧元',GBP:'英镑'}[c]||c||'未知币种');
let financeCurrency=/^[A-Z]{3}$/.test(new URL(location.href).searchParams.get('currency')||'')?new URL(location.href).searchParams.get('currency'):'CNY';
const usMetricLabels={revenue:'营业收入（TTM）',profit:'净利润（TTM）',roe:'净资产收益率（TTM）',netMargin:'净利润 / 营收（TTM）',cashflow:'经营现金流（TTM）',profitGrowth:'净利润同比增长'};
const needsLoad=s=>isForeign?!s.detailsLoaded:!s.points?.length;
$('market').value=isHK?'hk':isUS?'us':'cn';$('market').onchange=()=>location.href='/stock-peers.html?market='+$('market').value;
if(isUS){document.title='时序 · 美股同行对比';$('marketEyebrow').textContent='US STOCKS / SIDE BY SIDE';$('candidateLink').href='/?market=us#stock-picks';$('candidateLink').textContent='美股候选';$('marketBadge').textContent='美股观察池 · 细分行业';$('search').placeholder='例如 英伟达 / NVDA';}
if(isHK){document.title='时序 · 港股同行对比';$('marketEyebrow').textContent='HONG KONG / SIDE BY SIDE';$('candidateLink').href='/';$('candidateLink').textContent='市场首页';$('marketBadge').textContent='港股 · 港币普通股';$('search').placeholder='例如 腾讯 / 00700 / 0700.HK';}
$('currencyControl').hidden=!isHK;$('financeCurrency').value=financeCurrency;$('financeCurrency').onchange=()=>{financeCurrency=$('financeCurrency').value;if(data){renderRank();updateURL();}};
const colors=['#197b65','#7861b5','#e07031','#2b83b0','#af537c'];
const percent=(n,ratio=true)=>finite(n)?`${n>0?'+':''}${(n*(ratio?100:1)).toFixed(2)}%`:'—';
const money=(n,currency)=>finite(n)?`${(n/1e8).toLocaleString('zh-CN',{maximumFractionDigits:2})} 亿${currencyName(currency||(isHK?financeCurrency:isUS?'USD':'CNY'))}`:'—';
const metricLabel=k=>(isHK&&{marketCap:'市值（港币，来源口径）',revenueGrowth:'营收同比（最近财年）',profitGrowth:'净利润同比（最近财年）'}[k])||(isForeign&&usMetricLabels[k])||Object.values(RANKS).flat().find(([key])=>key===k)?.[1]||k;
const metricValue=(k,n,row)=>!finite(n)?'—':['marketCap','revenue','profit','cashflow'].includes(k)?money(n,isHK?(k==='marketCap'?'HKD':row?.finance?.currency):undefined):k==='excess'?`${n>0?'+':''}${(n*100).toFixed(2)} 个百分点`:k==='drawdown'?`${(n*100).toFixed(2)}%`:percent(n,['change'].includes(k));
let catalog,data,analysis,selected=[],rank='scale',metric=isHK?'marketCap':'revenue',days=30,generation=0,retryAction,chartSeries=[],chartDates=[];
const cache=new Map(),queries=new URL(location.href).searchParams;
const researchMarket=isHK?'hk':isUS?'us':'cn';
const researchStock=s=>({market:researchMarket,code:s.code,name:s.name,industry:data.id,industryName:data.name});
function restoreResearch(){if(!data)return;const codes=(readState().queues[researchMarket+':'+data.id]?.items||[]).map(i=>i.code),next=validSelection(codes,data.stocks);if(JSON.stringify(next)===JSON.stringify(selected))return;selected=next;renderRank();renderComparison();updateURL();if(selected.length)loadHistories(selected);}
document.addEventListener('research:change',e=>{if(e.detail?.source==='dock'&&data&&e.detail.group===researchMarket+':'+data.id)restoreResearch();});
document.addEventListener('research:external',restoreResearch);
let historyAbort,historyBusy=false;
if(PERIODS.includes(Number(queries.get('days'))))days=Number(queries.get('days'));$('days').value=String(days);
async function read(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw Error('数据暂时未能加载，请重试。');return r.json();}
function updateURL(){const u=new URL(location.href);u.searchParams.delete('code');u.searchParams.set('industry',data.id);u.searchParams.set('days',days);if(isHK)u.searchParams.set('currency',financeCurrency);if(selected.length)u.searchParams.set('codes',selected.join(','));else u.searchParams.delete('codes');history.replaceState(null,'',u);}
function showError(e,action){$('loadError').hidden=false;$('errorText').textContent=e.message||'暂时无法读取数据';retryAction=action;$('status').textContent='暂时无法显示本次选择的数据。';}
function setMetricOptions(){
 const bank=/银行|非银金融|^金融$/.test(data?.sector||'');
 const options=RANKS[rank].filter(([k])=>!(bank&&rank==='quality'&&k!=='roe')&&!(isForeign&&k==='turnover'));
 if(!options.some(([k])=>k===metric))metric=options[0][0];
 $('metric').innerHTML=options.map(([k,l])=>`<option value="${k}">${metricLabel(k)}</option>`).join('');$('metric').value=metric;
 document.querySelectorAll('[data-rank]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rank===rank)));
}
function screenText(s){const sc=s.screen;if(!sc)return '<span class="screen-badge">规则待核实</span>';return `<span class="screen-badge ${sc.range===true?'match':''}">R01 ${sc.range===true?'符合':sc.range===false?'不符':'待核实'}</span><span class="screen-badge ${sc.breakout===true?'match':''}">R02 ${sc.breakout===true?'确认':sc.breakout===false?'未确认':'待核实'}</span>`;}
function quoteDate(s){if(isUS)return esc(s.quote?.at||'暂未取得');return s.quote?.at?esc(s.quote.at.replace('T',' ').slice(0,19))+(isHK?' 香港时间':' 北京时间'):'暂未取得';}
function rankNote(){
 if(isHK)return {scale:`市值统一为港币；营收、利润金额榜仅比较${currencyName(financeCurrency)}报表，不作隐含汇率换算。财务采用最新TTM，各公司截止日单独显示。`,quality:`经营现金流金额榜仅比较${currencyName(financeCurrency)}报表；ROE和利润率是比率，可跨报表币种查看。ROE按TTM利润与期初期末平均股东权益计算，金融业不套用毛利率和现金流榜。`,growth:'采用最近两个完整财年的营收和净利润同比；要求同币种、年度长度可比。亏损或零利润基期不计算增长率。这里的成长指标来自年度报表，不与TTM混算。',strength:`截至 ${data.asof} 的港币股息与拆股调整收盘序列，按香港交易日历验证。参考组合仅包含完整行情同行。`}[rank];
 if(isUS)return {scale:'金额统一为美元。营收、净利润采用最新TTM（最近十二个月）；公司财年不同，截止日逐项显示。市值为资料抓取时快照，非历史收盘市值。',quality:'ROE为TTM净利润除以期初、期末股东权益均值，仅在两期权益均为正且日期匹配时计算。金融行业不套用毛利率和经营现金流榜。',growth:'比较相隔350—380天的两个TTM区间；没有可比基期、亏损或零利润时不计算利润增长率。',strength:`截至 ${data.asof} 的美元调整收盘价，观察期不含盘前盘后；参考组合仅包含完整行情的观察池同行。`}[rank];
 const notes={scale:`财报统一使用 ${data.financialPeriod} 报告期；金额为人民币。总市值使用各公司最新报价快照，日期单独标明。`,quality:`统一报告期 ${data.financialPeriod}；净资产收益率为报告期数值，未年化。负净资产不参与净资产收益率排名。${/银行|非银金融|^金融$/.test(data.sector)?'金融业只提供净资产收益率榜，其他通用行业指标不套用。':'各项指标分别排序；经营现金流金额本身也受公司规模影响。'}`,growth:`比较 ${data.financialPeriod} 与 ${data.previousPeriod} 同期数据；亏损或零利润不直接计算利润增长率，低基数单独标注。`,strength:`使用截至 ${data.asof} 的前复权收盘价；与本板块数据完整公司的等权参考组合比较。最大回撤越小越靠前；最新换手率是报价时点数据，不是整个观察期的换手率。`};
 return notes[rank];
}
function renderRank(){
 const sorted=isHK?currencyRankRows(analysis.rows,metric,financeCurrency):rankRows(analysis.rows,metric),valid=sorted.filter(s=>s.rank!==null).length;
 $('metricHeading').textContent=metricLabel(metric);$('rankNote').textContent=rankNote();
 $('coverage').textContent=`本行业收录 ${data.stocks.length} ${isForeign?'只证券':'家公司'} · 当前指标 ${valid} 项有可比数据`;
 $('ranking').innerHTML=sorted.map(s=>`<tr><td><input type="checkbox" data-select="${s.code}" aria-label="选择${esc(s.name)}加入对比" ${selected.includes(s.code)?'checked':''}></td><td><div class="rank-company"><span class="rank-no">${s.rank??'—'}</span><div><b>${esc(s.name)}</b>${researchButtons(researchStock(s))}<span class="subtle">${s.code}${!isForeign&&/ST|退/.test(s.name)?' · 名称含风险标记':''}</span></div></div></td><td><span class="metric-value">${metricValue(metric,s.metrics[metric],s)}</span><span class="subtle">${s.currencyExcluded?esc(s.finance?currencyName(s.finance.currency)+'报表，不参与当前金额榜':s.financeNote||'报表资料未取得'):isHK&&['revenueGrowth','profitGrowth'].includes(metric)?s.annual?.length>=2?`${s.annual[1].period} → ${s.annual[0].period}`:'年度基期不足':['marketCap','turnover'].includes(metric)?quoteDate(s):['change','excess','drawdown'].includes(metric)?s.price.known?`${s.price.start}—${s.price.end}`:esc(s.price.reason):s.finance?isForeign?`TTM 截止 ${s.finance.period}`:`${s.finance.period} · 公告 ${s.finance.published}`:esc(s.financeNote||'同报告期数据缺失')}${metric==='profitGrowth'&&s.metrics.profitNote?'<br>'+esc(s.metrics.profitNote):''}</span></td><td>${screenText(s)}</td></tr>`).join('');
 $('ranking').querySelectorAll('[data-select]').forEach(el=>el.onchange=()=>toggle(el.dataset.select,el.checked));
}
function toggle(code,checked){
 if(checked&&!selected.includes(code)){
  if(selected.length>=5){$('trayMessage').textContent='最多比较5家，请先移除一家。';const cb=$('ranking').querySelector(`[data-select="${code}"]`);if(cb)cb.checked=false;return;}selected.push(code);const item=data.stocks.find(s=>s.code===code);if(item)visit(researchStock(item));
 }else if(!checked)selected=selected.filter(c=>c!==code);
 updateURL();renderRank();renderComparison();
 if(checked&&!historyBusy&&data.stocks.some(s=>s.code===code&&needsLoad(s)))loadHistories([code]);
}
function renderChart(chosen){
 const eligible=chosen.filter(s=>s.price.known);
 $('chartInspector').hidden=true;chartSeries=[];chartDates=[];
 if(chosen.length<2){$('chart').innerHTML='<p class="chart-empty">从上方列表选择 2—5 家同行，查看同起点走势与经营数据。</p>';return;}
 if(eligible.length<2){$('chart').innerHTML='<p class="chart-empty">所选股票中不足两家具备本观察期的完整行情。可以缩短期间，或选择其他同行；财务数据仍可在下方比较。</p>';return;}
 chartSeries=eligible.map(s=>({name:s.name,color:colors[selected.indexOf(s.code)],points:s.price.points}));
 if(analysis.benchmark)chartSeries.push({name:`同行等权参考（${analysis.benchmark.count}家）`,color:'#71847a',points:analysis.benchmark.points,benchmark:true});
 chartDates=chartSeries[0].points.map(p=>p[0]);
 const values=chartSeries.flatMap(s=>s.points.map(p=>(p[1]-1)*100)),lo=Math.min(0,...values),hi=Math.max(0,...values),pad=Math.max((hi-lo)*.1,1),low=lo-pad,high=hi+pad;
 const x=i=>65+i/(chartDates.length-1)*805,y=v=>265-(v-low)/(high-low)*235;
 const grid=Array.from({length:5},(_,i)=>{const v=low+(high-low)*i/4;return `<line x1="65" x2="870" y1="${y(v)}" y2="${y(v)}" stroke="#e4ece5"/><text x="55" y="${y(v)+4}" text-anchor="end">${v.toFixed(1)}%</text>`}).join('');
 const labels=[0,Math.floor((chartDates.length-1)/2),chartDates.length-1].map((i,n)=>`<text x="${x(i)}" y="295" text-anchor="${n===0?'start':n===2?'end':'middle'}">${chartDates[i]}</text>`).join('');
 $('chart').innerHTML=`<svg viewBox="0 0 900 315" role="img" aria-label="所选股票与同行等权参考的同起点涨跌幅"><title>统一起点 ${chartDates[0]}，截止 ${data.asof}，起点均为0%</title>${grid}<line x1="65" x2="870" y1="${y(0)}" y2="${y(0)}" stroke="#adc4b5" stroke-dasharray="4 4"/>${chartSeries.map(s=>`<polyline fill="none" stroke="${s.color}" stroke-width="${s.benchmark?2:2.6}" ${s.benchmark?'stroke-dasharray="6 5"':''} points="${s.points.map((p,i)=>`${x(i).toFixed(1)},${y((p[1]-1)*100).toFixed(1)}`).join(' ')}"/>`).join('')}${labels}</svg>`;
 $('chartDay').max=chartDates.length-1;$('chartDay').value=chartDates.length-1;$('chartInspector').hidden=false;inspectChart();
}
function inspectChart(){const i=Math.max(0,Math.min(chartDates.length-1,Number($('chartDay').value)));if(!chartDates.length)return;$('chartDate').textContent=chartDates[i];$('chartValues').innerHTML=chartSeries.map(s=>`<span><i class="dot" style="background:${s.color}"></i>${esc(s.name)} <b>${percent(s.points[i][1]-1)}</b></span>`).join('');}
function companyLinks(s){if(isHK)return `<a href="https://emweb.securities.eastmoney.com/PC_HKF10/pages/home/index.html?code=${s.code}&type=web&color=w" target="_blank" rel="noopener noreferrer">公司资料</a> · <a href="https://finance.yahoo.com/quote/${s.symbol}/financials/" target="_blank" rel="noopener noreferrer">财务与走势</a> · <a href="https://gu.qq.com/hk${s.code}" target="_blank" rel="noopener noreferrer">市值来源</a>`;if(isUS)return `<a href="https://www.nasdaq.com/market-activity/stocks/${encodeURIComponent(s.code.toLowerCase().replaceAll('-','.'))}" target="_blank" rel="noopener noreferrer">公司与市值来源</a> · <a href="https://finance.yahoo.com/quote/${encodeURIComponent(s.code)}/financials/" target="_blank" rel="noopener noreferrer">财务与行情来源</a>`;return `<a href="https://emweb.securities.eastmoney.com/PC_HSF10/CompanySurvey/Index?type=web&code=${s.symbol}" target="_blank" rel="noopener noreferrer">公司资料</a> · <a href="https://data.eastmoney.com/bbsj/${s.code}.html" target="_blank" rel="noopener noreferrer">财务来源</a> · <a href="https://finance.sina.com.cn/realstock/company/${s.symbol}/nc.shtml" target="_blank" rel="noopener noreferrer">行情</a>`;}
function renderComparison(){
 setQueue(researchMarket+':'+data.id,selected.map(c=>data.stocks.find(s=>s.code===c)).filter(Boolean).map(researchStock),days);
 document.dispatchEvent(new CustomEvent('research:context',{detail:{group:researchMarket+':'+data.id}}));
 const chosen=selected.map(c=>analysis.rows.find(s=>s.code===c)).filter(Boolean);
 $('selection').innerHTML=chosen.map((s,i)=>`<button data-remove="${s.code}" aria-label="移除${esc(s.name)}"><i class="dot" style="background:${colors[i]}"></i>${esc(s.name)} <span>${s.code} ×</span></button>`).join('');$('selection').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>toggle(b.dataset.remove,false));
 $('tray').hidden=chosen.length===0;$('trayCount').textContent=`已选 ${chosen.length} / 5 家同行`;$('trayMessage').textContent=chosen.length<2?'再选择一家即可比较。':'同一细分行业 · 可继续增减选择';$('goCompare').setAttribute('aria-disabled',String(chosen.length<2));$('clear').disabled=!chosen.length;
 const b=analysis.benchmark,missing=chosen.filter(s=>!s.price.known);
 $('comparisonNote').textContent=`最近${days}自然日，图中股票使用同一交易日起点。${b?`虚线为本行业 ${b.count}/${b.total} 家行情完整公司的期初等权参考组合，非官方行业指数；${b.start} 至 ${b.end}，期间不调仓。`:data.historyPending?'行业行情尚未全部尝试载入，暂不计算同行参考线或超额表现；可点击“加载本行业走势”。':'完整行情公司不足两家，暂不生成同行参考线。'}${missing.length?' 所选 '+missing.map(s=>s.name).join('、')+' 行情不完整，暂不绘图。':''}`;
 renderChart(chosen);
 if(chosen.length<2){$('comparisonTable').innerHTML='';return;}
 const metricRow=(label,key,note='')=>[label,s=>`<span class="number">${metricValue(key,s.metrics[key],s)}</span>${note?'<span class="subtle">'+note+'</span>':''}`];
 const rows=[['主营业务',s=>`${esc(s.business||(isUS?'中文简介待补充':'暂未取得'))}${isForeign?`<span class="subtle">${esc(s.englishName)}</span>${s.businessEnglish?`<p>公司说明（英文节选）：${esc(s.businessEnglish)}</p>`:''}`:`<span class="subtle">产品：${esc(s.products||'暂未取得')}</span>`}`],[isUS?'行业':'行业 / 上市日期',s=>`${esc(data.sector)} / ${esc(data.name)}<span class="subtle">${s.listed||''}</span>`],[isForeign?'财务截止日 / 口径':'统一财报期 / 公告日期',s=>s.finance?(isForeign?`${isHK?currencyName(s.finance.currency)+' · ':''}TTM 截止 ${s.finance.period}<span class="subtle">抓取 ${s.checkedAt?.slice(0,10)||data.profileAsOf}；来源未提供公告日期</span>`:`${s.finance.period}<span class="subtle">公告 ${s.finance.published}</span>`):esc(s.financeNote||'财务资料待取得')],
 metricRow(isHK?'市值（港币，来源口径）':'总市值','marketCap'),[isForeign?'市值资料日期':'市值 / 换手率报价时点',quoteDate],metricRow('营业收入','revenue'),metricRow(isForeign?'净利润（TTM）':'归母净利润','profit'),metricRow(isForeign?'净资产收益率（TTM）':'加权净资产收益率','roe',isForeign?'TTM净利润 / 平均股东权益':'报告期值，未年化；负净资产不排名'),metricRow('销售毛利率','grossMargin'),metricRow(isForeign?'净利润 / 营收（TTM）':'归母净利润 / 营收','netMargin'),metricRow('经营现金流净额','cashflow'),metricRow(isHK?'营收同比（最近财年）':'营收同比增长','revenueGrowth'),[isHK?'净利润同比（最近财年）':'利润同比增长',s=>`<span class="number">${metricValue('profitGrowth',s.metrics.profitGrowth,s)}</span><span class="subtle">${esc(s.metrics.profitNote)}</span>`],
 ['近三年年度数据',s=>`<details><summary>展开年度营收与利润</summary>${s.annual.length?s.annual.map((a,i)=>`<p>${isForeign?a?.period||'未取得':data.annualYears[i]} ${isForeign?'财年截止':'年'}：${a?`营收 ${money(a.revenue,isHK?a.currency:undefined)} / 利润 ${money(a.profit,isHK?a.currency:undefined)}${a.published?'<br>公告 '+a.published:''}`:'数据缺失'}</p>`).join(''):'<p>年度资料暂未取得</p>'}</details>`],
 metricRow('区间涨跌幅','change'),metricRow('超越同行参考','excess'),metricRow('区间最大回撤','drawdown'),...(isForeign?[]:[metricRow('最新换手率','turnover')]),['走势可比性',s=>s.price.known?`${s.price.start}—${s.price.end}`:esc(s.price.reason)],['横盘 / 突破',screenText],['资料来源',companyLinks]];
 $('comparisonTable').innerHTML=`<table class="compare-table" style="min-width:${155+chosen.length*225}px"><thead><tr><th>比较项目</th>${chosen.map((s,i)=>`<th><i class="dot" style="background:${colors[i]}"></i> ${esc(s.name)}<span class="subtle">${s.code}</span></th>`).join('')}</tr></thead><tbody>${rows.map(([label,fn])=>`<tr><th scope="row">${label}</th>${chosen.map(s=>`<td>${fn(s)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function render(){
 if(isHK){const currencies=[...new Set(['CNY','HKD','USD',financeCurrency,...data.stocks.map(s=>s.finance?.currency).filter(c=>/^[A-Z]{3}$/.test(c||''))])];$('financeCurrency').innerHTML=currencies.map(c=>`<option value="${c}">${currencyName(c)} ${c}</option>`).join('');$('financeCurrency').value=financeCurrency;}
 data.historyPending=data.stocks.some(s=>!s.points?.length&&!s.historyAttempted);
 analysis=analyzeIndustry(data,days);setMetricOptions();$('content').hidden=false;$('loadError').hidden=true;
 $('industryTitle').textContent=`${data.name} · 同行排行榜`;
 $('status').textContent=isHK?`港交所港币普通股 ${catalog.total} 只 · 行情截止 ${data.asof} · 名单 ${data.universeAsOf} · ${catalog.industries.length-catalog.unclassified} 个已分类行业 / ${catalog.unclassified} 只行业待核实` :isUS?`美股观察池 ${catalog.total} 只证券 / ${catalog.industries.length} 个行业组 · 非全美股 · 行情截止 ${data.asof} · 资料核对 ${data.profileAsOf}`:`沪深A股共 ${catalog.total} 家 / ${catalog.industries.length} 个行业组 · 行情截止 ${data.asof} · 财报 ${data.financialPeriod} · 行业资料核对 ${data.profileAsOf}${data.dailyAsOf&&data.asof<data.dailyAsOf?' · 同行行情快照滞后，保留真实日期':''}`;
 $('methodology').innerHTML=`<p>范围：截至名单核对日的在市沪深A股，并要求上市日期不晚于行情截止日；不含北交所、B股和退市股票。使用${esc(data.classification)}。不同厂商分类可能不同；“未分类”组仅供查找，不代表同行。</p><p>财报统一为 ${data.financialPeriod}，只使用不晚于行情截止日已公告的数据；同比基期为 ${data.previousPeriod}。三年年度数据来自已完成披露的年度。单位为人民币；缺失数据用“—”表示，不当作零参与排名。财报数据可能包含后续更正，本页用于当前同行研究，不用于还原历史时点。</p><p>行情采用${esc(data.priceBasis)}，观察期间使用自然日，周末和节假日不补点。每家公司须具备共同交易日历上的完整行情；新上市、停牌或缺失记录可能不参与走势比较。同行参考采用完整样本期初等权持有，样本在观察期内固定，非官方行业指数。名次只在本页已收录且有可比数据的公司中计算，相同数值并列。</p><p>市值和最新换手率来自有时间戳的报价，可能是盘中值，不与历史收盘日期混淆。净资产收益率未年化；“归母净利润 / 营收”按该明确口径计算，不等于企业披露的所有净利率口径。银行与非银金融不套用毛利率、通用净利率及经营现金流排名。利润增长仅在本期与上期均为正时计算，上期利润不足1000万元提示低基数。</p><p>R01、R02采用首页相同的筛选口径，完整规则登录后可见；行情来源及复权处理可能造成与首页的细微差异，独立于当前走势期间；不参与同行名单筛选。这里分别比较业务规模、经营质量、成长与行情，没有自动认定“龙头”或给出买卖指令。</p><p>${data.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`).join(' · ')}</p>`;
 if(isUS)$('methodology').innerHTML=`<p>观察池为SPY股票持仓与纳斯达克100成分的去重合集，并非全美股。按纳斯达克官方细分行业分组，不同股类仍可能属于同一公司。未分类证券不自动视为同行。</p><p>财务金额仅采用来源明确标注的美元数据。营收、利润和现金流为最新TTM，各家公司财年及截止日不同；同比仅使用相隔350—380天的TTM基期。财报仅反映资料抓取时可见数据，可能含更正，不用于历史时点回测；来源未提供公告日期。非美元报表或数据缺失显示为—，不参与排名。</p><p>ROE为TTM净利润除以期初期末股东权益均值，两端权益须为正。银行保险等金融行业不套用毛利率和通用现金流排名。亏损基期不计算利润增长率。</p><p>股价采用Yahoo Finance股息及拆股调整收盘序列，美元计价，不含人民币汇率和交易费。30、90、180、365均为自然日；以美国交易日历验证完整数据。参考线为本行业有完整数据证券的期初等权组合，非官方指数，也非公司等权；同公司不同股类可能重复计权。缺失或上市不足的证券不补造历史。</p><p>R01、R02沿用首页同一规则，完整说明登录后可见。市值来自纳斯达克列表快照，仅能核对抓取日期，不代表走势图截止日市值。英文公司说明为纳斯达克公开介绍节选。</p><p>${data.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`).join(' · ')}</p>`;
 if(isHK)$('methodology').innerHTML=`<p>港交所${data.universeAsOf}官方名单中的港币主板及GEM普通股，排除ETF、REIT、权证、牛熊证、优先股和人民币交易柜台。并非所有香港上市产品；${data.unclassified}只行业资料尚未核实，分别保留在独立待核实分组，不当作同业。行业及公司业务来自东方财富资料，并与官方证券代码及ISIN交叉核对。</p><p>走势按香港交易日历，使用股息与拆股调整收盘序列，以港币计价。仅采用已收盘数据；周末、假日不补点。观察期间为自然日，上市不足或缺失交易日不参与完整区间比较。同行参考是已收录完整样本期初等权组合，非官方行业指数。</p><p>营收、利润、经营现金流为最新TTM（最近十二个月），保留来源明确标注的报表币种；金额榜通过上方币种选择，只比较同币种金额。市值为行情源提供的港币口径，不按报表币种变动。对比表逐列保留各自币种，不隐含换汇。ROE、利润率、同比是比率；金融业不套用通用毛利率和现金流比较。</p><p>成长榜使用最近两个完整财年同比，同币种且年度间隔350—380天才计算，不把年报与TTM混算。亏损或零利润基期不计算利润增长率。ROE用TTM净利润除以两端正股东权益均值，缺失时不推算。财务数据可能含后续更正，来源不提供公告时刻，本页用于当前研究，不用于历史时点回测。</p><p>R01、R02沿用首页同一规则，完整说明登录后可见。${data.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`).join(' · ')}</p>`;
 renderRank();renderComparison();updateURL();historyProgress();
}
function historyProgress(){
 const complete=data.stocks.filter(s=>!needsLoad(s)).length,failed=data.stocks.filter(s=>needsLoad(s)&&s.historyAttempted).length;
 $('historyProgress').textContent=` ${isForeign?'走势与财务已核对':'行情已载入'} ${complete}/${data.stocks.length} 家${failed?' · '+failed+'家暂未取得':''}${historyBusy?' · 正在分批加载，期间排名仅供临时查看':''}。`;
 $('loadHistories').disabled=historyBusy;$('loadHistories').textContent=historyBusy?'资料加载中…':failed?'重试未取得资料':complete===data.stocks.length?'资料已核对':isForeign?'加载行业走势与财务':'加载本行业走势';
 if(complete===data.stocks.length)$('loadHistories').disabled=true;
}
async function loadHistories(onlyCodes){
 if(!data||historyBusy)return;
 const target=data,version=generation,queue=target.stocks.filter(s=>needsLoad(s)&&(!onlyCodes||onlyCodes.includes(s.code)));
 if(!queue.length)return;historyBusy=true;historyAbort=new AbortController();const signal=historyAbort.signal;historyProgress();
 async function work(){
  while(queue.length&&!signal.aborted){
   const s=queue.shift();
   try{
    const r=await fetch(`${isHK?'/api/peers/hk':isUS?'/api/peers/us':'/api/peers/history'}?code=${encodeURIComponent(s.code)}&asof=${target.asof}`,{signal});const value=await r.json();
    if(!r.ok||value.code!==s.code||value.asof!==target.asof||!Array.isArray(value.points))throw Error(value.error||'行情身份异常');
    if(isForeign){const saved=s.points;const previousFinance={finance:s.finance,previous:s.previous,annual:s.annual,checkedAt:s.checkedAt};Object.assign(s,value);if(!value.points.length)s.points=saved;if(value.detailsErrors?.some(e=>e.startsWith('财务'))&&previousFinance.finance)Object.assign(s,previousFinance);s.historyError=value.detailsErrors?.join('；')||null;}else{s.points=value.points;s.historyError=null;}s.historySource=value.source;
    s.screen=value.screen||{range:null,breakout:null};
   }catch(e){if(signal.aborted)return;s.historyError=e.message;}
   s.historyAttempted=true;
   if(version===generation){render();historyProgress();}
  }
 }
 await Promise.all(isForeign?[work()]:[work(),work()]);
 if(version===generation){historyBusy=false;render();const waiting=selected.filter(code=>target.stocks.some(s=>s.code===code&&needsLoad(s)&&!s.historyAttempted));if(waiting.length)loadHistories(waiting);}
}
async function chooseIndustry(id,codes=null){
 if(!catalog.industries.some(i=>i.id===id))return;
 historyAbort?.abort();historyBusy=false;
 const request=++generation;$('content').hidden=true;$('tray').hidden=true;$('loadError').hidden=true;$('industry').value=id;$('status').textContent='正在读取该行业的公司与财务数据…';data=null;
 try{
  let next=cache.get(id);if(!next){next=await read(dataRoot+'/'+encodeURIComponent(id)+'.json');if(next.id!==id||next.asof!==catalog.asof||!Array.isArray(next.stocks))throw Error('数据快照正在更新，请重新加载页面。');cache.set(id,next);}
  if(request!==generation)return;
  data=next;const saved=readState().queues[researchMarket+':'+id];selected=validSelection(codes??saved?.items.map(i=>i.code)??[],data.stocks);if(codes===null&&saved){days=saved.days;$('days').value=String(days);}if(codes?.length){const item=data.stocks.find(s=>s.code===codes[0]);if(item)visit(researchStock(item));}render();
  if(data.stocks.length<=30)loadHistories();else if(selected.length)loadHistories(selected);
 }catch(e){if(request===generation)showError(e,()=>chooseIndustry(id,codes));}
}
function search(){
 const q=$('search').value.trim().toLowerCase();if(!q||!catalog){$('searchResults').hidden=true;return;}
 const results=catalog.stocks.filter(s=>s.code.toLowerCase().includes(normalizeCode(q).toLowerCase())||s.symbol?.toLowerCase().includes(q)||s.name.toLowerCase().includes(q)||s.englishName?.toLowerCase().includes(q)).slice(0,20);
 $('searchResults').innerHTML=results.length?results.map(s=>`<button data-code="${s.code}">${esc(s.name)} · ${s.code}<small>${esc(catalog.industries.find(i=>i.id===s.industry)?.name||'未分类')}</small></button>`).join(''):`<p>没有找到已收录的${isHK?'港股':isUS?'美股观察池证券':'沪深A股'}。</p>`;$('searchResults').hidden=false;
 $('searchResults').querySelectorAll('[data-code]').forEach(b=>b.onclick=()=>{const stock=catalog.stocks.find(s=>s.code===b.dataset.code);$('search').value=stock.name+' '+stock.code;$('searchResults').hidden=true;chooseIndustry(stock.industry,[stock.code]);});
}
async function init(){
 try{catalog=await read(dataRoot+'/index.json');if(!catalog.stocks?.length||!catalog.industries?.length)throw Error('同行名单暂不可用');
  const industries=[...catalog.industries].sort((a,b)=>(a.sector+a.name).localeCompare(b.sector+b.name,'zh-CN'));
  $('industry').innerHTML=industries.map(i=>`<option value="${esc(i.id)}">${esc(i.sector||'其他')} / ${esc(i.name)}（${i.count}家）</option>`).join('');$('industry').disabled=false;
  const initial=(queries.get('codes')||queries.get('code')||'').split(',').filter(Boolean).map(normalizeCode),seed=catalog.stocks.find(s=>s.code===initial[0]);
  const requested=queries.get('industry'),defaultStock=catalog.stocks.find(s=>s.code===(isHK?'00700':isUS?'NVDA':'600519'))||catalog.stocks[0];
  const id=seed?.industry||(catalog.industries.some(i=>i.id===requested)?requested:defaultStock.industry);
  await chooseIndustry(id,initial.length?initial:null);
 }catch(e){showError(e,init);}
}
$('search').oninput=search;$('search').onkeydown=e=>{if(e.key==='Escape')$('searchResults').hidden=true;};
$('industry').onchange=()=>{selected=[];chooseIndustry($('industry').value);};$('days').onchange=()=>{days=Number($('days').value);if(data)render();};
document.querySelectorAll('[data-rank]').forEach(b=>b.onclick=()=>{rank=b.dataset.rank;if(data){setMetricOptions();renderRank();}});
$('metric').onchange=()=>{metric=$('metric').value;renderRank();};$('clear').onclick=()=>{selected=[];renderRank();renderComparison();updateURL();};$('chartDay').oninput=inspectChart;
$('goCompare').onclick=e=>{if(selected.length<2){e.preventDefault();$('trayMessage').textContent='请再选择一家同行。';}};
$('retry').onclick=()=>retryAction?.();init();
$('loadHistories').onclick=()=>loadHistories();
