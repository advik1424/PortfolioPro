package com.advik.PortfolioPro.config;

import com.advik.PortfolioPro.marketdata.service.StockMarketSyncService;
import com.advik.PortfolioPro.stock.repository.StockRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Automatically populates the Stock universe on application boot if empty.
 * Strictly adheres to ZERO hardcoding: fetches live dynamic NSE equities from Twelve Data API.
 * Runs asynchronously so server startup is instantaneous.
 */
@Component
public class StockAutoSyncRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StockAutoSyncRunner.class);

    private final StockMarketSyncService stockMarketSyncService;
    private final StockRepository stockRepository;

    public StockAutoSyncRunner(
            StockMarketSyncService stockMarketSyncService,
            StockRepository stockRepository) {
        this.stockMarketSyncService = stockMarketSyncService;
        this.stockRepository = stockRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        new Thread(() -> {
            try {
                long currentCount = stockRepository.count();
                if (currentCount == 0) {
                    log.info("⚡ Stock universe is empty. Automatically synchronizing live NSE equities from Twelve Data API...");
                    int added = stockMarketSyncService.syncStocks();
                    log.info("✓ Auto-sync completed! Added {} equities into market universe.", added);
                } else {
                    log.info("✓ Stock universe already active with {} equities.", currentCount);
                }
            } catch (Exception e) {
                log.warn("⚠️ Stock auto-sync encountered an issue: {}", e.getMessage());
            }
        }, "StockAutoSyncThread").start();
    }
}
