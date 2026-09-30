package com.advik.PortfolioPro.analysis.technical.service;

import com.advik.PortfolioPro.analysis.technical.dto.TechnicalResponseDto;
import com.advik.PortfolioPro.analysis.technical.entity.Technical;
import com.advik.PortfolioPro.analysis.technical.mapper.TechnicalMapper;
import com.advik.PortfolioPro.analysis.technical.repository.TechnicalRepository;
import com.advik.PortfolioPro.globalexception.TechnicalAnalysisNotFound;

import org.springframework.stereotype.Service;

@Service
public class TechnicalService {

    private final TechnicalRepository technicalAnalysisRepository;
    private final TechnicalMapper technicalMapper;

    public TechnicalService(
            TechnicalRepository technicalAnalysisRepository,
            TechnicalMapper technicalMapper) {

        this.technicalAnalysisRepository = technicalAnalysisRepository;
        this.technicalMapper = technicalMapper;
    }

    public TechnicalResponseDto getTechnicalByStockId(Long stockId) {

        Technical technicalAnalysis =
                technicalAnalysisRepository
                        .findByStockId(stockId)
                        .orElseThrow(() ->
                                new TechnicalAnalysisNotFound(
                                        "Technical analysis not found for stock: "
                                                + stockId
                                )
                        );

        return technicalMapper.toResponse(technicalAnalysis);
    }
}