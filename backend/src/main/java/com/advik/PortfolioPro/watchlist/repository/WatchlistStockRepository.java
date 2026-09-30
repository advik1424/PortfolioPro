package com.advik.PortfolioPro.watchlist.repository;

import com.advik.PortfolioPro.watchlist.entity.Watchlist;
import com.advik.PortfolioPro.watchlist.entity.WatchlistStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WatchlistStockRepository
        extends JpaRepository<WatchlistStock, Long> {

    List<WatchlistStock> findByWatchlistId(Long watchlistId);

    Optional<WatchlistStock> findByWatchlistIdAndStockId(
            Long watchlistId,
            Long stockId
    );

    boolean existsByWatchlistIdAndStockId(
            Long watchlistId,
            Long stockId
    );
}