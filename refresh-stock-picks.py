"""Refresh the home page's CURRENT CSI 300 observation pool from public daily bars."""
import concurrent.futures,json,pathlib,re,time,sys
from datetime import date,timedelta,datetime,timezone
import requests

ROOT=pathlib.Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'python-deps'))
import xlrd
UNIVERSE_URL='https://oss-ch.csindex.com.cn/static/html/csindex/public/uploads/file/autofile/cons/000300cons.xls'
def get(url,params):
    r=requests.get(url,params=params,headers={'User-Agent':'Mozilla/5.0'},timeout=25)
    r.raise_for_status();return r.json()
def bars(symbol,start,end,index=False):
    body=get('https://web.ifzq.gtimg.cn/appstock/app/fqkline/get',{'param':f'{symbol},day,{start},{end},500,qfq'})
    if body.get('code')!=0:raise ValueError('行情响应异常')
    item=body['data'][symbol]
    values=item.get('day') if index else item.get('qfqday')
    if not isinstance(values,list):raise ValueError('未取得明确的前复权日线')
    result=[]
    for p in values:
        d=p[0]
        if not start<=d<=end:continue
        if date.fromisoformat(d).isoformat()!=d:raise ValueError('日期异常')
        o,c,h,l,v=map(float,p[1:6])
        if min(o,c,h,l)<=0 or h<max(o,c) or l>min(o,c) or v<0:raise ValueError('价格异常')
        result.append([d,c])
    if len(result)<2 or [p[0] for p in result]!=sorted(set(p[0] for p in result)):raise ValueError('日期重复或历史不足')
    return result
def main():
    source=(ROOT/'dist/index.html').read_text(encoding='utf-8')
    end=re.search(r'"asof"\s*:\s*"(\d{4}-\d{2}-\d{2})"',source).group(1)
    start=(date.fromisoformat(end)-timedelta(days=179)).isoformat()
    reference=bars('sh000300',start,end,True);asof=reference[-1][0]
    response=requests.get(UNIVERSE_URL,timeout=25);response.raise_for_status()
    sheet=xlrd.open_workbook(file_contents=response.content).sheet_by_index(0)
    universe=[];universe_dates=set()
    for i in range(1,sheet.nrows):
        fields=sheet.row_values(i)
        if str(fields[1]).zfill(6)!='000300':raise ValueError('官方指数身份不匹配')
        d=str(fields[0]);universe_dates.add(d[:4]+'-'+d[4:6]+'-'+d[6:8])
        code=str(fields[4]).zfill(6);exchange=fields[7]
        if exchange not in ['上海证券交易所','深圳证券交易所']:raise ValueError('未知交易所')
        universe.append({'code':code,'name':fields[5],'symbol':('sh' if exchange=='上海证券交易所' else 'sz')+code})
    if len(universe)!=300 or len({r['code'] for r in universe})!=300 or len(universe_dates)!=1:raise ValueError('官方成分名单不完整')
    universe_asof=next(iter(universe_dates))
    previous_path=ROOT/'stock-picks-raw.json';previous=json.loads(previous_path.read_text(encoding='utf-8')) if previous_path.exists() else {}
    cached={r['code']:r for r in previous.get('stocks',[])} if previous.get('asof')==asof and previous.get('historyStart')==start else {}
    def one(r):
        code=r['code'];symbol=r['symbol'];name=r['name']
        if not re.fullmatch(r'(sh|sz)\d{6}',symbol) or symbol[2:]!=code:raise ValueError('股票身份异常')
        base={'code':code,'symbol':symbol,'name':name,'source':'https://gu.qq.com/'+symbol}
        try:
            points=cached.get(code,{}).get('points') or bars(symbol,start,asof)
            if points[-1][0]!=asof:raise ValueError('最新交易日行情未齐')
            base.update(points=points)
        except Exception as e:base.update(error='行情来源暂不可用，等待下次更新' if isinstance(e,requests.RequestException) else str(e)[:100],points=[])
        return base
    stocks=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for n,r in enumerate(pool.map(one,universe),1):
            stocks.append(r)
            if n%50==0:print('Loaded',n,'/',len(universe),flush=True)
    count=sum(bool(s['points']) for s in stocks)
    if count<240:raise ValueError(f'仅{count}/300份行情成功，保留此前快照')
    out={'asof':asof,'requestedAsOf':end,'historyStart':start,'checkedAt':datetime.now(timezone.utc).isoformat(),'universe':'中证指数官方沪深300成分观察池','universeAsOf':universe_asof,'universeSource':UNIVERSE_URL,'calendar':[p[0] for p in reference if p[0]<=asof],'stocks':stocks}
    target=ROOT/'stock-picks-raw.json';tmp=target.with_suffix('.json.tmp');tmp.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf-8');tmp.replace(target)
    print('Saved',count,'/',len(stocks),'as of',asof,flush=True)
if __name__=='__main__':main()
