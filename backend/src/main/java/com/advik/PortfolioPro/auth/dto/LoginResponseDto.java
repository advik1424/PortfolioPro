package com.advik.PortfolioPro.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponseDto {

    private Long id;
    private String token;
    private String name;
    private String email;
}