// A single internal preview account. No registration, SMTP or user directory.
// Password verifier lives in Sites secrets; revocable session hashes live in D1.
export const SESSION_COOKIE='__Host-shixu_admin';
const SESSION_SECONDS=8*60*60;
export const authJSON=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff',...extra}});
export function authConfig(env){
 try{const p=JSON.parse(env.ADMIN_PASSWORD_VERIFIER),name=env.ADMIN_USERNAME;
 if(!/^[A-Za-z0-9_-]{3,32}$/.test(name||'')||p.iterations!==100000||!/^([a-f0-9]{2}){16}$/.test(p.salt)||!/^([a-f0-9]{2}){32}$/.test(p.hash)||!env.DB)return null;
 return {name,...p};}catch{return null;}
}
const hex=b=>Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('');
const unhex=s=>Uint8Array.from(s.match(/../g),p=>parseInt(p,16));
const digest=async value=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
const cookie=(token,seconds)=>`${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
function sessionToken(request){const v=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1);return /^[a-f0-9]{64}$/.test(v||'')?v:null;}
const credentialTag=config=>digest(config.name+':'+config.salt+':'+config.hash);
async function passwordMatches(password,config){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const bits=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unhex(config.salt),iterations:config.iterations},key,256)),expected=unhex(config.hash);
 let different=0;for(let i=0;i<bits.length;i++)different|=bits[i]^expected[i];return different===0;
}
export async function authenticatedUser(request,env){
 const config=authConfig(env),token=sessionToken(request);if(!config||!token)return null;
 try{const now=Math.floor(Date.now()/1000),row=await env.DB.prepare('SELECT expires, credential_tag FROM admin_sessions WHERE token_hash = ?').bind(await digest(token)).first();
 if(!row||row.expires<=now||row.credential_tag!==await credentialTag(config))return null;
 return {id:'preview-admin',name:config.name};}catch{return null;}
}
async function rateLimit(db,request){
 const now=Math.floor(Date.now()/1000),ipHash=await digest(request.headers.get('CF-Connecting-IP')||'shared');
 for(const [who,max] of [['global',100],['ip:'+ipHash,10]]){
  const window=900,key='admin:'+who+':'+Math.floor(now/window),expires=(Math.floor(now/window)+1)*window;
  const row=await db.prepare('INSERT INTO auth_rate_limits (key, hits, expires) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET hits = hits + 1 WHERE hits < ? RETURNING hits').bind(key,expires,max).first();
  if(!row)return false;
 }
 await db.prepare('DELETE FROM auth_rate_limits WHERE expires < ?').bind(now-3600).run();return true;
}
export async function authResponse(request,env){
 const u=new URL(request.url),route=u.pathname.slice('/api/auth/'.length),config=authConfig(env);
 if(route==='session'&&request.method==='GET'){const user=await authenticatedUser(request,env);return authJSON({configured:!!config,mode:'preview-admin',authenticated:!!user,user:user?{name:user.name}:null});}
 if(!['login','logout'].includes(route)||request.method!=='POST')return authJSON({error:'未找到此功能'},404);
 if(request.headers.get('Origin')!==u.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return authJSON({error:'请求来源不匹配'},403);
 if(route==='logout'){
  try{const token=sessionToken(request);if(token&&env.DB)await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await digest(token)).run();}
  catch{return authJSON({error:'暂时无法退出，请重试。'},503);}
  return authJSON({ok:true},200,{'Set-Cookie':cookie('',0)});
 }
 if(!config)return authJSON({error:'管理员登录暂不可用，请先以访客进入。'},503);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return authJSON({error:'请求格式无效'},415);
 try{
  const text=await request.text();if(text.length>2048)return authJSON({error:'输入过长'},413);
  let input;try{input=JSON.parse(text);}catch{return authJSON({error:'请求格式无效'},400);}
  if(typeof input?.password!=='string'||input.password.length<1||input.password.length>256)return authJSON({error:'请输入密码'},400);
  if(!await rateLimit(env.DB,request))return authJSON({error:'尝试次数过多，请15分钟后再试。'},429,{'Retry-After':'900'});
  const correct=await passwordMatches(input.password,config);
  if(!correct||(input.username!==undefined&&input.username!==config.name))return authJSON({error:'账号或密码不正确'},401);
  const now=Math.floor(Date.now()/1000),token=hex(crypto.getRandomValues(new Uint8Array(32))),tag=await credentialTag(config);
  const old=sessionToken(request);if(old)await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await digest(old)).run();
  await env.DB.prepare('DELETE FROM admin_sessions WHERE expires <= ? OR credential_tag <> ?').bind(now,tag).run();
  await env.DB.prepare('INSERT INTO admin_sessions (token_hash, expires, credential_tag) VALUES (?, ?, ?)').bind(await digest(token),now+SESSION_SECONDS,tag).run();
  return authJSON({ok:true},200,{'Set-Cookie':cookie(token,SESSION_SECONDS)});
 }catch{return authJSON({error:'登录服务暂不可用，请稍后重试。'},503);}
}
