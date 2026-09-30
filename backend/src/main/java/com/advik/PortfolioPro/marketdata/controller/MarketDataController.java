package com.advik.PortfolioPro.marketdata.controller;

import com.advik.PortfolioPro.marketdata.dto.LiveMarketQuoteDto;
import com.advik.PortfolioPro.marketdata.dto.MarketCandleResponseDto;
import com.advik.PortfolioPro.marketdata.dto.MarketPriceResponseDto;
import com.advik.PortfolioPro.marketdata.entity.MarketPrice;
import com.advik.PortfolioPro.marketdata.service.MarketDataService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market-data")
public class MarketDataController {

    private final MarketDataService marketDataService;

    public MarketDataController(
            MarketDataService marketDataService) {

        this.marketDataService = marketDataService;
    }


    // =====================================================
    // FETCH AND SAVE CURRENT PRICE USING SYMBOL
    // =====================================================

    @GetMapping("/external-price/{symbol}")
    public ResponseEntity<MarketPriceResponseDto> fetchAndSaveCurrentPrice(
            @PathVariable String symbol) {

        return ResponseEntity.ok(
                marketDataService.fetchAndSaveCurrentPrice(symbol)
        );
    }


    // =====================================================
    // CURRENT PRICE FROM DATABASE
    // =====================================================

    @GetMapping("/price/{stockId}")
    public ResponseEntity<MarketPriceResponseDto> getCurrentPrice(
            @PathVariable Long stockId) {

        return ResponseEntity.ok(
                marketDataService.getCurrentPrice(stockId)
        );
    }


    // =====================================================
    // LIVE MARKET QUOTE
    // =====================================================

    @GetMapping("/live-price/{stockId}")
    public ResponseEntity<LiveMarketQuoteDto> getLivePrice(
            @PathVariable Long stockId) {

        return ResponseEntity.ok(
                marketDataService.fetchLiveQuote(stockId)
        );
    }


    // =====================================================
    // LIVE MARKET QUOTE USING SYMBOL
    // =====================================================

    @GetMapping("/live-price/symbol/{symbol}")
    public ResponseEntity<LiveMarketQuoteDto> getLivePriceBySymbol(
            @PathVariable String symbol) {

        return ResponseEntity.ok(
                marketDataService.fetchLiveQuote(symbol)
        );
    }


    // =====================================================
    // ALL HISTORICAL DATA
    // =====================================================

    @GetMapping("/candles/{stockId}")
    public ResponseEntity<List<MarketCandleResponseDto>>
    getHistoricalData(
            @PathVariable Long stockId) {

        return ResponseEntity.ok(
                marketDataService.getHistoricalData(stockId)
        );
    }


    // =====================================================
    // HISTORICAL DATA BY RANGE
    // =====================================================

    @GetMapping("/candles/{stockId}/range")
    public ResponseEntity<List<MarketCandleResponseDto>>
    getHistoricalDataByRange(
            @PathVariable Long stockId,
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end) {

        return ResponseEntity.ok(
                marketDataService.getHistoricalData(
                        stockId,
                        start,
                        end
                )
        );
    }

    @PostMapping("/candles/sync/{stockId}")
    public ResponseEntity<Map<String, Object>> syncHistoricalData(
            @PathVariable Long stockId,
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end) {

        int savedCount =
                marketDataService.fetchAndSaveHistoricalData(
                        stockId,
                        start,
                        end
                );

        return ResponseEntity.ok(
                Map.of(
                        "message", "Historical data synchronized",
                        "stockId", stockId,
                        "candlesAdded", savedCount
                )
        );
    }
}