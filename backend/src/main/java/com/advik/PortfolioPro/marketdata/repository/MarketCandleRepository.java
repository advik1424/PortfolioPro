package com.advik.PortfolioPro.marketdata.repository;

import com.advik.PortfolioPro.marketdata.entity.MarketCandle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MarketCandleRepository
        extends JpaRepository<MarketCandle, Long> {

    List<MarketCandle> findByStockIdOrderByTimestampAsc(
            Long stockId
    );

    List<MarketCandle> findByStockIdAndTimestampBetweenOrderByTimestampAsc(
            Long stockId,
            LocalDateTime start,
            LocalDateTime end
    );
}