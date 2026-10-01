# Software Requirements Specification (SRS)
## For WealthEdge — Stock Screener, Financial Intelligence & Real-Time Portfolio Management Platform

**Document Version:** 2.0.0  
**Status:** Approved & Implemented  
**Date:** October 2026  
**Project Lead:** Advik  
**Target Environments:** Cloud (Render / Netlify / Docker), Local (JDK 21, Node 18+, MySQL 8 / PostgreSQL / H2)

---

## 1. Introduction

### 1.1 Purpose
The purpose of this Software Requirements Specification (SRS) document is to provide a complete, rigorous, and definitive description of the **WealthEdge** enterprise financial software system. It details the functional behavior, architectural topology, external interface definitions, non-functional constraints, and mathematical models governing the platform.

### 1.2 Document Conventions
- **Shall / Must**: Denotes mandatory system behavior.
- **Should**: Denotes strongly recommended implementation patterns.
- **May**: Denotes discretionary features.
- All monetary values are calculated in Indian Rupees (INR / ₹).
- Tabular financial metrics follow standard Indian formatting conventions (Lakhs and Crores: ₹ Cr).

### 1.3 Intended Audience
This document is authored for software engineers, systems architects, financial analysts, QA engineers, academic evaluators, and system administrators deploying and maintaining WealthEdge.

### 1.4 Project Scope & Objectives
WealthEdge is a high-performance web platform combining institutional stock screening capabilities inspired by **Screener.in** with real-time portfolio management and trading audit ledgers, wrapped in a modern **Groww Green (`#00D09C`) & Pure White** user interface.

**Core Objectives:**
1. **Dynamic Market Intelligence**: Eliminate hardcoded equity data. All equities, quotes, candle series, and sector metrics are dynamically synchronized from the Twelve Data REST API.
2. **Screener.in Financial Parity**: Provide 9 key financial ratios, automated Pros & Cons health analysis, sector peer comparison tables, 8-quarter Quarterly Results, annual Profit & Loss statements, Balance Sheets, Cash Flows, and Shareholding structures.
3. **Mathematical Valuation Rigor**: Implement high-precision weighted average acquisition cost pricing and separate realized vs. unrealized profit & loss calculations using `BigDecimal` arithmetic.
4. **Interactive SVG Visualizer**: Render zero-dependency interactive SVG price charts featuring dynamic cursor crosshair scrubbers, 50-DMA and 200-DMA trendlines, and 52-week price range sliders.
5. **Multi-Database Elasticity**: Seamless operation across local MySQL Workbench (port 3306), cloud PostgreSQL (Render), and embedded in-memory H2 database fallback.
6. **Dual Authentication**: Support standard BCrypt email/password authentication alongside official Google OAuth 2.0 Identity Federation with JWT token generation.

---

## 2. Overall Description

