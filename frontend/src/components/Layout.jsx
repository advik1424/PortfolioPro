import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { stockApi } from "../api";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Stocks", path: "/stocks" },
  { label: "Watchlists", path: "/watchlists" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Transactions", path: "/transactions" },
  { label: "Analysis", path: "/analysis" }
];

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Global Search Modal State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef(null);

  // Ctrl+K Global Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [searchOpen]);

  // Debounced search querying backend
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await stockApi.search(searchQuery.trim(), 0, 8);
        setSearchResults(data.content || []);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStock = (symbol) => {
    setSearchOpen(false);
    navigate(`/stocks/${symbol}`);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="site">
      {/* Top Header Navigation */}
      <header className="top-nav">
        <div className="nav-left">
          <div className="logo" onClick={() => navigate("/dashboard")} title="PortfolioPro Dashboard">
            <span className="logo-box">P</span>
            <span>PortfolioPro</span>
          </div>
          <nav className="main-nav">
            {navItems.map(({ label, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="nav-right">
          <button
            className="nav-search"
            onClick={() => setSearchOpen(true)}
            aria-label="Search stocks"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Search stocks...</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="avatar" title={user?.name || user?.email || "User Profile"}>
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <button className="logout-btn" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        <span>PortfolioPro © 2026</span>
        <span>Stock Portfolio Management & Market Tracking System</span>
      </footer>

      {/* Mobile Bottom Navigation Bar (< 680px) */}
      <nav className="mobile-nav-bar" aria-label="Mobile Navigation">
        {navItems.map(({ label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => (isActive ? "mobile-nav-item active" : "mobile-nav-item")}
          >
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Global Stock Search Modal (Ctrl+K) */}
      {searchOpen && (
        <div className="modal-overlay" onClick={() => setSearchOpen(false)}>
          <div className="modal-card" style={{ width: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: "none", paddingBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  ref={searchInputRef}
                  className="form-input"
                  style={{ border: "none", boxShadow: "none", fontSize: "14px", padding: "4px 0" }}
                  placeholder="Type company name or symbol (e.g. RELIANCE, TCS)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="modal-close" onClick={() => setSearchOpen(false)} aria-label="Close search">
                ✕
              </button>
            </div>

            <div style={{ maxHeight: "340px", overflowY: "auto", borderTop: "1px solid var(--border)" }}>
              {searching ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                  Searching stock database...
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  {searchResults.map((stock) => (
                    <div
                      key={stock.id}
                      onClick={() => handleSelectStock(stock.symbol)}
                      style={{
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border-subtle)",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="symbol-badge">{stock.symbol}</span>
                          <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                            {stock.companyName}
                          </strong>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {stock.exchange} · {stock.sector || "Equity"}
                        </div>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "600" }}>
                        View →
                      </span>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                  No stocks found matching "<strong>{searchQuery}</strong>"
                </div>
              ) : (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "11px" }}>
                  Search stocks by ticker symbol or company name
                </div>
              )}
            </div>

            <div style={{ padding: "8px 16px", background: "var(--bg-subtle)", borderTop: "1px solid var(--border)", fontSize: "10px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
              <span>Press <kbd style={{ background: "#fff", padding: "1px 4px", border: "1px solid var(--border)", borderRadius: "3px" }}>Esc</kbd> to close</span>
              <span>Backend-synced stock universe</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}