"""Refresh public current-universe sector samples. Parse JSON, never execute vendor JS."""
import concurrent.futures, datetime as dt, json, pathlib, re, threading, time, urllib.request, subprocess
ROOT=pathlib.Path(__file__).resolve().parent
CACHE=ROOT.parent/'sector-cache';CACHE.mkdir(exist_ok=True)
DAILY=json.loads(re.search(r'<script id="dataset" type="application/json">(.*?)</script>',(ROOT/'dist/index.html').read_text(encoding='utf-8'),re.S).group(1))
ASOF=DAILY['context']['asof']
THEMES={t['id']:t['pattern'] for t in json.loads((ROOT/'sector-themes.json').read_text(encoding='utf-8'))}
lock=threading.Lock();next_request=0
def get(url):
 global next_request
 for attempt in range(3):
  try:
   with lock:
    time.sleep(max(0,next_request-time.monotonic()));next_request=time.monotonic()+.25
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Referer':'https://fund.eastmoney.com/'}),timeout=25) as r:
    text=r.read(3000000).decode('utf-8-sig')
   if len(text)>2900000:raise ValueError('response too large')
   return text
  except Exception:
   if attempt==2:raise
   time.sleep(1+attempt)
def variable(text,key):
 m=re.search(r'\bvar\s+'+re.escape(key)+r'\s*=\s*(.*?);',text,re.S)
 if not m:raise ValueError('Missing '+key)
 return json.loads(m.group(1))
def sample(r):
 code=r['code'];out={k:r[k] for k in ['code','name','type']};out['themes']=[k for k,pat in THEMES.items() if re.search(pat,r['name'])]
 try:
  file=CACHE/(code+'-'+ASOF+'.json')
  if file.exists():
   cached=json.loads(file.read_text(encoding='utf-8'));cached.update(out);return cached
  navtext=get('https://fund.eastmoney.com/pingzhongdata/'+code+'.js')
  if variable(navtext,'fS_code')!=code:raise ValueError('NAV identity mismatch')
  nav=variable(navtext,'Data_netWorthTrend');cum=dict(variable(navtext,'Data_ACWorthTrend'))
  start=dt.date.fromisoformat(ASOF)-dt.timedelta(days=374);raw=[]
  for p in nav:
   day=dt.datetime.fromtimestamp(p['x']/1000,dt.timezone(dt.timedelta(hours=8))).date().isoformat()
   if start.isoformat()<=day<=ASOF:
    raw.append({'FSRQ':day,'DWJZ':p['y'],'LJJZ':cum.get(p['x']),'JZZZL':p.get('equityReturn')})
  if len(raw)!=len({p['FSRQ'] for p in raw}):raise ValueError('duplicate dates')
  out.update(raw=raw,profileHtml=get('https://fundf10.eastmoney.com/jbgk_'+code+'.html'),checkedAt=dt.datetime.now(dt.timezone.utc).isoformat())
  file.write_text(json.dumps(out,ensure_ascii=False),encoding='utf-8');return out
 except Exception as e:out['error']=str(e)[:180];return out
def eligible(r):
 # A shares or an unlettered legacy share only. Other share classes are never double-counted.
 return (re.search('|'.join(THEMES.values()),r['name'])
  and re.search('股票|混合',r['type']) and not re.search('QDII|海外|美元',r['name']+' '+r['type'])
  and not re.search(r'[B-Z](?:类|份额)?(?:[（(].*?[）)])?$',r['name'],re.I))
rows=[r for r in DAILY['rows'] if eligible(r)]
print(json.dumps({'asof':ASOF,'candidates':len(rows)}),flush=True)
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
 futures=[ex.submit(sample,r) for r in rows]
 for i,f in enumerate(concurrent.futures.as_completed(futures),1):
  results.append(f.result())
  if i%25==0:print('fetched',i,'/',len(rows),flush=True)
# The reference calendar is independently fetched even if no bank sample is eligible.
reference=sample({'code':'000001','name':'华夏成长混合','type':'混合型-偏股'})
payload={'asof':ASOF,'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'rows':sorted(results,key=lambda r:r['code']),'reference':reference}
(CACHE/'input.json').write_text(json.dumps(payload,ensure_ascii=False),encoding='utf-8')
print(json.dumps({'fetched':len(results),'failed':sum('error' in r for r in results)}),flush=True)
