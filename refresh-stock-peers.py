"""Dated public Shanghai/Shenzhen A-share peer snapshots. No user/account data."""
import concurrent.futures,datetime as dt,json,math,pathlib,re,requests,threading,time
ROOT=pathlib.Path(__file__).resolve().parent
CACHE=ROOT.parent/'stock-peer-cache';CACHE.mkdir(exist_ok=True)
DEST=ROOT/'stock-peer-data';DEST.mkdir(exist_ok=True)
LOCAL=threading.local()
def session():
    if not hasattr(LOCAL,'s'):
        LOCAL.s=requests.Session();LOCAL.s.headers.update({'User-Agent':'Mozilla/5.0','Referer':'https://data.eastmoney.com/'})
    return LOCAL.s
def get(url,params=None):
    for attempt in range(3):
        try:
            r=session().get(url,params=params,timeout=20);r.raise_for_status();return r.json()
        except (requests.RequestException,ValueError):
            if attempt==2:raise
            time.sleep(.5+attempt)
def write(path,value):
    temp=path.with_suffix('.tmp');temp.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'),allow_nan=False),encoding='utf8');temp.replace(path)
def report(name,columns,filters,key):
    cache=CACHE/(key+'.json')
    if cache.exists():return json.loads(cache.read_text(encoding='utf8'))
    url='https://datacenter.eastmoney.com/securities/api/data/v1/get' if name=='RPT_F10_ORG_BASICINFO' else 'https://datacenter-web.eastmoney.com/api/data/v1/get'
    params={'reportName':name,'columns':columns,'filter':filters,'pageSize':500,'pageNumber':1,'sortColumns':'SECURITY_CODE','sortTypes':'1'}
    def page(n):
        d=get(url,{**params,'pageNumber':n})
        if not d.get('success') or not d.get('result'):raise ValueError(name+': '+str(d.get('message')))
        return d['result']
    first=page(1);rows=first['data']
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for p in pool.map(page,range(2,first['pages']+1)):rows.extend(p['data'])
    if not first['count']<=len(rows)<=first['count']+5 or len({r['SECURITY_CODE'] for r in rows})!=len(rows):
        write(CACHE/(key+'-audit.json'),{'expected':first['count'],'pages':first['pages'],'rows':rows})
        raise ValueError(name+f' pagination count/identity mismatch: {len(rows)}/{first["count"]}, unique {len({r["SECURITY_CODE"] for r in rows})}, key {key}')
    if len(rows)!=first['count']:print(f'{name}: source count header {first["count"]}, all pages contain {len(rows)} unique codes; using actual returned records.',flush=True)
    write(cache,rows);return rows
def num(value):
    if value is None or isinstance(value,bool):return None
    try:v=float(value);return v if math.isfinite(v) else None
    except (ValueError,TypeError):return None
def financial(rows,period,asof):
    result={}
    for r in rows:
        if r['REPORTDATE'][:10]!=period or not r.get('NOTICE_DATE') or r['NOTICE_DATE'][:10]>asof:continue
        result[r['SECURITY_CODE']]={'period':period,'published':r['NOTICE_DATE'][:10],**{k:num(r.get(v)) for k,v in {'revenue':'TOTAL_OPERATE_INCOME','profit':'PARENT_NETPROFIT','roe':'WEIGHTAVG_ROE','grossMargin':'XSMLL','cashPerShare':'MGJYXJJE','bps':'BPS'}.items()}}
    return result
def get_bars(symbol,start,end,index=False):
    d=get('https://web.ifzq.gtimg.cn/appstock/app/fqkline/get',{'param':f'{symbol},day,{start},{end},500,qfq'})
    if d.get('code')!=0:raise ValueError('行情响应异常')
    item=d.get('data',{}).get(symbol,{})
    raw=item.get('day') if index else item.get('qfqday')
    if not isinstance(raw,list):raise ValueError('未取得明确的前复权行情')
    rows=[]
    for p in raw:
        date=p[0]
        if not start<=date<=end:continue
        o,c,h,l,v=map(float,p[1:6])
        if not all(math.isfinite(x) for x in (o,c,h,l,v)) or min(o,c,h,l)<=0 or h<max(o,c) or l>min(o,c) or v<0:raise ValueError('行情数值异常')
        rows.append([date,c,v])
    if len(rows)<2 or [p[0] for p in rows]!=sorted(set(p[0] for p in rows)):raise ValueError('行情缺失或日期异常')
    return rows
