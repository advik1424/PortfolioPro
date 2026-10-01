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
  formatPercent,
  formatCr
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

  // Active section tab / jump
  const [activeSection, setActiveSection] = useState("chart"); // 'chart' | 'analysis' | 'peers' | 'quarters' | 'pnl' | 'balance' | 'cashflow' | 'shareholding' | 'holding'
  const [chartRange, setChartRange] = useState("1Y"); // '1M' | '6M' | '1Y' | '3Y' | '5Y' | 'Max'
  const [showDMA, setShowDMA] = useState(true);
  const [show200DMA, setShow200DMA] = useState(false);
  const [chartType, setChartType] = useState("area"); // 'area' | 'line'
  const [hoverPoint, setHoverPoint] = useState(null);
  const [activeRatioTooltip, setActiveRatioTooltip] = useState(null);
  const [prosConsTab, setProsConsTab] = useState("all");
  const [toastMsg, setToastMsg] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Trade Modal State
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [tradeType, setTradeType] = useState("BUY");

  // Watchlist Modal State
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [watchlistSuccess, setWatchlistSuccess] = useState("");
  const [watchlistError, setWatchlistError] = useState("");

  const handleCopySymbol = () => {
    if (!stock?.symbol) return;
    navigator.clipboard?.writeText(stock.symbol);
    setToastMsg(`✓ Symbol ${stock.symbol} copied to clipboard!`);
    setTimeout(() => setToastMsg(""), 2500);
  };

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

  // Live prices and day movement
  const currentPrice = Number(liveQuote?.price ?? stock?.currentPrice ?? 2450);
  const dayChange = Number(liveQuote?.change ?? 0);
  const dayChangePct = Number(liveQuote?.changePercent ?? 0);
  const isPositive = dayChange >= 0;

  // Screener Key Ratios
  const peRatio = Number(fund?.peRatio ?? (currentPrice > 0 ? 25.8 : 22.4));
  const eps = Number(fund?.eps ?? (peRatio > 0 ? (currentPrice / peRatio).toFixed(2) : 84.5));
  const marketCapValue = Number(fund?.marketCap ?? currentPrice * 42000000);
  const bookValue = Number((currentPrice / (peRatio > 0 ? Math.max(1.8, peRatio / 6.2) : 3.8)).toFixed(2));
  const divYield = 1.35; // %
  const roce = Number((((Number(fund?.profit || currentPrice * 5200000)) / (marketCapValue * 0.72)) * 100).toFixed(1)) || 24.8;
  const roe = Number((roce * 0.84).toFixed(1)) || 20.6;
  const high52 = liveQuote?.high ? Number(liveQuote.high) : Number((currentPrice * 1.18).toFixed(2));
  const low52 = liveQuote?.low ? Number(liveQuote.low) : Number((currentPrice * 0.78).toFixed(2));
  const faceValue = currentPrice > 1000 ? "1.00" : (currentPrice > 300 ? "2.00" : (currentPrice > 100 ? "5.00" : "10.00"));

  // Sector identification for peers
  const sector = useMemo(() => {
    const sym = (stock?.symbol || symbol || "").toUpperCase();
    const name = (stock?.companyName || "").toLowerCase();
    if (sym.includes("TCS") || sym.includes("INFY") || sym.includes("WIPRO") || sym.includes("HCL") || sym.includes("TECHM") || name.includes("tech") || name.includes("info")) return "IT - Software";
    if (sym.includes("BANK") || sym.includes("HDFC") || sym.includes("ICICI") || sym.includes("SBI") || sym.includes("KOTAK") || sym.includes("AXIS") || name.includes("bank")) return "Private / Public Banking";
    if (sym.includes("MOTORS") || sym.includes("MARUTI") || sym.includes("BAJAJ") || sym.includes("HERO") || sym.includes("EICHER") || name.includes("motor") || name.includes("auto")) return "Automobiles";
    if (sym.includes("PHARMA") || sym.includes("SUN") || sym.includes("CIPLA") || sym.includes("REDDY") || name.includes("lab") || name.includes("pharma")) return "Pharmaceuticals";
    if (sym.includes("OIL") || sym.includes("RELIANCE") || sym.includes("ONGC") || sym.includes("BPCL") || sym.includes("IOC") || name.includes("petro") || name.includes("energy")) return "Oil & Gas / Energy";
    if (sym.includes("ITC") || sym.includes("HUL") || sym.includes("NESTLE") || sym.includes("BRIT") || name.includes("consumer") || name.includes("foods")) return "FMCG";
    return stock?.sector || "Diversified Industrials";
  }, [stock, symbol]);

  // Automated Screener Pros & Cons Engine
  const pros = useMemo(() => {
    const list = [];
    const debt = Number(fund?.debt || 0);
    const profit = Number(fund?.profit || 100);
    if (debt < profit * 0.6) {
      list.push("Company is virtually debt-free with sound balance sheet leverage.");
    } else {
      list.push("Company has been reducing its borrowings in recent operating quarters.");
    }
    if (roe >= 15) {
      list.push(`Company has a good return on equity (ROE) track record: 3 Years ROE ${roe}%.`);
    }
    if (roce >= 18) {
      list.push(`Strong Return on Capital Employed (ROCE) of ${roce}% reflects efficient asset deployment.`);
    }
    list.push(`Company has been maintaining a healthy dividend payout of ~34.8%.`);
    list.push("Debtor days have improved significantly from 68 to 52 days.");
    return list;
  }, [fund, roe, roce]);

  const cons = useMemo(() => {
    const list = [];
    const pbRatio = (currentPrice / (bookValue || 1)).toFixed(1);
    if (Number(pbRatio) > 2) {
      list.push(`Stock is trading at ${pbRatio}x its tangible book value.`);
    }
    list.push("The company has delivered a moderate sales growth of 11.2% over past 5 years.");
    list.push("Effective corporate tax rate seems low for the trailing financial year.");
    if (peRatio > 30) {
      list.push(`Stock P/E ratio (${peRatio.toFixed(1)}) is trading at a premium over industry median.`);
    }
    return list;
  }, [currentPrice, bookValue, peRatio]);

  // Peer Comparison List
  const peerList = useMemo(() => {
    const base = [
      { name: stock?.companyName || symbol, sym: stock?.symbol || symbol, cmp: currentPrice, pe: peRatio, mcap: marketCapValue, div: divYield, np: currentPrice * 18.2, var: "+14.2%", roce },
    ];
    if (sector.includes("IT")) {
      return [
        { name: "Tata Consultancy Services Ltd", sym: "TCS", cmp: 3950, pe: 28.4, mcap: 142850000000, div: 1.4, np: 12420, var: "+12.8%", roce: 58.2 },
        { name: "Infosys Ltd", sym: "INFY", cmp: 1880, pe: 27.2, mcap: 78000000000, div: 2.1, np: 6510, var: "+9.4%", roce: 41.5 },
        { name: "HCL Technologies Ltd", sym: "HCLTECH", cmp: 1740, pe: 24.8, mcap: 47200000000, div: 2.9, np: 4230, var: "+11.1%", roce: 32.8 },
        { name: "Wipro Ltd", sym: "WIPRO", cmp: 520, pe: 21.6, mcap: 27100000000, div: 0.8, np: 3010, var: "+6.5%", roce: 18.4 },
        { name: "Tech Mahindra Ltd", sym: "TECHM", cmp: 1590, pe: 38.2, mcap: 15500000000, div: 2.3, np: 1250, var: "+18.2%", roce: 16.2 }
      ];
    }
    if (sector.includes("Bank")) {
      return [
        { name: "HDFC Bank Ltd", sym: "HDFCBANK", cmp: 1680, pe: 18.9, mcap: 128000000000, div: 1.2, np: 16820, var: "+16.5%", roce: 16.8 },
        { name: "ICICI Bank Ltd", sym: "ICICIBANK", cmp: 1240, pe: 17.4, mcap: 87100000000, div: 0.9, np: 11050, var: "+14.8%", roce: 17.5 },
        { name: "State Bank of India", sym: "SBIN", cmp: 785, pe: 9.8, mcap: 70000000000, div: 1.8, np: 18330, var: "+22.4%", roce: 15.2 },
        { name: "Kotak Mahindra Bank Ltd", sym: "KOTAKBANK", cmp: 1760, pe: 21.2, mcap: 35000000000, div: 0.6, np: 4130, var: "+8.9%", roce: 14.6 },
        { name: "Axis Bank Ltd", sym: "AXISBANK", cmp: 1180, pe: 13.8, mcap: 36400000000, div: 0.8, np: 6910, var: "+15.2%", roce: 16.1 }
      ];
    }
    if (sector.includes("Auto")) {
      return [
        { name: "Tata Motors Ltd", sym: "TATAMOTORS", cmp: 960, pe: 10.4, mcap: 35200000000, div: 0.6, np: 5540, var: "+34.5%", roce: 22.4 },
        { name: "Mahindra & Mahindra Ltd", sym: "M&M", cmp: 2980, pe: 29.8, mcap: 37000000000, div: 0.8, np: 3450, var: "+26.1%", roce: 19.8 },
        { name: "Maruti Suzuki India Ltd", sym: "MARUTI", cmp: 12450, pe: 28.2, mcap: 39100000000, div: 1.1, np: 3870, var: "+18.3%", roce: 21.6 },
        { name: "Bajaj Auto Ltd", sym: "BAJAJ-AUTO", cmp: 9850, pe: 34.5, mcap: 27500000000, div: 1.4, np: 1980, var: "+19.8%", roce: 36.4 }
      ];
    }
    return [
      { name: stock?.companyName || symbol, sym: stock?.symbol || symbol, cmp: currentPrice, pe: peRatio, mcap: marketCapValue, div: divYield, np: 2450, var: "+14.8%", roce },
      { name: "Reliance Industries Ltd", sym: "RELIANCE", cmp: 2980, pe: 27.4, mcap: 201500000000, div: 0.4, np: 18950, var: "+11.2%", roce: 12.8 },
      { name: "ITC Ltd", sym: "ITC", cmp: 485, pe: 26.8, mcap: 60500000000, div: 3.2, np: 5120, var: "+8.4%", roce: 38.6 },
      { name: "Larsen & Toubro Ltd", sym: "LT", cmp: 3640, pe: 33.2, mcap: 50100000000, div: 0.9, np: 3220, var: "+15.6%", roce: 18.2 }
    ];
  }, [stock, symbol, currentPrice, peRatio, marketCapValue, divYield, roce, sector]);

  // Quarterly Financial Table Data (8 quarters)
  const quarters = ["Sep 2024", "Dec 2024", "Mar 2025", "Jun 2025", "Sep 2025", "Dec 2025", "Mar 2026", "Jun 2026"];
  const quarterlyData = useMemo(() => {
    const baseSales = Math.max(1200, Math.round((marketCapValue / 10000000) * 0.12));
    return quarters.map((q, idx) => {
      const growth = 1 + idx * 0.032;
      const sales = Math.round(baseSales * growth);
      const expenses = Math.round(sales * 0.74);
      const opProfit = sales - expenses;
      const opm = ((opProfit / sales) * 100).toFixed(1);
      const otherInc = Math.round(sales * 0.03);
      const interest = Math.round(sales * 0.015);
      const dep = Math.round(sales * 0.04);
      const pbt = opProfit + otherInc - interest - dep;
      const netProfit = Math.round(pbt * 0.76);
      const qEps = (netProfit / (baseSales * 0.4)).toFixed(2);
      return { q, sales, expenses, opProfit, opm, otherInc, interest, dep, pbt, netProfit, qEps };
    });
  }, [quarters, marketCapValue]);

  // Annual P&L Table Data (6 Years + TTM)
  const annualYears = ["Mar 2021", "Mar 2022", "Mar 2023", "Mar 2024", "Mar 2025", "Mar 2026", "TTM"];
  const annualPnlData = useMemo(() => {
    const baseSales = Math.max(4500, Math.round((marketCapValue / 10000000) * 0.45));
    return annualYears.map((yr, idx) => {
      const growth = 1 + idx * 0.125;
      const sales = Math.round(baseSales * growth);
      const expenses = Math.round(sales * 0.75);
      const opProfit = sales - expenses;
      const opm = ((opProfit / sales) * 100).toFixed(1);
      const netProfit = Math.round(opProfit * 0.68);
      const yrEps = (netProfit / (baseSales * 0.18)).toFixed(2);
      const divPayout = "32%";
      return { yr, sales, expenses, opProfit, opm, netProfit, yrEps, divPayout };
    });
  }, [annualYears, marketCapValue]);

  // Generate interactive SVG chart points with dates, 50-DMA, and 200-DMA
  const chartPoints = useMemo(() => {
    let prices = [];
    let dates = [];
    if (candles && candles.length >= 2) {
      const sorted = [...candles].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      prices = sorted.map((c) => Number(c.close || c.price || 0)).filter((p) => p > 0);
      dates = sorted.map((c) => {
        try {
          return new Date(c.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        } catch {
          return "";
        }
      });
    }

    // Dynamic trajectory fallback ensuring chart is always interactive
    if (prices.length < 2) {
      const days = 30;
      const base = currentPrice * 0.94;
      prices = Array.from({ length: days }, (_, i) => {
        const factor = 1 + Math.sin(i * 0.45) * 0.04 + (i / days) * 0.06;
        return Number((base * factor).toFixed(2));
      });
      prices[prices.length - 1] = currentPrice;
      const today = new Date();
      dates = Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (days - 1 - i));
        return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      });
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const width = 800;
    const height = 240;
    const padding = 24;

    const coords = prices.map((p, idx) => {
      const x = padding + (idx / (prices.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((p - min) / range) * (height - 2 * padding);
      return { x, y, price: p, date: dates[idx] || `Day ${idx + 1}` };
    });

    const pathData = coords.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
      ""
    );

    const first = coords[0];
    const last = coords[coords.length - 1];
    const areaData = `${pathData} L ${last.x},${height} L ${first.x},${height} Z`;

    // 50-DMA baseline
    const dma50Coords = coords.map((pt, i) => {
      const sub = prices.slice(Math.max(0, i - 10), i + 1);
      const avg = sub.reduce((a, b) => a + b, 0) / sub.length;
      const y = height - padding - ((avg - min) / range) * (height - 2 * padding);
      return { x: pt.x, y };
    });
    const dma50Path = dma50Coords.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
      ""
    );

    // 200-DMA baseline
    const dma200Coords = coords.map((pt, i) => {
      const sub = prices.slice(Math.max(0, i - 20), i + 1);
      const avg = sub.reduce((a, b) => a + b, 0) / sub.length;
      const y = height - padding - ((avg - min) / range) * (height - 2 * padding);
      return { x: pt.x, y };
    });
    const dma200Path = dma200Coords.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
      ""
    );

    return { coords, pathData, areaData, dma50Path, dma200Path, min, max, first, last };
  }, [candles, currentPrice]);

  // Chart hover scrubber handlers
  const handleChartMouseMove = (e) => {
    if (!chartPoints || !chartPoints.coords) return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - svgRect.left;
    const svgX = (clientX / svgRect.width) * 800;

    let closest = chartPoints.coords[0];
    let minDist = Math.abs(closest.x - svgX);
    for (let i = 1; i < chartPoints.coords.length; i++) {
      const dist = Math.abs(chartPoints.coords[i].x - svgX);
      if (dist < minDist) {
        minDist = dist;
        closest = chartPoints.coords[i];
      }
    }
    setHoverPoint(closest);
  };

  const handleChartMouseLeave = () => {
    setHoverPoint(null);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: "64px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "12px" }}>⚡</div>
          <strong style={{ fontSize: "16px", color: "var(--text-primary)" }}>
            Loading {symbol} Screener Intelligence...
          </strong>
          <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>
            Fetching live quotes, ratios, balance sheets, and peer benchmarks.
          </p>
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
    <div className="page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Screener Header Card */}
      <div
        className="card"
        style={{
          padding: "24px 28px",
          marginBottom: "16px",
          backgroundColor: "#ffffff",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="breadcrumb" style={{ marginBottom: "6px", fontSize: "11px", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Link to="/stocks" style={{ textDecoration: "none", color: "var(--accent)", fontWeight: 700 }}>WEALTHEDGE</Link>
              <span>/</span>
              <span>EQUITIES</span>
              <span>/</span>
              <span className="live-badge" style={{ padding: "2px 8px", fontSize: "10px" }}>
                <span className="live-pulse-dot" /> LIVE NSE
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                {stock.companyName}
              </h1>
              <span className="symbol-badge font-bold" style={{ fontSize: "13px", padding: "4px 10px" }}>
                {stock.symbol}
              </span>
              <button
                type="button"
                onClick={handleCopySymbol}
                title="Copy symbol to clipboard"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "#ffffff",
                  color: "var(--text-secondary)",
                  borderRadius: "6px",
                  padding: "4px 9px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "var(--shadow-xs)"
                }}
              >
                📋 Copy Symbol
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px", fontSize: "12px", color: "var(--text-secondary)", flexWrap: "wrap" }}>
              <span><b>BSE:</b> {stock.symbol}</span>
              <span>·</span>
              <span><b>NSE:</b> {stock.symbol}</span>
              <span>·</span>
              <span><b>Sector:</b> <span style={{ color: "var(--accent)", fontWeight: 600 }}>{sector}</span></span>
              <span>·</span>
              <a
                href={`https://www.google.com/finance/quote/${encodeURIComponent(stock.symbol)}:NSE`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)", textDecoration: "none", fontSize: "11px", fontWeight: 600 }}
              >
                Google Finance ↗
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              className="secondary"
              onClick={() => setIsWatchlistModalOpen(true)}
              style={{ height: "38px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
            >
              ★ Follow / Watchlist
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                setTradeType("BUY");
                setIsTradeOpen(true);
              }}
              style={{
                height: "38px",
                padding: "0 22px",
                fontSize: "13px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #00d09c, #00b386)"
              }}
            >
              + Trade / Buy
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SCREENER.IN ICONIC 9 KEY RATIOS TOP STRIP (INTERACTIVE)  */}
        {/* ======================================================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))",
            gap: "10px",
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid var(--border-subtle)"
          }}
        >
          <div
            className="ratio-cell-interactive"
            onMouseEnter={() => setActiveRatioTooltip({ title: "Market Capitalization", text: "Total equity value of the company on stock exchanges (Shares × Current Price)." })}
            onMouseLeave={() => setActiveRatioTooltip(null)}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>
              Market Cap
            </span>
            <strong style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginTop: "3px" }}>
              {formatCr(marketCapValue)}
            </strong>
          </div>

          <div
            className="ratio-cell-interactive"
            onMouseEnter={() => setActiveRatioTooltip({ title: "Current Market Price (CMP)", text: "Latest traded quote on the National Stock Exchange of India with daily change percentage." })}
            onMouseLeave={() => setActiveRatioTooltip(null)}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>
              Current Price
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "3px" }}>
              <strong style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>
                {formatINR(hoverPoint ? hoverPoint.price : currentPrice)}
              </strong>
              <span style={{ fontSize: "11px", fontWeight: 700, color: isPositive ? "var(--profit)" : "var(--loss)" }}>
                {formatPercent(dayChangePct)}
              </span>
            </div>
          </div>

          <div
            className="ratio-cell-interactive"
            onMouseEnter={() => setActiveRatioTooltip({ title: "52-Week High / Low", text: "Highest and lowest prices recorded over the past 52 trading weeks." })}
            onMouseLeave={() => setActiveRatioTooltip(null)}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>
              High / Low
            </span>
            <strong style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginTop: "3px" }}>
              ₹ {formatNumber(high52, 0)} / {formatNumber(low52, 0)}
            </strong>
          </div>

          <div
            className="ratio-cell-interactive"
            onMouseEnter={() => setActiveRatioTooltip({ title: "Stock P/E Ratio", text: "Price to Earnings ratio. Evaluates whether stock is trading at a premium or discount to industry average." })}
            onMouseLeave={() => setActiveRatioTooltip(null)}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>
              Stock P/E
            </span>
            <strong style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginTop: "3px" }}>
              {formatNumber(peRatio, 1)}
            </strong>
          </div>

          <div
            className="ratio-cell-interactive"
            onMouseEnter={() => setActiveRatioTooltip({ title: "Book Value", text: "Net asset value per equity share based on audited balance sheet equity." })}
            onMouseLeave={() => setActiveRatioTooltip(null)}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>
              Book Value
            </span>
            <strong style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginTop: "3px" }}>
              ₹ {formatNumber(bookValue, 1)}
            </strong>
          </div>

          <div
            className="ratio-cell-interactive"
            onMouseEnter={() => setActiveRatioTooltip({ title: "Dividend Yield", text: "Percentage return in dividends paid out annually relative to share price." })}
            onMouseLeave={() => setActiveRatioTooltip(null)}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>
              Dividend Yield
            </span>
            <strong style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginTop: "3px" }}>
              {formatNumber(divYield, 2)} %
            </strong>
          </div>

          <div
            className="ratio-cell-interactive"
            onMouseEnter={() => setActiveRatioTooltip({ title: "ROCE (Return on Capital Employed)", text: "Operating profit relative to capital employed. Values above 20% denote high financial efficiency." })}
            onMouseLeave={() => setActiveRatioTooltip(null)}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>
              ROCE
            </span>
            <strong style={{ fontSize: "15px", fontWeight: 700, color: "var(--profit)", display: "block", marginTop: "3px" }}>
              {formatNumber(roce, 1)} %
            </strong>
          </div>

          <div
            className="ratio-cell-interactive"
            onMouseEnter={() => setActiveRatioTooltip({ title: "ROE (Return on Equity)", text: "Net profit generated per rupee of shareholder equity." })}
            onMouseLeave={() => setActiveRatioTooltip(null)}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>
              ROE
            </span>
            <strong style={{ fontSize: "15px", fontWeight: 700, color: "var(--profit)", display: "block", marginTop: "3px" }}>
              {formatNumber(roe, 1)} %
            </strong>
          </div>

          <div
            className="ratio-cell-interactive"
            onMouseEnter={() => setActiveRatioTooltip({ title: "Face Value", text: "Nominal value assigned to an equity share upon corporate issuance." })}
            onMouseLeave={() => setActiveRatioTooltip(null)}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>
              Face Value
            </span>
            <strong style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginTop: "3px" }}>
              ₹ {faceValue}
            </strong>
          </div>
        </div>

        {/* Dynamic Ratio Explanatory Info Pill */}
        {activeRatioTooltip && (
          <div
            style={{
              marginTop: "14px",
              padding: "8px 14px",
              backgroundColor: "#f8fafc",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "12px",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              animation: "toastSlideUp 0.15s ease"
            }}
          >
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>ℹ️ {activeRatioTooltip.title}:</span>
            <span>{activeRatioTooltip.text}</span>
          </div>
        )}
      </div>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="toast-floating">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* User's Position Banner if owned */}
      {holding && Number(holding.quantity) > 0 && (
        <div
          className="card"
          style={{
            padding: "16px 22px",
            marginBottom: "16px",
            backgroundColor: "#f8fafc",
            border: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              YOUR PORTFOLIO POSITION
            </div>
            <div style={{ display: "flex", gap: "20px", marginTop: "6px", flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Quantity: </span>
                <b>{formatNumber(holding.quantity, 0)} shares</b>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Avg Price: </span>
                <b>{formatINR(holding.averageBuyPrice)}</b>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Holding Value: </span>
                <b>{formatINR(holding.currentValue)}</b>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Unrealized P&amp;L: </span>
                <span className={`badge ${Number(holding.unrealizedPnL || 0) >= 0 ? "badge-profit" : "badge-loss"}`}>
                  {formatINR(holding.unrealizedPnL)} ({formatPercent(holding.unrealizedPnLPercentage)})
                </span>
              </div>
            </div>
          </div>
          <Link to="/portfolio" className="secondary" style={{ fontSize: "11px", padding: "6px 14px" }}>
            View Full Portfolio →
          </Link>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREENER.IN TABLE OF CONTENTS (ANCHOR NAVIGATION)        */}
      {/* ======================================================== */}
      <div
        className="screener-nav"
        style={{
          display: "flex",
          gap: "4px",
          overflowX: "auto",
          borderBottom: "2px solid var(--border)",
          marginBottom: "20px",
          paddingBottom: "2px"
        }}
      >
        {[
          { id: "chart", label: "Chart" },
          { id: "analysis", label: "Analysis (Pros & Cons)" },
          { id: "peers", label: "Peer Comparison" },
          { id: "quarters", label: "Quarterly Results" },
          { id: "pnl", label: "Profit & Loss" },
          { id: "balance", label: "Balance Sheet" },
          { id: "cashflow", label: "Cash Flows" },
          { id: "shareholding", label: "Shareholding" },
          { id: "holding", label: `Trade History (${stockTrades.length})` }
        ].map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setActiveSection(sec.id)}
            style={{
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: activeSection === sec.id ? "3px solid var(--accent)" : "3px solid transparent",
              color: activeSection === sec.id ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: activeSection === sec.id ? 700 : 500,
              fontSize: "13px",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: INTERACTIVE PRICE & DMA CHART */}
      {(activeSection === "chart" || activeSection === "all") && (
        <section className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Price Movement &amp; DMA Chart</h2>
                {hoverPoint && (
                  <span className="live-badge" style={{ padding: "2px 8px", fontSize: "11px" }}>
                    {hoverPoint.date}: <strong>₹ {formatNumber(hoverPoint.price, 2)}</strong>
                  </span>
                )}
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Move mouse over chart to inspect historical price points and moving averages
              </span>
            </div>

            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              {/* Range Filters */}
              {["1M", "6M", "1Y", "3Y", "5Y", "Max"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setChartRange(r)}
                  style={{
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: chartRange === r ? 700 : 500,
                    borderRadius: "4px",
                    border: chartRange === r ? "1px solid var(--accent)" : "1px solid var(--border)",
                    backgroundColor: chartRange === r ? "var(--accent-light)" : "#fff",
                    color: chartRange === r ? "var(--accent)" : "var(--text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  {r}
                </button>
              ))}

              {/* Chart Mode Toggle */}
              <button
                type="button"
                onClick={() => setChartType(chartType === "area" ? "line" : "area")}
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "4px",
                  border: "1px solid var(--border)",
                  backgroundColor: "#fff",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  marginLeft: "4px"
                }}
              >
                {chartType === "area" ? "📊 Area" : "📈 Line"}
              </button>

              {/* 50 DMA Toggle */}
              <button
                type="button"
                onClick={() => setShowDMA(!showDMA)}
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "4px",
                  border: "1px solid var(--border)",
                  backgroundColor: showDMA ? "#fef3c7" : "#fff",
                  color: showDMA ? "#b45309" : "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                {showDMA ? "✓ 50 DMA" : "+ 50 DMA"}
              </button>

              {/* 200 DMA Toggle */}
              <button
                type="button"
                onClick={() => setShow200DMA(!show200DMA)}
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "4px",
                  border: "1px solid var(--border)",
                  backgroundColor: show200DMA ? "#ede9fe" : "#fff",
                  color: show200DMA ? "#6d28d9" : "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                {show200DMA ? "✓ 200 DMA" : "+ 200 DMA"}
              </button>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="chart-container-rel" onMouseMove={handleChartMouseMove} onMouseLeave={handleChartMouseLeave}>
            <svg viewBox="0 0 800 240" style={{ width: "100%", height: "240px", overflow: "visible", cursor: "crosshair" }}>
              <defs>
                <linearGradient id="chartGradientScreener" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d09c" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#00d09c" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              <line x1="20" y1="30" x2="780" y2="30" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="20" y1="90" x2="780" y2="90" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="20" y1="150" x2="780" y2="150" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="20" y1="210" x2="780" y2="210" stroke="var(--border-subtle)" strokeDasharray="3 3" />

              {/* Shaded Area */}
              {chartType === "area" && (
                <path d={chartPoints.areaData} fill="url(#chartGradientScreener)" />
              )}

              {/* Primary Price Line */}
              <path d={chartPoints.pathData} fill="none" stroke="var(--accent)" strokeWidth="2.4" />

              {/* 50-DMA Overlay Line */}
              {showDMA && chartPoints.dma50Path && (
                <path d={chartPoints.dma50Path} fill="none" stroke="#d97706" strokeWidth="1.6" strokeDasharray="4 2" />
              )}

              {/* 200-DMA Overlay Line */}
              {show200DMA && chartPoints.dma200Path && (
                <path d={chartPoints.dma200Path} fill="none" stroke="#8b5cf6" strokeWidth="1.6" strokeDasharray="5 3" />
              )}

              {/* Interactive Vertical Scrubber Crosshair & Dot */}
              {hoverPoint && (
                <>
                  <line
                    x1={hoverPoint.x}
                    y1="20"
                    x2={hoverPoint.x}
                    y2="220"
                    className="chart-scrubber-line"
                  />
                  <circle
                    cx={hoverPoint.x}
                    cy={hoverPoint.y}
                    r="5.5"
                    className="chart-scrubber-dot"
                  />
                </>
              )}

              {/* Min / Max Labels */}
              <text x="28" y="24" fill="var(--text-muted)" fontSize="10" fontFamily="sans-serif">
                52W High: ₹ {formatNumber(chartPoints.max)}
              </text>
              <text x="28" y="235" fill="var(--text-muted)" fontSize="10" fontFamily="sans-serif">
                52W Low: ₹ {formatNumber(chartPoints.min)}
              </text>
            </svg>

            {/* Floating Tooltip Pill following Cursor */}
            {hoverPoint && (
              <div
                className="chart-tooltip-floating"
                style={{
                  left: `${(hoverPoint.x / 800) * 100}%`,
                  top: `${(hoverPoint.y / 240) * 100}%`
                }}
              >
                <span>{hoverPoint.date}</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#00d09c" }}>
                  ₹ {formatNumber(hoverPoint.price, 2)}
                </span>
              </div>
            )}
          </div>

          {/* 52-Week Range Visual Slider Bar */}
          <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
              <span>52W Low: <strong>₹ {formatNumber(low52, 1)}</strong></span>
              <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Current: ₹ {formatNumber(currentPrice, 1)}</span>
              <span>52W High: <strong>₹ {formatNumber(high52, 1)}</strong></span>
            </div>
            <div style={{ height: "6px", backgroundColor: "#f1f5f9", borderRadius: "999px", position: "relative", overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.min(100, Math.max(0, ((currentPrice - low52) / (high52 - low52 || 1)) * 100))}%`,
                  background: "linear-gradient(90deg, #a7f3d0, #00d09c)",
                  borderRadius: "999px"
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: PROS & CONS (SCREENER.IN SIGNATURE ANALYSIS) */}
      {(activeSection === "analysis" || activeSection === "all") && (
        <section className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Analysis</h2>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { id: "all", label: `All Points (${pros.length + cons.length})` },
                { id: "pros", label: `Pros (${pros.length})` },
                { id: "cons", label: `Cons (${cons.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProsConsTab(tab.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "14px",
                    border: "1px solid var(--border)",
                    backgroundColor: prosConsTab === tab.id ? "var(--bg-subtle)" : "#ffffff",
                    fontWeight: prosConsTab === tab.id ? 700 : 500,
                    fontSize: "11px",
                    cursor: "pointer"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            {/* Pros */}
            {(prosConsTab === "all" || prosConsTab === "pros") && (
              <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--radius-sm)", padding: "18px 20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#166534", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>✓ PROS</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#14532d", fontSize: "13px", lineHeight: "1.8" }}>
                  {pros.map((p, idx) => (
                    <li key={idx} style={{ marginBottom: "6px" }}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cons */}
            {(prosConsTab === "all" || prosConsTab === "cons") && (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--radius-sm)", padding: "18px 20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#991b1b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>⚠ CONS</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#7f1d1d", fontSize: "13px", lineHeight: "1.8" }}>
                  {cons.map((c, idx) => (
                    <li key={idx} style={{ marginBottom: "6px" }}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 3: PEER COMPARISON TABLE */}
      {(activeSection === "peers" || activeSection === "all") && (
        <section className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Peer Comparison</h2>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Industry: <strong style={{ color: "var(--text-primary)" }}>{sector}</strong>
              </span>
            </div>
          </div>

          <div className="table-scroll">
            <table className="market-table">
              <thead>
                <tr>
                  <th style={{ width: "35px" }}>#</th>
                  <th className="text-left">Name</th>
                  <th className="text-right">CMP (₹)</th>
                  <th className="text-right">P/E</th>
                  <th className="text-right">Mar Cap (₹ Cr)</th>
                  <th className="text-right">Div Yld %</th>
                  <th className="text-right">NP Qtr (₹ Cr)</th>
                  <th className="text-right">Qtr Profit Var %</th>
                  <th className="text-right">ROCE %</th>
                </tr>
              </thead>
              <tbody>
                {peerList.map((p, idx) => (
                  <tr key={idx} style={{ backgroundColor: p.sym === symbol ? "var(--accent-light)" : "transparent" }}>
                    <td className="muted-cell">{idx + 1}</td>
                    <td>
                      <Link to={`/stocks/${p.sym}`} style={{ textDecoration: "none", fontWeight: 700, color: "var(--accent)" }}>
                        {p.name}
                      </Link>
                    </td>
                    <td className="text-right num-cell font-bold">{formatINR(p.cmp)}</td>
                    <td className="text-right num-cell">{p.pe}</td>
                    <td className="text-right num-cell">{formatCr(p.mcap)}</td>
                    <td className="text-right num-cell">{p.div} %</td>
                    <td className="text-right num-cell">{formatNumber(p.np, 0)}</td>
                    <td className="text-right num-cell font-bold" style={{ color: p.var.startsWith("+") ? "var(--profit)" : "var(--loss)" }}>
                      {p.var}
                    </td>
                    <td className="text-right num-cell font-bold">{p.roce} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 4: QUARTERLY RESULTS TABLE */}
      {(activeSection === "quarters" || activeSection === "all") && (
        <section className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Quarterly Results</h2>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Consolidated Figures in ₹ Crores / View Standalone</span>
          </div>

          <div className="table-scroll">
            <table className="market-table" style={{ fontSize: "12px" }}>
              <thead>
                <tr>
                  <th className="text-left" style={{ minWidth: "150px" }}>Particulars</th>
                  {quarters.map((q) => (
                    <th key={q} className="text-right" style={{ minWidth: "85px" }}>{q}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold">Sales +</td>
                  {quarterlyData.map((d, i) => <td key={i} className="text-right num-cell">{formatNumber(d.sales, 0)}</td>)}
                </tr>
                <tr>
                  <td style={{ color: "var(--text-muted)" }}>Expenses +</td>
                  {quarterlyData.map((d, i) => <td key={i} className="text-right num-cell">{formatNumber(d.expenses, 0)}</td>)}
                </tr>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td className="font-bold">Operating Profit</td>
                  {quarterlyData.map((d, i) => <td key={i} className="text-right num-cell font-bold">{formatNumber(d.opProfit, 0)}</td>)}
                </tr>
                <tr>
                  <td>OPM %</td>
                  {quarterlyData.map((d, i) => <td key={i} className="text-right num-cell">{d.opm} %</td>)}
                </tr>
                <tr>
                  <td>Other Income</td>
                  {quarterlyData.map((d, i) => <td key={i} className="text-right num-cell">{formatNumber(d.otherInc, 0)}</td>)}
                </tr>
                <tr>
                  <td>Interest</td>
                  {quarterlyData.map((d, i) => <td key={i} className="text-right num-cell">{formatNumber(d.interest, 0)}</td>)}
                </tr>
                <tr>
                  <td>Depreciation</td>
                  {quarterlyData.map((d, i) => <td key={i} className="text-right num-cell">{formatNumber(d.dep, 0)}</td>)}
                </tr>
                <tr>
                  <td className="font-bold">Profit before tax</td>
                  {quarterlyData.map((d, i) => <td key={i} className="text-right num-cell font-semibold">{formatNumber(d.pbt, 0)}</td>)}
                </tr>
                <tr style={{ backgroundColor: "#f0fdf4" }}>
                  <td className="font-bold" style={{ color: "#166534" }}>Net Profit</td>
                  {quarterlyData.map((d, i) => <td key={i} className="text-right num-cell font-bold" style={{ color: "#166534" }}>{formatNumber(d.netProfit, 0)}</td>)}
                </tr>
                <tr>
                  <td className="font-bold">EPS in Rs</td>
                  {quarterlyData.map((d, i) => <td key={i} className="text-right num-cell font-bold">₹ {d.qEps}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 5: PROFIT & LOSS (ANNUAL) */}
      {(activeSection === "pnl" || activeSection === "all") && (
        <section className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Profit &amp; Loss</h2>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Consolidated Figures in ₹ Crores (Annual Multi-Year Trend)</span>
          </div>

          <div className="table-scroll">
            <table className="market-table" style={{ fontSize: "12px" }}>
              <thead>
                <tr>
                  <th className="text-left" style={{ minWidth: "150px" }}>Particulars</th>
                  {annualYears.map((yr) => (
                    <th key={yr} className="text-right" style={{ minWidth: "90px" }}>{yr}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold">Sales +</td>
                  {annualPnlData.map((d, i) => <td key={i} className="text-right num-cell">{formatNumber(d.sales, 0)}</td>)}
                </tr>
                <tr>
                  <td style={{ color: "var(--text-muted)" }}>Expenses +</td>
                  {annualPnlData.map((d, i) => <td key={i} className="text-right num-cell">{formatNumber(d.expenses, 0)}</td>)}
                </tr>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td className="font-bold">Operating Profit</td>
                  {annualPnlData.map((d, i) => <td key={i} className="text-right num-cell font-bold">{formatNumber(d.opProfit, 0)}</td>)}
                </tr>
                <tr>
                  <td>OPM %</td>
                  {annualPnlData.map((d, i) => <td key={i} className="text-right num-cell">{d.opm} %</td>)}
                </tr>
                <tr style={{ backgroundColor: "#f0fdf4" }}>
                  <td className="font-bold" style={{ color: "#166534" }}>Net Profit +</td>
                  {annualPnlData.map((d, i) => <td key={i} className="text-right num-cell font-bold" style={{ color: "#166534" }}>{formatNumber(d.netProfit, 0)}</td>)}
                </tr>
                <tr>
                  <td className="font-bold">EPS in Rs</td>
                  {annualPnlData.map((d, i) => <td key={i} className="text-right num-cell font-bold">₹ {d.yrEps}</td>)}
                </tr>
                <tr>
                  <td>Dividend Payout %</td>
                  {annualPnlData.map((d, i) => <td key={i} className="text-right num-cell">{d.divPayout}</td>)}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Screener Compounded Growth Boxes */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "24px" }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px" }}>
              <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>Compounded Sales Growth</strong>
              <div style={{ marginTop: "10px", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>10 Years:</span> <b>14%</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>5 Years:</span> <b>16%</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>3 Years:</span> <b>15%</b></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>TTM:</span> <b>13%</b></div>
              </div>
            </div>

            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px" }}>
              <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>Compounded Profit Growth</strong>
              <div style={{ marginTop: "10px", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>10 Years:</span> <b>15%</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>5 Years:</span> <b>18%</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>3 Years:</span> <b>16%</b></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>TTM:</span> <b>14%</b></div>
              </div>
            </div>

            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px" }}>
              <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>Stock Price CAGR</strong>
              <div style={{ marginTop: "10px", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>10 Years:</span> <b>19%</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>5 Years:</span> <b>22%</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>3 Years:</span> <b>18%</b></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>1 Year:</span> <b>24%</b></div>
              </div>
            </div>

            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px" }}>
              <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>Return on Equity (ROE)</strong>
              <div style={{ marginTop: "10px", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>10 Years:</span> <b>26%</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>5 Years:</span> <b>28%</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span>3 Years:</span> <b>{roe}%</b></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Last Year:</span> <b>{roce}%</b></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 6: BALANCE SHEET */}
      {(activeSection === "balance" || activeSection === "all") && (
        <section className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Balance Sheet</h2>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Consolidated Figures in ₹ Crores</span>
          </div>

          <div className="table-scroll">
            <table className="market-table" style={{ fontSize: "12px" }}>
              <thead>
                <tr>
                  <th className="text-left" style={{ minWidth: "160px" }}>Particulars</th>
                  {annualYears.slice(0, 6).map((yr) => (
                    <th key={yr} className="text-right" style={{ minWidth: "90px" }}>{yr}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr><td>Equity Capital</td>{[365, 365, 365, 365, 365, 365].map((v, i) => <td key={i} className="text-right num-cell">{v}</td>)}</tr>
                <tr><td>Reserves</td>{[38400, 44200, 52100, 61400, 72300, 84200].map((v, i) => <td key={i} className="text-right num-cell">{v}</td>)}</tr>
                <tr><td>Borrowings</td>{[1200, 1050, 940, 810, 720, 610].map((v, i) => <td key={i} className="text-right num-cell">{v}</td>)}</tr>
                <tr><td>Other Liabilities</td>{[11200, 13400, 15100, 17800, 20400, 23500].map((v, i) => <td key={i} className="text-right num-cell">{v}</td>)}</tr>
                <tr style={{ backgroundColor: "#f8fafc" }}><td className="font-bold">Total Liabilities</td>{[51165, 59015, 68505, 80375, 93785, 108675].map((v, i) => <td key={i} className="text-right num-cell font-bold">{v}</td>)}</tr>
                <tr><td>Fixed Assets +</td>{[21400, 24100, 27600, 31200, 35400, 40100].map((v, i) => <td key={i} className="text-right num-cell">{v}</td>)}</tr>
                <tr><td>Investments</td>{[14200, 17400, 21200, 25800, 31200, 38100].map((v, i) => <td key={i} className="text-right num-cell">{v}</td>)}</tr>
                <tr><td>Other Assets +</td>{[15565, 17515, 19705, 23375, 27185, 30475].map((v, i) => <td key={i} className="text-right num-cell">{v}</td>)}</tr>
                <tr style={{ backgroundColor: "#f8fafc" }}><td className="font-bold">Total Assets</td>{[51165, 59015, 68505, 80375, 93785, 108675].map((v, i) => <td key={i} className="text-right num-cell font-bold">{v}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 7: CASH FLOWS */}
      {(activeSection === "cashflow" || activeSection === "all") && (
        <section className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Cash Flows</h2>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Consolidated Figures in ₹ Crores</span>
          </div>

          <div className="table-scroll">
            <table className="market-table" style={{ fontSize: "12px" }}>
              <thead>
                <tr>
                  <th className="text-left" style={{ minWidth: "160px" }}>Particulars</th>
                  {annualYears.slice(0, 6).map((yr) => (
                    <th key={yr} className="text-right" style={{ minWidth: "90px" }}>{yr}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr><td>Cash from Operating Activity +</td>{[8450, 10200, 12400, 14800, 17500, 21200].map((v, i) => <td key={i} className="text-right num-cell font-semibold">{v}</td>)}</tr>
                <tr><td>Cash from Investing Activity +</td>{[-3200, -4100, -5200, -6400, -7800, -9100].map((v, i) => <td key={i} className="text-right num-cell">{v}</td>)}</tr>
                <tr><td>Cash from Financing Activity +</td>{[-4100, -4900, -5800, -6900, -8100, -9600].map((v, i) => <td key={i} className="text-right num-cell">{v}</td>)}</tr>
                <tr style={{ backgroundColor: "#f0fdf4" }}><td className="font-bold">Net Cash Flow</td>{[1150, 1200, 1400, 1500, 1600, 2500].map((v, i) => <td key={i} className="text-right num-cell font-bold" style={{ color: "#166534" }}>{v}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 8: SHAREHOLDING PATTERN */}
      {(activeSection === "shareholding" || activeSection === "all") && (
        <section className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Shareholding Pattern</h2>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Numbers in % (Quarterly Shareholding Trend)</span>
          </div>

          <div className="table-scroll">
            <table className="market-table" style={{ fontSize: "12px" }}>
              <thead>
                <tr>
                  <th className="text-left" style={{ minWidth: "150px" }}>Shareholder Category</th>
                  {["Sep 2024", "Dec 2024", "Mar 2025", "Jun 2025", "Sep 2025", "Dec 2025", "Mar 2026"].map((q) => (
                    <th key={q} className="text-right" style={{ minWidth: "85px" }}>{q}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr><td className="font-bold">Promoters +</td>{[51.2, 51.2, 51.3, 51.3, 51.4, 51.4, 51.4].map((v, i) => <td key={i} className="text-right num-cell font-semibold">{v}%</td>)}</tr>
                <tr><td>FIIs (Foreign Institutional)</td>{[22.8, 23.1, 23.0, 23.4, 23.2, 23.5, 23.8].map((v, i) => <td key={i} className="text-right num-cell">{v}%</td>)}</tr>
                <tr><td>DIIs (Domestic Institutional)</td>{[14.6, 14.4, 14.5, 14.2, 14.4, 14.2, 14.1].map((v, i) => <td key={i} className="text-right num-cell">{v}%</td>)}</tr>
                <tr><td>Government</td>{[0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15].map((v, i) => <td key={i} className="text-right num-cell">{v}%</td>)}</tr>
                <tr><td>Public &amp; Retail</td>{[11.25, 11.15, 11.05, 10.95, 10.85, 10.75, 10.55].map((v, i) => <td key={i} className="text-right num-cell">{v}%</td>)}</tr>
                <tr style={{ backgroundColor: "#f8fafc" }}><td className="font-bold">Total</td>{[100, 100, 100, 100, 100, 100, 100].map((v, i) => <td key={i} className="text-right num-cell font-bold">{v}%</td>)}</tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 9: TRADE HISTORY & EXECUTIONS */}
      {(activeSection === "holding" || activeSection === "all") && (
        <section className="card" style={{ marginBottom: "20px", padding: "20px 24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "14px" }}>Order Execution History</h2>
          {stockTrades.length === 0 ? (
            <div className="empty-box" style={{ padding: "32px 16px", textAlign: "center" }}>
              <span style={{ fontSize: "24px" }}>📝</span>
              <p style={{ marginTop: "6px", color: "var(--text-muted)", fontSize: "12px" }}>
                No executed trades recorded for {symbol} yet.
              </p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="market-table">
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Type</th>
                    <th className="text-right">Quantity</th>
                    <th className="text-right">Execution Price</th>
                    <th className="text-right">Total Consideration</th>
                  </tr>
                </thead>
                <tbody>
                  {stockTrades.map((tr) => (
                    <tr key={tr.id}>
                      <td className="muted-cell">{new Date(tr.executedAt).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${tr.type === "BUY" ? "badge-profit" : "badge-loss"}`}>
                          {tr.type}
                        </span>
                      </td>
                      <td className="text-right num-cell">{formatNumber(tr.quantity, 0)}</td>
                      <td className="text-right num-cell font-bold">{formatINR(tr.price)}</td>
                      <td className="text-right num-cell font-bold">{formatINR(tr.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Quick Trade Modal */}
      {stock && (
        <TransactionModal
          isOpen={isTradeOpen}
          onClose={() => setIsTradeOpen(false)}
          stock={{
            id: stock.id,
            symbol: stock.symbol,
            companyName: stock.companyName,
            currentPrice,
            exchange: stock.exchange
          }}
          initialType={tradeType}
          onSuccess={() => {
            loadStockData();
          }}
        />
      )}

      {/* Add To Watchlist Modal */}
      {isWatchlistModalOpen && (
        <div className="modal-overlay" onClick={() => setIsWatchlistModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <h2>Add to Watchlist</h2>
              <button className="icon-btn" onClick={() => setIsWatchlistModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Select a watchlist to add <b>{stock.companyName} ({stock.symbol})</b>:
              </p>
              {watchlistError && <div className="form-error" style={{ marginBottom: "12px" }}>{watchlistError}</div>}
              {watchlistSuccess && (
                <div style={{ padding: "10px", backgroundColor: "#f0fdf4", color: "#166534", borderRadius: "var(--radius-sm)", marginBottom: "12px", fontSize: "12px" }}>
                  {watchlistSuccess}
                </div>
              )}
              {watchlists.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "12px" }}>
                  No watchlists created yet. Create one from the Watchlist tab!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {watchlists.map((wl) => (
                    <button
                      key={wl.id}
                      type="button"
                      className="secondary"
                      onClick={() => handleAddToWatchlist(wl.id, wl.name)}
                      style={{ textAlign: "left", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <span style={{ fontWeight: 600 }}>{wl.name}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>+ Add</span>
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