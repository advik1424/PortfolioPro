import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { formatINR, formatPercent, formatNumber, portfolioApi, tradingApi } from "../api";
import TransactionModal from "../components/TransactionModal";

const ALLOCATION_COLORS = [
  "#00d09c",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
  "#f97316"
];

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [summary, setSummary] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [hoveredHolding, setHoveredHolding] = useState(null);

  // Trade Modal State for quick order entry
  const [tradeStock, setTradeStock] = useState(null);
  const [isTradeOpen, setIsTradeOpen] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const loadDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [sumRes, tradesRes] = await Promise.allSettled([
        portfolioApi.summary(),
        tradingApi.history()
      ]);

      if (sumRes.status === "fulfilled") {
        setSummary(sumRes.value.data);
      } else {
        setError("Failed to load portfolio metrics.");
      }

      if (tradesRes.status === "fulfilled") {
        setRecentTrades((tradesRes.value.data || []).slice(0, 5));
      }
    } catch (err) {
      setError("Unable to connect to WealthEdge backend.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const holdings = summary?.holdings || [];
  const topHoldings = holdings.slice(0, 5);

  const totalValue = Number(summary?.totalCurrentValue || 0);
  const unrealizedPnL = summary?.totalUnrealizedPnL ?? 0;
  const isProfit = Number(unrealizedPnL) >= 0;

  // Asset allocation percentages
  const allocation = useMemo(() => {
    if (!totalValue || holdings.length === 0) return [];
    return holdings.map((h, i) => {
      const val = Number(h.currentValue || 0);
      const pct = Math.max(1, (val / totalValue) * 100);
      return {
        ...h,
        weight: pct,
        color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]
      };
    });
  }, [holdings, totalValue]);

  return (
    <div className="page" style={{ maxWidth: "1240px", margin: "0 auto" }}>
      {/* Top Notification / Market Status Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="live-badge">
            <span className="live-pulse-dot" /> LIVE NSE / BSE
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
            Indian Stock Exchanges Active · Market Regular Hours
          </span>
        </div>

        <button
          type="button"
          onClick={() => loadDashboardData(true)}
          disabled={refreshing || loading}
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "#ffffff",
            padding: "5px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            boxShadow: "var(--shadow-xs)"
          }}
        >
          <span className={refreshing ? "spinning" : ""} style={{ display: "inline-block" }}>↻</span>
          {refreshing ? "Refreshing..." : "Refresh Prices"}
        </button>
      </div>

      {/* Page Header */}
      <div className="page-heading">
        <div>
          <div className="breadcrumb">WEALTHEDGE / OVERVIEW</div>
          <h1>{getGreeting()}{user?.name ? `, ${user.name}` : ""}</h1>
          <p>Real-time valuation, dynamic portfolio asset allocation, and audit transaction history.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link to="/stocks" className="secondary">Explore Screener</Link>
          <Link to="/portfolio" className="primary">View Portfolio</Link>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      {/* Primary Financial Metric Row */}
      <div className="stat-grid">
        <div className="stat">
          <span>Portfolio Value</span>
          <strong>
            {loading ? <div className="skeleton skeleton-text" /> : formatINR(summary?.totalCurrentValue ?? 0)}
          </strong>
          <small>Current market valuation</small>
        </div>

        <div className="stat">
          <span>Total Invested</span>
          <strong>
            {loading ? <div className="skeleton skeleton-text" /> : formatINR(summary?.totalInvested ?? 0)}
          </strong>
          <small>Acquisition cost basis</small>
        </div>

        <div className="stat">
          <span>Unrealized P&L</span>
          <strong className={isProfit ? "positive num" : "negative num"}>
            {loading ? (
              <div className="skeleton skeleton-text" />
            ) : (
              `${isProfit ? "+" : ""}${formatINR(unrealizedPnL)} (${formatPercent(summary?.totalUnrealizedPnLPercentage ?? 0)})`
            )}
          </strong>
          <small>Open positions profit/loss</small>
        </div>

        <div className="stat">
          <span>Realized P&L</span>
          <strong className={(summary?.totalRealizedPnL ?? 0) >= 0 ? "positive num" : "negative num"}>
            {loading ? (
              <div className="skeleton skeleton-text" />
            ) : (
              `${(summary?.totalRealizedPnL ?? 0) >= 0 ? "+" : ""}${formatINR(summary?.totalRealizedPnL ?? 0)}`
            )}
          </strong>
          <small>{summary?.holdingsCount ?? 0} active holdings</small>
        </div>
      </div>

      {/* Interactive Asset Allocation Bar (if holdings exist) */}
      {allocation.length > 0 && (
        <div className="card" style={{ padding: "18px 22px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "13px", fontWeight: 700 }}>Asset Allocation Distribution</strong>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {holdings.length} equities · Hover segment to inspect weight
            </span>
          </div>

          <div className="allocation-track">
            {allocation.map((item, idx) => (
              <div
                key={item.id || idx}
                className="allocation-segment"
                style={{
                  width: `${item.weight}%`,
                  backgroundColor: item.color
                }}
                onMouseEnter={() => setHoveredHolding(item)}
                onMouseLeave={() => setHoveredHolding(null)}
              />
            ))}
          </div>

          {hoveredHolding ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", animation: "toastSlideUp 0.12s ease" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: hoveredHolding.color }} />
              <strong>{hoveredHolding.symbol}</strong>
              <span style={{ color: "var(--text-secondary)" }}>{hoveredHolding.companyName}</span>
              <span style={{ marginLeft: "auto", fontWeight: 700, color: "var(--text-primary)" }}>
                {formatINR(hoveredHolding.currentValue)} ({hoveredHolding.weight.toFixed(1)}%)
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "11px", color: "var(--text-secondary)" }}>
              {allocation.slice(0, 5).map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: item.color }} />
                  <span>{item.symbol} ({item.weight.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Top Holdings & Recent Transactions */}
      <div className="two-col">
        {/* Top Holdings Section */}
        <section className="card">
          <div className="card-head">
            <strong>Top Holdings</strong>
            <Link to="/portfolio">All Holdings ({holdings.length}) →</Link>
          </div>

          <div className="table-scroll">
            <table className="market-table">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Avg Price</th>
                  <th className="text-right">Current Value</th>
                  <th className="text-right">P&L</th>
                  <th className="text-center" style={{ width: "65px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan="6"><div className="skeleton skeleton-text" /></td>
                    </tr>
                  ))
                ) : topHoldings.length > 0 ? (
                  topHoldings.map((h) => {
                    const pnl = h.unrealizedPnL ?? 0;
                    const pnlPositive = Number(pnl) >= 0;
                    return (
                      <tr key={h.id}>
                        <td>
                          <Link className="company" to={`/stocks/${h.symbol}`}>
                            <span className="symbol-badge font-bold">{h.symbol}</span>
                          </Link>
                          {h.companyName && (
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                              {h.companyName}
                            </div>
                          )}
                        </td>
                        <td className="text-right num-cell">{h.quantity}</td>
                        <td className="text-right num-cell">{formatINR(h.averageBuyPrice)}</td>
                        <td className="text-right num-cell"><strong>{formatINR(h.currentValue)}</strong></td>
                        <td className="text-right num-cell">
                          <span className={`badge ${pnlPositive ? "badge-profit" : "badge-loss"}`}>
                            {pnlPositive ? "+" : ""}{formatINR(pnl)}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="secondary table-quick-action"
                            onClick={() => {
                              setTradeStock({
                                id: h.stockId || h.id,
                                symbol: h.symbol,
                                companyName: h.companyName,
                                currentPrice: h.currentPrice || h.averageBuyPrice
                              });
                              setIsTradeOpen(true);
                            }}
                            style={{ padding: "3px 8px", fontSize: "11px", borderRadius: "4px" }}
                          >
                            + Trade
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-box" style={{ padding: "32px 16px" }}>
                        <strong>No stock holdings yet</strong>
                        <p>Search companies and record your acquisitions to start tracking.</p>
                        <Link to="/stocks" className="secondary" style={{ display: "inline-block" }}>
                          Explore stock directory →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Transactions Section */}
        <section className="card">
          <div className="card-head">
            <strong>Recent Activity</strong>
            <Link to="/transactions">View All Transactions →</Link>
          </div>

          <div className="table-scroll">
            <table className="market-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Stock</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan="5"><div className="skeleton skeleton-text" /></td>
                    </tr>
                  ))
                ) : recentTrades.length > 0 ? (
                  recentTrades.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className={`badge ${t.type === "BUY" ? "badge-buy" : "badge-sell"}`}>
                          {t.type}
                        </span>
                      </td>
                      <td>
                        <Link className="company" to={`/stocks/${t.symbol}`}>
                          <strong>{t.symbol}</strong>
                        </Link>
                      </td>
                      <td className="text-right num-cell">{t.quantity}</td>
                      <td className="text-right num-cell">{formatINR(t.price)}</td>
                      <td className="text-right num-cell"><strong>{formatINR(t.totalAmount)}</strong></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-box" style={{ padding: "32px 16px" }}>
                        <strong>No transactions recorded</strong>
                        <p>When you record BUY or SELL trades, they will be preserved here.</p>
                        <Link to="/stocks" className="secondary" style={{ display: "inline-block" }}>
                          Find stocks to trade →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Quick Navigation Footer Banner */}
      <div style={{ marginTop: "24px" }} className="card info-card">
        <strong>WealthEdge Intelligence:</strong>
        <span>
          Stocks are stored in MySQL with market valuations synced from Twelve Data. Use Watchlists to monitor potential opportunities.
        </span>
      </div>

      {/* Transaction Modal */}
      {isTradeOpen && tradeStock && (
        <TransactionModal
          stock={tradeStock}
          initialType="BUY"
          onClose={() => {
            setIsTradeOpen(false);
            setTradeStock(null);
          }}
          onSuccess={() => {
            setIsTradeOpen(false);
            setTradeStock(null);
            loadDashboardData(true);
          }}
        />
      )}
    </div>
  );
}