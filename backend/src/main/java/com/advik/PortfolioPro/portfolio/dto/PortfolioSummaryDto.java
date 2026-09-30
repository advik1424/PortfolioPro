package com.advik.PortfolioPro.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioSummaryDto {

    private BigDecimal totalInvested;
    private BigDecimal totalCurrentValue;
    private BigDecimal totalUnrealizedPnL;
    private BigDecimal totalUnrealizedPnLPercentage;
    private BigDecimal totalRealizedPnL;
    private int holdingsCount;
    private List<HoldingResponseDto> holdings;
}
