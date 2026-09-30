package com.advik.PortfolioPro.analysis.technical.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class TechnicalResponseDto {

    private Long id;

    private Long stockId;

    private String symbol;

    private BigDecimal sma;

    private BigDecimal ema;

    private BigDecimal rsi;

    private BigDecimal macd;

    private BigDecimal macdSignal;

    private BigDecimal support;

    private BigDecimal resistance;

    private LocalDateTime updatedAt;
}