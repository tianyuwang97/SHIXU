const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=n=>(n>=0?'+':'')+(n*100).toFixed(2)+'%';
// Bounds arrive with authenticated rule evidence, in the same index as points.
export function opportunityChart(s){
 const p=s.points,vals=p.map(v=>(v[1]-1)*100),b=s.chartBox;
 const hasBox=Number.isFinite(b?.lower)&&Number.isFinite(b?.upper)&&b.lower<=b.upper;
 const edges=hasBox?[(b.lower-1)*100,(b.upper-1)*100]:[];
 const lo=Math.min(0,...vals,...edges),hi=Math.max(0,...vals,...edges),span=Math.max(hi-lo,.1),start=Date.parse(s.start);
 const x=i=>8+(Date.parse(p[i][0])-start)/(29*86400000)*284,y=v=>72-(v-lo)/span*60;
 const guides=hasBox?`<g class="pick-chart-box"><title>R2固定区间 ${esc(b.rangeStart)}—${esc(b.rangeEnd)} · 上沿 ${pct(b.upper-1)} · 下沿 ${pct(b.lower-1)}（相对30日首个收盘价）</title><rect x="8" y="${y(edges[1])}" width="284" height="${Math.max(1,y(edges[0])-y(edges[1]))}" fill="#d3e6c5" fill-opacity=".38"/><path d="M8 ${y(edges[1])}H292 M8 ${y(edges[0])}H292" fill="none" stroke="#8ca881" stroke-width="1" stroke-dasharray="4 4"/></g>`:`<path d="M8 ${y(0)}H292" stroke="#d1dfd8" stroke-dasharray="3 3"/>`;
 return `<svg viewBox="0 0 300 88" role="img" aria-label="${esc(s.name)}近30自然日调整收盘走势${hasBox?'，含R2固定区间上下沿':''}"><title>${esc(s.name)} · ${s.start}—${s.asof} · ${pct(s.change)}</title>${guides}<polyline fill="none" stroke="#237b65" stroke-width="2.5" points="${vals.map((v,i)=>x(i).toFixed(2)+','+y(v).toFixed(2)).join(' ')}"/>${hasBox?`<circle cx="${x(p.length-1)}" cy="${y(vals.at(-1))}" r="2.5" fill="#237b65"/>`:''}</svg>${hasBox?'<div class="pick-chart-key">虚线 · R2固定区间上下沿</div>':''}`;
}
