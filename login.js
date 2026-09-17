const $=id=>document.getElementById(id);
const coin=$('loginCoin');coin.decode().then(()=>document.documentElement.classList.add('coin-ready')).catch(()=>{coin.closest('.login-coin-stage').hidden=true;});
function returnPath(){try{const raw=new URL(location.href).searchParams.get('return_to')||'/';if(!raw.startsWith('/')||raw.startsWith('//'))return '/';const u=new URL(raw,location.origin);if(u.origin!==location.origin||/^\/(login(?:\.html)?|api|signin-with-chatgpt|signout-with-chatgpt|callback)(\/|$)/.test(u.pathname))return '/';return u.pathname+u.search;}catch{return '/';}}
const destination=returnPath(),guestDestination=new URL(destination,location.origin);guestDestination.searchParams.delete('view');$('guestEntry').href=guestDestination.pathname+guestDestination.search;$('continueResearch').href=destination;
let busy=false,configured=false;
function note(message,error=false){$('loginStatus').textContent=message;$('loginStatus').classList.toggle('error',error);}
async function api(path,body){const r=await fetch('/api/auth/'+path,{method:body?'POST':'GET',cache:'no-store',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok)throw Error(data.error||'暂时无法连接，请稍后重试。');return data;}
$('adminLogin').addEventListener('submit',async e=>{e.preventDefault();if(busy||!configured)return;busy=true;$('loginFields').disabled=true;note('正在登录…');try{await api('login',{username:'admin',password:$('loginPassword').value});$('loginPassword').value='';note('登录成功，正在返回…');location.replace(destination);}catch(e){note(e.message,true);busy=false;$('loginFields').disabled=false;}});
$('signOut').onclick=async()=>{if(busy)return;busy=true;$('signOut').disabled=true;try{await api('logout',{});location.reload();}catch(e){note(e.message,true);busy=false;$('signOut').disabled=false;}};
async function init(){try{const s=await api('session');configured=s.configured;$('adminLogin').hidden=s.authenticated;$('signedIn').hidden=!s.authenticated;$('guestEntry').hidden=s.authenticated;
 if(s.authenticated){$('accountName').textContent=s.user.name;note('已登录，可以查看完整规则');}
 else{$('loginFields').disabled=!configured;note(configured?'管理员预览账号':'管理员登录暂不可用，可先以访客进入。');}
 }catch{note('登录服务暂不可用，可先以访客进入。',true);}}
init();window.addEventListener('pageshow',e=>{if(e.persisted)init();});
