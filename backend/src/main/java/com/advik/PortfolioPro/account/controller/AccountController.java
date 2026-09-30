package com.advik.PortfolioPro.account.controller;

import com.advik.PortfolioPro.account.dto.AccountResponseDto;
import com.advik.PortfolioPro.account.entity.Account;
import com.advik.PortfolioPro.account.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    // =====================================================
    // GET AUTHENTICATED USER'S ACCOUNT
    // GET /api/accounts/me
    // =====================================================
    @GetMapping("/me")
    public ResponseEntity<AccountResponseDto> getMyAccount(Authentication authentication) {
        Account account = accountService.getAccountByUserEmail(authentication.getName());

        AccountResponseDto response = new AccountResponseDto(
                account.getId(),
                account.getBalance()
        );

        return ResponseEntity.ok(response);
    }

    // =====================================================
    // GET ACCOUNT BY USER ID (LEGACY/ADMIN)
    // GET /api/accounts/{userId}
    // =====================================================
    @GetMapping("/{userId}")
    public ResponseEntity<AccountResponseDto> getAccount(
            @PathVariable Long userId) {

        Account account = accountService.getAccountByUserId(userId);

        AccountResponseDto response = new AccountResponseDto(
                account.getId(),
                account.getBalance()
        );

        return ResponseEntity.ok(response);
    }
}