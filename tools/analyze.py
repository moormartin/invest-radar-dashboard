import csv, json
from datetime import datetime

def load(path):
    rows = []
    with open(path) as f:
        r = csv.DictReader(f, delimiter=';')
        for row in r:
            rows.append({
                'date': row['datetime'],
                'open': float(row['open']),
                'high': float(row['high']),
                'low': float(row['low']),
                'close': float(row['close']),
            })
    rows.reverse()  # chronological ascending
    return rows

def rsi(closes, period=14):
    if len(closes) < period+1:
        return [None]*len(closes)
    deltas = [closes[i]-closes[i-1] for i in range(1,len(closes))]
    gains = [max(d,0) for d in deltas]
    losses = [max(-d,0) for d in deltas]
    avg_gain = sum(gains[:period])/period
    avg_loss = sum(losses[:period])/period
    rsis = [None]*(period)
    rs = avg_gain/avg_loss if avg_loss!=0 else float('inf')
    rsis.append(100 - 100/(1+rs) if avg_loss!=0 else 100)
    for i in range(period, len(gains)):
        avg_gain = (avg_gain*(period-1)+gains[i])/period
        avg_loss = (avg_loss*(period-1)+losses[i])/period
        rs = avg_gain/avg_loss if avg_loss!=0 else float('inf')
        rsis.append(100 - 100/(1+rs) if avg_loss!=0 else 100)
    return rsis

def ema(values, period):
    k = 2/(period+1)
    out = []
    ema_prev = None
    for v in values:
        if ema_prev is None:
            ema_prev = v
        else:
            ema_prev = v*k + ema_prev*(1-k)
        out.append(ema_prev)
    return out

def macd(closes, fast=12, slow=26, signal=9):
    ema_fast = ema(closes, fast)
    ema_slow = ema(closes, slow)
    macd_line = [f-s for f,s in zip(ema_fast, ema_slow)]
    signal_line = ema(macd_line, signal)
    hist = [m-s for m,s in zip(macd_line, signal_line)]
    return macd_line, signal_line, hist

def zigzag(rows, pct=7.0):
    # simple zigzag pivot detection on close/high/low
    pivots = []
    if not rows:
        return pivots
    last_pivot_idx = 0
    last_pivot_price = rows[0]['close']
    direction = 0  # 0 unknown, 1 up, -1 down
    candidate_idx = 0
    candidate_price = rows[0]['close']
    for i in range(1, len(rows)):
        price_high = rows[i]['high']
        price_low = rows[i]['low']
        if direction <= 0:
            # looking for a low candidate, watch for reversal up
            if price_low < candidate_price or direction == 0 and i==1:
                pass
        # generic approach: track running max/min since last pivot and check retracement
    # Implement via running extreme + threshold
    pivots = []
    ext_idx = 0
    ext_price = rows[0]['close']
    trend = 0
    for i in range(1, len(rows)):
        c = rows[i]['close']
        h = rows[i]['high']
        l = rows[i]['low']
        if trend >= 0:
            # currently up or unknown, track max via high
            if h > ext_price:
                ext_price = h
                ext_idx = i
            # check reversal: drop from ext_price by pct using low
            if (ext_price - l)/ext_price*100 >= pct:
                pivots.append({'idx': ext_idx, 'date': rows[ext_idx]['date'], 'price': ext_price, 'type':'high'})
                trend = -1
                ext_price = l
                ext_idx = i
        if trend <= 0:
            if l < ext_price or trend==0:
                if trend==0:
                    pass
            if l < ext_price:
                ext_price = l
                ext_idx = i
            if (h - ext_price)/ext_price*100 >= pct:
                pivots.append({'idx': ext_idx, 'date': rows[ext_idx]['date'], 'price': ext_price, 'type':'low'})
                trend = 1
                ext_price = h
                ext_idx = i
    # append final extreme
    pivots.append({'idx': ext_idx, 'date': rows[ext_idx]['date'], 'price': ext_price, 'type': 'high' if trend>=0 else 'low'})
    return pivots

def analyze(path, name, pct=7.0):
    rows = load(path)
    closes = [r['close'] for r in rows]
    rsis = rsi(closes, 14)
    macd_line, signal_line, hist = macd(closes)
    pivots = zigzag(rows, pct)
    latest = rows[-1]
    result = {
        'name': name,
        'n': len(rows),
        'first_date': rows[0]['date'],
        'last_date': rows[-1]['date'],
        'last_close': latest['close'],
        'rsi14': rsis[-1],
        'rsi_series_tail': rsis[-10:],
        'macd': macd_line[-1],
        'macd_signal': signal_line[-1],
        'macd_hist': hist[-1],
        'macd_hist_tail': hist[-10:],
        'pivots': pivots,
        '52w_high': max(r['high'] for r in rows[-365:]) if len(rows)>=365 else max(r['high'] for r in rows),
        '52w_low': min(r['low'] for r in rows[-365:]) if len(rows)>=365 else min(r['low'] for r in rows),
    }
    return result, rows

for path, name, pct in [('/tmp/btc_daily.csv','BTC',6.0), ('/tmp/eth_daily.csv','ETH',7.0)]:
    res, rows = analyze(path, name, pct)
    print('='*20, name, '='*20)
    print('Last close:', res['last_close'], 'date', res['last_date'])
    print('RSI14:', round(res['rsi14'],1))
    print('MACD:', round(res['macd'],1), 'Signal:', round(res['macd_signal'],1), 'Hist:', round(res['macd_hist'],1))
    print('MACD hist tail:', [round(x,1) for x in res['macd_hist_tail']])
    print('52w range:', res['52w_low'], '-', res['52w_high'])
    print('Pivots (last 15):')
    for p in res['pivots'][-15:]:
        print(' ', p['date'], p['type'], round(p['price'],1))
    with open(f'/tmp/{name.lower()}_result.json','w') as f:
        json.dump(res, f, indent=2)
