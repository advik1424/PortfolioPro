package com.advik.PortfolioPro.marketdata.controller;

import com.advik.PortfolioPro.marketdata.service.StockMarketSyncService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stocks")
public class StockMarketSyncController {

    private final StockMarketSyncService stockMarketSyncService;

    public StockMarketSyncController(
            StockMarketSyncService stockMarketSyncService) {

        this.stockMarketSyncService = stockMarketSyncService;
    }


    // =====================================================
    // SYNC STOCKS FROM TWELVE DATA
    // =====================================================

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncStocks() {

        int savedCount =
                stockMarketSyncService.syncStocks();

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Stock synchronization completed",

                        "stocksAdded",
                        savedCount
                )
        );
    }
}