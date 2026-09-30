package com.advik.PortfolioPro.account.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;


@Getter
@AllArgsConstructor
public class AccountResponseDto {

    private Long id;
    private BigDecimal balance;


}
