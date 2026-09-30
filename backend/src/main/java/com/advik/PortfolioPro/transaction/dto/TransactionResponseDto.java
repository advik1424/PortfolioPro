package com.advik.PortfolioPro.transaction.dto;

import com.advik.PortfolioPro.transaction.entity.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponseDto {

    private Long id;
    private Long stockId;
    private String symbol;
    private String companyName;
    private String exchange;
    private TransactionType type;
    private BigDecimal quantity;
    private BigDecimal price;
    private BigDecimal totalAmount;
    private BigDecimal realizedPnL;
    private LocalDateTime transactionDate;
}
