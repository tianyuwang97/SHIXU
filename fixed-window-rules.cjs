// One calendar window and one fixed first-half box for both directions.
// Recompute from the selected window; never carry a historical signal forward.
function evaluateFixedWindow(row, context, direction='up') {
 const day=86400000,shift=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*day).toISOString().slice(0,10);
 const days=context.periodDays??30,asof=context.asof;
 if(!Number.isInteger(days)||days<2)throw new RangeError('Invalid rule period');
 if(!['up','down'].includes(direction))throw new RangeError('Invalid direction');
 const setupDays=Math.floor(days/2),start=shift(asof,1-days),rangeEnd=shift(start,setupDays-1);
 const common={asof,periodDays:days,setupDays,trackingStart:start,windowStart:start,windowEnd:asof};
 const fail=reason=>({state:null,result:{...common,known:false,phase:'unknown',reason,box:null}});
 if(!context.history_start||context.history_start>start)return fail('所选自然日期间历史不足');
 const points=(row.history||[]).map(p=>({date:shift(context.history_start,p[0]),nav:p[1],cash:p[2]??0,issue:p[3]||0})).filter(p=>p.date>=start&&p.date<=asof);
 const required=(context.dates||[]).filter(d=>d>=start&&d<=asof),dates=new Set(points.map(p=>p.date));
 if(!required.length||required.at(-1)!==asof||points.at(-1)?.date!==asof||required.some(d=>!dates.has(d)))return fail('所选期间行情或净值披露数据缺失');
 if(points.some((p,i)=>(i&&p.date<=points[i-1].date)||!Number.isFinite(p.nav)||p.nav<=0||(i&&(!Number.isFinite(p.cash)||p.issue))))return fail('所选期间价格、净值或分红口径异常');
 let value=1;
 for(let i=0;i<points.length;i++){
  if(i)value*=(points[i].nav+points[i].cash)/points[i-1].nav;
  if(!Number.isFinite(value)||value<=0)return fail('调整后净值异常');
  points[i].value=value;
 }
 const setup=points.filter(p=>p.date<=rangeEnd),after=points.filter(p=>p.date>rangeEnd);
 if(setup.length<2)return fail('前半段横盘区间不足两个有效观察点');
 const values=setup.map(p=>p.value),lower=Math.min(...values),upper=Math.max(...values),amplitude=upper/lower-1,change=values.at(-1)/values[0]-1;
 const box={id:row.code+':'+start+':'+days,rangeStart:start,rangeEnd,firstNavDate:setup[0].date,base:values[0],lower,upper,amplitude,change};
 const sideways=amplitude<=.1+1e-12&&Math.abs(change)<=.05+1e-12;
 let phase='watch',run=0;
 const outside=v=>direction==='up'?v>upper*(1+1e-12):v<lower*(1-1e-12);
 if(sideways)for(const p of after){
  if(outside(p.value)){
   run++;
   if(run===1){phase='pending';box.firstBreakDate=p.date;delete box.confirmDate;delete box.exitDate;delete box.failedDate;}
   if(run===2){phase='confirmed';box.confirmDate=p.date;}
  }else{
   if(phase==='confirmed'){phase='exited';box.exitDate=p.date;}
   else if(phase==='pending'){phase='failed';box.failedDate=p.date;}
   run=0;
  }
 }
 Object.assign(box,{upperReturn:upper/box.base-1,lowerReturn:lower/box.base-1,currentReturn:value/box.base-1});
 const result={...common,known:true,phase,box,sideways,newBuy:direction==='up'&&phase==='confirmed'&&box.confirmDate===asof,newSell:direction==='down'&&phase==='confirmed'&&box.confirmDate===asof,newReview:phase==='exited'&&box.exitDate===asof,...(!sideways?{reason:'所选期间前半段不符合横盘条件'}:{})};
 return {state:{version:2,...result},result};
}
if(typeof module!=='undefined')module.exports={evaluateFixedWindow};
