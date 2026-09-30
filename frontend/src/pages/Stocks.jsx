import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { stockApi, marketApi, formatINR, formatPercent } from "../api";
import TransactionModal from "../components/TransactionModal";

export default function Stocks() {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [quotes, setQuotes] = useState({});
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [sort, setSort] = useState({ key: "symbol", dir: "asc" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  // Trade Modal State
  const [tradeStock, setTradeStock] = useState(null);
  const [isTradeOpen, setIsTradeOpen] = useState(false);

  // Load stocks page with auto-retry during background startup sync
  const loadStocks = useCallback(async (isRetry = false) => {
    setLoading(true);
    setError("");
    try {
      const res = query
        ? await stockApi.search(query, page, pageSize)
        : await stockApi.list(page, pageSize);

      const pageData = res.data || { content: [], totalPages: 0, totalElements: 0 };
      setData(pageData);

      // If backend auto-sync is still synchronizing in the background, retry once after 3 seconds
      if (pageData.totalElements === 0 && !query && !isRetry) {
        setTimeout(() => {
          loadStocks(true);
        }, 3000);
      }

      // Lazily fetch live quotes for visible stocks
      const visible = pageData.content || [];
      const quoteMap = {};
      await Promise.allSettled(
        visible.map(async (stk) => {
          try {
            const q = await marketApi.liveQuote(stk.id);
            if (q.data) quoteMap[stk.id] = q.data;
          } catch {
            // safely ignore if unavailable
          }
        })
      );
      setQuotes(quoteMap);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load stock universe.");
      setData({ content: [], totalPages: 0, totalElements: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, query, pageSize]);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  const handleSyncStocks = async () => {
    setSyncing(true);
    setSyncMsg("");
    setError("");
    try {
      const res = await stockApi.sync();
      const count = res.data?.stocksAdded ?? 0;
      setSyncMsg(res.data?.message || `Successfully synced ${count} equities from Twelve Data!`);
      await loadStocks();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Stock synchronization failed. Please check Twelve Data API configuration on Render."
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    setQuery(input.trim());
  };

  const handleClearSearch = () => {
    setInput("");
    setQuery("");
    setPage(0);
  };

  // Sort rows client-side for currently loaded page
  const sortedRows = useMemo(() => {
    const copy = [...(data.content || [])];
    copy.sort((a, b) => {
      let av = a[sort.key];
      let bv = b[sort.key];

      if (sort.key === "price") {
        av = Number(quotes[a.id]?.price || 0);
        bv = Number(quotes[b.id]?.price || 0);
        return sort.dir === "asc" ? av - bv : bv - av;
      }

      av = String(av ?? "").toLowerCase();
      bv = String(bv ?? "").toLowerCase();
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return copy;
  }, [data.content, sort, quotes]);

  const toggleSort = (key) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc"
    }));
  };

  const sortArrow = (key) => {
    if (sort.key !== key) return "";
    return sort.dir === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="breadcrumb">MARKET UNIVERSE / EQUITIES</div>
          <h1>Stock Directory</h1>
          <p>Explore equities, monitor real-time quotes, and initiate portfolio orders.</p>
        </div>
      </div>

      {/* Screener Toolbar & Search */}
      <div
        className="screen-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "16px"
        }}
      >
        <form
          onSubmit={handleSearchSubmit}
          className="screen-search"
          style={{ flex: 1, maxWidth: "420px", display: "flex", gap: "6px" }}
        >
          <input
            type="text"
            className="form-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search by symbol or company name (e.g. INFY, Tata)..."
            style={{ height: "36px", fontSize: "12px" }}
          />
          <button type="submit" className="primary" style={{ padding: "0 16px", height: "36px" }}>
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {query && (
            <button
              type="button"
              className="secondary"
              onClick={handleClearSearch}
              style={{ fontSize: "11px", height: "36px" }}
            >
              ✕ Clear search ("{query}")
            </button>
          )}

          <button
            type="button"
            className="primary"
            onClick={handleSyncStocks}
            disabled={syncing || loading}
            style={{
              height: "36px",
              fontSize: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: syncing ? "var(--bg-tertiary)" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              cursor: syncing ? "not-allowed" : "pointer"
            }}
          >
            {syncing ? "⚡ Syncing from Twelve Data..." : "⚡ Sync Live Stocks (NSE)"}
          </button>
        </div>
      </div>

      {syncMsg && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid var(--profit)",
            borderRadius: "var(--radius-sm)",
            color: "var(--profit)",
            fontSize: "12px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span>✓</span>
          <span>{syncMsg}</span>
        </div>
      )}

      {error && (
        <div className="form-error" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Main Stock Table */}
      <section className="card table-card">
        <div className="table-header">
          <div>
            <strong>{data.totalElements?.toLocaleString() || 0} stocks found</strong>
            <span>{query ? ` matching “${query}”` : " in synchronized universe"}</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Showing page {data.totalPages ? page + 1 : 0} of {data.totalPages || 0}
          </div>
        </div>

        <div className="table-scroll">
          <table className="market-table">
            <thead>
              <tr>
                <th className="text-left" style={{ width: "40px" }}>#</th>
                <th
                  className="text-left"
                  style={{ cursor: "pointer", width: "120px" }}
                  onClick={() => toggleSort("symbol")}
                >
                  Symbol{sortArrow("symbol")}
                </th>
                <th
                  className="text-left"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("companyName")}
                >
                  Company Name{sortArrow("companyName")}
                </th>
                <th
                  className="text-center"
                  style={{ cursor: "pointer", width: "90px" }}
                  onClick={() => toggleSort("exchange")}
                >
                  Exchange{sortArrow("exchange")}
                </th>
                <th
                  className="text-left"
                  style={{ cursor: "pointer", width: "140px" }}
                  onClick={() => toggleSort("sector")}
                >
                  Sector{sortArrow("sector")}
                </th>
                <th
                  className="text-right"
                  style={{ cursor: "pointer", width: "120px" }}
                  onClick={() => toggleSort("price")}
                >
                  CMP{sortArrow("price")}
                </th>
                <th className="text-right" style={{ width: "110px" }}>
                  Day Change
                </th>
                <th className="text-center" style={{ width: "130px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan="8" style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>
                      Loading equities...
                    </td>
                  </tr>
                ))
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-box" style={{ padding: "36px 16px", textAlign: "center" }}>
                      {query ? (
                        <>
                          <strong>No Stocks Found</strong>
                          <p>No equities matched your query "{query}".</p>
                          <button className="secondary" onClick={handleClearSearch} style={{ marginTop: "10px" }}>
                            Clear Filter
                          </button>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: "28px", marginBottom: "8px" }}>📊</div>
                          <strong>0 Stocks in Synchronized Universe</strong>
                          <p style={{ maxWidth: "480px", margin: "6px auto 0", color: "var(--text-secondary)" }}>
                            The database currently has zero stocks. Click below to dynamically synchronize live NSE equities directly from Twelve Data API.
                          </p>
                          <button
                            className="primary"
                            onClick={handleSyncStocks}
                            disabled={syncing}
                            style={{
                              marginTop: "14px",
                              padding: "10px 22px",
                              fontSize: "13px",
                              fontWeight: "600",
                              background: syncing ? "var(--bg-tertiary)" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                              cursor: syncing ? "not-allowed" : "pointer"
                            }}
                          >
                            {syncing ? "⚡ Syncing Live Stocks from Twelve Data..." : "⚡ Sync Stocks from Twelve Data (NSE)"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedRows.map((s, idx) => {
                  const quote = quotes[s.id];
                  const price = quote?.price;
                  const changePct = Number(quote?.changePercent || 0);
                  const isPositive = changePct >= 0;

                  return (
                    <tr key={s.id}>
                      <td className="muted-cell" style={{ fontSize: "11px" }}>
                        {page * pageSize + idx + 1}
                      </td>
                      <td>
                        <Link
                          to={`/stocks/${encodeURIComponent(s.symbol)}`}
                          className="symbol-badge font-bold"
                          style={{ textDecoration: "none" }}
                        >
                          {s.symbol}
                        </Link>
                      </td>
                      <td>
                        <Link
                          to={`/stocks/${encodeURIComponent(s.symbol)}`}
                          className="company"
                        >
                          {s.companyName}
                        </Link>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-neutral">
                          {s.exchange || "NSE"}
                        </span>
                      </td>
                      <td style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                        {s.sector || "General"}
                      </td>
                      <td className="text-right num-cell font-bold">
                        {price != null ? formatINR(price) : "—"}
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
                                id: s.id,
                                symbol: s.symbol,
                                companyName: s.companyName,
                                currentPrice: price || null,
                                exchange: s.exchange
                              });
                              setIsTradeOpen(true);
                            }}
                          >
                            Buy
                          </button>
                          <Link
                            to={`/stocks/${encodeURIComponent(s.symbol)}`}
                            className="secondary"
                            style={{ padding: "3px 8px", fontSize: "11px" }}
                          >
                            View
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

        {/* Pager Pagination */}
        <div className="pager">
          <button
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ← Previous
          </button>
          <span>
            Page {data.totalPages ? page + 1 : 0} of {data.totalPages || 0}
          </span>
          <button
            disabled={page >= data.totalPages - 1 || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      </section>

      {/* Quick Trade Modal */}
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
            // refresh data if needed
          }}
        />
      )}
    </div>
  );
}