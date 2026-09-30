package com.advik.PortfolioPro.watchlist.mapper;

import com.advik.PortfolioPro.watchlist.dto.WatchlistResponseDto;
import com.advik.PortfolioPro.watchlist.dto.WatchlistStockResponseDto;
import com.advik.PortfolioPro.watchlist.entity.Watchlist;
import com.advik.PortfolioPro.watchlist.entity.WatchlistStock;
import org.springframework.stereotype.Component;

@Component
public class WatchlistMapper {

    public WatchlistResponseDto toResponse(Watchlist watchlist) {

        return new WatchlistResponseDto(
                watchlist.getId(),
                watchlist.getName()
        );
    }

    public WatchlistStockResponseDto toStockResponse(
            WatchlistStock watchlistStock) {

        return new WatchlistStockResponseDto(
                watchlistStock.getId(),
                watchlistStock.getStock().getId(),
                watchlistStock.getStock().getSymbol(),
                watchlistStock.getStock().getCompanyName()
        );
    }
}