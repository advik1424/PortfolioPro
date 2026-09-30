package com.advik.PortfolioPro.portfolio.mapper;

import com.advik.PortfolioPro.portfolio.dto.HoldingResponseDto;
import com.advik.PortfolioPro.portfolio.entity.Holding;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class HoldingMapper {

    public HoldingResponseDto toResponse(Holding holding) {
        return toDetailedResponse(holding, null);
    }

    public HoldingResponseDto toDetailedResponse(Holding holding, BigDecimal currentPrice) {
        BigDecimal quantity = holding.getQuantity();
        BigDecimal avgPrice = holding.getAverageBuyPrice();
        BigDecimal investedValue = quantity.multiply(avgPrice).setScale(2, RoundingMode.HALF_UP);

        BigDecimal effectiveCurrentPrice = currentPrice != null ? currentPrice : avgPrice;
        BigDecimal currentValue = quantity.multiply(effectiveCurrentPrice).setScale(2, RoundingMode.HALF_UP);

        BigDecimal unrealizedPnL = currentValue.subtract(investedValue);
        BigDecimal unrealizedPnLPercent = investedValue.compareTo(BigDecimal.ZERO) > 0
                ? unrealizedPnL.multiply(BigDecimal.valueOf(100)).divide(investedValue, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return HoldingResponseDto.builder()
                .id(holding.getId())
                .stockId(holding.getStock().getId())
                .symbol(holding.getStock().getSymbol())
                .companyName(holding.getStock().getCompanyName())
                .quantity(quantity)
                .averageBuyPrice(avgPrice)
                .currentPrice(currentPrice)
                .investedValue(investedValue)
                .currentValue(currentValue)
                .unrealizedPnL(unrealizedPnL)
                .unrealizedPnLPercentage(unrealizedPnLPercent)
                .build();
    }
}