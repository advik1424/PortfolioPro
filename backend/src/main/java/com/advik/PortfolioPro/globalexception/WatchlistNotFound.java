package com.advik.PortfolioPro.globalexception;

public class WatchlistNotFound extends RuntimeException {
    public WatchlistNotFound(String message) {
        super(message);
    }
}
