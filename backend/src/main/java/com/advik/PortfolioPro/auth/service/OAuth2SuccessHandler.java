package com.advik.PortfolioPro.auth.service;

import com.advik.PortfolioPro.account.service.AccountService;
import com.advik.PortfolioPro.user.entity.User;
import com.advik.PortfolioPro.user.repository.UserRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2SuccessHandler
        implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AccountService accountService;

    public OAuth2SuccessHandler(
            UserRepository userRepository,
            JwtService jwtService,
            AccountService accountService) {

        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.accountService = accountService;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oauth2User =
                (OAuth2User) authentication.getPrincipal();

        // GET GOOGLE USER DATA

        String email =
                oauth2User.getAttribute("email");

        String name =
                oauth2User.getAttribute("name");

        // FIND OR CREATE USER

        User user = userRepository
                .findByEmail(email)
                .orElseGet(() -> {

                    User newUser = new User();

                    newUser.setName(name);
                    newUser.setEmail(email);

                    // Google user does not need local password
                    newUser.setPassword(null);

                    return userRepository.save(newUser);
                });

        // ENSURE ACCOUNT EXISTS

        accountService.createAccountIfNotExists(user);

        // GENERATE JWT

        String token =
                jwtService.generateToken(
                        user.getEmail()
                );

        // REDIRECT TO REACT

        String frontendUrl =
                "http://localhost:5174/oauth2/callback";

        String redirectUrl =
                frontendUrl
                        + "#token=" + URLEncoder.encode(
                        token,
                        StandardCharsets.UTF_8)
                        + "&id=" + user.getId()
                        + "&name=" + URLEncoder.encode(
                        user.getName(),
                        StandardCharsets.UTF_8)
                        + "&email=" + URLEncoder.encode(
                        user.getEmail(),
                        StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }
}