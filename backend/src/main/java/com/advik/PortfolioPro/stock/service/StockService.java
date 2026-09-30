package com.advik.PortfolioPro.stock.service;

import com.advik.PortfolioPro.globalexception.StockAlreadyExist;
import com.advik.PortfolioPro.globalexception.StockNotFound;
import com.advik.PortfolioPro.stock.dto.StockRequestDto;
import com.advik.PortfolioPro.stock.dto.StockResponseDto;
import com.advik.PortfolioPro.stock.entity.Stock;
import com.advik.PortfolioPro.stock.mapper.StockMapper;
import com.advik.PortfolioPro.stock.repository.StockRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StockService {

    private final StockRepository stockRepository;
    private final StockMapper stockMapper;

    public StockService(
            StockRepository stockRepository,
            StockMapper stockMapper) {

        this.stockRepository = stockRepository;
        this.stockMapper = stockMapper;
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
}