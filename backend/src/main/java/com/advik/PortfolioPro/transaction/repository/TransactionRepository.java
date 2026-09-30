package com.advik.PortfolioPro.transaction.repository;

import com.advik.PortfolioPro.transaction.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserIdOrderByTransactionDateDesc(Long userId);

    List<Transaction> findByUserIdAndStockIdOrderByTransactionDateDesc(Long userId, Long stockId);
}
