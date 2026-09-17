// Sell R02: fixed 15-calendar-day setup, two consecutive closes below its lower edge.
// Persistent levels are in a dividend-reinvested index, never in raw NAV units.
const DAY=86400000, VERSION=1;
const shift=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*DAY).toISOString().slice(0,10);
const below=(value,level)=>value<level*(1-1e-12);
function evaluateBreakdown(row,context,previous=null){
 const fail=reason=>({state:previous,result:{known:false,phase:'unknown',reason,asof:context.asof,...(previous?.box?{box:previous.box}:{}),lastKnownPhase:previous?.phase||null}});
 if(previous&&previous.version!==VERSION)throw new Error('Unsupported breakout state version');
 if(previous?.lastDate>context.asof)return fail('净值截止日早于已保存信号日期，待复核');
 const points=row.history.map(p=>({date:shift(context.history_start,p[0]),nav:p[1],cash:p[2]||0,issue:p[3]||0}));
 if(!points.length||points.at(-1).date!==context.asof)return fail('最新共同截止日净值尚未齐备');
 const byDate=new Map(points.map(p=>[p.date,p]));
 const required=context.dates.filter(d=>!previous?.lastDate||d>previous.lastDate);
 if(required.some(d=>!byDate.has(d)))return fail('连续净值披露数据有缺失，暂停信号判断');
 if(previous?.lastDate&&previous.lastDate<context.history_start)return fail('更新中断超过已保存净值窗口，需要补齐历史后复核');
 if(previous){
  for(const sample of previous.samples){
   const p=byDate.get(sample.date);
   if(p&&(Math.abs(p.nav-sample.nav)>1e-10||p.issue||(p.date!==points[0].date&&Math.abs(p.cash-sample.cash)>1e-8)))return fail('已使用的历史净值或分红发生变化，冻结原信号并待复核');
  }
 }
 const fresh=points.filter(p=>!previous?.lastDate||p.date>previous.lastDate);
 if(fresh.some((p,i)=>!Number.isFinite(p.nav)||p.nav<=0||!Number.isFinite(p.cash)||(p.issue&&(previous||i>0))))return fail('净值或分红口径异常，暂停信号判断');
 const state=previous?JSON.parse(JSON.stringify(previous)):{version:VERSION,phase:'watch',samples:[],lastDate:null,lastNav:null,lastValue:null,box:null,events:[],trackingStart:context.history_start};
 for(const p of fresh){
  const value=state.lastDate?state.lastValue*(p.nav+p.cash)/state.lastNav:1;
  if(!Number.isFinite(value)||value<=0)return fail('调整后净值异常');
  if(state.phase==='pending'){
   if(below(value,state.box.lower)){
    state.phase='confirmed';state.box.confirmDate=p.date;
    state.events.push({type:'sell',date:p.date,id:state.box.id});
   }else{
    state.phase='failed';state.box.failedDate=p.date;
   }
  }else if(state.phase==='confirmed'){
   if(!below(value,state.box.lower)){
    state.phase='exited';state.box.exitDate=p.date;
    state.events.push({type:'review',date:p.date,id:state.box.id});
   }
  }else if(state.samples.length){
   // Freeze a setup evaluated as of the immediately preceding NAV date.
   // Today's breakout observation is excluded from all setup measurements.
   const end=state.samples.at(-1).date,start=shift(end,-14);
   if(start>=state.trackingStart&&start>=state.samples[0].date){
    const setup=state.samples.filter(s=>s.date>=start&&s.date<=end);
    const expected=context.dates.filter(d=>d>=start&&d<=end);
    if(setup.length>=2&&expected.every(d=>setup.some(s=>s.date===d))){
     const values=setup.map(s=>s.value),lower=Math.min(...values),upper=Math.max(...values),amplitude=upper/lower-1,change=values.at(-1)/values[0]-1;
     if(amplitude<=.1+1e-12&&Math.abs(change)<=.05+1e-12&&below(value,lower)){
      state.box={id:row.code+':'+p.date,rangeStart:start,rangeEnd:end,firstNavDate:setup[0].date,base:values[0],lower,upper,amplitude,change,firstBreakDate:p.date};
      state.phase='pending';
     }
    }
   }
  }
  state.samples.push({...p,value});state.lastDate=p.date;state.lastNav=p.nav;state.lastValue=value;
  state.samples=state.samples.filter(s=>s.date>=shift(p.date,-44));
  state.events=state.events.slice(-20);
 }
 const box=state.box?{...state.box,upperReturn:state.box.upper/state.box.base-1,lowerReturn:state.box.lower/state.box.base-1,currentReturn:state.lastValue/state.box.base-1}:null;
 return {state,result:{known:true,phase:state.phase,asof:context.asof,trackingStart:state.trackingStart,box,newSell:state.phase==='confirmed'&&box?.confirmDate===context.asof,newReview:state.phase==='exited'&&box?.exitDate===context.asof}};
}
module.exports={evaluateBreakdown};
