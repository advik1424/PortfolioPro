import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { portfolioApi, tradingApi, formatINR, formatNumber, formatPercent } from "../api";
import TransactionModal from "../components/TransactionModal";

export default function Portfolio() {
  const [summary, setSummary] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("holdings"); // 'holdings' | 'transactions'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Trade Modal State for Buy More / Sell from holdings
  const [tradeStock, setTradeStock] = useState(null);
  const [tradeType, setTradeType] = useState("BUY");
  const [isTradeOpen, setIsTradeOpen] = useState(false);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError("");
    try {
      const [sumRes, txRes] = await Promise.all([
        portfolioApi.summary(),
        tradingApi.history()
      ]);
      setSummary(sumRes.data);
      setHoldings(sumRes.data?.holdings || []);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : txRes.data?.content || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load portfolio data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  const unrealizedPnL = Number(summary?.totalUnrealizedPnL || 0);
  const realizedPnL = Number(summary?.totalRealizedPnL || 0);
  const isUnrealizedPositive = unrealizedPnL >= 0;
  const isRealizedPositive = realizedPnL >= 0;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="breadcrumb">PORTFOLIO OVERVIEW</div>
          <h1>My Investment Portfolio</h1>
          <p>Real-time valuation, active asset allocation, and audit transaction records.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="secondary"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh Data"}
          </button>
          <Link to="/stocks" className="primary">
            + Discover Stocks
          </Link>
        </div>
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* 4-Stat Metric Summary Row */}
      <div className="stat-grid">
        <div className="stat">
          <span>PORTFOLIO VALUE</span>
          <strong>{loading ? "..." : formatINR(summary?.totalCurrentValue || 0)}</strong>
          <small>Current market value</small>
        </div>
        <div className="stat">
          <span>TOTAL INVESTED</span>
          <strong>{loading ? "..." : formatINR(summary?.totalInvested || 0)}</strong>
          <small>Capital allocated</small>
        </div>
        <div className="stat">
          <span>UNREALIZED P&amp;L</span>
          <strong className={isUnrealizedPositive ? "positive" : "negative"}>
            {loading ? "..." : (
              <>
                {unrealizedPnL >= 0 ? "+" : ""}
                {formatINR(unrealizedPnL)}
                <span
                  style={{
                    fontSize: "12px",
                    marginLeft: "6px",
                    fontWeight: 600
                  }}
                >
                  ({formatPercent(summary?.totalUnrealizedPnLPercentage)})
                </span>
              </>
            )}
          </strong>
          <small>Open positions return</small>
        </div>
        <div className="stat">
          <span>REALIZED P&amp;L</span>
          <strong className={isRealizedPositive ? "positive" : "negative"}>
            {loading ? "..." : (
              <>
                {realizedPnL >= 0 ? "+" : ""}
                {formatINR(realizedPnL)}
              </>
            )}
          </strong>
          <small>Net closed trade profit/loss</small>
        </div>
      </div>

      {/* Tab Navigation: Holdings vs Transactions */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border)",
          marginBottom: "16px",
          marginTop: "24px"
        }}
      >
        <button
          onClick={() => setActiveTab("holdings")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "holdings" ? "2px solid var(--accent)" : "2px solid transparent",
            color: activeTab === "holdings" ? "var(--accent)" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span>Active Holdings</span>
          <span
            className="badge badge-neutral"
            style={{ fontSize: "10px", padding: "1px 6px" }}
          >
            {holdings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "transactions" ? "2px solid var(--accent)" : "2px solid transparent",
            color: activeTab === "transactions" ? "var(--accent)" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span>Transaction History</span>
          <span
            className="badge badge-neutral"
            style={{ fontSize: "10px", padding: "1px 6px" }}
          >
            {transactions.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Active Holdings Table */}
      {activeTab === "holdings" && (
        <section className="card table-card">
          <div className="table-header">
            <div>
              <strong>Holdings Breakdown</strong>
              <span> ({holdings.length} stocks currently in portfolio)</span>
            </div>
          </div>
          <div className="table-scroll">
            <table className="market-table">
              <thead>
                <tr>
                  <th className="text-left">Company</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Avg. Buy Price</th>
                  <th className="text-right">CMP</th>
                  <th className="text-right">Invested Value</th>
                  <th className="text-right">Current Value</th>
                  <th className="text-right">Unrealized P&amp;L</th>
                  <th className="text-center" style={{ width: "190px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "32px" }}>
                      Loading holdings data...
                    </td>
                  </tr>
                ) : holdings.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-box">
                        <strong>No Active Holdings</strong>
                        <p>You have not acquired any stock positions yet.</p>
                        <Link to="/stocks" className="primary">
                          Explore Stocks to Buy
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  holdings.map((h) => {
                    const pnl = Number(h.unrealizedPnL || 0);
                    const isProfit = pnl >= 0;
                    return (
                      <tr key={h.id || h.stockId}>
                        <td>
                          <Link to={`/stocks/${encodeURIComponent(h.symbol)}`} className="company">
                            {h.companyName}
                          </Link>
                          <span
                            className="symbol-badge"
                            style={{ marginLeft: "8px" }}
                          >
                            {h.symbol}
                          </span>
                        </td>
                        <td className="text-right num-cell font-semibold">
                          {formatNumber(h.quantity, 0)}
                        </td>
                        <td className="text-right num-cell">
                          {formatINR(h.averageBuyPrice)}
                        </td>
                        <td className="text-right num-cell font-semibold">
                          {formatINR(h.currentPrice)}
                        </td>
                        <td className="text-right num-cell">
                          {formatINR(h.investedValue)}
                        </td>
                        <td className="text-right num-cell font-semibold">
                          {formatINR(h.currentValue)}
                        </td>
                        <td className="text-right num-cell">
                          <span className={isProfit ? "positive font-semibold" : "negative font-semibold"}>
                            {pnl >= 0 ? "+" : ""}
                            {formatINR(pnl)}
                          </span>
                          <span
                            className={`badge ${isProfit ? "badge-profit" : "badge-loss"}`}
                            style={{ marginLeft: "8px" }}
                          >
                            {formatPercent(h.unrealizedPnLPercentage)}
                          </span>
                        </td>
                        <td className="text-center">
                          <div style={{ display: "inline-flex", gap: "5px" }}>
                            <button
                              className="primary"
                              style={{ padding: "3px 8px", fontSize: "11px" }}
                              onClick={() => {
                                setTradeStock({
                                  id: h.stockId || h.id,
                                  symbol: h.symbol,
                                  companyName: h.companyName,
                                  currentPrice: h.currentPrice,
                                  availableQuantity: Number(h.quantity || 0)
                                });
                                setTradeType("BUY");
                                setIsTradeOpen(true);
                              }}
                            >
                              Buy More
                            </button>
                            <button
                              className="danger-btn"
                              style={{ padding: "3px 8px", fontSize: "11px" }}
                              onClick={() => {
                                setTradeStock({
                                  id: h.stockId || h.id,
                                  symbol: h.symbol,
                                  companyName: h.companyName,
                                  currentPrice: h.currentPrice,
                                  availableQuantity: Number(h.quantity || 0)
                                });
                                setTradeType("SELL");
                                setIsTradeOpen(true);
                              }}
                            >
                              Sell
                            </button>
                            <Link
                              to={`/stocks/${encodeURIComponent(h.symbol)}`}
                              className="secondary"
                              style={{ padding: "3px 8px", fontSize: "11px" }}
                            >
                              Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 2: Transaction History Table */}
      {activeTab === "transactions" && (
        <section className="card table-card">
          <div className="table-header">
            <div>
              <strong>Executed Orders &amp; Audit Trail</strong>
              <span> ({transactions.length} total orders recorded)</span>
            </div>
          </div>
          <div className="table-scroll">
            <table className="market-table">
              <thead>
                <tr>
                  <th className="text-left">Date &amp; Time</th>
                  <th className="text-left">Stock</th>
                  <th className="text-center">Type</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Trade Price</th>
                  <th className="text-right">Total Amount</th>
                  <th className="text-right">Realized P&amp;L</th>
                  <th className="text-center" style={{ width: "90px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "32px" }}>
                      Loading transactions history...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-box">
                        <strong>No Transactions Recorded</strong>
                        <p>No buy or sell orders have been executed yet.</p>
                        <Link to="/stocks" className="primary">
                          Place Your First Order
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isBuy = tx.type === "BUY";
                    const hasRealizedPnL = tx.realizedPnL !== null && tx.realizedPnL !== undefined;
                    const rPnl = Number(tx.realizedPnL || 0);
                    const isProfit = rPnl >= 0;

                    return (
                      <tr key={tx.id}>
                        <td className="num-cell" style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                          {formatDate(tx.transactionDate)}
                        </td>
                        <td>
                          <Link to={`/stocks/${encodeURIComponent(tx.symbol)}`} className="company">
                            {tx.companyName || tx.symbol}
                          </Link>
                          <span
                            className="symbol-badge"
                            style={{ marginLeft: "8px" }}
                          >
                            {tx.symbol}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`badge ${isBuy ? "badge-buy" : "badge-sell"}`}>
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
                          {!isBuy && hasRealizedPnL ? (
                            <span className={isProfit ? "positive font-semibold" : "negative font-semibold"}>
                              {rPnl >= 0 ? "+" : ""}
                              {formatINR(rPnl)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </td>
                        <td className="text-center">
                          <Link
                            to={`/stocks/${encodeURIComponent(tx.symbol)}`}
                            className="secondary"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Trade Modal for Buy More / Sell from Holdings */}
      {tradeStock && (
        <TransactionModal
          isOpen={isTradeOpen}
          onClose={() => {
            setIsTradeOpen(false);
            setTradeStock(null);
          }}
          stock={tradeStock}
          initialType={tradeType}
          availableQuantity={tradeStock.availableQuantity || 0}
          onSuccess={() => loadData(true)}
        />
      )}
    </div>
  );
}