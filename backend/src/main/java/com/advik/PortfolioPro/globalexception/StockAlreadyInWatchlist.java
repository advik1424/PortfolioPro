package com.advik.PortfolioPro.globalexception;

public class StockAlreadyInWatchlist extends RuntimeException {
    public StockAlreadyInWatchlist(String message) {
        super(message);
    }
}
