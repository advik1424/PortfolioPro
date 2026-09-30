package com.advik.PortfolioPro.stock.repository;

import com.advik.PortfolioPro.stock.entity.Stock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StockRepository
        extends JpaRepository<Stock, Long> {

    Optional<Stock> findBySymbol(String symbol);

    boolean existsBySymbol(String symbol);

    Page<Stock> findBySymbolContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(
            String symbol,
            String companyName,
            Pageable pageable
    );
}