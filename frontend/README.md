# WealthEdge Frontend

Modern stock screener and financial intelligence platform for Indian equities inspired by Screener.in with Groww Green design language.

## Quick Start
1. `npm install`
2. `npm run dev`

### Development Server:
- `http://localhost:5173`
- Host: `127.0.0.1`

### Backend API:
- `http://localhost:8080` (Spring Boot API)

### Application Routes:
- `/dashboard` — Market Overview, Sector Indices & Watchlists
- `/stocks` — Screener.in style Equity Screens & Multi-filter Stock Discovery
- `/stocks/:symbol` — Deep Screener Analysis (Key Ratios, Interactive DMA Chart, Pros & Cons, Peers, Quarterly Results, P&L, Balance Sheet, Cash Flows, Shareholding)
- `/portfolio` — Holdings Ledger, Weighted Average Buy Price & Realized/Unrealized P&L
- `/watchlists` — Real-time Stock Tracking Lists
- `/transactions` — Immutable Trade Audit Trail
- `/analysis` — Technical & Fundamental Research Workbench
- `/login` / `/register` / `/forgot-password` — Secure Authentication & Google OAuth2
