package com.advik.PortfolioPro.marketdata.service;

import com.advik.PortfolioPro.marketdata.dto.LiveMarketQuoteDto;
import com.advik.PortfolioPro.marketdata.entity.MarketCandle;
import com.advik.PortfolioPro.marketdata.entity.MarketPrice;

import java.time.LocalDateTime;
import java.util.List;

public interface MarketDataProviderService {

    // =====================================================
    // CURRENT MARKET PRICE
    // =====================================================

    MarketPrice fetchCurrentPrice(String symbol);


    // =====================================================
    // LIVE MARKET QUOTE
    // =====================================================

    LiveMarketQuoteDto fetchLiveQuote(String symbol);


    // =====================================================
    // HISTORICAL OHLCV DATA
    // =====================================================

    List<MarketCandle> fetchHistoricalData(
            String symbol,
            LocalDateTime start,
            LocalDateTime end
    );


    // =====================================================
    // STOCK MASTER DATA
    // =====================================================

    List<ExternalStockDto> fetchStocks();


    // =====================================================
    // EXTERNAL STOCK DTO
    // =====================================================

    record ExternalStockDto(

            String symbol,

            String name,

            String exchange,

            String country,

            String type,

            String globalAccess,

            String planAccess,

            String businessPlanAccess

    ) {
    }
}