### 2.1 Product Perspective & System Context
WealthEdge operates as an independent, cloud-native client-server platform.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                           │
│   React 19 SPA · Vite 7 · Screener CSS · Groww Aesthetic    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON / JWT
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 WEALTHEDGE BACKEND API                      │
│       Spring Boot 3.x / 4.x · Java 21 LTS · Port 8080       │
│  ┌──────────────────────┬────────────────────────────────┐  │
│  │ Security & JWT Layer │ Spring Data JPA / Hibernate    │  │
│  ├──────────────────────┼────────────────────────────────┤  │
│  │ Valuation Engine     │ Twelve Data API Client Service │  │
│  └──────────────────────┴────────────────────────────────┘  │
└──────────────┬──────────────────────────────┬───────────────┘
               │ JDBC                         │ HTTPS REST
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      PERSISTENCE TIER        │ │     EXTERNAL PROVIDER      │
│ PostgreSQL / MySQL / H2 Mem  │ │ Twelve Data Real-Time API  │
└──────────────────────────────┘ └────────────────────────────┘
```

### 2.2 User Classes & Roles
1. **Registered Retail Investor**: Can authenticate, sync live market data, execute simulated BUY/SELL transactions, build custom watchlists, research fundamentals, and review portfolio performance.
2. **Guest / Public Visitor**: Can access login and registration portals, initiate password reset tokens, and view landing documentation.
3. **Automated System Service**: Background scheduler running Twelve Data sync and database maintenance jobs without user intervention.

### 2.3 Operating Environment
- **Server OS**: Linux (Alpine / Ubuntu inside Docker containers) or Windows 10/11 64-bit.
- **Java Runtime**: Eclipse Temurin OpenJDK 21 LTS.
- **Node Runtime**: Node.js v18.0.0+ / npm v10.0.0+.
- **Browsers**: Modern standards-compliant browsers (Google Chrome 110+, Mozilla Firefox 110+, Apple Safari 16+, Microsoft Edge 110+).

### 2.4 Design & Implementation Constraints
- **Zero Static Stocks**: The database must not initialize with static fake stocks in Java code. Equities must be populated through Twelve Data API calls.
- **Precision Floating Point Ban**: Primitive `float` and `double` are forbidden in financial calculation services to prevent IEEE 754 binary rounding errors. All transactions, values, and P&L must use `java.math.BigDecimal` with `RoundingMode.HALF_UP`.
- **Package Integrity**: Backend Java package declarations must remain uniform (`com.advik.PortfolioPro.*`) to preserve Spring Boot class loading while all user-facing branding is **WealthEdge**.

---

## 3. System Features & Functional Requirements

### 3.1 Module 1: Authentication & Security Architecture
- **FR-1.1**: The system shall accept user registrations with full name, unique email address, and password.
- **FR-1.2**: Passwords shall be salted and hashed using BCrypt (`BCryptPasswordEncoder`, strength factor 10).
- **FR-1.3**: The system shall authenticate valid credentials and issue an HMAC-SHA256 signed JWT Bearer Token valid for 24 hours (86,400,000 ms).
- **FR-1.4**: The system shall support Google OAuth 2.0 social login, automatically provisioning accounts for verified Google profile emails and redirecting with a JWT session token.
- **FR-1.5**: The system shall provide a Forgot Password recovery flow generating cryptographic reset verification tokens.

### 3.2 Module 2: Market Synchronization Engine (Twelve Data API)
- **FR-2.1**: The system shall dynamically resolve the Twelve Data API key from environment variables (`TWELVEDATA_API_KEY`, `TWELVE_DATA_API_KEY`, etc.).
- **FR-2.2**: The backend shall provide an auto-synchronization startup hook and a manual endpoint (`POST /api/stocks/sync`) that fetches active Indian NSE equities.
- **FR-2.3**: Equities fetched shall be upserted into the persistent database with symbol, company name, exchange (`NSE`), and sector classification.
- **FR-2.4**: The system shall provide cached live quotes (`GET /api/market-data/live-price/{stockId}`) with day change, percentage variance, day high, and day low.

### 3.3 Module 3: Screener.in Exact Financial Analysis
- **FR-3.1**: The stock detail page shall display the iconic **Top 9 Key Ratios Strip**:
  - Market Capitalization (₹ Cr)
  - Current Market Price (CMP ₹)
  - 52-Week High / Low (₹)
  - Stock P/E Ratio
  - Book Value (₹)
  - Dividend Yield (%)
  - ROCE (Return on Capital Employed %)
  - ROE (Return on Equity %)
  - Face Value (₹)
- **FR-3.2**: The system shall include an automated **Pros & Cons Evaluation Engine**:
  - Dynamically evaluates debt-to-equity ratios.
  - Flags exceptional 3-year and 5-year ROE track records.
  - Warns when stock trades at a high multiple of its audited book value.
- **FR-3.3**: The system shall render a **Sector Peer Comparison Table** benchmarking the active stock against 4–5 sectoral leaders across CMP, P/E, Market Cap, Dividend Yield, and ROCE.
- **FR-3.4**: The system shall render **Quarterly Results** spanning 8 continuous quarters with Sales, Expenses, Operating Profit Margin (OPM %), Profit Before Tax (PBT), Net Profit, and EPS.
- **FR-3.5**: The system shall render multi-year **Profit & Loss Statements**, **Balance Sheets**, **Cash Flow Statements**, and **Shareholding Breakdowns** (Promoter, FII, DII, Public).

### 3.4 Module 4: High-Precision Trading & Valuation Ledger
- **FR-4.1 (BUY Order)**:
  - Users can purchase stock quantities at specified limit or market prices.
  - The system recalculates the **Weighted Average Buy Price**:
    $$P_{\text{avg, new}} = \frac{(Q_{\text{prev}} \times P_{\text{avg, prev}}) + (Q_{\text{new}} \times P_{\text{new}})}{Q_{\text{prev}} + Q_{\text{new}}}$$
  - An immutable transaction record is written with timestamp, trade type `BUY`, price, quantity, and total value.
- **FR-4.2 (SELL Order)**:
  - The system validates that `quantity_to_sell <= active_holding_quantity`.
  - The system records **Realized Profit / Loss**:
    $$\text{PnL}_{\text{realized}} = (P_{\text{sell}} - P_{\text{avg}}) \times Q_{\text{sell}}$$
  - The active holding quantity is decremented; if quantity reaches zero, the holding record is updated or cleared.
- **FR-4.3 (Portfolio Summary)**:
  - Total Invested Capital = $\sum (Q_i \times P_{\text{avg}, i})$
  - Current Portfolio Value = $\sum (Q_i \times P_{\text{cmp}, i})$
  - Total Unrealized P&L = $\text{Current Value} - \text{Total Invested}$
  - Cumulative Realized P&L = $\sum \text{Realized PnL from all past SELL orders}$.

### 3.5 Module 5: Interactive Visualizer & DMA Chart Engine
- **FR-5.1**: The system shall render an interactive SVG area chart without external heavyweight charting libraries (Chart.js / Highcharts overhead avoided).
- **FR-5.2**: The chart shall feature a mouse-tracking scrubber displaying vertical crosshairs and a floating pill tooltip containing exact price (₹) and timestamp.
- **FR-5.3**: Users shall be able to toggle moving average trendlines:
  - **50-DMA Overlay** (Golden trend line)
  - **200-DMA Overlay** (Purple long-term support line)
- **FR-5.4**: Users shall be able to switch between **Area Mode** (Groww Green mint gradient fill) and **Line Mode**.
- **FR-5.5**: A 52-Week Range Visual Progress Slider shall display where the CMP sits between 52W Low and 52W High.

### 3.6 Module 6: Watchlists & Screener Query Engine
- **FR-6.1**: Users can create unlimited named watchlists and add/remove stocks with instant updates.
- **FR-6.2**: The Screener shall provide one-click institutional query formula presets (`💎 Debt Free`, `📈 High Growth`, `🎯 Deep Value`).
- **FR-6.3**: Table rows shall feature instant search, sector dropdowns, P/E range filtering, and multi-column sorting.

---

## 4. External Interface Requirements

### 4.1 User Interface (UI) Design System
- **Color Palette**: Groww Green (`#00D09C`), Mint Light (`#E6FBF5`), Pure White (`#FFFFFF`), Slate Body (`#0F172A`), Soft Border (`#E2E8F0`).
- **Typography**: Inter (Google Fonts) with tabular numeric alignment (`font-variant-numeric: tabular-nums`).
- **Layout Standards**: Screener.in data density layout with sub-navigation anchor tabs (`#chart`, `#analysis`, `#peers`, `#quarters`, `#pnl`, `#balance`, `#shareholding`).
- **Responsive Breakpoints**: Desktop (> 1024px), Tablet (768px - 1024px), Mobile (< 768px with bottom navigation bar).

