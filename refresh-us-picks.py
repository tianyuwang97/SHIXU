"""Public US observation pool; completed regular sessions and adjusted closes only."""
import concurrent.futures,io,json,math,pathlib,re,time,zipfile
import xml.etree.ElementTree as ET
from datetime import datetime,timedelta,timezone
import requests

ROOT=pathlib.Path(__file__).resolve().parent
SPY='https://www.ssga.com/library-content/products/fund-data/etfs/us/holdings-daily-us-en-spy.xlsx'
NDX='https://api.nasdaq.com/api/quote/list-type/nasdaq100'
HEADERS={'User-Agent':'Mozilla/5.0','Accept':'application/json,text/plain,*/*'}
def download(url,params=None):
    r=requests.get(url,params=params,headers=HEADERS,timeout=25);r.raise_for_status();return r
def spy_universe(content):
    ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with zipfile.ZipFile(io.BytesIO(content)) as z:
        strings=[''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns)]
        sheet=ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    rows=[]
    for row in sheet.findall('.//s:sheetData/s:row',ns):
        cells={}
        for c in row.findall('s:c',ns):
            v=c.find('s:v',ns);value=v.text if v is not None else ''
            cells[re.sub(r'\d','',c.get('r'))]=strings[int(value)] if c.get('t')=='s' else value
        rows.append(cells)
    if not any(r.get('A')=='Ticker Symbol:' and r.get('B')=='SPY' for r in rows):raise ValueError('SPY文件身份不符')
    stamp=next(r['B'] for r in rows if r.get('A')=='Holdings:')
    asof=datetime.strptime(stamp.removeprefix('As of '),'%d-%b-%Y').date().isoformat()
    header=next(i for i,r in enumerate(rows) if r.get('A')=='Name' and r.get('B')=='Ticker' and r.get('H')=='Local Currency')
    pool={}
    for r in rows[header+1:]:
        symbol=r.get('B','').replace('.','-');identifier=r.get('C','')
        if not re.fullmatch(r'[A-Z][A-Z0-9-]{0,9}',symbol) or not re.fullmatch(r'[A-Z0-9]{9}',identifier) or r.get('H')!='USD':continue
        if not 0<float(r.get('E','0'))<=100:continue
        if symbol in pool:raise ValueError('SPY股票重复')
        pool[symbol]={'code':symbol,'name':r['A'],'memberships':['SPY']}
    if not 490<=len(pool)<=510:raise ValueError('SPY股票持仓数量异常')
    return pool,asof
def nasdaq_universe(body):
    data=body['data'];rows=data['data']['rows'];asof=datetime.strptime(data['date'],'%b %d, %Y').date().isoformat()
    if len(rows)!=data['totalrecords'] or not 95<=len(rows)<=110:raise ValueError('纳指100名单不完整')
    pool={}
    for r in rows:
        symbol=r['symbol'].replace('.','-')
        if not re.fullmatch(r'[A-Z][A-Z0-9-]{0,9}',symbol) or symbol in pool:raise ValueError('纳指股票代码异常')
        pool[symbol]={'code':symbol,'name':r['companyName'],'memberships':['NDX']}
    return pool,asof
def parse_chart(body,symbol,now,asof=None,start=None,index=False):
    if body['chart'].get('error'):raise ValueError('行情来源返回错误')
    values=body['chart']['result']
    if not isinstance(values,list) or len(values)!=1:raise ValueError('行情结果异常')
    data=values[0];meta=data['meta']
    if meta.get('symbol')!=symbol or meta.get('currency')!='USD' or meta.get('instrumentType')!=('ETF' if index else 'EQUITY'):raise ValueError('行情身份、币种或证券类型不符')
    if meta.get('exchangeTimezoneName')!='America/New_York':raise ValueError('非预期交易时区')
    timestamps=data['timestamp'];adjusted=data['indicators']['adjclose'][0]['adjclose']
    if len(timestamps)!=len(adjusted):raise ValueError('调整收盘价不完整')
    regular=meta['currentTradingPeriod']['regular'];offset=regular['gmtoffset']
    session=datetime.fromtimestamp(regular['start']+offset,timezone.utc).date().isoformat()
    today=datetime.fromtimestamp(now+offset,timezone.utc).date().isoformat();points=[]
    for t,v in zip(timestamps,adjusted):
        d=datetime.fromtimestamp(t+offset,timezone.utc).date().isoformat()
        if d>today or (d>=session and now<regular['end']+900) or (asof and d>asof) or (start and d<start):continue
        if v is None:continue
        if not isinstance(v,(int,float)) or not math.isfinite(v) or v<=0:raise ValueError('调整收盘价无效')
        points.append([d,v])
    if len(points)<2 or [p[0] for p in points]!=sorted(set(p[0] for p in points)):raise ValueError('历史日期重复或不足')
    return points
