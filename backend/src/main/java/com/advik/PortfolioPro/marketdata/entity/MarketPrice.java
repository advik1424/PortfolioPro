package com.advik.PortfolioPro.marketdata.entity;

import com.advik.PortfolioPro.stock.entity.Stock;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "market_prices",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"stock_id", "timestamp"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(
            name = "stock_id",
            nullable = false
    )
    private Stock stock;

    @Column(
            nullable = false,
            precision = 15,
            scale = 4
    )
    private BigDecimal price;

    @Column(
            precision = 20,
            scale = 4
    )
    private BigDecimal volume;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    private String source;
}