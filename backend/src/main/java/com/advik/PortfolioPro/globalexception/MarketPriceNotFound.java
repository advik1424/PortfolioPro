package com.advik.PortfolioPro.globalexception;

public class MarketPriceNotFound extends RuntimeException {
    public MarketPriceNotFound(String message) {
        super(message);
    }
}
