import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {getUSPeerDetails} from './us-peer-provider.mjs';
const raw=JSON.parse(fs.readFileSync('us-stock-picks-raw.json','utf8')),profiles=JSON.parse(fs.readFileSync('us-company-profiles.json','utf8')),labels=JSON.parse(fs.readFileSync('us-industry-labels.json','utf8'));
const today=new Date().toISOString().slice(0,10),cache='../us-peer-cache',dest='us-peer-data';fs.mkdirSync(cache,{recursive:true});fs.mkdirSync(dest,{recursive:true});
async function read(url,file){if(fs.existsSync(file))return JSON.parse(fs.readFileSync(file));const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('US source unavailable '+r.status);const d=await r.json();fs.writeFileSync(file,JSON.stringify(d));return d;}
const listing=await read('https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&download=true',`${cache}/nasdaq-${today}.json`);
const byCode=new Map(listing.data.rows.map(r=>[r.symbol.replaceAll('.','-').replaceAll('/','-'),r]));
if(raw.stocks.some(s=>!byCode.has(s.code)))throw Error('Official industry list missing pool members');
const ref=await read('https://query1.finance.yahoo.com/v8/finance/chart/SPY?range=2y&interval=1d&events=div%2Csplits',`${cache}/calendar-${raw.asof}.json`);
const r=ref.chart?.result?.[0];if(r?.meta.symbol!=='SPY'||r.meta.currency!=='USD'||r.meta.instrumentType!=='ETF')throw Error('US calendar identity mismatch');
const start=new Date(Date.parse(raw.asof)-369*86400000).toISOString().slice(0,10),date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
const calendar=r.timestamp.map(t=>date.format(new Date(t*1000))).filter(d=>d>=start&&d<=raw.asof);if(calendar.at(-1)!==raw.asof||calendar.length<240)throw Error('US full-year calendar incomplete');
const sectorNames={'Technology':'科技','Finance':'金融','Health Care':'医疗健康','Consumer Discretionary':'非必需消费','Consumer Staples':'必需消费','Industrials':'工业','Energy':'能源','Utilities':'公用事业','Real Estate':'房地产','Basic Materials':'基础材料','Telecommunications':'电信'};
const names={'NVDA':'英伟达','AMD':'超威半导体','AVGO':'博通','INTC':'英特尔','QCOM':'高通','TXN':'德州仪器','MU':'美光科技','AMAT':'应用材料','LRCX':'泛林集团','KLAC':'科磊','AAPL':'苹果','MSFT':'微软','GOOG':'谷歌母公司 Alphabet C类','GOOGL':'谷歌母公司 Alphabet A类','AMZN':'亚马逊','META':'Meta','TSLA':'特斯拉'};
const groups={},stocks=[];
for(const s of raw.stocks){const p=byCode.get(s.code),industry=p.industry.trim(),id=industry?'us-'+createHash('sha256').update(industry).digest('hex').slice(0,12):'us-unclassified-'+s.code;
 const sector=sectorNames[p.sector]||p.sector||'未分类';
 groups[id]??={id,name:labels[industry]||industry||'行业待核实',englishName:industry,sector,financialIndustry:p.sector==='Finance',stocks:[]};
 const row={code:s.code,name:profiles[s.code]?.name||names[s.code]||s.name,englishName:s.name,symbol:s.code,industry:id,market:'US',business:profiles[s.code]?.summary||'',businessEnglish:'',products:'',listed:null,finance:null,previous:null,annual:[],quote:{marketCap:Number(p.marketCap)>0?Number(p.marketCap):null,turnover:null,at:today+'（资料抓取日，非报价时刻）'},points:[],screen:null,detailsLoaded:false};
 if(s.points?.length)row.screen=null;
 const file=`${cache}/${s.code}-${raw.asof}-${today}.json`;
 if(fs.existsSync(file))Object.assign(row,JSON.parse(fs.readFileSync(file)));
 if(row.businessEnglish)row.businessEnglish=row.businessEnglish.trim().split(/\s+/).slice(0,24).join(' ')+'…';
 groups[id].stocks.push(row);stocks.push({code:row.code,name:row.name,englishName:s.name,symbol:s.code,industry:id});
}
const seeds=Object.values(groups).find(g=>g.englishName==='Semiconductors')?.stocks||[];
let fetched=0;
for(const s of seeds){if(s.detailsLoaded)continue;const d=await getUSPeerDetails(s.code,raw.asof);Object.assign(s,d);fs.writeFileSync(`${cache}/${s.code}-${raw.asof}-${today}.json`,JSON.stringify(d));console.log('US seed',s.code,d.points.length,d.finance?.period||'no finance',d.detailsErrors.join('; '));fetched++;if(d.detailsErrors.some(e=>e.includes('繁忙')))break;await new Promise(r=>setTimeout(r,1200));}
const meta={market:'US',asof:raw.asof,checkedAt:new Date().toISOString(),profileAsOf:today,financialPeriod:'最新TTM（最近十二个月）',previousPeriod:'上年同期TTM',annualYears:[],calendar,total:stocks.length,classification:'纳斯达克官方行业分类；证券观察池为SPY股票持仓与纳斯达克100的去重合集',priceBasis:'Yahoo Finance股息与拆股调整收盘序列，美元计价',sources:[{label:'纳斯达克行业与公司资料',url:'https://www.nasdaq.com/market-activity/stocks/screener'},{label:'Yahoo Finance财务及行情',url:'https://finance.yahoo.com/'},...raw.universeSources]};
for(const g of Object.values(groups))fs.writeFileSync(`${dest}/${g.id}.json`,JSON.stringify({...meta,...g}));
fs.writeFileSync(`${dest}/index.json`,JSON.stringify({...meta,stocks,industries:Object.values(groups).map(({stocks,...g})=>({...g,count:stocks.length}))}));
console.log('US peers',stocks.length,Object.keys(groups).length,'industries; refreshed seeds',fetched);
