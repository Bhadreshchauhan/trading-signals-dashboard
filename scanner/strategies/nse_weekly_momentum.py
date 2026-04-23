import logging
import pandas as pd
import ta

logger = logging.getLogger(__name__)


def compute_indicators(daily_df: pd.DataFrame):
    weekly = daily_df.resample('W-FRI').agg({
        'open': 'first', 'high': 'max', 'low': 'min', 'close': 'last', 'volume': 'sum'
    }).dropna(subset=['close'])
    weekly['rsi']  = ta.momentum.RSIIndicator(weekly['close'], window=14).rsi()
    weekly['ma20'] = weekly['close'].rolling(20).mean()

    monthly = daily_df.resample('ME').agg({
        'open': 'first', 'high': 'max', 'low': 'min', 'close': 'last', 'volume': 'sum'
    }).dropna(subset=['close'])
    monthly['rsi']  = ta.momentum.RSIIndicator(monthly['close'], window=14).rsi()
    monthly['ma20'] = monthly['close'].rolling(20).mean()

    logger.info(f"Weekly rows: {len(weekly)} | Monthly rows: {len(monthly)}")
    return weekly, monthly


def run(daily_df: pd.DataFrame, position: dict, config: dict) -> dict:
    """
    Runs the NSE Weekly Momentum strategy.

    Args:
        daily_df:  Daily OHLCV DataFrame with lowercase columns, DatetimeIndex (tz-naive).
        position:  Current position state from Supabase positions table (or empty dict).
        config:    Config dict with 'symbol', 'risk_per_trade' keys.

    Returns:
        signal dict with keys:
            signal_type, symbol, price, stop_loss, quantity,
            risk_per_share, pnl, weekly_rsi, monthly_rsi,
            weekly_ma20, monthly_ma20, notes,
            updated_position (dict or None — write back to DB if set)
    """
    symbol         = config['symbol']
    risk_per_trade = int(config['risk_per_trade'])

    if len(daily_df) < 30:
        raise ValueError(f"Not enough data: {len(daily_df)} rows")

    weekly, monthly = compute_indicators(daily_df)

    if len(weekly) < 2 or len(monthly) < 1:
        raise ValueError("Not enough weekly/monthly data after resampling")

    w_curr  = weekly.iloc[-1]
    w_prev  = weekly.iloc[-2]
    m_curr  = monthly.iloc[-1]

    price        = float(w_curr['close'])
    weekly_ma20  = float(w_curr['ma20'])  if pd.notna(w_curr['ma20'])  else 0.0
    weekly_rsi   = float(w_curr['rsi'])   if pd.notna(w_curr['rsi'])   else 0.0
    prev_rsi     = float(w_prev['rsi'])   if pd.notna(w_prev['rsi'])   else 0.0
    monthly_rsi  = float(m_curr['rsi'])   if pd.notna(m_curr['rsi'])   else 0.0
    monthly_ma20 = float(m_curr['ma20'])  if pd.notna(m_curr['ma20'])  else 0.0
    monthly_close = float(m_curr['close'])

    monthly_ok    = monthly_rsi > 60 and monthly_close > monthly_ma20
    rsi_crossover = prev_rsi < 60 and weekly_rsi > 60

    is_open   = position.get('is_open', False)
    buy_price = float(position.get('buy_price', 0))
    qty       = int(position.get('quantity', 0))
    old_sl    = float(position.get('stop_loss', 0))
    pos_added = bool(position.get('position_added', False))

    base = dict(
        symbol=symbol, price=price,
        weekly_rsi=weekly_rsi, monthly_rsi=monthly_rsi,
        weekly_ma20=weekly_ma20, monthly_ma20=monthly_ma20,
        updated_position=None,
    )

    # ---- No open position: look for entry ----
    if not is_open:
        if monthly_ok and rsi_crossover:
            risk_per_share = price - weekly_ma20
            if risk_per_share <= 0:
                return {**base, 'signal_type': 'NO_SIGNAL', 'stop_loss': weekly_ma20,
                        'quantity': None, 'risk_per_share': None, 'pnl': None,
                        'notes': 'Entry at or below MA20 — no valid risk'}

            new_qty = int(risk_per_trade / risk_per_share)
            new_pos = {'symbol': symbol, 'quantity': new_qty, 'buy_price': price,
                       'stop_loss': weekly_ma20, 'position_added': False, 'is_open': True}
            return {**base, 'signal_type': 'BUY', 'stop_loss': weekly_ma20,
                    'quantity': new_qty, 'risk_per_share': risk_per_share, 'pnl': None,
                    'notes': 'Enter Monday open', 'updated_position': new_pos}

        return {**base, 'signal_type': 'NO_SIGNAL', 'stop_loss': weekly_ma20,
                'quantity': None, 'risk_per_share': None, 'pnl': None, 'notes': None}

    # ---- Position open: trail SL, check exit/add ----
    if price < weekly_ma20:
        pnl     = (price - buy_price) * qty
        new_pos = {'symbol': symbol, 'quantity': 0, 'buy_price': 0,
                   'stop_loss': 0, 'position_added': False, 'is_open': False}
        return {**base, 'signal_type': 'EXIT', 'stop_loss': weekly_ma20,
                'quantity': qty, 'risk_per_share': None, 'pnl': pnl,
                'notes': 'Exit Monday open', 'updated_position': new_pos}

    if weekly_ma20 >= buy_price and not pos_added:
        risk_per_share = price - weekly_ma20
        if risk_per_share > 0:
            add_qty = int(risk_per_trade / risk_per_share)
            new_pos = {'symbol': symbol, 'quantity': qty + add_qty, 'buy_price': buy_price,
                       'stop_loss': weekly_ma20, 'position_added': True, 'is_open': True}
            return {**base, 'signal_type': 'ADD', 'stop_loss': weekly_ma20,
                    'quantity': add_qty, 'risk_per_share': risk_per_share, 'pnl': None,
                    'notes': f'Total qty after add: {qty + add_qty}', 'updated_position': new_pos}

    new_pos = {**position, 'stop_loss': weekly_ma20}
    return {**base, 'signal_type': 'TRAIL', 'stop_loss': weekly_ma20,
            'quantity': qty, 'risk_per_share': None,
            'pnl': (price - buy_price) * qty,
            'notes': f'SL moved from {old_sl:.2f} to {weekly_ma20:.2f}',
            'updated_position': new_pos}
