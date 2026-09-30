package com.advik.PortfolioPro.transaction.controller;

import com.advik.PortfolioPro.transaction.dto.TransactionRequestDto;
import com.advik.PortfolioPro.transaction.dto.TransactionResponseDto;
import com.advik.PortfolioPro.transaction.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trading")
public class TradingController {

    private final TransactionService transactionService;

    public TradingController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // =====================================================
    // BUY STOCK / RECORD ACQUISITION
    // POST /api/trading/buy
    // =====================================================
    @PostMapping("/buy")
    public ResponseEntity<TransactionResponseDto> buyStock(
            @Valid @RequestBody TransactionRequestDto request,
            Authentication authentication) {
        TransactionResponseDto response = transactionService.buyStock(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // =====================================================
    // SELL STOCK / REDUCE HOLDING
    // POST /api/trading/sell
    // =====================================================
    @PostMapping("/sell")
    public ResponseEntity<TransactionResponseDto> sellStock(
            @Valid @RequestBody TransactionRequestDto request,
            Authentication authentication) {
        TransactionResponseDto response = transactionService.sellStock(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // =====================================================
    // GET COMPLETE TRADE / TRANSACTION HISTORY
    // GET /api/trading/history
    // =====================================================
    @GetMapping("/history")
    public ResponseEntity<List<TransactionResponseDto>> getTransactionHistory(
            Authentication authentication) {
        return ResponseEntity.ok(transactionService.getUserTransactions(authentication));
    }

    // =====================================================
    // GET TRADE HISTORY FOR SPECIFIC STOCK
    // GET /api/trading/history/{stockId}
    // =====================================================
    @GetMapping("/history/{stockId}")
    public ResponseEntity<List<TransactionResponseDto>> getStockTransactionHistory(
            @PathVariable Long stockId,
            Authentication authentication) {
        return ResponseEntity.ok(transactionService.getUserTransactionsForStock(stockId, authentication));
    }
}
