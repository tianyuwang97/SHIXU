(() => {
 const ctx=document.modelContext;
 if(!ctx?.registerTool)return;
 const lifecycle=new AbortController();
 const tool={name:'configure_fund_filter',title:'设置基金筛选条件',description:'选择规则一、规则二或两条同时满足，以及突破信号阶段，设置自然日期间、振幅上限、首尾涨跌幅上下限和排序，保留当前名称、类型与结果状态选择，返回匹配数量和前十条可见结果。仅调整本页筛选，不执行交易。',inputSchema:{type:'object',properties:{selectedRules:{type:'array',items:{type:'string',enum:RULES.map(rule=>rule.id)},uniqueItems:true,minItems:1},ruleMode:{type:'string',enum:['rule1','rule2','both']},breakoutStage:{type:'string',enum:['confirmed','newBuy','pending','exited']},days:{type:'integer',minimum:2,maximum:30},amplitudeMax:{type:'number',minimum:0,maximum:1000},changeMin:{type:['number','null']},changeMax:{type:['number','null']},sort:{type:'string',enum:['changeDesc','changeAsc','code','amplitude','abschange']}},required:['days','amplitudeMax','changeMin','changeMax','sort'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){
  if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['selectedRules','ruleMode','breakoutStage','days','amplitudeMax','changeMin','changeMax','sort'].includes(k)))throw new Error('筛选参数无效');
  if(input.selectedRules!==undefined&&(!Array.isArray(input.selectedRules)||!input.selectedRules.length||input.selectedRules.some(id=>!RULES.some(rule=>rule.id===id))||new Set(input.selectedRules).size!==input.selectedRules.length||input.ruleMode!==undefined))throw new Error('请选择有效规则，且不要同时传入旧的组合模式');
  const {days,amplitudeMax,changeMin,changeMax,sort}=input;
  if(input.ruleMode!==undefined&&!['rule1','rule2','both'].includes(input.ruleMode)||input.breakoutStage!==undefined&&!['confirmed','newBuy','pending','exited'].includes(input.breakoutStage))throw new Error('规则或信号阶段无效');
  if(!Number.isInteger(days)||days<2||days>30||!Number.isFinite(amplitudeMax)||amplitudeMax<0||amplitudeMax>1000||!(changeMin===null||Number.isFinite(changeMin))||!(changeMax===null||Number.isFinite(changeMax))||!['changeDesc','changeAsc','code','amplitude','abschange'].includes(sort)||(changeMin!==null&&changeMax!==null&&changeMin>changeMax))throw new Error('范围无效：请检查期间、振幅及涨跌幅上下限');
  if(input.ruleMode!==undefined)selectRules(input.ruleMode==='both'?['rule1','rule2']:[input.ruleMode]);if(input.breakoutStage!==undefined)$('breakoutStage').value=input.breakoutStage;
  if(input.selectedRules!==undefined)selectRules(input.selectedRules);
  $('days').value=[7,15,30].includes(days)?String(days):'custom';$('customDays').value=days;$('amp').value=amplitudeMax;$('changeMin').value=changeMin===null?'':changeMin;$('changeMax').value=changeMax===null?'':changeMax;$('sort').value=sort;update();
  return {selectedRules:activeRules,ruleMode:activeMode,breakoutStage:activeBreakoutStage,days,amplitudeMax,changeMin,changeMax,sort,visibleResultCount:filtered.length,matchingCount:Number($('nmatch').textContent.replace(/,/g,'')),results:filtered.slice(0,10).map(r=>({code:r.code,name:r.name,changePercent:valid(r)?r.change*100:null,amplitudePercent:valid(r)?r.amplitude*100:null,status:state(r),breakout:r.breakout}))};
 }};
 try{Promise.resolve(ctx.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
})();
