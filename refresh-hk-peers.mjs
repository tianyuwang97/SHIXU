import fs from 'node:fs';
import {getHKPeerDetails} from './hk-peer-provider.mjs';
const cache='../hk-peer-cache',dest='hk-peer-data',today=new Date().toISOString().slice(0,10);fs.mkdirSync(dest,{recursive:true});
const prepared=JSON.parse(fs.readFileSync(cache+'/prepared.json','utf8'));
if(prepared.profileAsOf!==today)throw Error('HK metadata must be refreshed before histories');
const calendarFile=`${cache}/calendar-${today}.json`;let body;
if(fs.existsSync(calendarFile))body=JSON.parse(fs.readFileSync(calendarFile));else{const r=await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EHSI?range=2y&interval=1d',{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('HK calendar unavailable');body=await r.json();fs.writeFileSync(calendarFile,JSON.stringify(body));}
const b=body.chart?.result?.[0],m=b?.meta;if(m?.symbol!=='^HSI'||m.currency!=='HKD'||m.instrumentType!=='INDEX'||m.exchangeTimezoneName!=='Asia/Hong_Kong')throw Error('HK calendar identity mismatch');
const format=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Hong_Kong',year:'numeric',month:'2-digit',day:'2-digit'}),session=format.format(new Date(m.currentTradingPeriod.regular.start*1000));
const all=b.timestamp.filter((t,i)=>b.indicators.quote[0].close[i]>0&&(format.format(new Date(t*1000))<session||Date.now()>=m.currentTradingPeriod.regular.end*1000+1800000)).map(t=>format.format(new Date(t*1000)));
const asof=all.at(-1),start=new Date(Date.parse(asof)-369*86400000).toISOString().slice(0,10),calendar=all.filter(d=>d>=start);
if(calendar.length<235||Date.now()-Date.parse(asof)>7*86400000)throw Error('HK calendar incomplete/stale');
const seeds=new Set(['00700','09988','03690','01024','09888','09618','09999','00005','00939','01398','03988','02318']);
for(const g of prepared.groups)for(const s of g.stocks){const file=`${cache}/${s.code}-${asof}-${today}.json`;if(fs.existsSync(file))Object.assign(s,JSON.parse(fs.readFileSync(file)));else if(seeds.has(s.code)){const value=await getHKPeerDetails(s.code,asof);Object.assign(s,value);fs.writeFileSync(file,JSON.stringify(value));console.log('HK seed',s.code,value.points.length,value.finance?.currency,value.detailsErrors.join(';'));}}
const meta={market:'HK',asof,checkedAt:new Date().toISOString(),profileAsOf:today,universeAsOf:prepared.universeAsOf,unclassified:prepared.unclassified,financialPeriod:'最新TTM（最近十二个月）',previousPeriod:'最近两个完整财年',annualYears:[],calendar,total:prepared.stocks.length,classification:'港交所港币主板及GEM普通股名单，行业采用东方财富公司资料',priceBasis:'Yahoo Finance股息与拆股调整收盘序列，港币计价',sources:[{label:'港交所官方证券名单',url:'https://www.hkex.com.hk/Services/Trading/Securities/Securities-Lists?sc_lang=zh-HK'},{label:'东方财富港股公司资料',url:'https://emweb.securities.eastmoney.com/PC_HKF10/pages/home/index.html'},{label:'Yahoo Finance财务与行情',url:'https://finance.yahoo.com/'},{label:'腾讯港股市值行情',url:'https://gu.qq.com/hk00700'}]};
for(const g of prepared.groups)fs.writeFileSync(`${dest}/${g.id}.json`,JSON.stringify({...meta,...g}));
fs.writeFileSync(`${dest}/index.json`,JSON.stringify({...meta,stocks:prepared.stocks,industries:prepared.groups.map(({stocks,...g})=>({...g,count:stocks.length}))}));
console.log('HK peers ready',prepared.stocks.length,'securities; asof',asof);