def chart(symbol,now,asof=None,start=None,index=False):
    body=download('https://query1.finance.yahoo.com/v8/finance/chart/'+symbol,{'range':'6mo','interval':'1d','events':'div,splits'}).json()
    return parse_chart(body,symbol,now,asof,start,index)
def main():
    now=time.time();pool,spy_date=spy_universe(download(SPY).content);ndx,ndx_date=nasdaq_universe(download(NDX).json())
    for code,row in ndx.items():
        if code in pool:pool[code]['memberships'].append('NDX')
        else:pool[code]=row
    reference_body=download('https://query1.finance.yahoo.com/v8/finance/chart/SPY',{'range':'6mo','interval':'1d','events':'div,splits'}).json()
    reference=parse_chart(reference_body,'SPY',now,index=True);asof=reference[-1][0];start=(datetime.fromisoformat(asof)-timedelta(days=179)).date().isoformat()
    if (datetime.fromtimestamp(now,timezone.utc).date()-datetime.fromisoformat(asof).date()).days>7:raise ValueError('基准行情过期')
    for stamp in [spy_date,ndx_date]:
        if abs((datetime.fromisoformat(asof)-datetime.fromisoformat(stamp)).days)>7:raise ValueError('观察名单日期与行情差距过大')
    def one(row):
        row={**row,'source':'https://finance.yahoo.com/quote/'+row['code']+'/history/'}
        try:
            points=chart(row['code'],now,asof,start)
            if points[-1][0]!=asof:raise ValueError('最新已收盘交易日行情未齐')
            row['points']=points
        except Exception as e:row.update(points=[],error='行情获取失败，等待下次更新' if isinstance(e,requests.RequestException) else str(e)[:100])
        return row
    stocks=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        for n,row in enumerate(ex.map(one,sorted(pool.values(),key=lambda r:r['code'])),1):
            stocks.append(row)
            if n%100==0:print('US history',n,'/',len(pool),flush=True)
    count=sum(bool(s['points']) for s in stocks)
    if count<len(stocks)*.8:raise ValueError(f'只有{count}/{len(stocks)}份历史成功，保留旧快照')
    regular=reference_body['chart']['result'][0]['meta']['currentTradingPeriod']['regular']
    session_date=datetime.fromtimestamp(regular['start']+regular['gmtoffset'],timezone.utc).date().isoformat()
    expected_asof=session_date if now>=regular['end']+900 else asof
    out={'market':'US','asof':asof,'expectedAsOf':expected_asof,'historyStart':start,'checkedAt':datetime.now(timezone.utc).isoformat(),'universe':'SPY股票持仓＋纳斯达克100成分','universeAsOf':min(spy_date,ndx_date),'universeSource':SPY,'universeSources':[{'label':'SPY官方股票持仓','asof':spy_date,'url':SPY},{'label':'纳斯达克100官方名单','asof':ndx_date,'url':'https://www.nasdaq.com/products/global-indexes/nasdaq-100/companies'}],'currency':'USD','priceBasis':'股息与拆股调整收盘序列','calendar':[p[0] for p in reference if start<=p[0]<=asof],'stocks':stocks}
    target=ROOT/'us-stock-picks-raw.json';temp=target.with_suffix('.json.tmp');temp.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf-8');temp.replace(target)
    print('Saved US:',count,'/',len(stocks),'asof',asof,flush=True)
if __name__=='__main__':main()
