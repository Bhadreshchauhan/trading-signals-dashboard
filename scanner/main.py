import logging
import sys

import db
from dhan_client import get_daily_ohlcv
from strategies.nse_weekly_momentum import run

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s'
)
logger = logging.getLogger(__name__)


def scan():
    config = db.load_config()

    client_id    = config.get("dhan_client_id", "")
    access_token = config.get("dhan_access_token", "")
    security_id  = config.get("security_id", "")
    symbol       = config.get("symbol", "")

    if not access_token or not client_id or not security_id:
        logger.error("Missing Dhan credentials in config. Update them from the dashboard settings.")
        sys.exit(1)

    logger.info(f"=== Scan started | symbol={symbol} | security_id={security_id} ===")

    daily_df = get_daily_ohlcv(client_id, access_token, security_id)
    position = db.load_position(symbol)
    signal   = run(daily_df, position, config)

    logger.info(f"Signal: {signal['signal_type']} | price={signal['price']:.2f}")

    db.insert_signal(signal)

    if signal.get("updated_position"):
        db.save_position(signal["updated_position"])

    logger.info("=== Scan complete ===")


if __name__ == "__main__":
    scan()
