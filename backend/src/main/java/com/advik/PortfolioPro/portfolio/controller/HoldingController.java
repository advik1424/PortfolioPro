package com.advik.PortfolioPro.portfolio.controller;

import com.advik.PortfolioPro.portfolio.dto.HoldingResponseDto;
import com.advik.PortfolioPro.portfolio.dto.PortfolioSummaryDto;
import com.advik.PortfolioPro.portfolio.service.HoldingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
public class HoldingController {

    private final HoldingService holdingService;

    public HoldingController(HoldingService holdingService) {
        this.holdingService = holdingService;
    }

    // =====================================================
    // GET ALL HOLDINGS
    // =====================================================
    @GetMapping("/holdings")
    public ResponseEntity<List<HoldingResponseDto>> getUserHoldings(
            Authentication authentication) {
        return ResponseEntity.ok(
                holdingService.getUserHoldings(authentication)
        );
    }

    // =====================================================
    // GET HOLDING BY STOCK
    // =====================================================
    @GetMapping("/holdings/{stockId}")
    public ResponseEntity<HoldingResponseDto> getUserHolding(
            @PathVariable Long stockId,
            Authentication authentication) {
        return ResponseEntity.ok(
                holdingService.getUserHolding(stockId, authentication)
        );
    }

    // =====================================================
    // GET PORTFOLIO SUMMARY
    // =====================================================
    @GetMapping("/summary")
    public ResponseEntity<PortfolioSummaryDto> getPortfolioSummary(
            Authentication authentication) {
        return ResponseEntity.ok(
                holdingService.getPortfolioSummary(authentication)
        );
    }
}