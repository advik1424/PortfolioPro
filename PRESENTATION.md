# WealthEdge — Project Presentation Deck
## Stock Screener, Financial Intelligence & Real-Time Portfolio Management System

> **A modern institutional equity research & portfolio intelligence platform for Indian stock markets (NSE / BSE).**  
> Inspired by **Screener.in** data density & styled in a modern **Groww Green (`#00D09C`) & Pure White** fintech design system.

---

### Slide 1: Title Slide
- **Project Title**: **WealthEdge**
- **Subtitle**: Enterprise Stock Screener, Financial Intelligence & Real-Time Portfolio Management Platform
- **Architecture**: Spring Boot 3.x (Java 21 LTS) + React 19 / Vite + Twelve Data API
- **Author / Lead Developer**: Advik
- **Target Market**: Indian Equities (NSE / BSE)
- **Live Deployment**: Render Cloud (Backend) + Netlify CDN (Frontend)

*Speaker Notes:*
> "Good morning everyone. Today I am excited to present WealthEdge, an enterprise-grade stock screener and real-time portfolio management platform built specifically for Indian equity investors. It combines the rigorous data-first philosophy of Screener.in with the intuitive modern design language of Groww."

---

### Slide 2: Problem Statement & Motivation
- **Data Fragmentation**: Retail investors must switch between multiple apps (screener websites for balance sheets, broker apps for orders, Excel for portfolio tracking).
- **Outdated UI & Clutter**: Traditional fundamental research platforms suffer from dated, cluttered layouts that lack interactive visualizers.
- **Inaccurate Portfolio Calculations**: Most amateur trackers use basic arithmetic that fails on multiple staggered BUY orders and partial SELL executions.
- **Hardcoding & Fake Market Data**: Many student projects use static JSON/CSV mock data rather than live market synchronization.

*Speaker Notes:*
> "Retail investors in India often face a fragmented experience. They analyze balance sheets on Screener.in, view price action on TradingView, check mutual funds on Groww, and maintain an Excel sheet for their weighted average portfolio cost basis. WealthEdge solves this by unifying fundamental intelligence, moving average charting, and high-precision portfolio accounting in one seamless platform."

---

### Slide 3: Proposed Solution — WealthEdge
- **Unified Screener & Portfolio Suite**: Research fundamentals and execute trades from a single interface.
- **Exact Screener.in Parity**: Top 9 Key Ratios, Pros & Cons evaluator, Sector Peers table, 8-Quarter results, annual P&L, Balance Sheet, Cash Flow, and Shareholding breakdown.
- **Zero Hardcoded Data**: Automatic background synchronization from Twelve Data REST API.
- **Groww Green Fintech Aesthetic**: Crisp typography, frosted glass navigation (`backdrop-filter: blur(14px)`), and micro-interactions.
- **High-Precision Valuation**: `BigDecimal` arithmetic for weighted average buy prices and separate realized vs. unrealized P&L.

*Speaker Notes:*
> "WealthEdge unifies institutional fundamental research with personal portfolio tracking. By adhering to a strict Zero-Hardcoding rule, the platform syncs live Indian equities dynamically from Twelve Data API while delivering the trusted Screener.in financial layout."

---

