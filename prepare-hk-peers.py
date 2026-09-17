"""Join HKEX HKD equity counters to verified company industry profiles."""
import concurrent.futures,datetime as dt,hashlib,io,json,pathlib,re,zipfile
import xml.etree.ElementTree as ET
import requests
ROOT=pathlib.Path(__file__).resolve().parent;CACHE=ROOT.parent/'hk-peer-cache';DEST=ROOT/'hk-peer-data';CACHE.mkdir(exist_ok=True);DEST.mkdir(exist_ok=True)
TODAY=dt.datetime.now(dt.timezone.utc).date().isoformat();HKEX='https://www.hkex.com.hk/eng/services/trading/securities/securitieslists/ListOfSecurities.xlsx'
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')),encoding='utf8')
def get(url,params=None):r=requests.get(url,params=params,timeout=25,headers={'User-Agent':'Mozilla/5.0'});r.raise_for_status();return r
def read_list(blob):
 ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
 with zipfile.ZipFile(io.BytesIO(blob)) as z:
  strings=[''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns)];sheet=ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
 rows=[]
 for row in sheet.findall('.//s:sheetData/s:row',ns):
  cells={}
  for c in row.findall('s:c',ns):
   v=c.find('s:v',ns);value=v.text if v is not None else '';cells[re.sub(r'\d','',c.get('r'))]=strings[int(value)] if c.get('t')=='s' and value else value
  rows.append(cells)
 assert rows[0]['A']=='List of Securities' and rows[2]['Q']=='Trading Currency'
 stamp=dt.datetime.strptime(rows[1]['A'].replace('Updated as at ',''),'%d/%m/%Y').date().isoformat()
 pool=[r for r in rows[3:] if r.get('C')=='Equity' and r.get('D') in ['Equity Securities (Main Board)','Equity Securities (GEM)'] and r.get('Q')=='HKD' and re.fullmatch(r'\d{5}',r.get('A') or '')]
 assert len(pool)>2000 and len({r['A'] for r in pool})==len(pool)
 return pool,stamp
def main():
 listfile=CACHE/('hkex-'+TODAY+'.xlsx')
 if not listfile.exists():listfile.write_bytes(get(HKEX).content)
 pool,listdate=read_list(listfile.read_bytes());print('HKEX HKD equities',len(pool),'asof',listdate,flush=True)
 cached=CACHE/('profiles-'+TODAY+'.json')
 if cached.exists():profiles=json.loads(cached.read_text(encoding='utf8'))
 else:
  profiles=[];page=1
  while True:
   p={'reportName':'RPT_HKF10_INFO_ORGPROFILE','columns':'SECUCODE,SECURITY_CODE,SECURITY_NAME_ABBR,ORG_EN_ABBR,BELONG_INDUSTRY,ISIN_CODE,LISTING_DATE,MAIN_BUSINESS','pageSize':500,'pageNumber':page,'sortColumns':'SECUCODE','sortTypes':'1'}
   d=get('https://datacenter.eastmoney.com/securities/api/data/v1/get',p).json()
   if not d.get('success'):raise ValueError('HK company source failed')
   profiles.extend(d['result']['data']);print('HK profiles page',page,'/',d['result']['pages'],flush=True)
   if page>=d['result']['pages']:break
   page+=1
  write(cached,profiles)
 lookup={}
 for p in profiles:
  if p['SECUCODE']==p['SECURITY_CODE']+'.HK':
   if p['SECURITY_CODE'] in lookup and lookup[p['SECURITY_CODE']]!=p:raise ValueError('Conflicting HK profiles')
   lookup[p['SECURITY_CODE']]=p
 quotesfile=CACHE/('quotes-'+TODAY+'.json')
 if quotesfile.exists():quotes=json.loads(quotesfile.read_text(encoding='utf8'))
 else:
  quotes={};batches=[pool[i:i+60] for i in range(0,len(pool),60)]
  def quote(batch):
   try:
    r=get('https://qt.gtimg.cn/q='+','.join('hk'+s['A'] for s in batch));r.encoding='gbk';out={}
    for code,body in re.findall(r'v_hk(\d{5})="([^"]*)"',r.text):
     f=body.split('~')
     if len(f)>75 and f[2]==code and f[75]=='HKD' and re.fullmatch(r'\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}',f[30]):
      cap=float(f[45]) if f[45] else 0;out[code]={'marketCap':cap*1e8 if cap>0 else None,'turnover':None,'at':f[30].replace('/','-').replace(' ','T')+'+08:00','currency':'HKD'}
    return out
   except Exception:return {}
  with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
   for out in ex.map(quote,batches):quotes.update(out)
  write(quotesfile,quotes)
 groups={};stocks=[];missing=0
 for r in pool:
  code=r['A'];p=lookup.get(code)
  if p and p.get('ISIN_CODE') and p['ISIN_CODE']!=r['F']:p=None
  industry=p.get('BELONG_INDUSTRY') if p else None
  gid='hk-'+hashlib.sha256(industry.encode()).hexdigest()[:12] if industry else 'hk-unclassified-'+code
  if not industry:missing+=1
  sector='金融' if industry and any(x in industry for x in ['银行','保险','证券','金融']) else '港股行业'
  groups.setdefault(gid,{'id':gid,'name':industry or '行业待核实','sector':sector,'stocks':[]})
  row={'code':code,'name':p.get('SECURITY_NAME_ABBR') if p else r['B'],'englishName':r['B'],'symbol':str(int(code)).zfill(4)+'.HK','industry':gid,'market':'HK','business':(p.get('MAIN_BUSINESS') or '').split('。')[0]+'。' if p and p.get('MAIN_BUSINESS') else '', 'products':'','listed':p.get('LISTING_DATE','')[:10] if p else None,'finance':None,'previous':None,'annual':[],'quote':quotes.get(code),'points':[],'screen':None,'detailsLoaded':False,'isin':r['F']}
  groups[gid]['stocks'].append(row);stocks.append({k:row[k] for k in ['code','name','englishName','symbol','industry']})
 write(CACHE/'prepared.json',{'profileAsOf':TODAY,'universeAsOf':listdate,'stocks':stocks,'groups':list(groups.values()),'unclassified':missing,'quoteCount':len(quotes)})
 print('Prepared HK',len(stocks),'groups',len(groups),'unclassified',missing,'quotes',len(quotes),flush=True)
if __name__=='__main__':main()
