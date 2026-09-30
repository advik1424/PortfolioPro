# PortfolioPro — Stock Portfolio Management & Tracking System

PortfolioPro is an enterprise-grade stock portfolio management, valuation, and market tracking platform. Inspired by the clean, data-first philosophy of **Screener.in**, it offers real-time portfolio valuation, weighted average acquisition pricing, realized/unrealized profit & loss calculations, immutable transaction ledgers, watchlist monitoring, technical indicators, and fundamental financial analysis.

---

## 🏗️ Architecture & Tech Stack

```
PortfolioPro/
├── backend/          # Spring Boot 3, Java 21, Spring Security, JWT, JPA/Hibernate, MySQL
├── frontend/         # React 19, Vite, React Router v7, Axios, Screener-style CSS Design System
├── .gitignore        # Unified Git ignore rules
└── README.md         # Project documentation
```

### Backend:
- **Language & Runtime**: Java 21 LTS
- **Framework**: Spring Boot 3.x
- **Security**: Spring Security 6 with Stateless JWT Bearer Authentication & Google OAuth2 Client
- **Persistence**: Spring Data JPA with Hibernate ORM
- **Database**: MySQL 8.x
- **Market Data Integration**: Twelve Data REST API (Real-time stock quotes, historical candles, technical indicators)
- **Mathematical Accuracy**: High-precision `BigDecimal` arithmetic for weighted average cost basis and P&L

### Frontend:
- **Library**: React 19.x with functional hooks
- **Bundler & Tooling**: Vite 7.x
- **Routing**: React Router v7 with protected route wrappers
- **Styling**: Screener.in-inspired bespoke financial design system (`styles.css`)
- **Key Features**:
  - Global `Ctrl + K` debounced stock search modal
  - Responsive SVG price charts (Zero external charting library overhead)
  - Right-aligned monospace tabular numerical values (`font-variant-numeric: tabular-nums`)
  - Semantic profit/loss badge indicators
  - Dual-mode order execution modal (`BUY` and `SELL` with holding validation)

---

## 🌟 Key Features

1. **Authoritative Financial Valuation**:
   - Backend-driven calculations: Total Invested, Portfolio Value, Unrealized P&L, Realized P&L.
   - Weighted average buy price recalculated automatically upon multiple BUY transactions.
   - Realized P/L calculated and recorded when shares are partially or fully sold.
2. **Order Execution & Trading Modal**:
   - Buy and Sell transactions recorded directly from Stock Detail, Watchlists, or Portfolio.
   - Pre-validation ensures users cannot sell more shares than their active holding quantity.
   - Real-time estimated order value calculation (`Qty × Price`) and CMP shortcut.
3. **Immutable Transaction History Ledger**:
   - Complete audit trail of all executed trades (`/transactions`).
   - Filter by `ALL`, `BUY`, or `SELL` with live search by stock symbol.
4. **Interactive Watchlist Workspace**:
   - Multi-watchlist support with instant tab switching.
   - Real-time stock monitor table with CMP and day change percentage.
   - Search & add stocks modal and stock removal.
5. **Deep Stock Research & Screener Table**:
   - Search across synchronized stock universe with sorting by Symbol, Company, Exchange, Sector, or Price.
   - Stock detail page featuring live price spread, high/low range, valuation metrics, and technical indicators (SMA, EMA, RSI with status badges, MACD, Support, Resistance).
   - Historical close price movements rendered via responsive SVG line & area charts.

---

## 🚀 Getting Started

### Prerequisites:
- **JDK 21** or later
- **Node.js 18+** & npm
- **MySQL Server 8.0+**

### 1. Database Setup:
Create the database in MySQL:
```sql
CREATE DATABASE portfoliopro;
```

### 2. Backend Setup & Run:
Configure your database credentials in `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/portfoliopro
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
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
