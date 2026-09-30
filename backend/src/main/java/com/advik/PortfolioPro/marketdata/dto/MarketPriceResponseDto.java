package com.advik.PortfolioPro.marketdata.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class MarketPriceResponseDto {

    private Long id;

    private Long stockId;

    private String symbol;

    private BigDecimal price;

    private BigDecimal volume;

    private LocalDateTime timestamp;

    private String source;
}