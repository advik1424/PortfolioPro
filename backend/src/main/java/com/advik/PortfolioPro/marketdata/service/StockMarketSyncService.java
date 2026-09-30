package com.advik.PortfolioPro.marketdata.service;

import com.advik.PortfolioPro.stock.entity.Stock;
import com.advik.PortfolioPro.stock.repository.StockRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
    // SYNC STOCKS FROM TWELVE DATA
    // =====================================================

    @Transactional
    public int syncStocks() {

        List<MarketDataProviderService.ExternalStockDto>
                externalStocks =
                marketDataProviderService.fetchStocks();

        int savedCount = 0;

        for (MarketDataProviderService.ExternalStockDto
                externalStock : externalStocks) {

            if (externalStock.symbol() == null ||
                    externalStock.name() == null ||
                    externalStock.exchange() == null) {

                continue;
            }

            String symbol =
                    externalStock.symbol()
                            .trim()
                            .toUpperCase();

            if (stockRepository.existsBySymbol(symbol)) {
                continue;
            }

            Stock stock = new Stock();

            stock.setSymbol(symbol);

            stock.setCompanyName(
                    externalStock.name().trim()
            );

            stock.setExchange(
                    externalStock.exchange().trim()
            );

            /*
             * Twelve Data /stocks does not provide
             * sector information.
             *
             * Therefore we intentionally do NOT
             * hardcode sector.
             */
            stock.setSector(null);

            stockRepository.save(stock);

            savedCount++;
        }

        return savedCount;
    }
}