### 4.2 Software Interfaces & REST API Endpoints
| HTTP Method | URI Pattern | Security | Functionality |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates user; returns JWT token |
| `POST` | `/api/users` | Public | Registers a new user account |
| `GET` | `/api/stocks` | Authenticated | Returns paginated stock directory |
| `GET` | `/api/stocks/search` | Authenticated | Debounced search by symbol / company name |
| `POST` | `/api/stocks/sync` | Authenticated | Trigger dynamic Twelve Data sync |
| `GET` | `/api/stocks/{id}` | Authenticated | Retrieve stock metadata by ID |
| `GET` | `/api/stocks/symbol/{symbol}` | Authenticated | Retrieve stock metadata by symbol |
| `GET` | `/api/market-data/live-price/{id}` | Authenticated | Live quote, day change & 52W high/low |
| `GET` | `/api/market-data/candles/{id}` | Authenticated | Historical time-series close prices |
| `POST` | `/api/trading/buy` | Authenticated | Execute BUY transaction |
| `POST` | `/api/trading/sell` | Authenticated | Execute SELL transaction |
| `GET` | `/api/trading/history` | Authenticated | Audit trail of all executed trades |
| `GET` | `/api/portfolio/summary` | Authenticated | Valuation, total invested, P&L totals |
| `GET` | `/api/portfolio/holdings` | Authenticated | Active stock holdings list |
| `GET` | `/api/watchlists` | Authenticated | User watchlists list |
| `POST` | `/api/watchlists` | Authenticated | Create a new named watchlist |
| `POST` | `/api/watchlists/{id}/stocks/{stockId}` | Authenticated | Add stock to watchlist |
| `DELETE` | `/api/watchlists/{id}/stocks/{stockId}` | Authenticated | Remove stock from watchlist |
| `GET` | `/api/health` | Public | System health check & uptime probe |

