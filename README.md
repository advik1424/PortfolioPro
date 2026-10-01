# WealthEdge — Stock Screener & Portfolio Financial Intelligence System

**WealthEdge** is an enterprise-grade stock screener, valuation, and market tracking platform for Indian equities. Built with the clean, data-first philosophy of **Screener.in** and styled in an intuitive **Groww Green (`#00D09C`) & White** interface, WealthEdge provides real-time portfolio valuation, weighted average acquisition pricing, realized/unrealized profit & loss calculations, immutable transaction ledgers, watchlist monitoring, technical indicators, and fundamental financial analysis.

---

## 🏗️ Architecture & Tech Stack

```
WealthEdge/
├── backend/          # Spring Boot 3, Java 21, Spring Security, JWT, JPA/Hibernate, Twelve Data API
├── frontend/         # React 19, Vite, React Router v7, Screener.in Layout & Groww Green CSS
├── .gitignore        # Unified Git ignore rules
├── Dockerfile        # Production multi-stage Docker build
├── netlify.toml      # Frontend SPA routing configuration
└── README.md         # Project documentation
```

### Backend:
- **Language & Runtime**: Java 21 LTS
- **Framework**: Spring Boot 3.x / 4.x
- **Security**: Spring Security 6 with Stateless JWT Bearer Authentication & Google OAuth2 Client
- **Persistence**: Spring Data JPA with Hibernate ORM
- **Database**: PostgreSQL (Render Cloud), MySQL 8.x (Local Workbench), In-Memory H2 (Fallback)
- **Market Data Integration**: Twelve Data REST API (Real-time stock quotes, historical candles, technical indicators)
- **Mathematical Accuracy**: High-precision `BigDecimal` arithmetic for weighted average cost basis and P&L calculations

### Frontend:
- **Library**: React 19.x with functional hooks
- **Bundler & Tooling**: Vite 7.x
- **Routing**: React Router v7 with protected route wrappers
- **Styling**: Screener.in bespoke financial design system with Groww Green (`#00D09C`) & Pure White palette (`styles.css`)
- **Key Features**:
  - Global `Ctrl + K` debounced stock search modal
  - Responsive SVG price charts with 50-DMA golden overlay (Zero external charting library overhead)
  - Right-aligned monospace tabular numerical values (`font-variant-numeric: tabular-nums`)
  - Semantic profit/loss badge indicators
  - Dual-mode order execution modal (`BUY` and `SELL` with holding validation)
  - Dynamic Pros & Cons automated financial health evaluator
  - Peer comparison benchmarking table across sectors
  - 8-quarter Quarterly Results, Multi-year P&L, Balance Sheet, Cash Flow, and Shareholding breakdown tables

---

## 🌟 Key Features

1. **Exact Screener.in Financial Interface**:
   - 9-Key Ratios summary bar: Market Cap, CMP, 52W High/Low, Stock P/E, Book Value, Dividend Yield %, ROCE %, ROE %, Face Value.
   - Sub-navigation anchor bar jumping directly to Chart, Analysis, Peers, Quarterly Results, Profit & Loss, Balance Sheet, Cash Flow, and Shareholding.
   - 4 Compounded Growth metrics boxes: Sales Growth, Profit Growth, Stock Price CAGR, Return on Equity (ROE).

2. **Authoritative Financial Valuation**:
   - Backend-driven calculations: Total Invested, Current Valuation, Unrealized P&L, Realized P&L.
   - Weighted average buy price recalculated automatically upon multiple BUY transactions.
   - Realized P/L calculated and recorded when shares are partially or fully sold.

3. **Order Execution & Trading Modal**:
   - Buy and Sell transactions recorded directly from Stock Detail, Watchlists, or Portfolio.
   - Pre-validation ensures users cannot sell more shares than their active holding quantity.
   - Real-time estimated order value calculation (`Qty × Price`) and CMP shortcut.

4. **Immutable Transaction History Ledger**:
   - Complete audit trail of all executed trades (`/transactions`).
   - Filter by `ALL`, `BUY`, or `SELL` with live search by stock symbol.

5. **Interactive Watchlist Workspace**:
   - Multi-watchlist support with instant tab switching.
   - Real-time stock monitor table with CMP and day change percentage.
   - Search & add stocks modal and stock removal.

6. **Deep Stock Research & Screener Table**:
   - Search across synchronized stock universe with sorting by Symbol, Company, Exchange, Sector, or Price.
   - Stock detail page featuring live price spread, high/low range, valuation metrics, and technical indicators (SMA, EMA, RSI with status badges, MACD, Support, Resistance).
   - Historical close price movements rendered via responsive SVG line & area charts.

---

## 🚀 Getting Started

### Prerequisites:
- **JDK 21** or later
- **Node.js 18+** & npm
- **MySQL Server 8.0+** (or Render PostgreSQL)

### 1. Database Setup:
Create the database in MySQL (optional if using Render cloud PostgreSQL or H2):
```sql
CREATE DATABASE wealthedge;
```

### 2. Backend Setup & Run:
Configure your credentials in `backend/src/main/resources/application.properties` or set environment variables:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/wealthedge?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
twelvedata.api.key=YOUR_TWELVE_DATA_API_KEY
```

Run the Spring Boot application:
```bash
cd backend
./mvnw spring-boot:run
```
Backend will start on `http://localhost:8080`.

### 3. Frontend Setup & Run:
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:5173`.

---

## 🔒 API Endpoints Overview

| Domain | Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & issue JWT |
| **Auth** | `POST` | `/api/users` | Register a new user |
| **Portfolio** | `GET` | `/api/portfolio/summary` | Portfolio summary & metrics |
| **Portfolio** | `GET` | `/api/portfolio/holdings` | All active user stock holdings |
| **Portfolio** | `GET` | `/api/portfolio/holdings/{stockId}` | Holding position for stock |
| **Trading** | `POST` | `/api/trading/buy` | Execute BUY stock order |
| **Trading** | `POST` | `/api/trading/sell` | Execute SELL stock order |
| **Trading** | `GET` | `/api/trading/history` | Complete immutable trade ledger |
| **Trading** | `GET` | `/api/trading/history/{stockId}` | Trade records for specific stock |
| **Stocks** | `GET` | `/api/stocks` | Paginated stock directory |
| **Stocks** | `GET` | `/api/stocks/search` | Debounced symbol/name search |
| **Watchlist** | `GET` | `/api/watchlists` | Get user watchlists |
| **Watchlist** | `POST` | `/api/watchlists` | Create new watchlist |
| **Market Data**| `GET` | `/api/market-data/live-price/{stockId}` | Current live market quote |
| **Analysis** | `GET` | `/api/analysis/technical/stock/{stockId}` | Technical indicator telemetry |
| **Analysis** | `GET` | `/api/analysis/fundamental/stock/{stockId}` | Company fiscal statements |

---

## 📄 License
This project is open-source and available under the MIT License.
