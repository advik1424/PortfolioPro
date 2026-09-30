package com.advik.PortfolioPro.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StockResponseDto {

    private Long id;
    private String symbol;
    private String companyName;
    private String exchange;
    private String sector;
}