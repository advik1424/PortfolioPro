package com.advik.PortfolioPro.globalexception;

public class HoldingNotFound extends RuntimeException {
    public HoldingNotFound(String message) {
        super(message);
    }
}
