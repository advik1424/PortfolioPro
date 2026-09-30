package com.advik.PortfolioPro.globalexception;

public class WatchlistAlreadyExist extends RuntimeException {
    public WatchlistAlreadyExist(String message) {
        super(message);
    }
}
