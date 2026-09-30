package com.advik.PortfolioPro.account.service;

import com.advik.PortfolioPro.account.entity.Account;
import com.advik.PortfolioPro.account.repository.AccountRepository;
import com.advik.PortfolioPro.globalexception.AccountNotFound;
import com.advik.PortfolioPro.user.entity.User;
import com.advik.PortfolioPro.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class AccountService {

    private static final BigDecimal INITIAL_BALANCE =
            new BigDecimal("100000.00");

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public AccountService(AccountRepository accountRepository, UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    // =====================================================
    // CREATE ACCOUNT
    // =====================================================
    public Account createAccount(User user) {
        Account account = Account.builder()
                .user(user)
                .balance(INITIAL_BALANCE)
                .build();

        return accountRepository.save(account);
    }

    // =====================================================
    // CREATE ACCOUNT IF NOT EXISTS
    // =====================================================
    public Account createAccountIfNotExists(User user) {
        return accountRepository
                .findByUserId(user.getId())
                .orElseGet(() -> createAccount(user));
    }

    // =====================================================
    // GET ACCOUNT BY USER ID
    // =====================================================
    public Account getAccountByUserId(Long userId) {
        return accountRepository
                .findByUserId(userId)
                .orElseThrow(() ->
                        new AccountNotFound("Account not found for user ID: " + userId)
                );
    }

    // =====================================================
    // GET ACCOUNT BY USER EMAIL (AUTHENTICATED)
    // =====================================================
    public Account getAccountByUserEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AccountNotFound("User not found with email: " + email));
        return getAccountByUserId(user.getId());
    }
}