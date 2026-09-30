PortfolioPro frontend v2

Run:
1. npm install
2. npm run dev

Vite uses:
127.0.0.1 with port 5173, but strictPort=false so another port is used if 5173 is busy.

Backend:
http://localhost:8080

Routes:
 /login
 /register
 /dashboard
 /stocks
 /stocks/:symbol
 /portfolio
 /watchlists
 /analysis

The UI is Screener-inspired rather than a pixel-perfect/proprietary clone.
It uses your existing Spring Boot APIs and does not fabricate market values.
