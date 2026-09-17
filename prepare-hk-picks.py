"""Refresh 30-day HK screening from the HKEX equity universe and adjusted daily closes."""
import concurrent.futures,datetime as dt,json,math,pathlib,time
import requests
ROOT=pathlib.Path(__file__).resolve().parent
index=json.loads((ROOT/'hk-peer-data/index.json').read_text(encoding='utf-8'))
now=dt.datetime.now(dt.timezone.utc);hk=now.astimezone(dt.timezone(dt.timedelta(hours=8)))
cutoff=hk.date() if hk.hour*60+hk.minute>=16*60+15 else hk.date()-dt.timedelta(days=1)
asof=max(d for d in index['calendar'] if d<=cutoff.isoformat())
start=(dt.date.fromisoformat(asof)-dt.timedelta(days=179)).isoformat()
cache=ROOT.parent/'hk-picks-cache'/asof;cache.mkdir(parents=True,exist_ok=True)
stocks=[]
for group in index['industries']:stocks+=json.loads((ROOT/'hk-peer-data'/(group['id']+'.json')).read_text(encoding='utf-8'))['stocks']
def fetch(s):
 symbol=str(int(s['code'])).zfill(4)+'.HK'
 out={'code':s['code'],'name':s['name'],'source':f'https://finance.yahoo.com/quote/{symbol}/history/','points':[]}
 file=cache/(s['code']+'.json')
 try:
  if file.exists():body=json.loads(file.read_text(encoding='utf-8'))
  else:
   r=requests.get(f'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}',params={'range':'1y','interval':'1d','events':'div,splits'},headers={'User-Agent':'Mozilla/5.0'},timeout=18);r.raise_for_status();body=r.json()
   file.write_text(json.dumps(body,separators=(',',':')),encoding='utf-8')
  result=body['chart']['result'][0];m=result['meta']
  if m['symbol']!=symbol or m['currency']!='HKD' or m['instrumentType']!='EQUITY' or m['exchangeTimezoneName']!='Asia/Hong_Kong':raise ValueError('证券身份或币种异常')
  ts=result['timestamp'];prices=result['indicators']['adjclose'][0]['adjclose']
  if len(ts)!=len(prices):raise ValueError('调整收盘序列不完整')
  for timestamp,value in zip(ts,prices):
   day=dt.datetime.fromtimestamp(timestamp,dt.timezone(dt.timedelta(hours=8))).date().isoformat()
   if not start<=day<=asof or value is None:continue
   if not isinstance(value,(float,int)) or not math.isfinite(value) or value<=0:raise ValueError('价格异常')
   if out['points'] and day<=out['points'][-1][0]:raise ValueError('日期异常')
   out['points'].append([day,value])
 except Exception as e:out['error']='行情未取得：'+str(e)[:120];out['points']=[]
 return out
rows=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
 for row in ex.map(fetch,stocks):
  rows.append(row)
  if len(rows)%200==0:print('HK prices',len(rows),'/',len(stocks),'loaded',sum(bool(r['points']) for r in rows),flush=True)
raw={'market':'HK','currency':'HKD','asof':asof,'expectedAsOf':asof,'historyStart':start,'calendar':[d for d in index['calendar'] if start<=d<=asof],'checkedAt':now.isoformat(),'priceBasis':index['priceBasis'],'universe':index['classification'],'universeAsOf':index['universeAsOf'],'universeSource':index['sources'][0]['url'],'universeSources':[dict(index['sources'][0],asof=index['universeAsOf'])],'stocks':rows}
if sum(bool(r['points']) for r in rows)<len(rows)*.7:raise RuntimeError('数据来源可用率过低，保留旧快照')
(ROOT/'hk-stock-picks-raw.json').write_text(json.dumps(raw,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('HK snapshot saved',asof,'total',len(rows),'loaded',sum(bool(r['points']) for r in rows),flush=True)
