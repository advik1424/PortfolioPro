package com.advik.PortfolioPro.marketdata.mapper;

import com.advik.PortfolioPro.marketdata.dto.MarketCandleResponseDto;
import com.advik.PortfolioPro.marketdata.dto.MarketPriceResponseDto;
import com.advik.PortfolioPro.marketdata.entity.MarketCandle;
import com.advik.PortfolioPro.marketdata.entity.MarketPrice;
import org.springframework.stereotype.Component;

@Component
public class MarketDataMapper {

    public MarketPriceResponseDto toPriceResponse(
            MarketPrice marketPrice) {

        return new MarketPriceResponseDto(
                marketPrice.getId(),
                marketPrice.getStock().getId(),
                marketPrice.getStock().getSymbol(),
                marketPrice.getPrice(),
                marketPrice.getVolume(),
                marketPrice.getTimestamp(),
                marketPrice.getSource()
        );
    }

    public MarketCandleResponseDto toCandleResponse(
            MarketCandle marketCandle) {

        return new MarketCandleResponseDto(
                marketCandle.getId(),
                marketCandle.getStock().getId(),
                marketCandle.getStock().getSymbol(),
                marketCandle.getOpen(),
                marketCandle.getHigh(),
                marketCandle.getLow(),
                marketCandle.getClose(),
                marketCandle.getVolume(),
                marketCandle.getTimestamp()
        );
    }
}