def quotes(asof,profiles):
    today=dt.datetime.now(dt.timezone.utc).date().isoformat();path=CACHE/('qq-quotes-'+today+'.json')
    if path.exists():return json.loads(path.read_text())
    symbols=[r['SECUCODE'][-2:].lower()+r['SECURITY_CODE'] for r in profiles]
    batches=[symbols[i:i+70] for i in range(0,len(symbols),70)]
    result={}
    def batch(symbols):
        r=session().get('https://qt.gtimg.cn/q='+','.join(symbols),timeout=20);r.raise_for_status();r.encoding='gbk';out={}
        for symbol,body in re.findall(r'v_((?:sh|sz)\d{6})="([^"]*)"',r.text):
            f=body.split('~')
            if symbol not in symbols or len(f)<45 or f[2]!=symbol[2:] or not re.fullmatch(r'\d{14}',f[30]):continue
            cap=num(f[44]);stamp=dt.datetime.strptime(f[30],'%Y%m%d%H%M%S').replace(tzinfo=dt.timezone(dt.timedelta(hours=8)))
            if cap and cap>0:out[f[2]]={'marketCap':cap*1e8,'turnover':num(f[38]),'at':stamp.isoformat()}
        return out
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for i in range(0,len(batches)):
            try:result.update(batch(batches[i]))
            except Exception as e:print('Quote batch pending',i,str(e)[:70],flush=True)
    write(path,result);return result

def sina_bars(symbol,start,end):
    raw=session().get('https://quotes.sina.cn/cn/api/jsonp_v2.php/var%20k=/CN_MarketDataService.getKLineData',params={'symbol':symbol,'scale':240,'ma':'no','datalen':500},timeout=18);raw.raise_for_status()
    fact=session().get(f'https://finance.sina.com.cn/realstock/company/{symbol}/qfq.js',timeout=18);fact.raise_for_status()
    a=re.search(r'var\s+k\s*=\s*\((\[[\s\S]*\])\)\s*;?\s*$',raw.text)
    b=re.search(r'var\s+'+symbol+r'qfq\s*=\s*(\{[\s\S]*\})\s*;?\s*(?:/\*[\s\S]*?\*/\s*)?$',fact.text)
    if not a or not b:raise ValueError('新浪历史数据身份或格式异常')
    rows=json.loads(a.group(1));factors=sorted((p['d'],float(p['f'])) for p in json.loads(b.group(1))['data'])
    points=[]
    for r in rows:
        d=r['day'][:10]
        if not start<=d<=end:continue
        values=[f for date,f in factors if date<=d]
        if not values or values[-1]<=0:raise ValueError('复权因子不足')
        c=float(r['close'])/values[-1];v=float(r['volume'])
        if not math.isfinite(c) or c<=0 or not math.isfinite(v) or v<0:raise ValueError('行情数值异常')
        points.append([d,c,v])
    if len(points)<2 or [p[0] for p in points]!=sorted(set(p[0] for p in points)):raise ValueError('历史行情不足或日期异常')
    return points

