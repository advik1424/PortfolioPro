package com.advik.PortfolioPro.analysis.fundamental.entity;

import com.advik.PortfolioPro.stock.entity.Stock;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fundamental_analysis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fundamental {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "stock_id", nullable = false, unique = true)
    private Stock stock;

    @Column(precision = 15, scale = 4)
    private BigDecimal marketCap;

    @Column(precision = 15, scale = 4)
    private BigDecimal peRatio;

    @Column(precision = 15, scale = 4)
    private BigDecimal eps;

    @Column(precision = 15, scale = 4)
    private BigDecimal revenue;

    @Column(precision = 15, scale = 4)
    private BigDecimal profit;

    @Column(precision = 15, scale = 4)
    private BigDecimal debt;

    private LocalDateTime updatedAt;
}