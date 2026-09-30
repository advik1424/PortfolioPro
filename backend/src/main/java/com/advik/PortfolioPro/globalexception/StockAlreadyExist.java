package com.advik.PortfolioPro.globalexception;

public class StockAlreadyExist extends RuntimeException {
    public StockAlreadyExist(String message) {
        super(message);
    }
}
