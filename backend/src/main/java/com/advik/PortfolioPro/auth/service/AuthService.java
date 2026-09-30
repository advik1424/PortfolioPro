package com.advik.PortfolioPro.auth.service;

import com.advik.PortfolioPro.auth.dto.LoginRequestDto;
import com.advik.PortfolioPro.auth.dto.LoginResponseDto;
import com.advik.PortfolioPro.globalexception.InvalidCredential;
import com.advik.PortfolioPro.user.entity.User;
import com.advik.PortfolioPro.user.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }


    public LoginResponseDto login(LoginRequestDto request) {

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new InvalidCredential(
                                "Invalid email or password"
                        )
                );


        // =====================================================
        // GOOGLE USER / NO LOCAL PASSWORD
        // =====================================================

        if (user.getPassword() == null) {

            throw new InvalidCredential(
                    "Invalid email or password"
            );
        }


        // =====================================================
        // CHECK PASSWORD
        // =====================================================

        boolean passwordMatch =
                passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );


        if (!passwordMatch) {

            throw new InvalidCredential(
                    "Invalid email or password"
            );
        }


        // =====================================================
        // GENERATE JWT
        // =====================================================

        String token =
                jwtService.generateToken(
                        user.getEmail()
                );


        // =====================================================
        // RESPONSE
        // =====================================================

        return new LoginResponseDto(
                user.getId(),
                token,
                user.getName(),
                user.getEmail()
        );
    }
}