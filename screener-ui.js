const D=JSON.parse(document.getElementById('dataset').textContent),$=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let page=1,filtered=[],calculated=[],activeDays=30;const size=60,valid=r=>typeof r.amplitude==='number',pct=x=>typeof x==='number'?(x*100).toFixed(2)+'%':'—',periodCache=new Map();
let activeAmp=.1,activeChangeMin=-.05,activeChangeMax=.05;
let activeMode='both',activeBreakoutStage='confirmed',activeRules=['rule1','rule2'];
let historyTimer,scopeTimer,historyScopeKey='',historyScope=[],historyAutoAllowed=false;
const longMetricCache=new Map();
function longMetric(row,days){const entry=historyStore.entries.get(row.code),cached=longMetricCache.get(row.code);if(cached&&cached.entry===entry&&cached.days===days)return cached.value;const value=screeningLongWindow(row,entry,D.context.asof,days,calculateCalendarWindow);longMetricCache.set(row.code,{entry,days,value});return value;}
const historyStore=new ScreenerHistoryStore(D.context.asof,{changed:()=>{clearTimeout(historyTimer);historyTimer=setTimeout(()=>update(true),250)}});
$('customDays').max=SCREEN_MAX_DAYS;
$('days').value='30';$('customDays').value=30;
$('customDaysLabel').firstChild.textContent='自然日天数（2—360）';
for(const [value,label] of [[90,'最近90天'],[180,'最近180天'],[360,'最近360天']])if(!$('days').querySelector(`option[value="${value}"]`)){const option=document.createElement('option');option.value=value;option.textContent=label;$('days').insertBefore(option,$('days').querySelector('option[value="custom"]'));}
const historyPanel=document.createElement('div');historyPanel.id='longHistoryPanel';historyPanel.hidden=true;historyPanel.className='history-progress';historyPanel.innerHTML='<p id="longHistoryStatus" role="status"></p><div class="history-actions"><button id="loadLongHistory">加载当前范围历史</button><button id="pauseLongHistory" hidden>暂停加载</button><button id="retryLongHistory" hidden>重试失败项</button></div>';$('customDaysLabel').closest('.filters').after(historyPanel);
function syncHistoryScope(rows,days){
 historyScope=rows;const key=days>D.context.max_calendar_days?$('search').value.trim().toLowerCase()+'|'+$('type').value:'short';
 if(key!==historyScopeKey){historyStore.stop();clearTimeout(scopeTimer);historyScopeKey=key;historyAutoAllowed=key!=='short'&&rows.length>0&&rows.length<=20;
  if(historyAutoAllowed&&location.protocol!=='file:')scopeTimer=setTimeout(()=>{historyAutoAllowed=false;historyStore.run(historyScope.map(r=>r.code));},450);
 }
 historyPanel.hidden=key==='short';if(historyPanel.hidden)return;
 const ready=rows.filter(r=>historyStore.entries.get(r.code)?.phase==='ready').length,failed=rows.filter(r=>historyStore.entries.get(r.code)?.phase==='error').length;
 $('longHistoryStatus').textContent=location.protocol==='file:'?'超过30天的期间需要联网读取历史净值，请在网站中打开基金筛选。':`${days}自然日 · 当前范围${rows.length.toLocaleString()}只 · 已取得${ready.toLocaleString()}只历史 · 加载失败${failed}只 · ${historyStore.running?'正在逐只加载，结果会陆续更新':ready+failed===rows.length?'本轮加载结束':rows.length>20?'点击加载，或搜索名称/代码缩小范围':'等待加载'}。尚未加载及加载失败的净值不作为横盘不符合；规则二将按所选期间的前半段重新计算固定区间。`;
 $('loadLongHistory').hidden=historyStore.running||ready+failed===rows.length;$('loadLongHistory').disabled=location.protocol==='file:';
 $('pauseLongHistory').hidden=!historyStore.running;$('retryLongHistory').hidden=historyStore.running||failed===0;
}
$('loadLongHistory').onclick=()=>{clearTimeout(scopeTimer);historyStore.run(historyScope.map(r=>r.code));};
$('pauseLongHistory').onclick=()=>{clearTimeout(scopeTimer);historyStore.stop();update(true);};
$('retryLongHistory').onclick=()=>{clearTimeout(scopeTimer);historyStore.run(historyScope.filter(r=>historyStore.entries.get(r.code)?.phase==='error').map(r=>r.code),{retry:true});};
const dateAt=i=>new Date(Date.parse(D.context.history_start+'T00:00:00Z')+i*86400000).toISOString().slice(0,10);
if($('updateStatus')){
 const checked=D.context.last_checked_at?new Intl.DateTimeFormat('zh-CN',{timeZone:'Europe/Paris',dateStyle:'short',timeStyle:'short'}).format(new Date(D.context.last_checked_at))+'（巴黎时间）':'尚未配置';
 $('updateStatus').textContent=`${D.context.schedule_note||'每日更新待配置'} · 最近检查：${checked} · ${D.context.last_check_status||'当前为已保存快照'}`;
}
[...new Set(D.rows.map(r=>r.type))].sort().forEach(t=>{let o=document.createElement('option');o.value=t;o.textContent=t;$('type').append(o)});
$('coverage').textContent=`基金代码目录含 ${D.context.universe_count.toLocaleString()} 条记录；本次开放式净值列表返回 ${D.context.daily_count.toLocaleString()} 条。排除 ${D.context.excluded.length} 条货币型、场内ETF或封闭式记录后，对 ${D.rows.length.toLocaleString()} 个份额进行筛选。已保存${D.context.history_start}—${D.context.asof}的历史净值，此快照支持2—${D.context.max_calendar_days}自然日；网站可按当前搜索及类型范围加载历史，扩展到360自然日。未加载与获取失败不会冒充完整结果。`;
function rule1State(r){return valid(r)?(r.amplitude<=activeAmp+1e-12&&r.change>=activeChangeMin-1e-12&&r.change<=activeChangeMax+1e-12?'符合':'不符合'):'数据待核实'}
function rule2State(r){
 const b=r.breakout;if(!b?.known)return '数据待核实';
 return (activeBreakoutStage==='newBuy'?b.newBuy:b.phase===activeBreakoutStage)?'符合':'不符合';
}
function state(r){
 if(!activeRules.length)return '未选择规则';
 const states=RULES.filter(rule=>activeRules.includes(rule.id)).map(rule=>rule.evaluate(r));
 return states.includes('不符合')?'不符合':states.includes('数据待核实')?'数据待核实':'符合';
}
const breakoutLabels={watch:'观察中 · 未突破',pending:'首次突破 · 待第二点确认',confirmed:'已确认突破 · 买入信号',exited:'跌回原区间 · 退出／复核',failed:'突破未确认',unknown:'数据待核实'};
function breakoutSummary(r){
 const b=r.breakout;if(!b)return '<div class="rule-meta">规则二：数据待核实</div>';
 const box=b.box;
 return `<div class="rule-meta"><strong>规则二：${esc(breakoutLabels[b.phase]||'数据待核实')}</strong>${b.reason?'<div>'+esc(b.reason)+'</div>':''}${box?`<div>固定区间 ${esc(box.rangeStart)}—${esc(box.rangeEnd)}</div><div>区间上沿 ${pct(box.upper/box.base-1)} · 下沿 ${pct(box.lower/box.base-1)}<br>（区间首个调整后净值＝0%）</div><div>首破 ${esc(box.firstBreakDate||'尚未形成')}${box.confirmDate?' · 确认 '+esc(box.confirmDate):''}${box.exitDate?'<br>退出／复核 '+esc(box.exitDate):''}${box.failedDate?' · 未确认 '+esc(box.failedDate):''}</div>`:''}</div>`;
}
// Add future rules here: one card, evaluator and detail renderer; combinations use the selected IDs.
const RULES=[
 {id:'rule1',number:'01',name:'横盘筛选',short:'横盘',description:'在所选自然日期间内，限制振幅和首尾涨跌幅。',evaluate:rule1State,
  settings:`<label>振幅上限 %<input id="amp" type="number" min="0" max="1000" step="0.5" value="10"></label><label>首尾涨跌幅最低 %<input id="changeMin" type="number" step="any" value="-5" placeholder="不限"></label><label>首尾涨跌幅最高 %<input id="changeMax" type="number" step="any" value="5" placeholder="不限"></label><p class="rule-help" id="changeHelp">使用下方选择的自然日期间。涨跌幅含上下限，留空表示该侧不限。</p>`,
  detail:r=>`<p class="rule-meta">期间 ${esc(r.windowStart)}—${esc(r.windowEnd)}<br>振幅 ${pct(r.amplitude)} / 上限 ${pct(activeAmp)}<br>首尾涨跌幅 ${pct(r.change)} / 范围 ${Number.isFinite(activeChangeMin)?pct(activeChangeMin):'不限'} 至 ${Number.isFinite(activeChangeMax)?pct(activeChangeMax):'不限'}${r.reason?'<br>'+esc(r.reason):''}</p>`},
 {id:'rule2',number:'02',name:'横盘后突破',short:'突破',description:'以所选期间前半段固定横盘上下沿，后半段连续两个净值披露点突破上沿。',evaluate:rule2State,
  settings:`<label>信号阶段<select id="breakoutStage"><option value="confirmed">已确认突破</option><option value="newBuy">本次新确认的买入信号</option><option value="pending">首次突破，等待确认</option><option value="exited">跌回原区间，退出／复核</option></select></label><p class="rule-help">前半段天数为R01期间的一半（奇数向下取整），横盘振幅≤10%、涨跌幅±5%。上下沿在前半段结束时固定；仅后半段确认突破，确认后跌回上沿或更低即失效。30天对应前15天，60天对应前30天。</p>`,detail:breakoutSummary}
];
$('rulesGrid').innerHTML=RULES.map(rule=>`<article class="rule-card" id="card_${rule.id}"><div class="rule-top"><label class="rule-select"><input type="checkbox" id="enable_${rule.id}" data-rule="${rule.id}" checked aria-label="启用${rule.name}"><span><span class="rule-number">规则 ${rule.number}</span>${rule.name}</span></label><span class="rule-count" id="ruleCount_${rule.id}"></span></div><p id="ruleBrief_${rule.id}">${rule.description}</p><details><summary>${rule.name} · 参数与说明</summary><div class="rule-settings">${rule.settings}</div></details></article>`).join('');
function selectRules(ids){RULES.forEach(rule=>$('enable_'+rule.id).checked=ids.includes(rule.id))}
const statusClass=value=>value==='符合'?'pass':value==='不符合'?'fail':'unknown';
function ruleBadges(r){return `<span class="pill ${statusClass(state(r))}">${esc(state(r))}</span><div class="rule-tags">${RULES.filter(rule=>activeRules.includes(rule.id)).map(rule=>`<span class="rule-tag ${statusClass(rule.evaluate(r))}">${rule.short} · ${rule.id==='rule2'&&r.breakout?.known?esc(({confirmed:'已确认',pending:'待确认',exited:'退出复核',failed:'未确认',watch:'未突破'})[r.breakout.phase]):esc(rule.evaluate(r))}</span>`).join('')}</div>`}
function update(keepPage=false){
 const previousPage=page;
 const selected=RULES.filter(rule=>$('enable_'+rule.id).checked).map(rule=>rule.id),usesRule1=selected.includes('rule1'),mode=selected.length>1?'both':selected[0]||'none',stage=$('breakoutStage').value;
 RULES.forEach(rule=>$('card_'+rule.id).classList.toggle('selected',selected.includes(rule.id)));
 ['amp','changeMin','changeMax'].forEach(id=>$(id).disabled=!usesRule1);
 $('breakoutStage').disabled=!selected.includes('rule2');
 const custom=$('days').value==='custom',days=Number(custom?$('customDays').value:$('days').value);
 $('customDaysLabel').hidden=!custom;
 if(!Number.isInteger(days)||days<2||days>SCREEN_MAX_DAYS){$('periodError').textContent=`请输入2—${SCREEN_MAX_DAYS}之间的整数。当前仍显示已应用的${activeDays}自然日结果。`;return}
 const amp=Number($('amp').value),minText=$('changeMin').value.trim(),maxText=$('changeMax').value.trim(),min=minText===''?-Infinity:Number(minText),max=maxText===''?Infinity:Number(maxText);
 if(usesRule1){
  if($('amp').value.trim()===''||!Number.isFinite(amp)||amp<0||amp>1000||$('amp').validity.badInput){$('periodError').textContent='振幅上限请输入0—1000之间的数值。列表保留上一次有效筛选结果。';return}
  if($('changeMin').validity.badInput||$('changeMax').validity.badInput||(minText!==''&&!Number.isFinite(min))||(maxText!==''&&!Number.isFinite(max))){$('periodError').textContent='首尾涨跌幅请输入有效数字，留空表示该侧不限。列表保留上一次有效筛选结果。';return}
  if(min>max){$('periodError').textContent='首尾涨跌幅最低值不能高于最高值。列表保留上一次有效筛选结果。';return}
  activeAmp=amp/100;activeChangeMin=min/100;activeChangeMax=max/100;
 }
 $('periodError').textContent='';activeDays=days;activeMode=mode;activeBreakoutStage=stage;activeRules=selected;
 const q=$('search').value.trim().toLowerCase(),type=$('type').value,st=$('status').value;
 const inScope=r=>(!q||(r.code+' '+r.name).toLowerCase().includes(q))&&(!type||(type==='__equity'?/股票|混合型-偏股/.test(r.type):r.type===type));
 const sourceRows=D.rows.filter(inScope);syncHistoryScope(sourceRows,days);
 if(days>D.context.max_calendar_days){calculated=sourceRows.map(r=>longMetric(r,days));}
 else{
  if(!periodCache.has(days)){periodCache.set(days,D.rows.map(r=>calculateCalendarWindow(r,D.context,days)));if(periodCache.size>4)periodCache.delete(periodCache.keys().next().value);}
  calculated=periodCache.get(days);
 }
 const scoped=calculated.filter(inScope);
 $('nall').textContent=scoped.length.toLocaleString();$('nmatch').textContent=scoped.filter(r=>state(r)==='符合').length.toLocaleString();$('nfail').textContent=scoped.filter(r=>state(r)==='不符合').length.toLocaleString();$('nunknown').textContent=scoped.filter(r=>state(r)==='数据待核实').length.toLocaleString();
 RULES.forEach(rule=>$('ruleCount_'+rule.id).textContent=scoped.filter(r=>rule.evaluate(r)==='符合').length.toLocaleString()+' 个符合');
 filtered=activeRules.length?scoped.filter(r=>st==='全部'||state(r)===st):[];
 const sort=$('sort').value;filtered.sort((a,b)=>{
  if(sort==='code')return a.code.localeCompare(b.code);
  const av=sort==='amplitude'?a.amplitude:a.change,bv=sort==='amplitude'?b.amplitude:b.change;
  if(!Number.isFinite(av)||!Number.isFinite(bv))return Number(Number.isFinite(bv))-Number(Number.isFinite(av))||a.code.localeCompare(b.code);
  return (sort==='changeDesc'?bv-av:sort==='abschange'?Math.abs(av)-Math.abs(bv):av-bv)||a.code.localeCompare(b.code);
 });
 const start=screeningStart(D.context.asof,days),longContext=days>D.context.max_calendar_days?sourceRows.map(r=>historyStore.entries.get(r.code)?.data?.context).find(Boolean):null,calendarContext=longContext||(days<=D.context.max_calendar_days?D.context:null),requiredDates=calendarContext?calendarContext.calendar_offsets.map(i=>new Date(Date.parse(calendarContext.history_start+'T00:00:00Z')+i*86400000).toISOString().slice(0,10)).filter(d=>d>=start):[],expected=calendarContext?requiredDates.length:'待加载';
 const rangeLabel=min===-Infinity?(max===Infinity?'不限':`≤ ${max}%`):(max===Infinity?`≥ ${min}%`:`${min}% 至 ${max}%`);
 $('heading').textContent='基金筛选';
 $('ruleBrief_rule1').textContent=`${days}个自然日 · 振幅≤${activeAmp*100}% · 首尾涨跌幅 ${Number.isFinite(activeChangeMin)?(activeChangeMin*100).toFixed(1)+'%':'不限'} 至 ${Number.isFinite(activeChangeMax)?(activeChangeMax*100).toFixed(1)+'%':'不限'}`;
 $('ruleBrief_rule2').textContent=`前${Math.floor(days/2)}自然日固定横盘区间 → 后${days-Math.floor(days/2)}自然日两个披露点确认 · ${$('breakoutStage').selectedOptions[0].textContent}`;
 const names=RULES.filter(rule=>activeRules.includes(rule.id)).map(rule=>rule.name);
 $('ruleExplanation').textContent=names.length?`已启用 ${names.length} 条：${names.join(' ＋ ')}${names.length>1?' · 全部满足（取交集）':''}。每张卡片的数量为该规则在当前基金范围内的独立匹配数。`:'请至少勾选一条规则，开始筛选。';
 $('period').textContent=`净值截止 ${D.context.asof} · 展示 ${days} 个自然日 / ${expected} 个净值披露日`;
 $('chartHeading').textContent=`${days}自然日走势 · 相对首个净值`;
 $('dates').textContent=calendarContext?requiredDates.join('、'):'历史披露日历待加载';
 page=keepPage===true?Math.min(previousPage,Math.max(1,Math.ceil(filtered.length/size))):1;render();
}
function sparkline(r){
 if(!valid(r))return '<div class="muted small">'+esc(r.reason||'数据待核实，暂无完整走势')+'</div>';
 const values=r.series.map(v=>(v-1)*100),extent=Math.max(10,Math.ceil((Math.max(...values.map(Math.abs))-1e-9)/10)*10),first=Date.parse(r.windowStart),span=(r.periodDays-1)*86400000,x=i=>34+(Date.parse(r.dates[i])-first)*184/span,y=v=>40-v/extent*30;
 const points=values.map((v,i)=>`${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' '),color=r.change>=0?'#a34438':'#267269';
 return `<svg class="sparkline" viewBox="0 0 224 92" role="img" aria-label="${esc(r.name)}最近${r.periodDays}个自然日走势，${r.pointCount}个净值观察点，首尾涨跌${pct(r.change)}，纵轴正负${extent}%"><title>${esc(r.name)} · ${r.periodDays}自然日 · ${r.pointCount}个净值点 · 纵轴±${extent}%</title><path d="M34 10H218 M34 70H218" stroke="#e7edf2" fill="none"/><path d="M34 40H218" stroke="#bccbd6" stroke-dasharray="3 3"/><g fill="#6b7a8b" font-size="9"><text x="0" y="13">+${extent}%</text><text x="13" y="43">0%</text><text x="0" y="73">−${extent}%</text><text x="34" y="88">${r.windowStart.slice(5)}</text><text x="218" y="88" text-anchor="end">${r.windowEnd.slice(5)}</text></g><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="${i===values.length-1?2.5:1.5}" fill="${color}"><title>${r.dates[i]}：${v>=0?'+':''}${v.toFixed(2)}%</title></circle>`).join('')}</svg>`;
}
function holdingsSummary(r){
 if(!/股票/.test(r.type))return '';
 const h=r.holdings,linked=/联接/.test(r.name);
 const source=h?.source||`https://fundf10.eastmoney.com/ccmx_${r.code}.html`;
 if(!h?.items?.length)return `<div class="holdings muted">${!h||h.status==='error'?'持仓暂未取得，待更新':'源站暂无股票持仓数据'}${linked?' · 联接基金未穿透目标ETF':''}<div class="holding-meta"><a href="${esc(source)}" target="_blank" rel="noopener">持仓来源</a></div></div>`;
 return `<div class="holdings"><div class="holdings-label">主要股票 · 占基金净值</div>${h.items.slice(0,3).map(s=>`<div class="holding-item"><span>${esc(s.name)}</span><span class="holding-weight">${typeof s.weight==='number'?s.weight.toFixed(2)+'%':'未披露'}</span></div>`).join('')}<div class="holding-meta"><a href="${esc(source)}" target="_blank" rel="noopener">报告期 ${esc(h.date)}</a> · 非实时${h.status==='error'?' · 更新失败，保留旧披露':''}${linked?'<br>仅直接持股，未穿透目标ETF':''}</div></div>`;
}
function render(){
 const total=Math.max(1,Math.ceil(filtered.length/size));$('count').textContent=`当前条件：${filtered.length.toLocaleString()} 个份额。直接展示${activeDays}个自然日期间内实际披露的净值走势；横轴按自然日期间距绘制，周末不补点。纵轴默认±10%，超出时自动扩展。`;
 $('page').textContent=`第 ${page} / ${total} 页`;$('prev').disabled=page<=1;$('next').disabled=page>=total;
 $('body').innerHTML=filtered.slice((page-1)*size,page*size).map(r=>`<tr><td><div class="fund-name">${esc(r.name)}</div><div class="fund-meta">${esc(r.code)} · ${esc(r.type)}</div>${holdingsSummary(r)}</td><td class="num" data-label="区间振幅">${pct(r.amplitude)}</td><td class="num" data-label="首尾涨跌幅">${pct(r.change)}</td><td class="rule-cell">${ruleBadges(r)}</td><td class="spark-cell">${sparkline(r)}</td><td><div class="row-actions"><button class="detail-link" data-code="${r.code}">判断依据</button><a href="${esc(r.source)}" target="_blank" rel="noopener">净值来源</a><span class="small muted">${esc(r.subscription||'—')}</span></div></td></tr>`).join('');
 if(!filtered.length)$('body').innerHTML=`<tr><td colspan="6" class="empty">${activeRules.length?(activeDays>D.context.max_calendar_days&&historyScope.some(r=>historyStore.entries.get(r.code)?.phase!=='ready')?'当前已取得数据中暂无匹配；仍有历史待加载或加载失败，请查看上方进度。':'没有匹配记录，可调整所选规则或筛选条件。'):'请在上方勾选至少一条规则。'}</td></tr>`;

}
['search','type','status','amp','changeMin','changeMax','sort','days','customDays','breakoutStage',...RULES.map(rule=>'enable_'+rule.id)].forEach(id=>$(id).addEventListener('input',()=>update()));
$('prev').onclick=()=>{page--;render()};$('next').onclick=()=>{page++;render()};
$('reset').onclick=()=>{selectRules(['rule1','rule2']);$('breakoutStage').value='confirmed';$('days').value='30';$('customDays').value=30;$('amp').value=10;$('changeMin').value=-5;$('changeMax').value=5;$('search').value='';$('type').value='';$('status').value='符合';$('sort').value='changeDesc';update()};
$('body').onclick=e=>{
 const code=e.target.dataset.code;if(!code)return;const r=calculated.find(r=>r.code===code);
 $('detailTitle').textContent=r.code+' '+r.name;
 $('detailInfo').textContent=valid(r)?`${r.windowStart}—${r.windowEnd} · ${r.periodDays}个自然日 / ${r.pointCount}个净值点 · 实际首尾净值日${r.dates[0]}—${r.dates.at(-1)} · 振幅${pct(r.amplitude)} · 涨跌幅${pct(r.change)} · 分红调整${r.dividends}次`:`${r.windowStart}—${r.windowEnd} · ${r.reason||'净值数据待核实'}`;
 $('breakoutDetail').innerHTML=RULES.map(rule=>`<article class="detail-rule"><div class="detail-rule-heading"><strong>规则 ${rule.number} · ${rule.name}</strong><span class="pill ${statusClass(rule.evaluate(r))}">${esc(rule.evaluate(r))} · ${activeRules.includes(rule.id)?'已启用':'未参与筛选'}</span></div>${rule.detail(r)}</article>`).join('');
 if(!valid(r)){$('chart').innerHTML='';$('detailRows').innerHTML='<tr><td colspan="2">净值数据待核实，暂无完整走势。</td></tr>';$('detail').showModal();return}
 $('detailRows').innerHTML=r.dates.map((d,i)=>'<tr><td>'+d+'</td><td>'+r.series[i].toFixed(6)+'</td></tr>').join('');
 const lo=Math.min(...r.series),hi=Math.max(...r.series),span=Math.max(hi-lo,.001),first=Date.parse(r.windowStart),pts=r.series.map((v,i)=>`${20+(Date.parse(r.dates[i])-first)*660/((r.periodDays-1)*86400000)},${155-(v-lo)*125/span}`).join(' ');
 $('chart').innerHTML=`<line x1="20" y1="155" x2="680" y2="155" stroke="#dce3e9"/><polyline fill="none" stroke="#267269" stroke-width="3" points="${pts}"/><text x="20" y="177" fill="#667589" font-size="12">${r.windowStart}</text><text x="610" y="177" fill="#667589" font-size="12">${r.windowEnd}</text>`;
 $('detail').showModal();
};$('close').onclick=()=>$('detail').close();update();
