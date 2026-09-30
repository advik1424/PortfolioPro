import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  watchlistApi,
  marketApi,
  stockApi,
  formatINR,
  formatPercent
} from "../api";
import TransactionModal from "../components/TransactionModal";

export default function Watchlist() {
  const [watchlists, setWatchlists] = useState([]);
  const [activeWlId, setActiveWlId] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [quotes, setQuotes] = useState({}); // { [stockId]: LiveMarketQuoteDto }
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [error, setError] = useState("");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWlName, setNewWlName] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");

  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [stockSearchResults, setStockSearchResults] = useState([]);
  const [searchingStocks, setSearchingStocks] = useState(false);
  const [addStockMsg, setAddStockMsg] = useState("");

  // Trade Modal State
  const [tradeStock, setTradeStock] = useState(null);
  const [isTradeOpen, setIsTradeOpen] = useState(false);

  // Load all user watchlists
  const loadWatchlists = useCallback(async (selectId = null) => {
    setLoadingLists(true);
    setError("");
    try {
      const res = await watchlistApi.all();
      const listData = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setWatchlists(listData);

      if (listData.length > 0) {
        const targetId = selectId || activeWlId || listData[0].id;
        const exists = listData.some((w) => w.id === targetId);
        const chosenId = exists ? targetId : listData[0].id;
        setActiveWlId(chosenId);
      } else {
        setActiveWlId(null);
        setStocks([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load watchlists.");
    } finally {
      setLoadingLists(false);
    }
  }, [activeWlId]);

  useEffect(() => {
    loadWatchlists();
  }, []);

  // Load stocks for the active watchlist
  const loadWatchlistStocks = useCallback(async (wlId) => {
    if (!wlId) return;
    setLoadingStocks(true);
    try {
      const res = await watchlistApi.getStocks(wlId);
      const stockList = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setStocks(stockList);

      // Fetch live quotes for stocks in this watchlist
      const quoteMap = {};
      await Promise.allSettled(
        stockList.map(async (stk) => {
          try {
            const qRes = await marketApi.liveQuote(stk.stockId);
            quoteMap[stk.stockId] = qRes.data;
          } catch {
            // gracefully fallback if quote unavailable
          }
        })
      );
      setQuotes(quoteMap);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load stocks for watchlist.");
    } finally {
      setLoadingStocks(false);
    }
  }, []);

  useEffect(() => {
    if (activeWlId) {
      loadWatchlistStocks(activeWlId);
    }
  }, [activeWlId, loadWatchlistStocks]);

  // Create new watchlist
  const handleCreateWatchlist = async (e) => {
    e.preventDefault();
    if (!newWlName.trim()) return;
    setCreateBusy(true);
    setCreateError("");
    try {
      const res = await watchlistApi.create(newWlName.trim());
      setNewWlName("");
      setIsCreateModalOpen(false);
      await loadWatchlists(res.data?.id);
    } catch (err) {
      setCreateError(err.response?.data?.message || "Could not create watchlist.");
    } finally {
      setCreateBusy(false);
    }
  };

  // Search stocks to add into active watchlist
  useEffect(() => {
    if (!stockSearchQuery.trim()) {
      setStockSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingStocks(true);
      try {
        const res = await stockApi.search(stockSearchQuery.trim(), 0, 6);
        setStockSearchResults(res.data?.content || []);
      } catch {
        setStockSearchResults([]);
      } finally {
        setSearchingStocks(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [stockSearchQuery]);

  // Add stock to active watchlist
  const handleAddStock = async (stockItem) => {
    if (!activeWlId) return;
    setAddStockMsg("");
    try {
      await watchlistApi.addStock(activeWlId, stockItem.id);
      setAddStockMsg(`Added ${stockItem.symbol} successfully!`);
      loadWatchlistStocks(activeWlId);
      setTimeout(() => setAddStockMsg(""), 1500);
    } catch (err) {
      setAddStockMsg(err.response?.data?.message || "Failed to add stock.");
    }
  };

  // Remove stock from active watchlist
  const handleRemoveStock = async (stockId) => {
    if (!activeWlId) return;
    try {
      await watchlistApi.removeStock(activeWlId, stockId);
      setStocks((prev) => prev.filter((s) => s.stockId !== stockId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove stock.");
    }
  };

  const activeWatchlist = watchlists.find((w) => w.id === activeWlId);

  return (
    <div className="page">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <div className="breadcrumb">WATCHLISTS &amp; MONITORING</div>
          <h1>Watchlists</h1>
          <p>Organize, track, and monitor stocks with real-time price updates.</p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setCreateError("");
            setNewWlName("");
            setIsCreateModalOpen(true);
          }}
        >
          + New Watchlist
        </button>
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {loadingLists ? (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading watchlists...</div>
        </div>
      ) : watchlists.length === 0 ? (
        /* Empty State: No Watchlists Created */
        <div className="card empty-box" style={{ padding: "48px 24px" }}>
          <strong style={{ fontSize: "16px" }}>No Watchlists Created Yet</strong>
          <p style={{ maxWidth: "400px", margin: "8px auto 20px" }}>
            Create watchlists to track price movements, study stocks, and plan your acquisitions.
          </p>
          <button
            className="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Create Your First Watchlist
          </button>
        </div>
      ) : (
        <>
          {/* Watchlists Tab Navigation */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              borderBottom: "1px solid var(--border)",
              marginBottom: "16px",
              overflowX: "auto",
              paddingBottom: "1px"
            }}
          >
            {watchlists.map((w) => {
              const isActive = w.id === activeWlId;
              return (
                <button
                  key={w.id}
                  onClick={() => setActiveWlId(w.id)}
                  style={{
                    padding: "10px 18px",
                    background: "none",
                    border: "none",
                    borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                    color: isActive ? "var(--accent)" : "var(--text-muted)",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {w.name}
                </button>
              );
            })}
          </div>

          {/* Active Watchlist Content Table */}
          <section className="card table-card">
            <div className="table-header">
              <div>
                <strong>{activeWatchlist?.name || "Watchlist"}</strong>
                <span> ({stocks.length} stocks tracked)</span>
              </div>
              <button
                className="secondary"
                onClick={() => {
                  setStockSearchQuery("");
                  setStockSearchResults([]);
                  setAddStockMsg("");
                  setIsAddStockOpen(true);
                }}
                style={{ fontSize: "11px", padding: "5px 12px", fontWeight: 600 }}
              >
                + Add Stocks
              </button>
            </div>

            <div className="table-scroll">
              <table className="market-table">
                <thead>
                  <tr>
                    <th className="text-left" style={{ width: "40px" }}>#</th>
                    <th className="text-left">Company &amp; Symbol</th>
                    <th className="text-right">Live CMP</th>
                    <th className="text-right">Day Change</th>
                    <th className="text-right">Change %</th>
                    <th className="text-center" style={{ width: "160px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStocks ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "32px" }}>
                        Loading stocks in {activeWatchlist?.name}...
                      </td>
                    </tr>
                  ) : stocks.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <div className="empty-box">
                          <strong>No stocks in this watchlist</strong>
                          <p>Add stocks to monitor real-time prices and start trading.</p>
                          <button
                            className="primary"
                            onClick={() => setIsAddStockOpen(true)}
                          >
                            + Add Stock to {activeWatchlist?.name}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    stocks.map((stk, idx) => {
                      const quote = quotes[stk.stockId];
                      const price = quote?.price;
                      const change = Number(quote?.change || 0);
                      const changePct = Number(quote?.changePercent || 0);
                      const isPositive = change >= 0;

                      return (
                        <tr key={stk.id || stk.stockId}>
                          <td className="muted-cell">{idx + 1}</td>
                          <td>
                            <Link to={`/stocks/${encodeURIComponent(stk.symbol)}`} className="company">
                              {stk.companyName}
                            </Link>
                            <span className="symbol-badge" style={{ marginLeft: "8px" }}>
                              {stk.symbol}
                            </span>
                          </td>
                          <td className="text-right num-cell font-bold">
                            {price != null ? formatINR(price) : "—"}
                          </td>
                          <td className="text-right num-cell">
                            {price != null ? (
                              <span className={isPositive ? "positive" : "negative"}>
                                {isPositive ? "+" : ""}
                                {formatINR(change)}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>—</span>
                            )}
                          </td>
                          <td className="text-right num-cell">
                            {price != null ? (
                              <span className={`badge ${isPositive ? "badge-profit" : "badge-loss"}`}>
                                {formatPercent(changePct)}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>—</span>
                            )}
                          </td>
                          <td className="text-center">
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                className="primary"
                                style={{ padding: "3px 8px", fontSize: "11px" }}
                                onClick={() => {
                                  setTradeStock({
                                    id: stk.stockId,
                                    symbol: stk.symbol,
                                    companyName: stk.companyName,
                                    currentPrice: price || null
                                  });
                                  setIsTradeOpen(true);
                                }}
                              >
                                Buy
                              </button>
                              <Link
                                to={`/stocks/${encodeURIComponent(stk.symbol)}`}
                                className="secondary"
                                style={{ padding: "3px 8px", fontSize: "11px" }}
                              >
                                View
                              </Link>
                              <button
                                className="danger-btn"
                                style={{ padding: "3px 8px", fontSize: "11px" }}
                                onClick={() => handleRemoveStock(stk.stockId)}
                                title="Remove from watchlist"
                              >
                                ✕
                              </button>
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
        </>
      )}

      {/* Modal 1: Create Watchlist */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => !createBusy && setIsCreateModalOpen(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "380px" }}
          >
            <div className="modal-header">
              <h3>Create New Watchlist</h3>
              <button
                className="modal-close"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={createBusy}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateWatchlist}>
              <div className="modal-body">
                {createError && (
                  <div className="form-error" style={{ marginBottom: "12px" }}>
                    {createError}
                  </div>
                )}
                <div className="form-group">
                  <label>Watchlist Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bluechip Leaders, Pharma Picks"
                    value={newWlName}
                    onChange={(e) => setNewWlName(e.target.value)}
                    required
                    autoFocus
                    disabled={createBusy}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createBusy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={createBusy || !newWlName.trim()}
                >
                  {createBusy ? "Creating..." : "Create Watchlist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Stock to Watchlist */}
      {isAddStockOpen && (
        <div className="modal-overlay" onClick={() => setIsAddStockOpen(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "440px" }}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Add Stock to Watchlist</h3>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Adding to: <b>{activeWatchlist?.name}</b>
                </div>
              </div>
              <button className="modal-close" onClick={() => setIsAddStockOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {addStockMsg && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: addStockMsg.includes("success") ? "var(--profit-bg)" : "var(--loss-bg)",
                    color: addStockMsg.includes("success") ? "var(--profit)" : "var(--loss)",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "12px"
                  }}
                >
                  {addStockMsg}
                </div>
              )}
              <div className="form-group">
                <label>Search Stock</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type symbol or company name (e.g. INFY, TCS)"
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {searchingStocks && (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "8px 0" }}>
                  Searching backend universe...
                </div>
              )}

              {stockSearchResults.length > 0 && (
                <div
                  style={{
                    maxHeight: "220px",
                    overflowY: "auto",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)"
                  }}
                >
                  {stockSearchResults.map((stk) => {
                    const alreadyInList = stocks.some((s) => s.stockId === stk.id);
                    return (
                      <div
                        key={stk.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 12px",
                          borderBottom: "1px solid var(--border-subtle)"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "13px" }}>
                            {stk.symbol}{" "}
                            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>
                              ({stk.exchange || "NSE"})
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            {stk.companyName}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={alreadyInList ? "secondary" : "primary"}
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          disabled={alreadyInList}
                          onClick={() => handleAddStock(stk)}
                        >
                          {alreadyInList ? "Added" : "+ Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {stockSearchQuery.trim() && !searchingStocks && stockSearchResults.length === 0 && (
                <div style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "12px" }}>
                  No matching stocks found for "{stockSearchQuery}".
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="secondary"
                onClick={() => setIsAddStockOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trade Modal for Quick Buy */}
      {tradeStock && (
        <TransactionModal
          isOpen={isTradeOpen}
          onClose={() => {
            setIsTradeOpen(false);
            setTradeStock(null);
          }}
          stock={tradeStock}
          initialType="BUY"
          onSuccess={() => {
            // Reload stocks
            if (activeWlId) loadWatchlistStocks(activeWlId);
          }}
        />
      )}
    </div>
  );
}