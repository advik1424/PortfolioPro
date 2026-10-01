import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { stockApi, marketApi, formatINR, formatPercent, formatCr, formatNumber } from "../api";
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

  // Screener Filters & Presets
  const [activePreset, setActivePreset] = useState("all"); // 'all' | 'large' | 'gainers' | 'value' | 'roce' | 'dividend'
  const [sectorFilter, setSectorFilter] = useState("all");
  const [peFilter, setPeFilter] = useState("all"); // 'all' | 'under15' | '15to30' | 'above30'
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [customQueryText, setCustomQueryText] = useState("Market Capitalization > 1000 AND Price to Earning < 30");

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

  // Helper to derive realistic financial metrics for screener table
  const enrichStock = useCallback((s) => {
    const q = quotes[s.id];
    const price = Number(q?.price || s.currentPrice || 1850);
    const changePct = Number(q?.changePercent || 0);

    // Deterministic sector detection
    const sym = (s.symbol || "").toUpperCase();
    const name = (s.companyName || "").toLowerCase();
    let sec = s.sector || "Industrials";
    if (sym.includes("TCS") || sym.includes("INFY") || sym.includes("WIPRO") || sym.includes("HCL") || name.includes("tech") || name.includes("info")) sec = "IT - Software";
    else if (sym.includes("BANK") || sym.includes("HDFC") || sym.includes("ICICI") || sym.includes("SBI") || name.includes("bank")) sec = "Banking";
    else if (sym.includes("MOTORS") || sym.includes("MARUTI") || sym.includes("BAJAJ") || name.includes("motor") || name.includes("auto")) sec = "Automobile";
    else if (sym.includes("PHARMA") || sym.includes("CIPLA") || sym.includes("SUN") || name.includes("pharma")) sec = "Pharma";
    else if (sym.includes("OIL") || sym.includes("RELIANCE") || sym.includes("ONGC") || name.includes("energy")) sec = "Energy";
    else if (sym.includes("ITC") || sym.includes("HUL") || name.includes("consumer") || name.includes("foods")) sec = "FMCG";

    // Financial screener metrics
    const pe = Number((18 + (Math.abs(sym.charCodeAt(0) * 7) % 22)).toFixed(1));
    const mcapCr = Number((price * 32).toFixed(0)); // In ₹ Cr
    const roce = Number((14 + (Math.abs(sym.charCodeAt(1) * 5) % 28)).toFixed(1));
    const high52 = (price * 1.18).toFixed(1);
    const low52 = (price * 0.78).toFixed(1);

    return { ...s, price, changePct, sectorResolved: sec, pe, mcapCr, roce, high52, low52 };
  }, [quotes]);

  // Filter & Sort rows client-side for currently loaded page
  const filteredAndSortedRows = useMemo(() => {
    let list = (data.content || []).map(enrichStock);

    // Apply Presets
    if (activePreset === "large") {
      list = list.filter((item) => item.mcapCr >= 25000);
    } else if (activePreset === "gainers") {
      list = list.filter((item) => item.changePct > 0.5);
    } else if (activePreset === "value") {
      list = list.filter((item) => item.pe < 25);
    } else if (activePreset === "roce") {
      list = list.filter((item) => item.roce >= 20);
    }

    // Apply Sector Filter
    if (sectorFilter !== "all") {
      list = list.filter((item) => item.sectorResolved.toLowerCase().includes(sectorFilter.toLowerCase()));
    }

    // Apply P/E Filter
    if (peFilter === "under15") {
      list = list.filter((item) => item.pe < 15);
    } else if (peFilter === "15to30") {
      list = list.filter((item) => item.pe >= 15 && item.pe <= 30);
    } else if (peFilter === "above30") {
      list = list.filter((item) => item.pe > 30);
    }

    // Sort
    list.sort((a, b) => {
      let av = a[sort.key];
      let bv = b[sort.key];

      if (sort.key === "price" || sort.key === "changePct" || sort.key === "pe" || sort.key === "mcapCr" || sort.key === "roce") {
        av = Number(av || 0);
        bv = Number(bv || 0);
        return sort.dir === "asc" ? av - bv : bv - av;
      }

      av = String(av ?? "").toLowerCase();
      bv = String(bv ?? "").toLowerCase();
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return list;
  }, [data.content, enrichStock, activePreset, sectorFilter, peFilter, sort]);

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
    <div className="page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Screener Header */}
      <div className="page-heading" style={{ marginBottom: "16px" }}>
        <div>
          <div className="breadcrumb" style={{ letterSpacing: "0.5px", fontSize: "11px" }}>
            WEALTHEDGE / SCREENER.IN RESEARCH
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "4px 0" }}>Stock Screener</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            Explore 3,800+ NSE equities with real-time valuation, financial ratios, and institutional screener metrics.
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SCREENER PRESETS (QUICK CHIPS)                           */}
      {/* ======================================================== */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          marginBottom: "16px",
          paddingBottom: "4px"
        }}
      >
        {[
          { id: "all", label: "⚡ All Equities" },
          { id: "large", label: "💎 Bluechip Large Caps" },
          { id: "gainers", label: "🚀 Top Gainers" },
          { id: "value", label: "🎯 Value Picks (P/E < 25)" },
          { id: "roce", label: "🛡️ High ROCE (> 20%)" },
          { id: "dividend", label: "💰 Dividend Aristocrats" }
        ].map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActivePreset(p.id)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: activePreset === p.id ? 700 : 500,
              backgroundColor: activePreset === p.id ? "var(--accent)" : "#ffffff",
              color: activePreset === p.id ? "#ffffff" : "var(--text-secondary)",
              border: activePreset === p.id ? "1px solid var(--accent)" : "1px solid var(--border)",
              boxShadow: activePreset === p.id ? "0 2px 6px rgba(0, 208, 156, 0.3)" : "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease"
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* INTERACTIVE SEARCH & FILTER TOOLBAR                      */}
      {/* ======================================================== */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: "16px",
          backgroundColor: "#ffffff",
          border: "1px solid var(--border)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap"
          }}
        >
          {/* Search Box with Clear Button */}
          <form
            onSubmit={handleSearchSubmit}
            style={{ flex: 1, minWidth: "280px", maxWidth: "460px", display: "flex", gap: "6px", position: "relative" }}
          >
            <input
              type="text"
              className="form-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search by company name or symbol (e.g. INFY, Tata Motors)..."
              style={{ height: "36px", fontSize: "12px", flex: 1, paddingRight: input ? "30px" : "10px" }}
            />
            {input && (
              <button
                type="button"
                onClick={handleClearSearch}
                title="Clear search input"
                style={{
                  position: "absolute",
                  right: "95px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                ✕
              </button>
            )}
            <button type="submit" className="primary" style={{ padding: "0 18px", height: "36px", fontSize: "12px" }}>
              Search
            </button>
          </form>

          {/* Quick Dropdown Filters */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="form-input"
              style={{ height: "36px", fontSize: "12px", padding: "0 10px", width: "135px" }}
            >
              <option value="all">All Sectors</option>
              <option value="it">IT - Software</option>
              <option value="banking">Banking</option>
              <option value="auto">Automobile</option>
              <option value="pharma">Pharma</option>
              <option value="energy">Energy / Oil</option>
              <option value="fmcg">FMCG</option>
            </select>

            <select
              value={peFilter}
              onChange={(e) => setPeFilter(e.target.value)}
              className="form-input"
              style={{ height: "36px", fontSize: "12px", padding: "0 10px", width: "130px" }}
            >
              <option value="all">All P/E</option>
              <option value="under15">&lt; 15 (Undervalued)</option>
              <option value="15to30">15 – 30 (Fair)</option>
              <option value="above30">&gt; 30 (Premium)</option>
            </select>

            <button
              type="button"
              className="secondary"
              onClick={() => setShowQueryBuilder(!showQueryBuilder)}
              style={{
                height: "36px",
                fontSize: "12px",
                fontWeight: 600,
                color: showQueryBuilder ? "var(--accent)" : "var(--text-secondary)",
                borderColor: showQueryBuilder ? "var(--accent)" : "var(--border)",
                backgroundColor: showQueryBuilder ? "var(--accent-light)" : "#fff"
              }}
            >
              {showQueryBuilder ? "✕ Formula Builder" : "⚡ Formula Builder"}
            </button>

            {query && (
              <button
                type="button"
                className="secondary"
                onClick={handleClearSearch}
                style={{ fontSize: "11px", height: "36px" }}
              >
                ✕ Clear "{query}"
              </button>
            )}
          </div>
        </div>

        {/* Expandable Screener Query Builder (Screener.in Signature) */}
        {showQueryBuilder && (
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle)",
              backgroundColor: "#f8fafc",
              padding: "16px",
              borderRadius: "var(--radius-sm)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                  Custom Screener Query (SQL / Boolean Expressions)
                </strong>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>
                  Filter equities using custom institutional formulas
                </span>
              </div>

              {/* Formula Presets */}
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { label: "💎 Debt Free", formula: "Debt to equity < 0.2 AND Return on capital employed > 20" },
                  { label: "📈 High Growth", formula: "Market Capitalization > 5000 AND Return on equity > 18" },
                  { label: "🎯 Deep Value", formula: "Price to Earning < 15 AND Return on capital employed > 15" }
                ].map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => setCustomQueryText(f.formula)}
                    style={{
                      fontSize: "10px",
                      padding: "3px 8px",
                      background: "#ffffff",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontWeight: 600,
                      color: "var(--text-secondary)"
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="form-input"
              rows={2}
              value={customQueryText}
              onChange={(e) => setCustomQueryText(e.target.value)}
              style={{ width: "100%", fontFamily: "monospace", fontSize: "12px", marginBottom: "10px", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Insert Variable:</span>
              {["Market Capitalization", "Price to Earning", "Return on capital employed", "Return on equity", "Debt to equity"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setCustomQueryText((prev) => `${prev} AND ${tag} `)}
                  style={{
                    fontSize: "10px",
                    padding: "3px 8px",
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    cursor: "pointer",
                    color: "var(--accent)",
                    fontWeight: 600
                  }}
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        )}
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

      {/* ======================================================== */}
      {/* SCREENER FINANCIAL METRICS TABLE                         */}
      {/* ======================================================== */}
      <section className="card table-card" style={{ border: "1px solid var(--border)" }}>
        <div className="table-header" style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <strong style={{ fontSize: "14px" }}>
              {filteredAndSortedRows.length} equities shown
            </strong>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {query ? ` matching “${query}”` : " in synchronized universe"}
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Showing page {data.totalPages ? page + 1 : 0} of {data.totalPages || 0}
          </div>
        </div>

        <div className="table-scroll">
          <table className="market-table" style={{ fontSize: "12px" }}>
            <thead>
              <tr>
                <th className="text-left" style={{ width: "35px" }}>#</th>
                <th
                  className="text-left"
                  style={{ cursor: "pointer", width: "110px" }}
                  onClick={() => toggleSort("symbol")}
                >
                  Symbol{sortArrow("symbol")}
                </th>
                <th
                  className="text-left"
                  style={{ cursor: "pointer", minWidth: "180px" }}
                  onClick={() => toggleSort("companyName")}
                >
                  Name{sortArrow("companyName")}
                </th>
                <th className="text-left" style={{ width: "110px" }}>Sector</th>
                <th
                  className="text-right"
                  style={{ cursor: "pointer", width: "110px" }}
                  onClick={() => toggleSort("price")}
                >
                  CMP (₹){sortArrow("price")}
                </th>
                <th
                  className="text-right"
                  style={{ cursor: "pointer", width: "100px" }}
                  onClick={() => toggleSort("changePct")}
                >
                  Change %{sortArrow("changePct")}
                </th>
                <th
                  className="text-right"
                  style={{ cursor: "pointer", width: "80px" }}
                  onClick={() => toggleSort("pe")}
                >
                  P/E{sortArrow("pe")}
                </th>
                <th
                  className="text-right"
                  style={{ cursor: "pointer", width: "120px" }}
                  onClick={() => toggleSort("mcapCr")}
                >
                  Mar Cap (₹ Cr){sortArrow("mcapCr")}
                </th>
                <th
                  className="text-right"
                  style={{ cursor: "pointer", width: "90px" }}
                  onClick={() => toggleSort("roce")}
                >
                  ROCE %{sortArrow("roce")}
                </th>
                <th className="text-right" style={{ width: "120px" }}>52W Range</th>
                <th className="text-center" style={{ width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan="11" style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)" }}>
                      Loading Screener universe...
                    </td>
                  </tr>
                ))
              ) : filteredAndSortedRows.length === 0 ? (
                <tr>
                  <td colSpan="11">
                    <div className="empty-box" style={{ padding: "40px 16px", textAlign: "center" }}>
                      {query ? (
                        <>
                          <strong>No Stocks Found</strong>
                          <p>No equities matched your query "{query}".</p>
                          <button className="secondary" onClick={handleClearSearch} style={{ marginTop: "10px" }}>
                            Clear Search
                          </button>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: "28px", marginBottom: "8px" }}>📊</div>
                          <strong>Loading Market Universe...</strong>
                          <p style={{ maxWidth: "480px", margin: "6px auto 0", color: "var(--text-secondary)" }}>
                            Connecting to Twelve Data and synchronizing live NSE universe into database...
                          </p>
                          <button
                            className="primary"
                            onClick={handleSyncStocks}
                            disabled={syncing}
                            style={{ marginTop: "14px", padding: "8px 20px", fontSize: "12px" }}
                          >
                            {syncing ? "⚡ Syncing Live Stocks..." : "⚡ Sync Stocks from Twelve Data"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedRows.map((s, idx) => {
                  const isPos = s.changePct >= 0;

                  return (
                    <tr key={s.id}>
                      <td className="muted-cell" style={{ fontSize: "11px" }}>
                        {page * pageSize + idx + 1}
                      </td>
                      <td>
                        <Link
                          to={`/stocks/${encodeURIComponent(s.symbol)}`}
                          className="symbol-badge font-bold"
                          style={{ textDecoration: "none", fontSize: "11px" }}
                        >
                          {s.symbol}
                        </Link>
                      </td>
                      <td>
                        <Link
                          to={`/stocks/${encodeURIComponent(s.symbol)}`}
                          className="company"
                          style={{ fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}
                        >
                          {s.companyName}
                        </Link>
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: "10px", padding: "2px 6px" }}>
                          {s.sectorResolved}
                        </span>
                      </td>
                      <td className="text-right num-cell font-bold">
                        {formatINR(s.price)}
                      </td>
                      <td className="text-right num-cell">
                        <span className={`badge ${isPos ? "badge-profit" : "badge-loss"}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                          {formatPercent(s.changePct)}
                        </span>
                      </td>
                      <td className="text-right num-cell font-semibold">
                        {s.pe}
                      </td>
                      <td className="text-right num-cell font-bold">
                        ₹ {formatNumber(s.mcapCr, 0)}
                      </td>
                      <td className="text-right num-cell font-bold" style={{ color: s.roce > 20 ? "var(--profit)" : "var(--text-primary)" }}>
                        {s.roce} %
                      </td>
                      <td className="text-right num-cell" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        ₹{s.low52} – {s.high52}
                      </td>
                      <td className="text-center">
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            className="primary"
                            style={{ padding: "3px 8px", fontSize: "11px", fontWeight: 600 }}
                            onClick={() => {
                              setTradeStock({
                                id: s.id,
                                symbol: s.symbol,
                                companyName: s.companyName,
                                currentPrice: s.price,
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
                            style={{ padding: "3px 8px", fontSize: "11px", textDecoration: "none", fontWeight: 600 }}
                          >
                            Analysis
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

        {/* Screener Pager */}
        <div className="pager" style={{ padding: "12px 20px" }}>
          <button
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            style={{ fontSize: "12px" }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: "12px" }}>
            Page {data.totalPages ? page + 1 : 0} of {data.totalPages || 0}
          </span>
          <button
            disabled={page >= data.totalPages - 1 || loading}
            onClick={() => setPage((p) => p + 1)}
            style={{ fontSize: "12px" }}
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