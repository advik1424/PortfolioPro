import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatINR, formatPercent, portfolioApi, tradingApi } from "../api";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [summary, setSummary] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
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
      }
    };

    loadDashboardData();
  }, []);

  const holdings = summary?.holdings || [];
  const topHoldings = holdings.slice(0, 5);

  const unrealizedPnL = summary?.totalUnrealizedPnL ?? 0;
  const isProfit = Number(unrealizedPnL) >= 0;

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-heading">
        <div>
          <div className="breadcrumb">HOME / DASHBOARD</div>
          <h1>{getGreeting()}{user?.name ? `, ${user.name}` : ""}</h1>
          <p>Real-time overview of your stock holdings, valuation, and transaction history.</p>
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
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan="5"><div className="skeleton skeleton-text" /></td>
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
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5">
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
    </div>
  );
}