import fs from 'node:fs';
// Reapply on each daily build, including the shared rule engine and 30-day defaults.
export function extendScreener(source){
 const marker='<script id="dataset" type="application/json">',datasetAt=source.indexOf(marker);
 if(datasetAt<0)throw Error('Screener dataset not found');
 const datasetEnd=source.indexOf('</script>',datasetAt)+9,scriptStart=source.indexOf('<script>',datasetEnd),scriptEnd=source.indexOf('</script>',scriptStart);
 if(scriptStart<datasetEnd||scriptEnd<0)throw Error('Screener runtime not found');
 const runtime=['fixed-window-rules.cjs','screener-core.js','screener-history.js','screener-ui.js'].map(f=>fs.readFileSync(new URL(f,import.meta.url),'utf8')).join('\n');
 source=source.slice(0,scriptStart)+'<script>\n'+runtime+'\n</script>'+source.slice(scriptEnd+9);
 source=source.replace('指标／走势图期间（自然日）','规则与走势图期间（自然日）').replace('<option value="15" selected>','<option value="15">').replace('<option value="30">','<option value="30" selected>');
 // Never ship old rolling-window signals from the imported daily report.
 source=source.replace(/(<script id="dataset" type="application\/json">)([\s\S]*?)(<\/script>)/,(_,head,json,tail)=>{const data=JSON.parse(json);for(const row of data.rows)delete row.breakout;return head+JSON.stringify(data).replaceAll('<','\\u003c')+tail;});
 source=source.replaceAll('自然日天数（2—30）','自然日天数（2—360）').replace('id="customDays" type="number" min="2" max="30"','id="customDays" type="number" min="2" max="360"');
 source=source.replace('此页可选择7天、15天、30天或自定义2—30个自然日；期间、幅度条件变化后会重新计算指标、统计和走势。仅重算已保存的数据，不联网刷新。','此页支持2—360个自然日；30天以内使用快照，超过30天按当前搜索和类型范围联网加载历史净值。期间、幅度条件变化后重新计算指标、统计和走势；没有完整历史的基金保留为待核实。');
 source=source.replace('</style>','.history-progress{margin:16px 0;padding:14px 16px;background:#edf6f4;border:1px solid #c5ddd7;border-radius:9px;font-size:14px;line-height:1.8}.history-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.history-actions button{font-size:14px}</style>');
 return source;
}
