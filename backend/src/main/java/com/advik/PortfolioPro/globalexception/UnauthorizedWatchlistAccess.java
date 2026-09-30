package com.advik.PortfolioPro.globalexception;

public class UnauthorizedWatchlistAccess extends RuntimeException {
    public UnauthorizedWatchlistAccess(String message) {
        super(message);
    }
}
