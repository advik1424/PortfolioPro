package com.advik.PortfolioPro.stock.controller;

import com.advik.PortfolioPro.stock.dto.StockRequestDto;
import com.advik.PortfolioPro.stock.dto.StockResponseDto;
import com.advik.PortfolioPro.stock.service.StockService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stocks")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }


    // =====================================================
    // CREATE STOCK
    // =====================================================

    @PostMapping
    public ResponseEntity<StockResponseDto> createStock(
            @Valid @RequestBody StockRequestDto request) {

        StockResponseDto response =
                stockService.createStock(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =====================================================
    // GET ALL STOCKS - PAGINATED
    // =====================================================

    @GetMapping
    public ResponseEntity<Page<StockResponseDto>> getAllStocks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Pageable pageable =
                PageRequest.of(page, size);

        return ResponseEntity.ok(
                stockService.getAllStocks(pageable)
        );
    }


    // =====================================================
    // SEARCH STOCKS
    // =====================================================

    @GetMapping("/search")
    public ResponseEntity<Page<StockResponseDto>> searchStocks(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Pageable pageable =
                PageRequest.of(page, size);

        return ResponseEntity.ok(
                stockService.searchStocks(
                        query,
                        pageable
                )
        );
    }


    // =====================================================
    // GET STOCK BY SYMBOL
    // =====================================================

    @GetMapping("/{symbol}")
    public ResponseEntity<StockResponseDto> getStockBySymbol(
            @PathVariable String symbol) {

        StockResponseDto response =
                stockService.getStockBySymbol(symbol);

        return ResponseEntity.ok(response);
    }
}