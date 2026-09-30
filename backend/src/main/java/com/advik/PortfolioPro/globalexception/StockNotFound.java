package com.advik.PortfolioPro.globalexception;

public class StockNotFound extends RuntimeException {
    public StockNotFound(String message) {
        super(message);
    }
}
