package com.advik.PortfolioPro.watchlist.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class WatchlistStockResponseDto {

    private Long id;
    private Long stockId;
    private String symbol;
    private String companyName;
}