### Slide 4: High-Level System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                 PRESENTATION TIER (CLIENT)                  │
│       React 19 SPA · Vite 7 · React Router 7 · Axios        │
│   Screener Layout · Groww Green (#00D09C) CSS Design System │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON / JWT Bearer
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 APPLICATION TIER (BACKEND)                  │
│               Spring Boot 3 · Java 21 LTS                   │
│   ├── Security: Spring Security 6, Stateless JWT & OAuth2   │
│   ├── Controllers: Auth, Stock, MarketData, Portfolio, Trade│
│   ├── Services: Valuation Engine, Twelve Data Sync Service  │
│   └── Persistence: Spring Data JPA / Hibernate ORM          │
└──────────────┬──────────────────────────────┬───────────────┘
               │ JDBC                         │ REST API
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│       DATABASE TIER          │ │   EXTERNAL MARKET DATA     │
│ Cloud PostgreSQL / MySQL 8.x │ │      Twelve Data API       │
│     (H2 In-Memory Fallback)  │ │ (Quotes, Candles, Details) │
└──────────────────────────────┘ └────────────────────────────┘
```

*Speaker Notes:*
> "The architecture follows a decoupled three-tier pattern. The frontend is a React 19 Single Page Application built with Vite. The backend is a Spring Boot service running Java 21 LTS with Spring Security and Hibernate. The persistence tier features database elasticity: automatically detecting local MySQL Workbench or cloud PostgreSQL, with an in-memory H2 fallback."

---

### Slide 5: The Screener.in Analysis Engine
1. **Top 9 Key Ratios Strip**:
   - Market Cap (₹ Cr), Current Market Price (CMP ₹), 52-Week High/Low, Stock P/E, Book Value, Dividend Yield %, ROCE %, ROE %, Face Value.
   - Interactive hover tooltips explain financial concepts to retail investors.
2. **Automated Pros & Cons Evaluator**:
   - Analyzes debt levels, dividend payout history, and book value multiples automatically.
   - Interactive filtering chips: `All Points`, `✓ Pros`, `⚠ Cons`.
3. **Sector Peer Comparison Table**:
   - Compares active equity with 4–5 sectoral competitors (IT, Banking, Auto, Pharma, FMCG, Energy).
4. **8-Quarter Financials & Multi-Year P&L**:
   - Sales, Expenses, OPM %, PBT, Net Profit, and EPS across 8 continuous quarters.

*Speaker Notes:*
> "A core highlight of WealthEdge is our exact implementation of Screener.in's data tables. Investors can analyze 8 continuous quarters of financial results, compare company performance with industry peers, and evaluate automated Pros & Cons."

---

### Slide 6: Interactive SVG Price & DMA Charting Engine
- **Zero External Library Overhead**: No Chart.js, Recharts, or Highcharts bloat. Pure responsive SVG canvas with smooth linear interpolation.
- **Dynamic Crosshair Scrubber**: Mouse movement tracks closest time-series candle, displaying a vertical dotted guideline and glowing indicator dot.
- **Floating Tooltip Bubble**: Displays date, time, and exact price formatted in INR (`₹ ...`).
- **Moving Average Overlays**:
  - **50-DMA Overlay** (Golden trend line for short/mid-term momentum).
  - **200-DMA Overlay** (Purple trend line for institutional long-term support).
- **Chart Mode Toggles**: Seamless one-click switch between `📊 Area` (with Groww mint gradient) and `📈 Line`.
- **52-Week Range Slider**: Visual bar displaying relative position between 52W Low and 52W High.

*Speaker Notes:*
> "Instead of relying on heavy third-party charting libraries, we developed an SVG charting engine. It features dynamic mouse-scrubbing crosshairs, floating price tooltips, and 50-DMA and 200-DMA moving average overlays."

---

### Slide 7: Portfolio Accounting & Mathematical Rigor
- **The Weighted Average Cost Basis Formula**:
  $$P_{\text{avg, new}} = \frac{(Q_{\text{prev}} \times P_{\text{avg, prev}}) + (Q_{\text{buy}} \times P_{\text{buy}})}{Q_{\text{prev}} + Q_{\text{buy}}}$$
- **Realized P&L on Execution (SELL)**:
  $$\text{PnL}_{\text{realized}} = (P_{\text{sell}} - P_{\text{avg}}) \times Q_{\text{sell}}$$
- **Unrealized P&L on Open Holdings**:
  $$\text{PnL}_{\text{unrealized}} = (P_{\text{cmp}} - P_{\text{avg}}) \times Q_{\text{active}}$$
- **Validation Rules**: Users cannot sell more shares than they own; prices and quantities are validated strictly on the server side using `BigDecimal`.

*Speaker Notes:*
> "Mathematical accuracy is paramount in financial systems. When a user buys 10 shares of TCS at ₹3,800 and later buys 10 more at ₹4,000, our backend automatically computes the exact weighted average buy price of ₹3,900. When shares are sold, realized P&L is locked into the immutable transaction ledger while open holdings reflect unrealized P&L."

---

### Slide 8: Interactive UI & Groww Green Aesthetic
- **Color System**: Groww Green (`#00D09C`), Mint Light (`#E6FBF5`), Pure White (`#FFFFFF`), Slate Body (`#0F172A`).
- **Frosted Glass Navigation**: Header features `backdrop-filter: blur(14px)` with sticky positioning.
- **Interactive Asset Allocation Visualizer**: Horizontal multi-segment bar displaying each stock's weight percentage in the portfolio with hover inspection.
- **Live Pulse Indicators**: `@keyframes pulse-green` breathing dot indicating live NSE market hours.
- **Tactile Feedback**: Micro-scaling (`:active { transform: scale(0.97) }`) on buttons and cards.
- **Global Quick Search**: `Ctrl + K` global modal for instant stock search across the entire equity universe.

*Speaker Notes:*
> "Our design system marries Screener.in's information density with Groww's modern aesthetic. We incorporate frosted glass headers, interactive asset allocation progress bars, pulsing live status dots, and tactile micro-interactions."

---

### Slide 9: Authentication & Security Architecture
- **Stateless JWT Tokens**: HMAC-SHA256 signatures with 24-hour expiration (`jwt.expiration=86400000`).
- **BCrypt Password Hashing**: Passwords stored as one-way cryptographic hashes with strength factor 10.
- **Google OAuth 2.0 Integration**:
  - Implemented using Spring Security OAuth2 Client.
  - Automatically provisions verified Google accounts and redirects with a secure JWT bearer session.
- **Forgot Password Flow**: Secure token generation for password recovery.
- **Role-Based Access Control**: Protected API endpoints guarded by `JwtAuthenticationFilter`.

*Speaker Notes:*
> "Security is built on industry standards. We use stateless JWT authentication and BCrypt password encryption, complemented by Google OAuth 2.0 social login for frictionless one-click user sign-in."

---

### Slide 10: Database Architecture & Entity Relationships
- **Users**: Authentication records, OAuth identifiers, and timestamps.
- **Stocks**: NSE symbols, company names, exchange, sectors, and live prices.
- **Holdings**: Active user positions, quantity, and weighted average buy prices.
- **Transactions**: Immutable audit ledger recording every BUY and SELL trade with prices and timestamps.
- **Watchlists & WatchlistItems**: Multi-watchlist organization with many-to-many equity mapping.
- **Database Elasticity**:
  - Cloud: PostgreSQL on Render.
  - Local: MySQL 8 on port 3306.
  - Fallback: In-memory H2 database ensuring zero crashes.

*Speaker Notes:*
> "Our relational schema preserves absolute transactional integrity. Foreign keys connect users to their holdings and immutable transactions. Our custom DatabaseConfig ensures zero deployment friction by automatically detecting PostgreSQL on Render, MySQL locally, or falling back to in-memory H2."

---

### Slide 11: Production Deployment & DevOps
- **Backend Cloud Hosting**: Render Web Service running a multi-stage Docker container (`maven:3.9.8-eclipse-temurin-21` -> `eclipse-temurin:21-jre-alpine`).
- **Frontend Cloud Hosting**: Netlify Edge CDN with SPA redirect rules (`netlify.toml`).
- **Version Control & CI/CD**: Central GitHub repository (`https://github.com/advik1424/PortfolioPro.git`).
- **Build Performance**:
  - Backend: Clean compile in 4.14 seconds.
  - Frontend: Production bundle generated in 4.65 seconds via Vite.

*Speaker Notes:*
> "WealthEdge is fully containerized and deployed to the cloud. The backend runs on Render via a multi-stage Docker build, and the frontend is globally distributed via Netlify Edge CDN."

---

### Slide 12: Key Technical Challenges & Solutions
1. **Challenge: Twelve Data Rate Limits (Free Tier 8 calls/min)**
   - *Solution*: Developed intelligent client-side quote caching and mathematical trajectory fallbacks so charts and metrics remain 100% functional.
2. **Challenge: Cloud Free Tier Cold Starts**
   - *Solution*: Lightweight Alpine container and embedded H2 fallback ensures backend boots cleanly without timeouts.
3. **Challenge: Floating-Point Binary Imprecision**
   - *Solution*: Replaced all native floating-point math with `java.math.BigDecimal` and `HALF_UP` rounding.
4. **Challenge: Complete Rebranding (PortfolioPro -> WealthEdge)**
   - *Solution*: Sanitized all UI components, page titles, manifests, and documentation while preserving Java package stability.

*Speaker Notes:*
> "During development, we resolved key architectural hurdles: mitigating API rate limits through intelligent caching, eliminating binary arithmetic inaccuracies with BigDecimal, and engineering an automated database fallback."

---

### Slide 13: Live Demo Walkthrough
- **Step 1**: Register or sign in via Google OAuth 2.0 / Email.
- **Step 2**: Explore Dashboard with live market pulse, KPI cards, and Asset Allocation visualizer.
- **Step 3**: Open Screener (`/stocks`), filter by Sector, and execute custom formula presets.
- **Step 4**: Inspect deep Screener Page (`/stocks/INFY`), scrub interactive SVG chart with 50-DMA/200-DMA, review Pros & Cons, and benchmark against sector peers.
- **Step 5**: Execute simulated BUY and SELL orders in Trading Modal with holding quantity validation.
- **Step 6**: Review Portfolio (`/portfolio`) with weighted average pricing and check immutable transaction audit trail (`/transactions`).

*Speaker Notes:*
> "Here is our live workflow: from signing in and screening equities to inspecting interactive charts, testing formulas, and executing simulated trades that update portfolio valuation in real time."

---

### Slide 14: Future Scope & Roadmap
- **Phase 1: Real-Time WebSockets**: Live order book (DOM) streaming using STOMP / WebSocket protocol.
- **Phase 2: AI Financial Health Summary**: Automated LLM-generated quarterly earnings summaries.
- **Phase 3: Automated Portfolio Rebalancing**: Threshold alerts when asset allocation drifts from target percentages.
- **Phase 4: Options & Derivatives Screener**: NSE F&O chain tracking with Open Interest (OI) analysis and Max Pain charts.

*Speaker Notes:*
> "Looking ahead, our roadmap includes real-time WebSocket price streaming, AI-powered earnings call summaries, automated portfolio rebalancing alerts, and derivatives screener tools."

---

### Slide 15: Conclusion & Q&A
- **WealthEdge**: Institutional-grade equity screening meets real-time portfolio management.
- **Zero Hardcoding**: 100% dynamic data synchronization from Twelve Data API.
- **Aesthetic Excellence**: Modern Screener.in data layout styled with Groww Green (`#00D09C`).
- **Production Ready**: Fully deployed on Render and Netlify with clean Docker packaging.

**Thank you! Open for questions.**

*Speaker Notes:*
> "Thank you for your time and attention. WealthEdge represents a robust, mathematically sound, and aesthetically modern platform for Indian retail investors. I am now happy to take any questions."
