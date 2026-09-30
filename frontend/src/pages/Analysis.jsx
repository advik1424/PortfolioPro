import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  stockApi,
  analysisApi,
  marketApi,
  formatINR,
  formatNumber,
  formatPercent
} from "../api";
import TransactionModal from "../components/TransactionModal";

export default function Analysis() {
  const [selectedStock, setSelectedStock] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Analysis data states
  const [liveQuote, setLiveQuote] = useState(null);
  const [tech, setTech] = useState(null);
  const [fund, setFund] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'technical' | 'fundamental'

  // Trade Modal
  const [isTradeOpen, setIsTradeOpen] = useState(false);

  // Quick benchmark stocks for easy access
  const benchmarkSymbols = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK"];

  // Fetch initial stock on page load
  useEffect(() => {
    stockApi
      .list(0, 1)
      .then((res) => {
        const first = res.data?.content?.[0];
        if (first) {
          setSelectedStock(first);
        }
      })
      .catch(() => {});
  }, []);

  // Load analytical data whenever selectedStock changes
  const loadAnalysis = useCallback(async (stock) => {
    if (!stock?.id) return;
    setLoadingAnalysis(true);
    try {
      const [quoteRes, techRes, fundRes] = await Promise.allSettled([
        marketApi.liveQuote(stock.id),
        analysisApi.technical(stock.id),
        analysisApi.fundamental(stock.id)
      ]);

      setLiveQuote(quoteRes.status === "fulfilled" ? quoteRes.value.data : null);
      setTech(techRes.status === "fulfilled" ? techRes.value.data : null);
      setFund(fundRes.status === "fulfilled" ? fundRes.value.data : null);
    } catch {
      setLiveQuote(null);
      setTech(null);
      setFund(null);
    } finally {
      setLoadingAnalysis(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStock) {
      loadAnalysis(selectedStock);
    }
  }, [selectedStock, loadAnalysis]);

  // Debounced search for stock lookup
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await stockApi.search(searchQuery.trim(), 0, 5);
        setSearchResults(res.data?.content || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Quick switch benchmark symbol
  const handleSelectSymbol = async (sym) => {
    try {
      const res = await stockApi.bySymbol(sym);
      if (res.data) {
        setSelectedStock(res.data);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch {
      // safely ignore
    }
  };

  const currentPrice = liveQuote?.price ?? selectedStock?.currentPrice ?? 0;
  const dayChange = Number(liveQuote?.change ?? 0);
  const dayChangePct = Number(liveQuote?.changePercent ?? 0);
  const isPositive = dayChange >= 0;

  const rsi = tech?.rsi != null ? Number(tech.rsi) : null;
  const rsiLabel = rsi != null ? (rsi < 30 ? "Oversold" : rsi > 70 ? "Overbought" : "Neutral") : null;
  const rsiBadgeClass = rsi != null ? (rsi < 30 ? "badge-profit" : rsi > 70 ? "badge-loss" : "badge-neutral") : "";

  return (
    <div className="page">
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="breadcrumb">RESEARCH &amp; SCREENING</div>
          <h1>Technical &amp; Fundamental Analysis</h1>
          <p>Multi-indicator valuation models, moving averages, and balance sheet metrics.</p>
        </div>
      </div>

      {/* Stock Selection & Benchmark Bar */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        {/* Search Input with Autocomplete dropdown */}
        <div style={{ position: "relative", minWidth: "280px", flex: 1, maxWidth: "420px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search stock to analyze (e.g. RELIANCE, TCS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ height: "36px", fontSize: "12px" }}
          />

          {searching && (
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              Searching equities...
            </div>
          )}

          {searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "42px",
                left: 0,
                right: 0,
                backgroundColor: "#ffffff",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow-md)",
                zIndex: 20,
                maxHeight: "220px",
                overflowY: "auto"
              }}
            >
              {searchResults.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedStock(s);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div>
                    <b>{s.symbol}</b> <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{s.companyName}</span>
                  </div>
                  <span className="badge badge-neutral">{s.exchange || "NSE"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Benchmark Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
            Quick Select:
          </span>
          {benchmarkSymbols.map((sym) => (
            <button
              key={sym}
              type="button"
              className={selectedStock?.symbol === sym ? "primary" : "secondary"}
              style={{ padding: "4px 10px", fontSize: "11px", fontWeight: 700 }}
              onClick={() => handleSelectSymbol(sym)}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Stock Overview Card */}
      {selectedStock && (
        <div
          className="card"
          style={{
            padding: "20px 24px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            backgroundColor: "var(--bg-surface)"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>
                {selectedStock.companyName}
              </h2>
              <span className="symbol-badge" style={{ fontSize: "12px", padding: "2px 7px" }}>
                {selectedStock.symbol}
              </span>
              <span className="badge badge-neutral">{selectedStock.exchange || "NSE"}</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Sector: <b>{selectedStock.sector || "General"}</b>
            </div>
          </div>

          {/* Price & Action */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ textAlign: "right" }}>
              <div className="num font-bold" style={{ fontSize: "22px", color: "var(--text-primary)" }}>
                {formatINR(currentPrice)}
              </div>
              <div style={{ fontSize: "11px" }}>
                <span className={isPositive ? "positive font-semibold" : "negative font-semibold"}>
                  {isPositive ? "+" : ""}
                  {formatINR(dayChange)} ({formatPercent(dayChangePct)})
                </span>
              </div>
            </div>

            <button
              className="primary"
              style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 700 }}
              onClick={() => setIsTradeOpen(true)}
            >
              Buy {selectedStock.symbol}
            </button>

            <Link
              to={`/stocks/${encodeURIComponent(selectedStock.symbol)}`}
              className="secondary"
              style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 600 }}
            >
              Full Profile →
            </Link>
          </div>
        </div>
      )}

      {/* Analysis Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border)",
          marginBottom: "20px"
        }}
      >
        <button
          onClick={() => setActiveTab("all")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "all" ? "2px solid var(--accent)" : "2px solid transparent",
            color: activeTab === "all" ? "var(--accent)" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          All Indicators
        </button>
        <button
          onClick={() => setActiveTab("technical")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "technical" ? "2px solid var(--accent)" : "2px solid transparent",
            color: activeTab === "technical" ? "var(--accent)" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          Technical Analysis
        </button>
        <button
          onClick={() => setActiveTab("fundamental")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "fundamental" ? "2px solid var(--accent)" : "2px solid transparent",
            color: activeTab === "fundamental" ? "var(--accent)" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          Fundamental Statements
        </button>
      </div>

      {loadingAnalysis ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            Computing indicator telemetry for {selectedStock?.symbol}...
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 1: Technical Indicators */}
          {(activeTab === "all" || activeTab === "technical") && (
            <section className="card">
              <div className="card-head">
                <strong>Technical Indicators &amp; Trend Models</strong>
                <span>Calculated from closing price momentum</span>
              </div>
              <div style={{ padding: "20px" }}>
                {!tech ? (
                  <div className="empty-box" style={{ padding: "24px 0" }}>
                    <p style={{ margin: 0, color: "var(--text-muted)" }}>
                      Technical analysis is currently unavailable for {selectedStock?.symbol}.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px"
                    }}
                  >
                    <MetricBox
                      label="Simple Moving Avg (SMA)"
                      value={tech.sma ? formatINR(tech.sma) : "—"}
                      hint="20-day trend baseline"
                    />
                    <MetricBox
                      label="Exponential Moving Avg (EMA)"
                      value={tech.ema ? formatINR(tech.ema) : "—"}
                      hint="Weighted short-term momentum"
                    />
                    <MetricBox
                      label="RSI (Relative Strength)"
                      value={rsi != null ? formatNumber(rsi) : "—"}
                      badge={rsiLabel}
                      badgeClass={rsiBadgeClass}
                      hint="Momentum oscillator (14-period)"
                    />
                    <MetricBox
                      label="MACD"
                      value={tech.macd != null ? formatNumber(tech.macd) : "—"}
                      hint="Moving Average Convergence Divergence"
                    />
                    <MetricBox
                      label="MACD Signal Line"
                      value={tech.macdSignal != null ? formatNumber(tech.macdSignal) : "—"}
                      hint="Signal line trigger threshold"
                    />
                    <MetricBox
                      label="Key Support Level"
                      value={tech.support ? formatINR(tech.support) : "—"}
                      hint="Floor price accumulation band"
                    />
                    <MetricBox
                      label="Key Resistance Level"
                      value={tech.resistance ? formatINR(tech.resistance) : "—"}
                      hint="Ceiling price supply band"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section 2: Fundamental Analysis */}
          {(activeTab === "all" || activeTab === "fundamental") && (
            <section className="card">
              <div className="card-head">
                <strong>Fundamental Valuation &amp; Balance Sheet Metrics</strong>
                <span>Reported fiscal fundamentals</span>
              </div>
              <div style={{ padding: "20px" }}>
                {!fund ? (
                  <div className="empty-box" style={{ padding: "24px 0" }}>
                    <p style={{ margin: 0, color: "var(--text-muted)" }}>
                      Fundamental analysis is currently unavailable for {selectedStock?.symbol}.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px"
                    }}
                  >
                    <MetricBox
                      label="Market Capitalization"
                      value={fund.marketCap ? formatINR(fund.marketCap) : "—"}
                      hint="Total company equity value"
                    />
                    <MetricBox
                      label="Price to Earnings (P/E)"
                      value={fund.peRatio != null ? formatNumber(fund.peRatio) : "—"}
                      hint="Valuation multiple"
                    />
                    <MetricBox
                      label="Earnings Per Share (EPS)"
                      value={fund.eps != null ? `₹${formatNumber(fund.eps)}` : "—"}
                      hint="Trailing twelve-month earnings"
                    />
                    <MetricBox
                      label="Annual Revenue"
                      value={fund.revenue ? formatINR(fund.revenue) : "—"}
                      hint="Reported top-line sales"
                    />
                    <MetricBox
                      label="Net Profit"
                      value={fund.profit ? formatINR(fund.profit) : "—"}
                      hint="Reported bottom-line earnings"
                    />
                    <MetricBox
                      label="Total Debt"
                      value={fund.debt ? formatINR(fund.debt) : "—"}
                      hint="Total reported liabilities"
                    />
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Quick Trade Modal */}
      {selectedStock && (
        <TransactionModal
          isOpen={isTradeOpen}
          onClose={() => setIsTradeOpen(false)}
          stock={{
            id: selectedStock.id,
            symbol: selectedStock.symbol,
            companyName: selectedStock.companyName,
            currentPrice: currentPrice,
            exchange: selectedStock.exchange
          }}
          initialType="BUY"
          onSuccess={() => {
            // reload analysis if needed
          }}
        />
      )}
    </div>
  );
}

// Reusable Metric Box Helper
function MetricBox({ label, value, hint, badge, badgeClass }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "14px 16px",
        backgroundColor: "var(--bg-surface)"
      }}
    >
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
        {label}
      </div>
      <div
        className="num font-bold"
        style={{ fontSize: "17px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}
      >
        <span>{value}</span>
        {badge && (
          <span className={`badge ${badgeClass}`} style={{ fontSize: "10px" }}>
            {badge}
          </span>
        )}
      </div>
      {hint && (
        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
          {hint}
        </div>
      )}
    </div>
  );
}