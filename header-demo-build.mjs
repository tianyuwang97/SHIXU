import fs from 'node:fs';
const wordmark=`<span class="hd-name"><strong>时序</strong><span lang="en">SHIXU</span></span>`;
const motto=`<span class="hd-motto"><span>度时间，探秩序。</span><small lang="en">Measure Time. Explore Order.</small></span>`;
const nav=()=>`<nav class="hd-nav" aria-label="主要功能"><a data-hd-screen href="#stock-picks">筛选</a><a data-hd-compare href="/stock-peers.html?market=cn">对比</a><button class="hd-practice" data-hd-practice>演练 </button><a class="hd-login" href="/login">登录</a></nav>`;
const header=`<div class="header-demo-stage" id="headerDemoStage">
<header class="hd-header hd-classic" data-header-design="1"><div class="hd-inner"><a class="hd-brand" href="/" aria-label="时序 SHIXU 返回首页">${wordmark}${motto}</a>${nav()}</div></header>
<header class="hd-header hd-island" data-header-design="2" hidden><div class="hd-inner"><a class="hd-brand" href="/" aria-label="时序 SHIXU 返回首页">${wordmark}${motto}</a>${nav()}</div></header>
<header class="hd-header hd-editorial" data-header-design="3" hidden><div class="hd-inner"><a class="hd-brand" href="/" aria-label="时序 SHIXU 返回首页">${wordmark}</a>${nav()}</div><div class="hd-ribbon"><span>度时间，探秩序。</span><span lang="en">Measure Time. Explore Order.</span></div></header>
</div>`;
const controls=`<aside class="hd-switcher" aria-label="对比三种顶部设计"><div class="hd-switcher-copy"><span>顶部设计对比</span><p id="hdDescription" aria-live="polite">紧凑双语标识 · 下滚后收起标语</p></div><div class="hd-options" role="group" aria-label="选择设计"><button data-design="1" aria-pressed="true"><small>01</small> 精致品牌栏</button><button data-design="2" aria-pressed="false"><small>02</small> 悬浮导航岛</button><button data-design="3" aria-pressed="false"><small>03</small> 品牌与操作分层</button></div><button class="hd-top" id="hdTop" aria-label="回到顶部查看完整设计">↑ 顶部</button><a class="hd-exit" href="/">返回正式版</a></aside>
<dialog id="hdPracticeDialog"><button class="hd-dialog-close" id="hdClose" aria-label="关闭">×</button><span class="eyebrow">REHEARSAL</span><h2>选择一场历史演练</h2><p>用虚拟资金，练习自己的判断。</p><a href="/stocks.html">A股历史演练</a><a href="/simulation.html">基金历史演练</a></dialog>`;
export function buildHeaderDemo(){
 let html=fs.readFileSync('dist/client/index.html','utf8');
 html=html.replace('<title>时序 · 市场工作台</title>','<title>时序 · 三种顶部设计对比</title>').replace('<body>','<body class="header-demo" data-design="1">');
 const old=/<nav class="topbar home-topbar">[\s\S]*?<\/nav>/;
 if(!old.test(html))throw Error('Homepage header not found');
 html=html.replace(old,header).replace('</head>','<meta name="robots" content="noindex"><link rel="stylesheet" href="/header-demo.css"></head>').replace('</body>',controls+'<script type="module" src="/header-demo.js"></script></body>');
 fs.writeFileSync('dist/client/header-demo.html',html);
 for(const file of ['header-demo.css','header-demo.js'])fs.copyFileSync(file,'dist/client/'+file);
}

export function buildHomeIsland(){
 let html=fs.readFileSync('dist/client/index.html','utf8');
 const island=header.match(/<header class="hd-header hd-island"[\s\S]*?<\/header>/)[0].replace(' hidden','');
 const dialog=controls.match(/<dialog id="hdPracticeDialog">[\s\S]*?<\/dialog>/)[0];
 html=html.replace('<body>','<body class="header-demo home-island">').replace(/<nav class="topbar home-topbar">[\s\S]*?<\/nav>/,'<div class="header-demo-stage">'+island+'</div>');
 html=html.replace('</head>','<link rel="stylesheet" href="/header-demo.css"><link rel="stylesheet" href="/home-header.css"></head>').replace('</body>',dialog+'<script type="module" src="/home-header.js"></script></body>');
 fs.writeFileSync('dist/client/index.html',html);
 for(const file of ['home-header.css','home-header.js'])fs.copyFileSync(file,'dist/client/'+file);
}