def main():
    current=json.loads((ROOT/'stock-picks-raw.json').read_text(encoding='utf8'));asof=current['asof'];today=dt.datetime.now(dt.timezone.utc).date().isoformat()
    start=(dt.date.fromisoformat(asof)-dt.timedelta(days=369)).isoformat()
    y=int(asof[:4]);md=asof[5:]
    period=f'{y}-09-30' if md>='11-01' else f'{y}-06-30' if md>='09-01' else f'{y}-03-31' if md>='05-01' else f'{y-1}-09-30'
    previous=str(int(period[:4])-1)+period[4:]
    years=[y-1,y-2,y-3] if md>='05-01' else [y-2,y-3,y-4]
    cols='SECUCODE,SECURITY_CODE,SECURITY_NAME_ABBR,MAIN_BUSINESS,PRODUCT_NAME,LISTING_DATE,LISTING_STATE,SECURITY_TYPE_CODE,BOARD_CODE_BK_1LEVEL,BOARD_NAME_1LEVEL,BOARD_CODE_BK_2LEVEL,BOARD_NAME_2LEVEL,BOARD_CODE_BK_3LEVEL,BOARD_NAME_3LEVEL'
    profiles=report('RPT_F10_ORG_BASICINFO',cols,'(SECURITY_TYPE_CODE="058001001")(LISTING_STATE="0")','profiles-'+today)
    profiles=[r for r in profiles if re.fullmatch(r'\d{6}\.(SH|SZ)',r.get('SECUCODE','')) and r.get('LISTING_DATE') and r['LISTING_DATE'][:10]<=asof]
    if len(profiles)<4500:raise ValueError('在市沪深A股名单异常缩减')
    finance={}
    for p in dict.fromkeys([period,previous]+[f'{y}-12-31' for y in years]):
        raw=report('RPT_LICO_FN_CPD','ALL',f'(REPORTDATE=\'{p}\')(SECURITY_TYPE_CODE="058001001")','finance-'+p+'-'+asof)
        finance[p]=financial(raw,p,asof);print('Financial report',p,len(finance[p]),flush=True)
    cash={}
    try:
        raw=report('RPT_DMSK_FN_CASHFLOW','SECURITY_CODE,REPORT_DATE,NOTICE_DATE,NETCASH_OPERATE',f'(REPORT_DATE=\'{period}\')','cash-'+period+'-'+asof)
        cash={r['SECURITY_CODE']:num(r.get('NETCASH_OPERATE')) for r in raw if r.get('NOTICE_DATE') and r['NOTICE_DATE'][:10]<=asof and r['REPORT_DATE'][:10]==period}
    except Exception as e:print('Cash flow unavailable:',str(e)[:160],flush=True)
    try:quote=quotes(asof,profiles)
    except Exception as e:print('Quotes unavailable:',str(e)[:160],flush=True);quote={}
    calendar_cache=CACHE/('calendar-'+asof+'.json')
    if calendar_cache.exists():calendar=json.loads(calendar_cache.read_text())
    else:
        response=get('https://push2his.eastmoney.com/api/qt/stock/kline/get',{'secid':'1.000300','fields1':'f1,f2,f3,f4,f5,f6','fields2':'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61','klt':101,'fqt':1,'beg':start.replace('-',''),'end':asof.replace('-',''),'lmt':500})
        if response.get('data',{}).get('code')!='000300':raise ValueError('日历身份异常')
        calendar=[p.split(',')[0] for p in response['data']['klines'] if start<=p.split(',')[0]<=asof];write(calendar_cache,calendar)
    if calendar[-1]!=asof:raise ValueError('交易日历日期不匹配')
    print('Preparing peer snapshots and selected history seeds; cutoff',asof,flush=True)
    home=json.loads((ROOT/'dist/client/stock-picks.json').read_text(encoding='utf8'))
    seeds={s['code'] for s in home['matches']}|{r['SECURITY_CODE'] for r in profiles if r.get('BOARD_NAME_3LEVEL')=='白酒Ⅲ'}
    def one(r):
        code=r['SECURITY_CODE'];symbol=r['SECUCODE'][-2:].lower()+code
        cached=CACHE/('sina-'+code+'-'+asof+'.json')
        if cached.exists():return r,json.loads(cached.read_text()),None
        if code not in seeds:return r,[],None
        try:
            points=sina_bars(symbol,start,asof);write(cached,points);return r,points,None
        except Exception as e:return r,[],str(e)[:80]
    groups={};stocks=[];good=0
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for i,(r,points,error) in enumerate(pool.map(one,profiles),1):
            code=r['SECURITY_CODE'];group=r.get('BOARD_CODE_BK_3LEVEL') or r.get('BOARD_CODE_BK_2LEVEL') or 'unclassified'
            groupName=r.get('BOARD_NAME_3LEVEL') or r.get('BOARD_NAME_2LEVEL') or '未分类'
            row={'code':code,'name':r['SECURITY_NAME_ABBR'],'symbol':r['SECUCODE'][-2:].lower()+code,'industry':group,'business':r.get('MAIN_BUSINESS') or '',
                 'products':'、'.join(dict.fromkeys((r.get('PRODUCT_NAME') or '').split('、'))),'listed':r['LISTING_DATE'][:10],
                 'finance':finance[period].get(code),'previous':finance[previous].get(code),'annual':[finance[f'{y}-12-31'].get(code) for y in years],
                 'quote':quote.get(code),'points':points,'historyError':error}
            if row['finance']:row['finance']['cashflow']=cash.get(code)
            groups.setdefault(group,{'id':group,'name':groupName,'parent':r.get('BOARD_NAME_2LEVEL'),'sector':r.get('BOARD_NAME_1LEVEL'),'stocks':[]})['stocks'].append(row)
            stocks.append({k:row[k] for k in ['code','name','industry','symbol']});good+=bool(points and points[-1][0]==asof)
            if i%100==0:print('Histories',i,'/',len(profiles),'complete latest:',good,flush=True)
    # Histories are loaded on demand by industry; no incomplete data is fabricated.
    meta={'asof':asof,'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'profileAsOf':today,'financialPeriod':period,'previousPeriod':previous,'annualYears':years,'calendar':calendar,'total':len(stocks),'historyAvailable':good,
          'classification':'东方财富三级行业；缺失时使用二级行业','priceBasis':'新浪日收盘价按新浪前复权因子调整，非分红再投资收益','sources':[{'label':'东方财富行业与公司资料','url':'https://emweb.securities.eastmoney.com/'},{'label':'东方财富财务报表','url':'https://data.eastmoney.com/bbsj/'+period[:4]+period[5:7]+'.html'},{'label':'腾讯市值与换手率','url':'https://gu.qq.com/'},{'label':'新浪历史日线与复权因子','url':'https://finance.sina.com.cn/'}]}
    index={**meta,'stocks':stocks,'industries':[{k:v for k,v in g.items() if k!='stocks'}|{'count':len(g['stocks'])} for g in groups.values()]}
    for code,g in groups.items():write(DEST/(code+'.json'),{**meta,**g})
    write(DEST/'index.json',index)
    print('Saved',len(stocks),'stocks,',len(groups),'industries; histories',good,flush=True)
if __name__=='__main__':main()
