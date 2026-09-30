package com.advik.PortfolioPro.analysis.fundamental.controller;

import com.advik.PortfolioPro.analysis.fundamental.dto.FundamentalResponseDto;
import com.advik.PortfolioPro.analysis.fundamental.service.FundamentalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analysis/fundamental")
public class FundamentalController {

    private final FundamentalService fundamentalService;

    public FundamentalController(
            FundamentalService fundamentalService) {
        this.fundamentalService = fundamentalService;
    }

    @GetMapping("/stock/{stockId}")
    public ResponseEntity<FundamentalResponseDto> getFundamentalAnalysis(
            @PathVariable Long stockId) {

        return ResponseEntity.ok(
                fundamentalService.getFundamentalByStockId(stockId)
        );
    }
}