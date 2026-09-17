export const MAX_COMPARE=4;
export function validSelection(codes,hasCode){
 if(!Array.isArray(codes))return [];
 return [...new Set(codes.filter(c=>typeof c==='string'&&/^\d{6}$/.test(c)&&hasCode(c)))].slice(0,MAX_COMPARE);
}
export function comparisonLink(codes,days){
 const clean=validSelection(codes,()=>true),period=[7,15,30,180,365].includes(Number(days))?Number(days):30;
 return '/compare.html?'+new URLSearchParams({codes:clean.join(','),days:String(period)}).toString()+'#selection';
}
export function readComparisonLink(params,hasCode){
 const codes=validSelection((params.get('codes')||params.get('code')||'').split(',').slice(0,50),hasCode);
 const value=Number(params.get('days'));
 return {codes,days:[7,15,30,180,365].includes(value)?value:30};
}
