import os
import logging
from supabase import create_client, Client

logger = logging.getLogger(__name__)

_client: Client | None = None


def client() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _client = create_client(url, key)
    return _client


def load_config() -> dict:
    rows = client().table("config").select("key, value").execute().data
    return {r["key"]: r["value"] for r in rows}


def save_config_key(key: str, value: str):
    client().table("config").upsert({"key": key, "value": value}).execute()


def load_position(symbol: str) -> dict:
    rows = (client().table("positions")
            .select("*")
            .eq("symbol", symbol)
            .eq("is_open", True)
            .limit(1)
            .execute().data)
    return rows[0] if rows else {}


def save_position(pos: dict):
    from datetime import datetime, timezone
    pos["updated_at"] = datetime.now(timezone.utc).isoformat()
    client().table("positions").upsert(pos, on_conflict="symbol").execute()
    logger.info(f"Position saved: {pos}")


def insert_signal(signal: dict):
    row = {k: signal[k] for k in (
        "symbol", "signal_type", "price", "stop_loss", "quantity",
        "risk_per_share", "pnl", "weekly_rsi", "monthly_rsi",
        "weekly_ma20", "monthly_ma20", "notes"
    )}
    client().table("signals").insert(row).execute()
    logger.info(f"Signal inserted: {row['signal_type']} | {row['symbol']}")
