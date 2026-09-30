package com.advik.PortfolioPro.stock.dto;

import jakarta.validation.constraints.NotBlank;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StockRequestDto {

    @NotBlank(message = "Symbol is required")
    private String symbol;

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Exchange is required")
    private String exchange;

    private String sector;
}