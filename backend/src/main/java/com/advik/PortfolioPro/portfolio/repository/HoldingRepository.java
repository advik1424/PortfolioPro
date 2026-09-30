package com.advik.PortfolioPro.portfolio.repository;

import com.advik.PortfolioPro.portfolio.entity.Holding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HoldingRepository extends JpaRepository<Holding,Long> {


    List<Holding> findByUserId(Long userId);

    Optional<Holding> findByUserIdAndStockId(
            Long userId,
            Long stockId
    );
}
