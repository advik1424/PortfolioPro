package com.advik.PortfolioPro.watchlist.entity;

import com.advik.PortfolioPro.stock.entity.Stock;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "watchlist_stocks",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"watchlist_id", "stock_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchlistStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "watchlist_id", nullable = false)
    private Watchlist watchlist;

    @ManyToOne
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;
}