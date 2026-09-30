import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { tradingApi, formatINR, formatNumber } from "../api";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState("ALL"); // 'ALL' | 'BUY' | 'SELL'
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadTransactions = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError("");
    try {
      const res = await tradingApi.history();
      const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
      // Sort newest first
      data.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
      setTransactions(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load transaction history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoStr;
    }
  };

  // Metrics computation across transactions
  const metrics = useMemo(() => {
    let buyCount = 0;
    let sellCount = 0;
    let buyTotal = 0;
    let sellTotal = 0;
    let totalRealized = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.totalAmount || 0);
      if (tx.type === "BUY") {
        buyCount++;
        buyTotal += amt;
      } else if (tx.type === "SELL") {
        sellCount++;
        sellTotal += amt;
        if (tx.realizedPnL != null) {
          totalRealized += Number(tx.realizedPnL);
        }
      }
    });

    return { buyCount, sellCount, buyTotal, sellTotal, totalRealized };
  }, [transactions]);

  // Filtered rows
  const filteredList = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = filterType === "ALL" || tx.type === filterType;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        tx.symbol?.toLowerCase().includes(q) ||
        tx.companyName?.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [transactions, filterType, searchQuery]);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="breadcrumb">AUDIT TRAIL / TRANSACTIONS</div>
          <h1>Transaction History</h1>
          <p>Complete immutable ledger of all executed BUY and SELL stock orders.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="secondary"
            onClick={() => loadTransactions(true)}
            disabled={refreshing || loading}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh Ledger"}
          </button>
          <Link to="/stocks" className="primary">
            + Place Order
          </Link>
        </div>
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Metric Summary Row */}
      <div className="stat-grid" style={{ marginBottom: "20px" }}>
        <div className="stat">
          <span>TOTAL EXECUTIONS</span>
          <strong>{loading ? "..." : transactions.length}</strong>
          <small>
            {metrics.buyCount} Buys · {metrics.sellCount} Sells
          </small>
        </div>
        <div className="stat">
          <span>TOTAL CAPITAL ALLOCATED</span>
          <strong>{loading ? "..." : formatINR(metrics.buyTotal)}</strong>
          <small>Total Buy volume</small>
        </div>
        <div className="stat">
          <span>TOTAL PROCEEDS REALIZED</span>
          <strong>{loading ? "..." : formatINR(metrics.sellTotal)}</strong>
          <small>Total Sell volume</small>
        </div>
        <div className="stat">
          <span>CUMULATIVE REALIZED P&amp;L</span>
          <strong
            className={metrics.totalRealized >= 0 ? "positive" : "negative"}
          >
            {loading ? "..." : (
              <>
                {metrics.totalRealized >= 0 ? "+" : ""}
                {formatINR(metrics.totalRealized)}
              </>
            )}
          </strong>
          <small>Closed position gains/losses</small>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px"
        }}
      >
        {/* Type Filters */}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            className={filterType === "ALL" ? "primary" : "secondary"}
            style={{ padding: "6px 14px", fontSize: "12px" }}
            onClick={() => setFilterType("ALL")}
          >
            All Orders ({transactions.length})
          </button>
          <button
            className={filterType === "BUY" ? "primary" : "secondary"}
            style={{ padding: "6px 14px", fontSize: "12px" }}
            onClick={() => setFilterType("BUY")}
          >
            BUY ({metrics.buyCount})
          </button>
          <button
            className={filterType === "SELL" ? "primary" : "secondary"}
            style={{ padding: "6px 14px", fontSize: "12px" }}
            onClick={() => setFilterType("SELL")}
          >
            SELL ({metrics.sellCount})
          </button>
        </div>

        {/* Stock Search Input */}
        <div style={{ minWidth: "220px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Filter by symbol or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ height: "34px", fontSize: "12px" }}
          />
        </div>
      </div>

      {/* Transactions Table Card */}
      <section className="card table-card">
        <div className="table-header">
          <div>
            <strong>Ledger Entries</strong>
            <span> ({filteredList.length} of {transactions.length} records shown)</span>
          </div>
        </div>

        <div className="table-scroll">
          <table className="market-table">
            <thead>
              <tr>
                <th className="text-left" style={{ width: "160px" }}>Execution Date &amp; Time</th>
                <th className="text-left">Stock</th>
                <th className="text-center" style={{ width: "80px" }}>Type</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Execution Price</th>
                <th className="text-right">Total Amount</th>
                <th className="text-right">Realized P&amp;L</th>
                <th className="text-center" style={{ width: "90px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "36px" }}>
                    Loading transaction ledger...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-box">
                      <strong>No Transactions Found</strong>
                      <p>
                        {searchQuery || filterType !== "ALL"
                          ? "No transactions match your current filter criteria."
                          : "You have not recorded any stock transactions yet."}
                      </p>
                      <Link to="/stocks" className="primary">
                        Browse Stock Universe
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((tx) => {
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
                        <span className="symbol-badge" style={{ marginLeft: "8px" }}>
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
                      <td className="text-right num-cell font-bold">
                        {formatINR(tx.totalAmount)}
                      </td>
                      <td className="text-right num-cell">
                        {!isBuy && hasRealizedPnL ? (
                          <span
                            className={isProfit ? "positive font-semibold" : "negative font-semibold"}
                          >
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
                          Details
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
    </div>
  );
}
