package com.advik.PortfolioPro.auth.controller;

import com.advik.PortfolioPro.auth.dto.ForgotPasswordRequestDto;
import com.advik.PortfolioPro.auth.dto.LoginRequestDto;
import com.advik.PortfolioPro.auth.dto.LoginResponseDto;
import com.advik.PortfolioPro.auth.dto.ResetPasswordRequestDto;
import com.advik.PortfolioPro.auth.service.AuthService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    // =====================================================
    // FORGOT PASSWORD
    // POST /api/auth/forgot-password
    // =====================================================

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @RequestBody ForgotPasswordRequestDto request
    ) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    // =====================================================
    // RESET PASSWORD
    // POST /api/auth/reset-password
    // =====================================================

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @RequestBody ResetPasswordRequestDto request
    ) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }
}