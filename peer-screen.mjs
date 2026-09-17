import {stockPick} from './stock-picks-core.mjs';
// Called only on the server. Browser bundles receive two matching booleans.
export function withPeerScreen(value,index){
 const start=new Date(Date.parse(index.asof+'T00:00:00Z')-179*86400000).toISOString().slice(0,10);
 const rule=stockPick({...value,points:(value.points||[]).filter(p=>p[0]>=start)},{asof:index.asof,historyStart:start,calendar:index.calendar.filter(d=>d>=start)});
 return {...value,screen:{range:rule.error?null:rule.rule1,breakout:rule.error||!rule.signal?.known?null:rule.rule2}};
}
