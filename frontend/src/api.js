import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

// Attach JWT Bearer token to all outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global response errors (e.g. 401 Unauthorized -> redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
export const authApi = {
  login: (payload) => api.post("/api/auth/login", payload),
  register: (payload) => api.post("/api/users", payload),
  forgotPassword: (payload) => api.post("/api/auth/forgot-password", payload),
  resetPassword: (payload) => api.post("/api/auth/reset-password", payload)
};

// -------------------------------------------------------------
// Stock Exploration Endpoints
// -------------------------------------------------------------
export const stockApi = {
  list: (page = 0, size = 25) =>
    api.get("/api/stocks", { params: { page, size } }),
  search: (query, page = 0, size = 25) =>
    api.get("/api/stocks/search", { params: { query, page, size } }),
  bySymbol: (symbol) =>
    api.get(`/api/stocks/${encodeURIComponent(symbol)}`),
  sync: () => api.post("/api/stocks/sync")
};

// -------------------------------------------------------------
// Market Data Endpoints
// -------------------------------------------------------------
export const marketApi = {
  price: (stockId) => api.get(`/api/market-data/price/${stockId}`),
  liveQuote: (stockId) => api.get(`/api/market-data/live-price/${stockId}`),
  liveQuoteBySymbol: (symbol) => api.get(`/api/market-data/live-price/symbol/${encodeURIComponent(symbol)}`),
  externalPrice: (symbol) => api.get(`/api/market-data/external-price/${encodeURIComponent(symbol)}`),
  candles: (stockId) => api.get(`/api/market-data/candles/${stockId}`)
};

// -------------------------------------------------------------
// Portfolio & Holdings Endpoints
// -------------------------------------------------------------
export const portfolioApi = {
  summary: () => api.get("/api/portfolio/summary"),
  holdings: () => api.get("/api/portfolio/holdings"),
  holding: (stockId) => api.get(`/api/portfolio/holdings/${stockId}`)
};

// -------------------------------------------------------------
// Trading & Transactions Endpoints
// -------------------------------------------------------------
export const tradingApi = {
  buy: (payload) => api.post("/api/trading/buy", payload),
  sell: (payload) => api.post("/api/trading/sell", payload),
  history: () => api.get("/api/trading/history"),
  historyForStock: (stockId) => api.get(`/api/trading/history/${stockId}`)
};

// -------------------------------------------------------------
// Watchlist Endpoints
// -------------------------------------------------------------
export const watchlistApi = {
  all: () => api.get("/api/watchlists"),
  create: (name) => api.post("/api/watchlists", null, { params: { name } }),
  getStocks: (watchlistId) => api.get(`/api/watchlists/${watchlistId}/stocks`),
  addStock: (watchlistId, stockId) => api.post(`/api/watchlists/${watchlistId}/stocks/${stockId}`),
  removeStock: (watchlistId, stockId) => api.delete(`/api/watchlists/${watchlistId}/stocks/${stockId}`)
};

// -------------------------------------------------------------
// Analysis Endpoints
// -------------------------------------------------------------
export const analysisApi = {
  technical: (stockId) => api.get(`/api/analysis/technical/stock/${stockId}`),
  fundamental: (stockId) => api.get(`/api/analysis/fundamental/stock/${stockId}`)
};

// -------------------------------------------------------------
// Account Endpoints
// -------------------------------------------------------------
export const accountApi = {
  me: () => api.get("/api/accounts/me")
};

// -------------------------------------------------------------
// Financial Formatting Utilities (Indian Numbering & Currency)
// -------------------------------------------------------------
export const formatINR = (value, showDecimals = true) => {
  if (value === null || value === undefined || value === "" || isNaN(value)) {
    return "—";
  }
  const num = Number(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  }).format(num);
};

export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "" || isNaN(value)) {
    return "—";
  }
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatPercent = (value) => {
  if (value === null || value === undefined || value === "" || isNaN(value)) {
    return "—";
  }
  const num = Number(value);
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
};