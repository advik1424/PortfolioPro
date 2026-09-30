package com.advik.PortfolioPro.auth.service;

import com.advik.PortfolioPro.auth.dto.ForgotPasswordRequestDto;
import com.advik.PortfolioPro.auth.dto.LoginRequestDto;
import com.advik.PortfolioPro.auth.dto.LoginResponseDto;
import com.advik.PortfolioPro.auth.dto.ResetPasswordRequestDto;
import com.advik.PortfolioPro.globalexception.InvalidCredential;
import com.advik.PortfolioPro.user.entity.User;
import com.advik.PortfolioPro.user.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private final Map<String, ResetTokenInfo> resetTokens = new ConcurrentHashMap<>();

    private record ResetTokenInfo(String email, LocalDateTime expiresAt) {}

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

    // =====================================================
    // FORGOT PASSWORD - INITIATE
    // =====================================================

    public Map<String, String> forgotPassword(ForgotPasswordRequestDto request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No registered account found with email: " + email));

        // Generate 8-character verification token
        String resetToken = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        resetTokens.put(resetToken, new ResetTokenInfo(email, LocalDateTime.now().plusMinutes(15)));

        return Map.of(
                "message", "Password reset code generated successfully. Valid for 15 minutes.",
                "resetToken", resetToken,
                "email", email
        );
    }

    // =====================================================
    // RESET PASSWORD - CONFIRM & UPDATE
    // =====================================================

    public Map<String, String> resetPassword(ResetPasswordRequestDto request) {
        String email = request.getEmail().trim().toLowerCase();
        String token = request.getToken().trim().toUpperCase();
        String newPassword = request.getNewPassword();

        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters long.");
        }

        ResetTokenInfo tokenInfo = resetTokens.get(token);
        if (tokenInfo == null || !tokenInfo.email().equalsIgnoreCase(email) || tokenInfo.expiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Invalid or expired password reset token.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        resetTokens.remove(token);

        return Map.of("message", "Password has been successfully updated. You can now sign in.");
    }
}