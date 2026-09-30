package com.advik.PortfolioPro.analysis.fundamental.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class FundamentalResponseDto {

    private Long id;

    private Long stockId;

    private String symbol;

    private BigDecimal marketCap;

    private BigDecimal peRatio;

    private BigDecimal eps;

    private BigDecimal revenue;

    private BigDecimal profit;

    private BigDecimal debt;

    private LocalDateTime updatedAt;
}