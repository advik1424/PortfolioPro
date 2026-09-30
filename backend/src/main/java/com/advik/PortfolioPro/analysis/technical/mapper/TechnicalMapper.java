package com.advik.PortfolioPro.analysis.technical.mapper;

import com.advik.PortfolioPro.analysis.technical.dto.TechnicalResponseDto;
import com.advik.PortfolioPro.analysis.technical.entity.Technical;
import org.springframework.stereotype.Component;

@Component
public class TechnicalMapper {

    public TechnicalResponseDto toResponse(
            Technical technicalAnalysis) {

        return new TechnicalResponseDto(
                technicalAnalysis.getId(),
                technicalAnalysis.getStock().getId(),
                technicalAnalysis.getStock().getSymbol(),
                technicalAnalysis.getSma(),
                technicalAnalysis.getEma(),
                technicalAnalysis.getRsi(),
                technicalAnalysis.getMacd(),
                technicalAnalysis.getMacdSignal(),
                technicalAnalysis.getSupport(),
                technicalAnalysis.getResistance(),
                technicalAnalysis.getUpdatedAt()
        );
    }
}