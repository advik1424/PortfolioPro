package com.advik.PortfolioPro.analysis.technical.repository;

import com.advik.PortfolioPro.analysis.technical.entity.Technical;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TechnicalRepository
        extends JpaRepository<Technical, Long> {

    Optional<Technical> findByStockId(Long stockId);
}