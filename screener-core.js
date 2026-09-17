// Pure period calculation shared by the report and independent Node verification.
function calculateCalendarWindow(row, context, days) {
  const maxDays=context.max_calendar_days;
  if(!Number.isInteger(days)||days<2||days>maxDays)throw new RangeError(`自然日天数必须为2—${maxDays}的整数`);
  const begin=maxDays-days,end=maxDays-1;
  const dateAt=i=>new Date(Date.parse(context.history_start+'T00:00:00Z')+i*86400000).toISOString().slice(0,10);
  const required=context.calendar_offsets.filter(i=>i>=begin&&i<=end);
  const observations=row.history.filter(p=>p[0]>=begin&&p[0]<=end);
  const base={...row,windowStart:dateAt(begin),windowEnd:dateAt(end),periodDays:days,dates:observations.map(p=>dateAt(p[0])),pointCount:observations.length};
  const present=new Set(observations.map(p=>p[0]));
  const missing=required.filter(i=>!present.has(i));
  if(missing.length)return {...base,result:row.fetchError?'获取失败':'数据不足',reason:`期间缺少${missing.length}个应披露日：${missing.map(dateAt).join('、')}${row.fetchError?'；补充历史数据获取失败':''}`};
  if(required.length<2||observations.length<2)return {...base,result:'数据不足',reason:'所选自然日期间内不足2个净值观察点'};
  if(observations.some(p=>!Number.isFinite(p[1])||p[1]<=0))return {...base,result:'数据异常',reason:'期间内存在无效净值'};
  let value=1,dividends=0;const series=[1];
  for(let i=1;i<observations.length;i++){
    const p=observations[i],previous=observations[i-1],issue=p[3]||0;
    if(issue)return {...base,result:'数据异常',reason:issue===1?'分红/拆分或日增长率口径不一致，待复核':issue===2?'累计净值偏移减少，疑似拆分，待复核':'期间内存在无效净值'};
    const cash=p[2]||0,ratio=(p[1]+cash)/previous[1];
    if(!Number.isFinite(ratio)||ratio<=0)return {...base,result:'数据异常',reason:'期间内存在无效收益率'};
    value*=ratio;series.push(value);if(cash>0)dividends++;
  }
  return {...base,result:'可计算',amplitude:Math.max(...series)/Math.min(...series)-1,change:series.at(-1)-1,series,dividends,nav_start:observations[0][1],nav_end:observations.at(-1)[1]};
}
if(typeof module!=='undefined')module.exports={calculateCalendarWindow};
