import profiles from './us-company-profiles.json' with {type:'json'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const companyProfile=(row,market)=>market.toUpperCase()==='US'?profiles[row.code]:null;
export function companyIntro(row,market){
 if(market.toUpperCase()!=='US')return '';
 const p=companyProfile(row,market);
 if(!p)return '<section class="company-intro company-intro-pending"><p>这家公司的中文业务简介待补充。</p></section>';
 return `<section class="company-intro" aria-label="${esc(p.name)}公司简介"><span class="company-industry">${esc(p.industry)}</span><p>${esc(p.summary)}</p><details class="company-sources"><summary>简介来源 · ${esc(p.checkedAt)}核对</summary><p>按公开公司资料整理的业务介绍；核对日期独立于行情截止日。</p>${p.sources.map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a>`).join(' · ')}</details></section>`;
}
