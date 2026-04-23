-- ============================================================
-- config  (key-value store: token, symbol, security_id, risk)
-- ============================================================
create table if not exists config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz default now()
);

-- seed defaults (update values from the dashboard settings page)
insert into config (key, value) values
  ('dhan_access_token', ''),
  ('dhan_client_id',    ''),
  ('symbol',            'RELIANCE'),
  ('security_id',       '2885'),
  ('risk_per_trade',    '10000')
on conflict (key) do nothing;

-- ============================================================
-- signals  (one row per scan result)
-- ============================================================
create table if not exists signals (
  id             uuid default gen_random_uuid() primary key,
  symbol         text        not null,
  signal_type    text        not null,  -- BUY | EXIT | ADD | TRAIL | NO_SIGNAL
  price          numeric     not null,
  stop_loss      numeric,
  quantity       integer,
  risk_per_share numeric,
  pnl            numeric,
  weekly_rsi     numeric,
  monthly_rsi    numeric,
  weekly_ma20    numeric,
  monthly_ma20   numeric,
  notes          text,
  scanned_at     timestamptz default now()
);

-- ============================================================
-- positions  (single open position per symbol)
-- ============================================================
create table if not exists positions (
  id               uuid default gen_random_uuid() primary key,
  symbol           text    not null unique,
  quantity         integer not null default 0,
  buy_price        numeric not null default 0,
  stop_loss        numeric not null default 0,
  position_added   boolean          default false,
  is_open          boolean          default false,
  opened_at        timestamptz      default now(),
  updated_at       timestamptz      default now()
);
