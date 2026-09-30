package com.advik.PortfolioPro.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequestDto {
    private String email;
    private String token;
    private String newPassword;
}
