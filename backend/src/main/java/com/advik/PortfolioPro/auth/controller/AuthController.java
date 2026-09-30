package com.advik.PortfolioPro.auth.controller;

import com.advik.PortfolioPro.auth.dto.LoginRequestDto;
import com.advik.PortfolioPro.auth.dto.LoginResponseDto;
import com.advik.PortfolioPro.auth.service.AuthService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;


    public AuthController(AuthService authService) {
        this.authService = authService;
    }


    // =====================================================
    // LOGIN
    // POST /api/auth/login
    // =====================================================

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(
            @RequestBody LoginRequestDto request
    ) {

        LoginResponseDto response =
                authService.login(request);

        return ResponseEntity.ok(response);
    }
}