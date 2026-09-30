package com.advik.PortfolioPro.analysis.technical.entity;

import com.advik.PortfolioPro.stock.entity.Stock;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "technical_analysis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Technical {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(
            name = "stock_id",
            nullable = false,
            unique = true
    )
    private Stock stock;

    @Column(precision = 15, scale = 4)
    private BigDecimal sma;

    @Column(precision = 15, scale = 4)
    private BigDecimal ema;

    @Column(precision = 10, scale = 4)
    private BigDecimal rsi;

    @Column(precision = 15, scale = 4)
    private BigDecimal macd;

    @Column(precision = 15, scale = 4)
    private BigDecimal macdSignal;

    @Column(precision = 15, scale = 4)
    private BigDecimal support;

    @Column(precision = 15, scale = 4)
    private BigDecimal resistance;

    private LocalDateTime updatedAt;
}