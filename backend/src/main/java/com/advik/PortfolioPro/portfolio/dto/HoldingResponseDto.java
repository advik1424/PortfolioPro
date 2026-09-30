package com.advik.PortfolioPro.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoldingResponseDto {

    private Long id;
    private Long stockId;
    private String symbol;
    private String companyName;
    private BigDecimal quantity;
    private BigDecimal averageBuyPrice;
    private BigDecimal currentPrice;
    private BigDecimal investedValue;
    private BigDecimal currentValue;
    private BigDecimal unrealizedPnL;
    private BigDecimal unrealizedPnLPercentage;

    public HoldingResponseDto(
            Long id,
            Long stockId,
            String symbol,
            String companyName,
            BigDecimal quantity,
            BigDecimal averageBuyPrice) {
        this.id = id;
        this.stockId = stockId;
        this.symbol = symbol;
        this.companyName = companyName;
        this.quantity = quantity;
        this.averageBuyPrice = averageBuyPrice;
    }
}