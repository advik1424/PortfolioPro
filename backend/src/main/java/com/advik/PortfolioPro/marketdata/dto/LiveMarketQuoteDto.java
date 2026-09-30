package com.advik.PortfolioPro.marketdata.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class LiveMarketQuoteDto {

    private Long stockId;

    private String symbol;

    private BigDecimal price;

    private BigDecimal change;

    private BigDecimal changePercent;

    private BigDecimal open;

    private BigDecimal high;

    private BigDecimal low;

    private BigDecimal previousClose;

    private BigDecimal volume;

    private LocalDateTime timestamp;

    private String source;
}