let observer;
export function sizeTradeDock(bar){
 observer?.disconnect();
 observer=new ResizeObserver(()=>document.documentElement.style.setProperty('--trade-dock-height',bar.offsetHeight+'px'));
 observer.observe(bar);
}
