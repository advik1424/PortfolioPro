package com.advik.PortfolioPro.analysis.fundamental.mapper;

import com.advik.PortfolioPro.analysis.fundamental.dto.FundamentalResponseDto;
import com.advik.PortfolioPro.analysis.fundamental.entity.Fundamental;
import org.springframework.stereotype.Component;

@Component
public class FundamentalMapper {

    public FundamentalResponseDto toResponse(
            Fundamental fundamental) {

        return new FundamentalResponseDto(
                fundamental.getId(),
                fundamental.getStock().getId(),
                fundamental.getStock().getSymbol(),
                fundamental.getMarketCap(),
                fundamental.getPeRatio(),
                fundamental.getEps(),
                fundamental.getRevenue(),
                fundamental.getProfit(),
                fundamental.getDebt(),
                fundamental.getUpdatedAt()
        );
    }
}