---

## 5. Non-Functional Requirements

### 5.1 Performance & Latency
- **NFR-1.1**: Client search queries shall debounce at 250ms, returning top matching equities in < 150ms.
- **NFR-1.2**: Portfolio summary and holding valuation calculations shall execute in < 80ms for portfolios up to 500 positions.
- **NFR-1.3**: Frontend production asset bundle size shall remain under 500 KB gzipped.

### 5.2 Security & Protection
- **NFR-2.1**: All REST API endpoints (except `/api/auth/**`, `/api/users`, `/api/health`, and OAuth callbacks) must enforce JWT token verification.
- **NFR-2.2**: Cross-Origin Resource Sharing (CORS) must explicitly whitelist client domains while allowing local debugging on ports 5173 and 3000.
- **NFR-2.3**: Database passwords and Twelve Data API credentials must be injected via environment variables and never committed to source control.

### 5.3 Reliability & Fallback Architecture
- **NFR-3.1**: If local MySQL port 3306 is inaccessible and no external cloud database URL is configured, the application must automatically initialize an embedded in-memory H2 database to prevent startup crash.
- **NFR-3.2**: If Twelve Data API rate limits are encountered, candle visualizers must dynamically calculate mathematical trajectories based on CMP and 52W bounds without erroring.

---

## 6. Data Modeling & Database Schema

```
┌──────────────────────┐         ┌──────────────────────┐
│        USERS         │ 1     * │     TRANSACTIONS     │
├──────────────────────┤─────────┼──────────────────────┤
│ id (PK, BIGINT)      │         │ id (PK, BIGINT)      │
│ email (VARCHAR, UNQ) │         │ user_id (FK)         │
│ password (VARCHAR)   │         │ stock_id (FK)        │
│ name (VARCHAR)       │         │ type (BUY / SELL)    │
│ role (VARCHAR)       │         │ quantity (INT)       │
│ created_at (DATETIME)│         │ price (DECIMAL 19,4) │
└──────────┬───────────┘         │ total_amount (DEC)   │
           │ 1                   │ created_at (DATETIME)│
           │                     └──────────────────────┘
           │ 1
           ▼ *                   ┌──────────────────────┐
┌──────────────────────┐         │        STOCKS        │
│       HOLDINGS       │ *     1 ├──────────────────────┤
├──────────────────────┼─────────┤ id (PK, BIGINT)      │
│ id (PK, BIGINT)      │         │ symbol (VARCHAR, UNQ)│
│ user_id (FK)         │         │ company_name (VAR)   │
│ stock_id (FK)        │         │ exchange (VARCHAR)   │
│ quantity (INT)       │         │ sector (VARCHAR)     │
│ avg_buy_price (DEC)  │         │ current_price (DEC)  │
│ updated_at (DATETIME)│         │ updated_at (DATETIME)│
└──────────────────────┘         └──────────┬───────────┘
                                            │ 1
┌──────────────────────┐                    │
│      WATCHLISTS      │ 1                  │
├──────────────────────┤                    │
│ id (PK, BIGINT)      │                    │
│ user_id (FK)         │                    │
│ name (VARCHAR)       │                    │
└──────────┬───────────┘                    │
           │ 1                              │
           ▼ *                              │
┌──────────────────────┐                    │
│   WATCHLIST_ITEMS    │ *                1 │
├──────────────────────┼────────────────────┘
│ id (PK, BIGINT)      │
│ watchlist_id (FK)    │
│ stock_id (FK)        │
│ added_at (DATETIME)  │
└──────────────────────┘
```

---

## 7. Deployment & Verification Matrix

### 7.1 Production Dockerfile Configuration
The backend is packaged using a multi-stage Docker build:
- **Build Stage**: `maven:3.9.8-eclipse-temurin-21` builds executable Spring Boot JAR skipping unit tests.
- **Runtime Stage**: `eclipse-temurin:21-jre-alpine` lightweight JRE executing `app.jar` on dynamic `$PORT` (default 8080).

### 7.2 Cloud Deployment Topology
- **Backend**: Hosted on **Render Web Services** (`https://portfoliopro-1-uch5.onrender.com`).
- **Frontend**: Hosted on **Netlify Edge CDN** (`https://clinquant-tartufo-34ba0c.netlify.app`).
- **Version Control**: Git repository on **GitHub** (`https://github.com/advik1424/PortfolioPro.git`).
