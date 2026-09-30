package com.advik.PortfolioPro.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping(value = {"/", "/health", "/api/health"})
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "PortfolioPro Backend API",
                "version", "2.0.0",
                "timestamp", System.currentTimeMillis(),
                "frontend", "https://clinquant-tartufo-34ba0c.netlify.app"
        ));
    }
}
