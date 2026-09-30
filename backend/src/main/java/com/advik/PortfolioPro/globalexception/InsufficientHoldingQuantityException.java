package com.advik.PortfolioPro.globalexception;

public class InsufficientHoldingQuantityException extends RuntimeException {
    public InsufficientHoldingQuantityException(String message) {
        super(message);
    }
}
