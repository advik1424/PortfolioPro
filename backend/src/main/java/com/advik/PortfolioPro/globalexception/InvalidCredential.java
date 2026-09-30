package com.advik.PortfolioPro.globalexception;

public class InvalidCredential extends  RuntimeException{

    public InvalidCredential(String message){

        super(message);
    }
}
