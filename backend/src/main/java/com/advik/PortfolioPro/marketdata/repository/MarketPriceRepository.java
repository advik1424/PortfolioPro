package com.advik.PortfolioPro.marketdata.repository;

import com.advik.PortfolioPro.marketdata.entity.MarketPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MarketPriceRepository
        extends JpaRepository<MarketPrice, Long> {

    Optional<MarketPrice> findTopByStockIdOrderByTimestampDesc(Long stockId);
}