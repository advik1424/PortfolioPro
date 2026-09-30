package com.advik.PortfolioPro.analysis.technical.controller;

import com.advik.PortfolioPro.analysis.technical.dto.TechnicalResponseDto;


import com.advik.PortfolioPro.analysis.technical.service.TechnicalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analysis/technical")
public class TechnicalController {

    private final TechnicalService technicalAnalysisService;

    public TechnicalController(
            TechnicalService technicalAnalysisService) {

        this.technicalAnalysisService = technicalAnalysisService;
    }

    @GetMapping("/stock/{stockId}")
    public ResponseEntity<TechnicalResponseDto> getTechnicalAnalysis(
            @PathVariable Long stockId) {

        return ResponseEntity.ok(
                technicalAnalysisService
                        .getTechnicalByStockId(stockId)
        );
    }
}