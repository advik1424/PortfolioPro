package com.advik.PortfolioPro.watchlist.repository;

import com.advik.PortfolioPro.watchlist.entity.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WatchlistRepository
        extends JpaRepository<Watchlist, Long> {

    List<Watchlist> findByUserId(Long userId);

    Optional<Watchlist> findByUserIdAndName(
            Long userId,
            String name
    );
}
