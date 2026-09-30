package com.advik.PortfolioPro.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.advik.PortfolioPro.auth.service.OAuth2SuccessHandler;

import java.util.List;

@Configuration
public class SecurityConfig {


    // =====================================================
    // PASSWORD ENCODER
    // =====================================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    // =====================================================
    // CORS
    // =====================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOriginPatterns(
                List.of(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        "https://*.vercel.app",
                        "https://*.netlify.app",
                        "https://*.railway.app",
                        "https://*.render.com"
                )
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }


    // =====================================================
    // API SECURITY
    // =====================================================

    @Bean
    @Order(1)
    public SecurityFilterChain apiSecurityFilterChain(
            HttpSecurity http)
            throws Exception {

        http
                .securityMatcher("/api/**", "/", "/health")

                .cors(Customizer.withDefaults())

                .csrf(csrf ->
                        csrf.disable()
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth ->
                        auth

                                // Root & Health check
                                .requestMatchers(
                                        "/",
                                        "/health",
                                        "/api/health"
                                )
                                .permitAll()

                                // Registration
                                .requestMatchers(
                                        "/api/users",
                                        "/api/users/**"
                                )
                                .permitAll()

                                // Login
                                .requestMatchers(
                                        "/api/auth",
                                        "/api/auth/**"
                                )
                                .permitAll()

                                // CORS preflight
                                .requestMatchers(
                                        HttpMethod.OPTIONS,
                                        "/api/**"
                                )
                                .permitAll()

                                // Everything else requires JWT
                                .anyRequest()
                                .authenticated()
                )

                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(
                                Customizer.withDefaults()
                        )
                );

        return http.build();
    }


    // =====================================================
    // GOOGLE OAUTH2 SECURITY
    // =====================================================

    @Bean
    @Order(2)
    public SecurityFilterChain oauthSecurityFilterChain(
            HttpSecurity http,
            OAuth2SuccessHandler oauth2SuccessHandler)
            throws Exception {

        http
                .securityMatcher(
                        "/oauth2/**",
                        "/login/**"
                )

                .csrf(csrf ->
                        csrf.disable()
                )

                .authorizeHttpRequests(auth ->
                        auth
                                .anyRequest()
                                .permitAll()
                )

                .oauth2Login(oauth2 ->
                        oauth2.successHandler(
                                oauth2SuccessHandler
                        )
                );

        return http.build();
    }
}