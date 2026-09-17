import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {evaluateFixedWindow} from './fixed-window-rules.cjs';
import {stockPick,buildStockPicks} from './stock-picks-core.mjs';
import {stockExit,buildStockExits,buildFundExits} from './stock-exits-core.mjs';
import {evaluateBreakout} from './stock-picks-breakout.cjs';
const date=i=>new Date(Date.UTC(2026,0,1+i)).toISOString().slice(0,10);
const make=(values,days=values.length)=>({row:{code:'TEST',history:values.map((v,i)=>[i,v])},context:{asof:date(values.length-1),history_start:date(0),dates:values.map((_,i)=>date(i)),periodDays:days}});
const run=(values,direction='up',days=values.length)=>{const {row,context}=make(values,days);return evaluateFixedWindow(row,context,direction).result;};
const sandbox=vm.createContext({});
vm.runInContext(['fixed-window-rules.cjs','screener-core.js','screener-history.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n'),sandbox);
const fundContext=n=>({history_start:date(0),asof:date(n-1),max_calendar_days:n,calendar_offsets:Array.from({length:n},(_,i)=>i)});

test('30/15 and 60/30 use the first half, never a rolling setup before the break',()=>{
 for(const days of [30,60]){
  const values=[...Array(days/2).fill(100),...Array(days/2-2).fill(100.5),101,102],r=run(values);
  assert.equal(r.phase,'confirmed');assert.equal(r.setupDays,days/2);
  assert.equal(r.box.rangeStart,date(0));assert.equal(r.box.rangeEnd,date(days/2-1));
  assert.equal(r.box.upper,1);assert.equal(r.box.lower,1);assert.equal(r.box.firstBreakDate,date(days/2));
  assert.equal(r.box.confirmDate,date(days/2+1));
 }
});
test('both directions share identical edges; observation 15 is setup, observation 16 can break',()=>{
 const values=[...Array(14).fill(100),101,...Array(15).fill(101)],up=run(values),down=run(values,'down');
 assert.equal(up.phase,'watch');assert.equal(up.box.upper,1.01);
 for(const k of ['rangeStart','rangeEnd','lower','upper'])assert.equal(up.box[k],down.box[k]);
 values[15]=102;values.fill(103,16);assert.equal(run(values).box.confirmDate,date(16));
});
test('one point is pending, two confirm, touching the fixed edge invalidates in either direction',()=>{
 for(const [direction,price] of [['up',101],['down',99]]){
  const values=[...Array(28).fill(100),price,price];
  assert.equal(run(values,direction).phase,'confirmed');
  values[28]=100;assert.equal(run(values,direction).phase,'pending');
  values[26]=price;values[27]=price;values[28]=price;values[29]=100;
  assert.equal(run(values,direction).phase,'exited');
 }
});
test('old history and persisted signal cannot influence selected window',()=>{
 const recent=[...Array(30).fill(100)],a=make([...Array(70).fill(80),...recent],30);
 const initial=evaluateBreakout(a.row,a.context,{version:1,phase:'confirmed',box:{upper:.5}}).result;
 assert.equal(initial.phase,'watch');assert.equal(initial.box.rangeStart,date(70));
 a.row.history[5]=[5,0,0,1];a.row.history.splice(6,1);
 assert.deepEqual(evaluateBreakout(a.row,a.context).result,initial);
 a.row.history.push([101,200]);assert.deepEqual(evaluateBreakout(a.row,a.context).result,initial);
});
test('calendar days, weekend boundaries, odd periods and missing observations',()=>{
 const {row,context}=make([...Array(15).fill(100),...Array(15).fill(102)]);
 row.history=row.history.filter(p=>p[0]%7<5);context.dates=row.history.map(p=>date(p[0]));
 const r=evaluateFixedWindow(row,context).result;
 assert.equal(r.box.rangeEnd,date(14));assert.equal(r.box.confirmDate,date(16));
 row.history.splice(12,1);assert.equal(evaluateFixedWindow(row,context).result.known,false);
 const odd=run([...Array(15).fill(100),...Array(16).fill(101)]);assert.equal(odd.setupDays,15);assert.equal(odd.box.rangeEnd,date(14));
 assert.equal(run([100,101]).known,false);
});
test('front-half sideways condition is required and no historical normalization affects R01',()=>{
 const values=[...Array(14).fill(100),106,...Array(15).fill(107)];
 assert.equal(run(values).sideways,false);assert.equal(run(values).phase,'watch');
 const {row,context}=make([...Array(30).fill(80),...Array(15).fill(100),...Array(15).fill(104)],30);
 const stock={code:row.code,points:row.history.map(p=>[date(p[0]),p[1]])},c={asof:context.asof,calendar:context.dates,historyStart:context.history_start};
 const p=stockPick(stock,c);assert.equal(p.rule1,true);assert.equal(p.rule2,true);assert.ok(Math.abs(p.change-.04)<1e-12);
});
test('fund UI recalculates R2 for selected days, clears stale signals while history loads',()=>{
 const {row}=make([...Array(30).fill(100),...Array(30).fill(101)]);
 const a=sandbox.calculateCalendarWindow(row,fundContext(60),60),b=sandbox.calculateCalendarWindow(row,fundContext(60),30);
 assert.equal(a.breakout.phase,'confirmed');assert.equal(a.breakout.box.rangeEnd,date(29));
 assert.equal(b.breakout.phase,'watch');assert.equal(b.breakout.box.rangeStart,date(30));
 const unavailable=sandbox.screeningLongWindow({...row,breakout:a.breakout},null,date(59),60,sandbox.calculateCalendarWindow);
 assert.equal(unavailable.breakout.known,false);
});
test('fund dividends use reinvested NAV for identical buy/sell box boundaries',()=>{
 const {row}=make([...Array(15).fill(100),...Array(15).fill(99)]);
 row.history[15][2]=1;
 const c=fundContext(30),buy=sandbox.calculateCalendarWindow(row,c,30),sell=buildFundExits({context:{...c,dates:c.calendar_offsets.map(date)},rows:[row]}).rows[0];
 assert.equal(buy.breakout.phase,'watch');assert.equal(sell.status,'clear');assert.ok(Math.abs(buy.change)<1e-12);
 row.history[16][3]=1;assert.equal(sandbox.calculateCalendarWindow(row,c,30).breakout.known,false);
 assert.equal(buildFundExits({context:{...c,dates:c.calendar_offsets.map(date)},rows:[row]}).rows[0].status,'unknown');
});
test('real CRRC and Zijin regressions use Aug 17–31, not old June/July boxes',()=>{
 const raw=JSON.parse(fs.readFileSync('stock-picks-raw.json'));
 for(const [code,expectedExit] of [['601766','clear'],['601899','triggered']]){
  const row=raw.stocks.find(s=>s.code===code),buy=stockPick(row,raw),sell=stockExit(row,raw);
  assert.equal(buy.rule1&&buy.rule2,false);assert.equal(sell.status,expectedExit);
  assert.equal(buy.signal.box.rangeStart,'2026-08-17');assert.equal(buy.signal.box.rangeEnd,'2026-08-31');
 }
});
test('all four complete snapshot pools contain no simultaneous buy/sell candidates',t=>{
 for(const [market,prefix] of [['CN',''],['US','us-'],['HK','hk-']]){
  const raw=JSON.parse(fs.readFileSync(prefix+'stock-picks-raw.json')),buy=buildStockPicks(raw,raw.asof),sell=buildStockExits(raw).rows.filter(r=>r.status==='triggered'),ids=new Set(buy.matches.map(r=>r.code));
  assert.equal(sell.filter(r=>ids.has(r.code)).length,0,market);
  t.diagnostic(`${market}: buy=${ids.size}, sell=${sell.length}, unknown=${buy.unknown}`);
 }
 const daily=JSON.parse(fs.readFileSync('dist/index.html','utf8').match(/<script id="dataset" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 const ids=new Set(daily.rows.map(r=>sandbox.calculateCalendarWindow(r,daily.context,30)).filter(r=>r.amplitude<=.1+1e-12&&Math.abs(r.change)<=.05+1e-12&&r.breakout?.phase==='confirmed').map(r=>r.code));
 const exits=buildFundExits(daily).rows.filter(r=>r.status==='triggered');
 assert.equal(exits.filter(r=>ids.has(r.code)).length,0,'FUND');
 t.diagnostic(`FUND: buy=${ids.size}, sell=${exits.length}`);
});
