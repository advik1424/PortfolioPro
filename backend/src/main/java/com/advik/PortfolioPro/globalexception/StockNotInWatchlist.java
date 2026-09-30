package com.advik.PortfolioPro.globalexception;

public class StockNotInWatchlist extends RuntimeException {
    public StockNotInWatchlist(String message) {
        super(message);
    }
}
