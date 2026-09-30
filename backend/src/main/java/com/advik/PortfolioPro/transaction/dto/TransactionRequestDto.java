package com.advik.PortfolioPro.transaction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRequestDto {

    @NotNull(message = "Stock ID cannot be null")
    private Long stockId;

    @NotNull(message = "Quantity cannot be null")
    @DecimalMin(value = "0.0001", message = "Quantity must be greater than zero")
    private BigDecimal quantity;

    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    private BigDecimal price;

    private LocalDateTime transactionDate;
}
