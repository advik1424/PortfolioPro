package com.advik.PortfolioPro.transaction.mapper;

import com.advik.PortfolioPro.transaction.dto.TransactionResponseDto;
import com.advik.PortfolioPro.transaction.entity.Transaction;
import org.springframework.stereotype.Component;

@Component
public class TransactionMapper {

    public TransactionResponseDto toResponse(Transaction transaction) {
        if (transaction == null) {
            return null;
        }

        return TransactionResponseDto.builder()
                .id(transaction.getId())
                .stockId(transaction.getStock() != null ? transaction.getStock().getId() : null)
                .symbol(transaction.getStock() != null ? transaction.getStock().getSymbol() : null)
                .companyName(transaction.getStock() != null ? transaction.getStock().getCompanyName() : null)
                .exchange(transaction.getStock() != null ? transaction.getStock().getExchange() : null)
                .type(transaction.getType())
                .quantity(transaction.getQuantity())
                .price(transaction.getPrice())
                .totalAmount(transaction.getTotalAmount())
                .realizedPnL(transaction.getRealizedPnL())
                .transactionDate(transaction.getTransactionDate())
                .build();
    }
}
