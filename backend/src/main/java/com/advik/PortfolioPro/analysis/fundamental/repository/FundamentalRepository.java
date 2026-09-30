package com.advik.PortfolioPro.analysis.fundamental.repository;

import com.advik.PortfolioPro.analysis.fundamental.entity.Fundamental;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FundamentalRepository
        extends JpaRepository<Fundamental, Long> {

    Optional<Fundamental> findByStockId(Long stockId);
}