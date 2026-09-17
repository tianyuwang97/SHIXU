# A-share historical rehearsal data

This is a fixed 30-stock Shanghai/Shenzhen main-board sample, not a live or complete A-share screener. It excludes ST, new listings, STAR, ChiNext, Beijing and delisted securities. Selection of surviving companies introduces survivorship bias; results are not representative of the whole market.

## Sources and representation

- Raw daily OHLC and volume: Tencent Finance `web.ifzq.gtimg.cn/appstock/app/fqkline/get`, 2023-06-01 through 2025-12-31. Volume is in 100-share lots. Each stock retains its source URL.
- Implemented cash dividends and bonus/conversion shares: Sina Finance company share-bonus tables. Each action retains announcement, record, ex and listing dates. Unimplemented proposals were excluded. Stocks with rights issues in the interval were rejected by the importer.
- `bars`: date, open, close, high, low, volume in lots. Missing sessions remain missing and cannot be filled with synthetic prices.
- `points`: date, close, cash per share, bonus ratio, chronological total-return factor. The factor uses only corporate actions that have already occurred; screening never uses a future-adjusted price series.
- Company industries are broad descriptive labels. They are not historical index membership data or trading signals.

The importer and raw caches live outside this deployable checkout, in `work/fetch_stocks.py` and `work/stock_cache/`.

## Simulation boundaries

At the simulated 09:00 decision time, only prior sessions' prices and available events are sent to the browser. Orders use the current session's as-yet-unknown real open when the user advances. Screens show raw-price candles; screening uses chronological total-return factors to avoid artificial dividend/split breakouts.

Teaching assumptions are displayed in the UI: 100-share purchase lots, T+1 sale eligibility, conservative opening-limit rejection, missing/zero-volume rejection, 1% daily-volume order cap, 0.05% slippage, simplified commission and stamp duty. Gross dividends and bonus shares are credited on the ex-date; actual payment delays, dividend tax and bonus-share listing delays are not modeled. No claim is made that all simulated orders could execute in a real order book.

Corporate-action ledger tests cover all 30 stocks for a one-year buy-and-hold run. Account profit reconciles to per-stock contributions and the first-purchase comparison. Future-data mutation, T+1, rejection/refund, lot sizing, period bounds, batch advancement and asset/visitor isolation are covered in the expansion tests under `work/`.
