import logging
from datetime import date, timedelta

import pandas as pd
from dhanhq import dhanhq

logger = logging.getLogger(__name__)

EXCHANGE_SEGMENT = "NSE_EQ"
INSTRUMENT_TYPE  = "EQUITY"


def get_daily_ohlcv(client_id: str, access_token: str, security_id: str) -> pd.DataFrame:
    dhan      = dhanhq(client_id, access_token)
    from_date = "2015-01-01"
    to_date   = date.today().strftime("%Y-%m-%d")

    logger.info(f"Fetching Dhan history | security_id={security_id} | {from_date} → {to_date}")

    resp = dhan.historical_daily_data(
        security_id=security_id,
        exchange_segment=EXCHANGE_SEGMENT,
        instrument_type=INSTRUMENT_TYPE,
        expiry_code=0,
        from_date=from_date,
        to_date=to_date,
    )

    if resp.get('status') == 'failure' or 'data' not in resp:
        raise ValueError(f"Dhan API error: {resp.get('remarks', resp)}")

    raw = resp['data']
    df  = pd.DataFrame({
        'open':   raw['open'],
        'high':   raw['high'],
        'low':    raw['low'],
        'close':  raw['close'],
        'volume': raw['volume'],
    }, index=pd.to_datetime(raw['timestamp'], unit='s'))

    df.index = df.index.tz_localize(None)
    df       = df[df['close'].notna()].sort_index()

    logger.info(f"Dhan data: {len(df)} candles ({df.index[0].date()} → {df.index[-1].date()})")
    return df
