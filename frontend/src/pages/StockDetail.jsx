import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  stockApi,
  marketApi,
  analysisApi,
  portfolioApi,
  tradingApi,
  watchlistApi,
  formatINR,
  formatNumber,
  formatPercent
} from "../api";
import TransactionModal from "../components/TransactionModal";

export default function StockDetail() {
  const { symbol } = useParams();

  const [stock, setStock] = useState(null);
  const [liveQuote, setLiveQuote] = useState(null);
  const [tech, setTech] = useState(null);
  const [fund, setFund] = useState(null);
  const [holding, setHolding] = useState(null);
  const [stockTrades, setStockTrades] = useState([]);
  const [candles, setCandles] = useState([]);
  const [watchlists, setWatchlists] = useState([]);

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'technical' | 'fundamental' | 'history'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Trade Modal State
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [tradeType, setTradeType] = useState("BUY");

  // Watchlist Modal State
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [watchlistSuccess, setWatchlistSuccess] = useState("");
  const [watchlistError, setWatchlistError] = useState("");

  // Fetch all stock details and related market info
  const loadStockData = async () => {
    setError("");
    try {
      const stockRes = await stockApi.bySymbol(symbol);
      const stockData = stockRes.data;
      setStock(stockData);

      const [quoteRes, techRes, fundRes, holdRes, candleRes, tradeRes, wlRes] =
        await Promise.allSettled([
          marketApi.liveQuote(stockData.id),
          analysisApi.technical(stockData.id),
          analysisApi.fundamental(stockData.id),
          portfolioApi.holding(stockData.id),
          marketApi.candles(stockData.id),
          tradingApi.historyForStock(stockData.id),
          watchlistApi.all()
        ]);

      if (quoteRes.status === "fulfilled") setLiveQuote(quoteRes.value.data);
      if (techRes.status === "fulfilled") setTech(techRes.value.data);
      if (fundRes.status === "fulfilled") setFund(fundRes.value.data);
      if (holdRes.status === "fulfilled") setHolding(holdRes.value.data);
      if (candleRes.status === "fulfilled") setCandles(candleRes.value.data || []);
      if (tradeRes.status === "fulfilled") setStockTrades(tradeRes.value.data || []);
      if (wlRes.status === "fulfilled") setWatchlists(wlRes.value.data || []);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to load data for stock: ${symbol}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadStockData();
  }, [symbol]);

  // Handle adding stock to a watchlist
  const handleAddToWatchlist = async (watchlistId, watchlistName) => {
    setWatchlistError("");
    setWatchlistSuccess("");
    try {
      await watchlistApi.addStock(watchlistId, stock.id);
      setWatchlistSuccess(`Added ${stock.symbol} to "${watchlistName}"!`);
      setTimeout(() => {
        setIsWatchlistModalOpen(false);
        setWatchlistSuccess("");
      }, 1200);
    } catch (err) {
      setWatchlistError(err.response?.data?.message || "Failed to add stock to watchlist.");
    }
  };

  // Re-fetch holding and trades after trade execution
  const handleTradeSuccess = () => {
    if (stock?.id) {
      portfolioApi.holding(stock.id).then(r => setHolding(r.data)).catch(() => setHolding(null));
      tradingApi.historyForStock(stock.id).then(r => setStockTrades(r.data || [])).catch(() => {});
    }
  };

  const currentPrice = liveQuote?.price ?? stock?.currentPrice ?? 0;
  const dayChange = Number(liveQuote?.change ?? 0);
  const dayChangePct = Number(liveQuote?.changePercent ?? 0);
  const isPositive = dayChange >= 0;

  // Generate SVG path for candle prices
  const chartPoints = useMemo(() => {
    if (!candles || candles.length === 0) return null;
    const sorted = [...candles].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    const prices = sorted.map((c) => Number(c.close || c.price || 0)).filter((p) => p > 0);
    if (prices.length < 2) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const width = 600;
    const height = 180;
    const padding = 20;

    const coords = prices.map((p, idx) => {
      const x = padding + (idx / (prices.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((p - min) / range) * (height - 2 * padding);
      return { x, y, price: p };
    });

    const pathData = coords.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
      ""
    );

    const first = coords[0];
    const last = coords[coords.length - 1];
    const areaData = `${pathData} L ${last.x},${height} L ${first.x},${height} Z`;

    return { coords, pathData, areaData, min, max, first, last };
  }, [candles]);

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
            Loading {symbol} financial data...
          </div>
        </div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="page">
        <div className="form-error" style={{ margin: "24px 0" }}>
          {error || "Stock not found."}
        </div>
        <Link to="/stocks" className="secondary">
          ← Back to Stock Screener
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <Link to="/stocks">STOCKS</Link> / <span>{stock.symbol}</span>
      </div>

      {/* Main Stock Header Card */}
      <div
        className="card"
        style={{
          padding: "24px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "20px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
              {stock.companyName}
            </h1>
            <span className="symbol-badge" style={{ fontSize: "13px", padding: "3px 8px" }}>
              {stock.symbol}
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "12px" }}>
            <span><b>Exchange:</b> {stock.exchange || "NSE"}</span>
            <span>·</span>
            <span><b>Sector:</b> {stock.sector || "General"}</span>
          </div>

          {/* Prominent Price & Change Display */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginTop: "16px" }}>
            <span
              className="num"
              style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-primary)" }}
            >
              {formatINR(currentPrice)}
            </span>
            <span
              className={`badge ${isPositive ? "badge-profit" : "badge-loss"}`}
              style={{ fontSize: "13px", padding: "4px 10px" }}
            >
              {isPositive ? "+" : ""}
              {formatINR(dayChange)} ({formatPercent(dayChangePct)})
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              CMP ({liveQuote?.source || "Twelve Data"})
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="secondary"
            onClick={() => setIsWatchlistModalOpen(true)}
            style={{ fontWeight: 600 }}
          >
            + Watchlist
          </button>
          <button
            className="secondary"
            onClick={() => {
              setTradeType("SELL");
              setIsTradeOpen(true);
            }}
            disabled={!holding || Number(holding.quantity) <= 0}
            style={{
              fontWeight: 700,
              color: holding && Number(holding.quantity) > 0 ? "var(--loss)" : "var(--text-muted)"
            }}
          >
            Sell Stock
          </button>
          <button
            className="primary"
            onClick={() => {
              setTradeType("BUY");
              setIsTradeOpen(true);
            }}
            style={{ fontWeight: 700, padding: "8px 20px" }}
          >
            Buy / Acquire
          </button>
        </div>
      </div>

      {/* User's Active Position in Portfolio Banner */}
      {holding && Number(holding.quantity) > 0 && (
        <div
          className="card"
          style={{
            padding: "16px 20px",
            marginBottom: "20px",
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
              YOUR CURRENT HOLDING POSITION
            </div>
            <Link to="/portfolio" style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent)" }}>
              View in Portfolio →
            </Link>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "16px"
            }}
          >
            <div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Quantity</span>
              <div className="num font-bold" style={{ fontSize: "15px" }}>{formatNumber(holding.quantity, 0)} shares</div>
            </div>
            <div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Avg Buy Price</span>
              <div className="num font-semibold" style={{ fontSize: "15px" }}>{formatINR(holding.averageBuyPrice)}</div>
            </div>
            <div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Invested Value</span>
              <div className="num font-semibold" style={{ fontSize: "15px" }}>{formatINR(holding.investedValue)}</div>
            </div>
            <div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Current Value</span>
              <div className="num font-bold" style={{ fontSize: "15px" }}>{formatINR(holding.currentValue)}</div>
            </div>
            <div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Unrealized P&amp;L</span>
              <div
                className={`num font-bold ${Number(holding.unrealizedPnL || 0) >= 0 ? "positive" : "negative"}`}
                style={{ fontSize: "15px" }}
              >
                {Number(holding.unrealizedPnL || 0) >= 0 ? "+" : ""}
                {formatINR(holding.unrealizedPnL)}
                <span style={{ fontSize: "11px", marginLeft: "6px" }}>
                  ({formatPercent(holding.unrealizedPnLPercentage)})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screener Key Metrics Grid */}
      <div className="stat-grid" style={{ marginBottom: "24px" }}>
        <div className="stat">
          <span>MARKET CAP</span>
          <strong>{fund?.marketCap != null ? formatINR(fund.marketCap) : "—"}</strong>
          <small>Total company equity</small>
        </div>
        <div className="stat">
          <span>DAY RANGE (HIGH / LOW)</span>
          <strong style={{ fontSize: "16px" }}>
            {liveQuote?.high != null ? `${formatINR(liveQuote.high)} / ${formatINR(liveQuote.low)}` : "—"}
          </strong>
          <small>Today's price spread</small>
        </div>
        <div className="stat">
          <span>STOCK P/E RATIO</span>
          <strong>{fund?.peRatio != null ? formatNumber(fund.peRatio) : "—"}</strong>
          <small>Price to Earnings</small>
        </div>
        <div className="stat">
          <span>BOOK VALUE / EPS</span>
          <strong>{fund?.eps != null ? `₹${formatNumber(fund.eps)}` : "—"}</strong>
          <small>Earnings per share</small>
        </div>
      </div>

      {/* Price Chart Section */}
      <section className="card" style={{ marginBottom: "24px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <strong style={{ fontSize: "14px" }}>Price Movement Chart</strong>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>
              Historical close prices
            </span>
          </div>
          {chartPoints && (
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              Range: <b>{formatINR(chartPoints.min)}</b> – <b>{formatINR(chartPoints.max)}</b>
            </div>
          )}
        </div>

        {chartPoints ? (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <svg
              viewBox="0 0 600 180"
              style={{ width: "100%", height: "200px", overflow: "visible" }}
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="20" y1="20" x2="580" y2="20" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="20" y1="90" x2="580" y2="90" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="20" y1="160" x2="580" y2="160" stroke="var(--border-subtle)" strokeDasharray="3 3" />

              {/* Area & Line */}
              <path d={chartPoints.areaData} fill="url(#chartGradient)" />
              <path
                d={chartPoints.pathData}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Last Price Point Dot */}
              <circle
                cx={chartPoints.last.x}
                cy={chartPoints.last.y}
                r="4.5"
                fill="var(--accent)"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </svg>
          </div>
        ) : (
          <div className="empty-box" style={{ padding: "32px 16px" }}>
            <strong>No Historical Candle Data Available</strong>
            <p>Candle history will populate automatically as market data syncs.</p>
          </div>
        )}
      </section>

      {/* Tabs: Overview, Technical, Fundamental, Trade History */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border)",
          marginBottom: "16px"
        }}
      >
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "overview" ? "2px solid var(--accent)" : "2px solid transparent",
            color: activeTab === "overview" ? "var(--accent)" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          Key Ratios
        </button>
        <button
          onClick={() => setActiveTab("technical")}
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "technical" ? "2px solid var(--accent)" : "2px solid transparent",
            color: activeTab === "technical" ? "var(--accent)" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          Technical Indicators
        </button>
        <button
          onClick={() => setActiveTab("fundamental")}
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "fundamental" ? "2px solid var(--accent)" : "2px solid transparent",
            color: activeTab === "fundamental" ? "var(--accent)" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          Financial Statements
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "history" ? "2px solid var(--accent)" : "2px solid transparent",
            color: activeTab === "history" ? "var(--accent)" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          Trade History ({stockTrades.length})
        </button>
      </div>

      {/* Tab 1: Key Ratios Overview */}
      {activeTab === "overview" && (
        <div className="two-col">
          <section className="card">
            <div className="card-head">
              <strong>Valuation &amp; Price Metrics</strong>
              <span>Latest data</span>
            </div>
            <div style={{ padding: "16px" }}>
              <DataRow label="Current Market Price (CMP)" value={formatINR(currentPrice)} />
              <DataRow label="Market Capitalization" value={fund?.marketCap ? formatINR(fund.marketCap) : "—"} />
              <DataRow label="Price to Earnings (P/E)" value={fund?.peRatio != null ? formatNumber(fund.peRatio) : "—"} />
              <DataRow label="Earnings Per Share (EPS)" value={fund?.eps != null ? `₹${formatNumber(fund.eps)}` : "—"} />
              <DataRow label="Day High / Low" value={liveQuote?.high ? `${formatINR(liveQuote.high)} / ${formatINR(liveQuote.low)}` : "—"} />
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <strong>Technical Trend Summary</strong>
              <span>Technical Indicators</span>
            </div>
            <div style={{ padding: "16px" }}>
              <DataRow label="RSI (14-period)" value={tech?.rsi != null ? formatNumber(tech.rsi) : "—"} />
              <DataRow label="SMA (Simple Moving Avg)" value={tech?.sma ? formatINR(tech.sma) : "—"} />
              <DataRow label="EMA (Exponential Moving Avg)" value={tech?.ema ? formatINR(tech.ema) : "—"} />
              <DataRow label="Key Support" value={tech?.support ? formatINR(tech.support) : "—"} />
              <DataRow label="Key Resistance" value={tech?.resistance ? formatINR(tech.resistance) : "—"} />
            </div>
          </section>
        </div>
      )}

      {/* Tab 2: Technical Analysis */}
      {activeTab === "technical" && (
        <section className="card">
          <div className="card-head">
            <strong>Complete Technical Indicators</strong>
            <span>Computed from price action</span>
          </div>
          <div style={{ padding: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <StatItem label="Simple Moving Average (SMA)" value={tech?.sma ? formatINR(tech.sma) : "—"} />
              <StatItem label="Exponential Moving Avg (EMA)" value={tech?.ema ? formatINR(tech.ema) : "—"} />
              <StatItem label="RSI (Relative Strength)" value={tech?.rsi != null ? formatNumber(tech.rsi) : "—"} highlight={tech?.rsi < 30 ? "Oversold" : tech?.rsi > 70 ? "Overbought" : "Neutral"} />
              <StatItem label="MACD" value={tech?.macd != null ? formatNumber(tech.macd) : "—"} />
              <StatItem label="MACD Signal Line" value={tech?.macdSignal != null ? formatNumber(tech.macdSignal) : "—"} />
              <StatItem label="Key Support Level" value={tech?.support ? formatINR(tech.support) : "—"} />
              <StatItem label="Key Resistance Level" value={tech?.resistance ? formatINR(tech.resistance) : "—"} />
            </div>
          </div>
        </section>
      )}

      {/* Tab 3: Fundamental Analysis */}
      {activeTab === "fundamental" && (
        <section className="card">
          <div className="card-head">
            <strong>Company Financial Highlights</strong>
            <span>Reported fundamentals</span>
          </div>
          <div style={{ padding: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <StatItem label="Market Capitalization" value={fund?.marketCap ? formatINR(fund.marketCap) : "—"} />
              <StatItem label="Annual Revenue" value={fund?.revenue ? formatINR(fund.revenue) : "—"} />
              <StatItem label="Net Profit" value={fund?.profit ? formatINR(fund.profit) : "—"} />
              <StatItem label="Total Debt" value={fund?.debt ? formatINR(fund.debt) : "—"} />
              <StatItem label="Price to Earnings (P/E)" value={fund?.peRatio != null ? formatNumber(fund.peRatio) : "—"} />
              <StatItem label="Earnings Per Share (EPS)" value={fund?.eps != null ? `₹${formatNumber(fund.eps)}` : "—"} />
            </div>
          </div>
        </section>
      )}

      {/* Tab 4: Stock Trade History */}
      {activeTab === "history" && (
        <section className="card table-card">
          <div className="table-header">
            <div>
              <strong>Order Audit Trail for {stock.symbol}</strong>
              <span> ({stockTrades.length} trades executed)</span>
            </div>
          </div>
          <div className="table-scroll">
            <table className="market-table">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-center">Type</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total Amount</th>
                  <th className="text-right">Realized P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {stockTrades.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-box">
                        <strong>No Trades Executed for {stock.symbol}</strong>
                        <p>Buy or sell orders executed for this stock will appear here.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stockTrades.map((tx) => (
                    <tr key={tx.id}>
                      <td className="num-cell" style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                        {new Date(tx.transactionDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${tx.type === "BUY" ? "badge-buy" : "badge-sell"}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="text-right num-cell font-semibold">
                        {formatNumber(tx.quantity, 0)}
                      </td>
                      <td className="text-right num-cell">
                        {formatINR(tx.price)}
                      </td>
                      <td className="text-right num-cell font-semibold">
                        {formatINR(tx.totalAmount)}
                      </td>
                      <td className="text-right num-cell">
                        {tx.type === "SELL" && tx.realizedPnL != null ? (
                          <span
                            className={
                              Number(tx.realizedPnL) >= 0 ? "positive font-semibold" : "negative font-semibold"
                            }
                          >
                            {Number(tx.realizedPnL) >= 0 ? "+" : ""}
                            {formatINR(tx.realizedPnL)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Trade Execution Modal */}
      <TransactionModal
        isOpen={isTradeOpen}
        onClose={() => setIsTradeOpen(false)}
        stock={{
          id: stock.id,
          symbol: stock.symbol,
          companyName: stock.companyName,
          currentPrice: currentPrice,
          exchange: stock.exchange
        }}
        initialType={tradeType}
        availableQuantity={holding?.quantity ? Number(holding.quantity) : 0}
        onSuccess={handleTradeSuccess}
      />

      {/* Add to Watchlist Dialog */}
      {isWatchlistModalOpen && (
        <div className="modal-overlay" onClick={() => setIsWatchlistModalOpen(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "380px" }}
          >
            <div className="modal-header">
              <h3>Add to Watchlist</h3>
              <button className="modal-close" onClick={() => setIsWatchlistModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {watchlistError && (
                <div className="form-error" style={{ marginBottom: "12px" }}>
                  {watchlistError}
                </div>
              )}
              {watchlistSuccess && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--profit-bg)",
                    color: "var(--profit)",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "12px"
                  }}
                >
                  ✓ {watchlistSuccess}
                </div>
              )}
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 14px" }}>
                Select a watchlist to monitor <b>{stock.symbol}</b>:
              </p>
              {watchlists.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px 0", color: "var(--text-muted)", fontSize: "12px" }}>
                  No watchlists created yet.
                  <div style={{ marginTop: "8px" }}>
                    <Link to="/watchlists" className="secondary" style={{ fontSize: "11px" }}>
                      Create Watchlist
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {watchlists.map((wl) => (
                    <button
                      key={wl.id}
                      type="button"
                      className="secondary"
                      onClick={() => handleAddToWatchlist(wl.id, wl.name)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        textAlign: "left",
                        cursor: "pointer"
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{wl.name}</span>
                      <span style={{ fontSize: "11px", color: "var(--accent)" }}>+ Add</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components for clean tabular representation
function DataRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid var(--border-subtle)",
        fontSize: "12px"
      }}
    >
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span className="num font-semibold" style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function StatItem({ label, value, highlight }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "12px 14px",
        backgroundColor: "var(--bg-surface)"
      }}
    >
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
        {label}
      </div>
      <div className="num font-bold" style={{ fontSize: "16px", color: "var(--text-primary)" }}>
        {value}
        {highlight && (
          <span className="badge badge-neutral" style={{ marginLeft: "8px", fontSize: "10px" }}>
            {highlight}
          </span>
        )}
      </div>
    </div>
  );
}