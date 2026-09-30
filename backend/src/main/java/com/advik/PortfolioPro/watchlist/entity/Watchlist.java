package com.advik.PortfolioPro.watchlist.entity;



import com.advik.PortfolioPro.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "watchlists",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"user_id", "name"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Watchlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
