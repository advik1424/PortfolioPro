package com.advik.PortfolioPro.stock.mapper;

import com.advik.PortfolioPro.stock.dto.StockRequestDto;
import com.advik.PortfolioPro.stock.dto.StockResponseDto;
import com.advik.PortfolioPro.stock.entity.Stock;
import org.springframework.stereotype.Component;

@Component
public class StockMapper {

    public Stock toEntity(StockRequestDto request) {

        Stock stock = new Stock();

        stock.setSymbol(request.getSymbol());
        stock.setCompanyName(request.getCompanyName());
        stock.setExchange(request.getExchange());
        stock.setSector(request.getSector());

        return stock;
    }

    public StockResponseDto toResponse(Stock stock) {

        return new StockResponseDto(
                stock.getId(),
                stock.getSymbol(),
                stock.getCompanyName(),
                stock.getExchange(),
                stock.getSector()
        );
    }
}