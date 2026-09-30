package com.advik.PortfolioPro.stock.entity;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "stocks")
@Getter
@Setter
public class Stock {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String symbol;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String exchange;

    private String sector;
}
