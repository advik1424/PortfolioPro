package com.advik.PortfolioPro.marketdata.service;

import com.advik.PortfolioPro.stock.entity.Stock;
import com.advik.PortfolioPro.stock.repository.StockRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class StockMarketSyncService {

    private final MarketDataProviderService marketDataProviderService;
    private final StockRepository stockRepository;

    public StockMarketSyncService(
            MarketDataProviderService marketDataProviderService,
            StockRepository stockRepository) {

        this.marketDataProviderService = marketDataProviderService;
        this.stockRepository = stockRepository;
    }

    // =====================================================
    // SYNC STOCKS FROM TWELVE DATA (HIGH SPEED BATCH SYNC)
    // =====================================================

    @Transactional
    public int syncStocks() {

        List<MarketDataProviderService.ExternalStockDto> externalStocks =
                marketDataProviderService.fetchStocks();

        if (externalStocks == null || externalStocks.isEmpty()) {
            return 0;
        }

        // Single query to retrieve all existing symbols to prevent thousands of network roundtrips
        Set<String> existingSymbols = stockRepository.findAll()
                .stream()
                .map(s -> s.getSymbol().trim().toUpperCase())
                .collect(Collectors.toSet());

        List<Stock> stocksToSave = new ArrayList<>();

        for (MarketDataProviderService.ExternalStockDto externalStock : externalStocks) {

            if (externalStock.symbol() == null ||
                    externalStock.name() == null ||
                    externalStock.exchange() == null) {
                continue;
            }

            String symbol = externalStock.symbol().trim().toUpperCase();

            // Filter out empty, test symbols, or duplicates
            if (symbol.isEmpty() || symbol.contains("TEST") || existingSymbols.contains(symbol)) {
                continue;
            }

            existingSymbols.add(symbol);

            Stock stock = new Stock();
            stock.setSymbol(symbol);
            stock.setCompanyName(externalStock.name().trim());
            stock.setExchange(externalStock.exchange().trim());
            stock.setSector(null);

            stocksToSave.add(stock);
        }

        if (stocksToSave.isEmpty()) {
            return 0;
        }

        // Batch save in chunks of 500
        int batchSize = 500;
        for (int i = 0; i < stocksToSave.size(); i += batchSize) {
            int end = Math.min(i + batchSize, stocksToSave.size());
            stockRepository.saveAll(stocksToSave.subList(i, end));
        }

        return stocksToSave.size();
    }
}