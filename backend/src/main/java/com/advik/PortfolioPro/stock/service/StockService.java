package com.advik.PortfolioPro.stock.service;

import com.advik.PortfolioPro.globalexception.StockAlreadyExist;
import com.advik.PortfolioPro.globalexception.StockNotFound;
import com.advik.PortfolioPro.marketdata.service.StockMarketSyncService;
import com.advik.PortfolioPro.stock.dto.StockRequestDto;
import com.advik.PortfolioPro.stock.dto.StockResponseDto;
import com.advik.PortfolioPro.stock.entity.Stock;
import com.advik.PortfolioPro.stock.mapper.StockMapper;
import com.advik.PortfolioPro.stock.repository.StockRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class StockService {

    private static final Logger log = LoggerFactory.getLogger(StockService.class);

    private final StockRepository stockRepository;
    private final StockMapper stockMapper;
    private final StockMarketSyncService stockMarketSyncService;

    public StockService(
            StockRepository stockRepository,
            StockMapper stockMapper,
            StockMarketSyncService stockMarketSyncService) {

        this.stockRepository = stockRepository;
        this.stockMapper = stockMapper;
        this.stockMarketSyncService = stockMarketSyncService;
    }


    // =====================================================
    // CREATE STOCK
    // =====================================================

    public StockResponseDto createStock(StockRequestDto request) {

        String symbol = request.getSymbol()
                .trim()
                .toUpperCase();

        if (stockRepository.existsBySymbol(symbol)) {

            throw new StockAlreadyExist(
                    "Stock with this symbol already exists"
            );
        }

        request.setSymbol(symbol);

        Stock stock = stockMapper.toEntity(request);

        Stock savedStock = stockRepository.save(stock);

        return stockMapper.toResponse(savedStock);
    }


    // =====================================================
    // GET STOCK BY SYMBOL
    // =====================================================

    public StockResponseDto getStockBySymbol(String symbol) {

        String normalizedSymbol = symbol
                .trim()
                .toUpperCase();

        Stock stock = stockRepository
                .findBySymbol(normalizedSymbol)
                .orElseThrow(() ->
                        new StockNotFound(
                                "Stock not found: " + normalizedSymbol
                        )
                );

        return stockMapper.toResponse(stock);
    }


    // =====================================================
    // GET ALL STOCKS - PAGINATED
    // =====================================================

    public Page<StockResponseDto> getAllStocks(
            Pageable pageable) {

        ensureStocksPopulated();

        return stockRepository
                .findAll(pageable)
                .map(stockMapper::toResponse);
    }


    // =====================================================
    // SEARCH STOCKS
    // =====================================================

    public Page<StockResponseDto> searchStocks(
            String query,
            Pageable pageable) {

        ensureStocksPopulated();

        String normalizedQuery =
                query == null
                        ? ""
                        : query.trim();

        return stockRepository
                .findBySymbolContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(
                        normalizedQuery,
                        normalizedQuery,
                        pageable
                )
                .map(stockMapper::toResponse);
    }

    private void ensureStocksPopulated() {
        if (stockRepository.count() == 0) {
            try {
                log.info("Stock database is currently empty. Synchronizing live stocks from Twelve Data...");
                stockMarketSyncService.syncStocks();
            } catch (Exception e) {
                log.warn("Auto-sync from market provider encountered an issue: {}", e.getMessage());
            }
        }
    }
}