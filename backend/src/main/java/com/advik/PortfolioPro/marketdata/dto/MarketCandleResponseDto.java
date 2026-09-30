package com.advik.PortfolioPro.marketdata.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class MarketCandleResponseDto {

    private Long id;

    private Long stockId;

    private String symbol;

    private BigDecimal open;

    private BigDecimal high;

    private BigDecimal low;

    private BigDecimal close;

    private BigDecimal volume;

    private LocalDateTime timestamp;
}

