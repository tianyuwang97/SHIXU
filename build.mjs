import {buildHeaderDemo,buildHomeIsland} from './header-demo-build.mjs';
import {build} from 'esbuild';
import fs from 'node:fs';
import {buildSiteIcons} from './site-icons-build.mjs';
import {companies} from './company-data.mjs';
import {extendScreener} from './screener-build.mjs';
import {buildStockPicks,stockPick} from './stock-picks-core.mjs';
import {publicPicks} from './stock-rule-access.mjs';
import {buildStockExits,buildFundExits} from './stock-exits-core.mjs';
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/client',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
fs.writeFileSync('dist/client/funds.html',extendScreener(fs.readFileSync('dist/index.html','utf8')));
const daily=JSON.parse(fs.readFileSync('dist/index.html','utf8').match(/<script id="dataset" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const {asof,history_start,max_calendar_days,calendar_offsets,last_checked_at}=daily.context;
fs.writeFileSync('dist/client/compare-data.json',JSON.stringify({context:{asof,history_start,max_calendar_days,calendar_offsets,last_checked_at},rows:daily.rows.map(({code,name,type,history,holdings})=>({code,name,type,history,holdings}))}));
fs.writeFileSync('dist/client/portfolio-funds.json',JSON.stringify({context:{asof},rows:daily.rows.map(({code,name,type})=>({code,name,type}))}));
for(const f of ['portfolio.html','portfolio.css'])fs.copyFileSync(f,'dist/client/'+f);
await build({entryPoints:['portfolio.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/client/portfolio.js'});
for(const f of ['compare.html','compare.css','compare-profiles.json'])fs.copyFileSync(f,'dist/client/'+f);
await build({entryPoints:['compare.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/client/compare.js'});
for(const f of ['companies.html','companies.css'])fs.copyFileSync(f,'dist/client/'+f);
await build({entryPoints:['companies.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/client/companies.js'});
await build({entryPoints:['sector-board.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/client/sector-board.js'});
const sector=JSON.parse(fs.readFileSync('sector-data.json','utf8'));
fs.writeFileSync('dist/client/sector-data.json',JSON.stringify({...sector,dailyAsOf:asof}));
const companyProducts=Object.fromEntries(companies.flatMap(c=>c.products.map(code=>{const r=daily.rows.find(r=>r.code===code);if(!r||!r.name.startsWith(c.short))throw Error('Company example is missing or mismatched: '+code);return [code,{name:r.name,type:r.type}];})));
fs.writeFileSync('dist/client/company-products.json',JSON.stringify(companyProducts));
fs.copyFileSync('dist/site-tools.js','dist/client/site-tools.js');
fs.copyFileSync('simulation/home.html','dist/client/index.html');
for(const f of ['login.html','login.css','login.js','coin-dollar.png'])fs.copyFileSync(f,'dist/client/'+f);
fs.copyFileSync('market-indices.css','dist/client/market-indices.css');
await build({entryPoints:['market-indices.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/client/market-indices.js'});
{let home=fs.readFileSync('dist/client/index.html','utf8');home=home.replace('<main class="market-shell">','<main class="market-shell">'+'<section class="index-overview" aria-labelledby="indexOverviewTitle"><header class="index-heading"><h2 id="indexOverviewTitle">市场概览 <span>MARKET PULSE</span></h2><div><p id="indexUpdate" role="status">正在获取行情…</p><button id="indexRefresh" type="button">刷新</button></div></header><div id="indexCards" class="index-grid"></div><p class="index-footnote">指数点位 · 涨跌幅相对前收盘 · 可能延迟 · 红涨绿跌 · 小图为近30自然日日线</p></section>').replace('</head>','<link rel="stylesheet" href="/market-indices.css"></head>').replace('</body>','<dialog id="indexDialog" aria-labelledby="indexDialogTitle"><header><h2 id="indexDialogTitle">指数走势</h2><button id="indexDialogClose" type="button" aria-label="关闭指数走势">×</button></header><div id="indexDetail"></div></dialog>'+'<script id="indexSnapshot" type="application/json">'+fs.readFileSync('market-indices-snapshot.json','utf8').replaceAll('<','\\u003c')+'</script><script type="module" src="/market-indices.js"></script></body>');fs.writeFileSync('dist/client/index.html',home);}

for(const f of ['motion-demo.html','motion-demo.css','motion-demo.js','motion-scroll.js','motion-coin.js','gold-coin-flat.png','coin-fund.png','coin-cn.png','coin-us.png','coin-hk.png'])fs.copyFileSync(f,'dist/client/'+f);
await build({entryPoints:['motion-smooth.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/client/motion-smooth.js',minify:true});
fs.copyFileSync('home-picks.css','dist/client/home-picks.css');
await build({entryPoints:['home-picks.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/client/home-picks.js'});
const privatePicks={};
const privateExits={};
for(const [market,prefix] of [['CN',''],['US','us-'],['HK','hk-']]){
 const raw=JSON.parse(fs.readFileSync(prefix+'stock-picks-raw.json','utf8'));
 const snapshot=buildStockPicks(raw,asof);
 privateExits[market]=buildStockExits(raw);
 privatePicks[market]=snapshot;
 fs.writeFileSync('dist/client/'+prefix+'stock-picks.json',JSON.stringify(publicPicks(snapshot)));
}
fs.mkdirSync('.generated',{recursive:true});
privateExits.FUND=buildFundExits(daily);
fs.writeFileSync('.generated/stock-picks.json',JSON.stringify(privatePicks));
fs.writeFileSync('.generated/stock-exits.json',JSON.stringify(privateExits));
for(const f of ['exit-mode.css','stone-portal.png','stone-portal-open.png','mystery-mark.svg'])fs.copyFileSync(f,'dist/client/'+f);
for(const f of ['stock-peers.html','stock-peers.css'])fs.copyFileSync(f,'dist/client/'+f);
await build({entryPoints:['stock-peers.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/client/stock-peers.js'});
for(const peerRoot of ['stock-peer-data','us-peer-data','hk-peer-data']){
const peerIndex=JSON.parse(fs.readFileSync(peerRoot+'/index.json','utf8'));
const ruleStart=new Date(Date.parse(peerIndex.asof+'T00:00:00Z')-179*86400000).toISOString().slice(0,10);
const ruleCalendar=peerIndex.calendar.filter(d=>d>=ruleStart);
fs.mkdirSync('dist/client/'+peerRoot,{recursive:true});
fs.writeFileSync('dist/client/'+peerRoot+'/index.json',JSON.stringify({...peerIndex,dailyAsOf:asof}));
for(const industry of peerIndex.industries){
 const group=JSON.parse(fs.readFileSync(peerRoot+'/'+industry.id+'.json','utf8'));
 if(group.asof!==peerIndex.asof||group.stocks.length!==industry.count)throw Error('Peer snapshot mismatch: '+industry.id);
 for(const s of group.stocks){
  const rule=stockPick({...s,points:s.points.filter(p=>p[0]>=ruleStart)},{asof:peerIndex.asof,historyStart:ruleStart,calendar:ruleCalendar});
  s.screen={range:rule.error?null:rule.rule1,breakout:rule.error||!rule.signal?.known?null:rule.rule2};
 }
 fs.writeFileSync('dist/client/'+peerRoot+'/'+industry.id+'.json',JSON.stringify({...group,dailyAsOf:asof}));
}
}
fs.copyFileSync('simulation/stocks.html','dist/client/stocks.html');
for(const f of ['index.html','sim.css','sim.js'])fs.copyFileSync('simulation/'+f,'dist/client/'+(f==='index.html'?'simulation.html':f));
await build({entryPoints:['simulation/sim.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/client/sim.js'});
await build({entryPoints:['simulation/stocks.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/client/stocks.js'});
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});
for(const f of ['home-motion.css','home-motion.js','site-motion-ui.css','brand.css'])fs.copyFileSync(f,'dist/client/'+f);
await build({entryPoints:['site-motion.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/client/site-motion.js',minify:true});
for(const page of ['index.html','funds.html','compare.html','companies.html','stock-peers.html','simulation.html','stocks.html','portfolio.html']){
 const path='dist/client/'+page;
 let html=fs.readFileSync(path,'utf8');
 const styles='<link rel="stylesheet" href="/brand.css"><link rel="stylesheet" href="/site-motion.css"><link rel="stylesheet" href="/site-motion-ui.css">';
 html=html.includes('</head>')?html.replace('</head>',styles+'</head>'):html.replace('</style>','</style>'+styles);
 const end=html.includes('</body>')?'</body>':'</html>';
 html=html.replace(end,'<script type="module" src="/site-motion.js"></script>'+end);
 fs.writeFileSync(path,html);
}
buildHeaderDemo();
buildHomeIsland();
await build({entryPoints:['research-dock.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/client/research-dock.js'});
fs.copyFileSync('research-dock.css','dist/client/research-dock.css');
for(const page of ['index.html','funds.html','compare.html','companies.html','stock-peers.html','simulation.html','stocks.html','portfolio.html']){
 const path='dist/client/'+page;let html=fs.readFileSync(path,'utf8');
 const css='<link rel="stylesheet" href="/research-dock.css">';
 html=html.includes('</head>')?html.replace('</head>',css+'</head>'):html.replace('</style>','</style>'+css);
 if(!['simulation.html','stocks.html'].includes(page)){const end=html.includes('</body>')?'</body>':'</html>';html=html.replace(end,'<script type="module" src="/research-dock.js"></script>'+end);}
 fs.writeFileSync(path,html);
}
buildSiteIcons();
await build({entryPoints:['worker.mjs'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/server/index.js',minify:true});
console.log('Built historical rehearsal Worker and preserved fund screener');
