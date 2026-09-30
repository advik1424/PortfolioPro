package com.advik.PortfolioPro.watchlist.controller;

import com.advik.PortfolioPro.watchlist.dto.WatchlistResponseDto;
import com.advik.PortfolioPro.watchlist.dto.WatchlistStockResponseDto;
import com.advik.PortfolioPro.watchlist.service.WatchlistService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/watchlists")
public class WatchlistController {

    private final WatchlistService watchlistService;

    public WatchlistController(
            WatchlistService watchlistService) {

        this.watchlistService = watchlistService;
    }


    // =====================================================
    // CREATE WATCHLIST
    // POST /api/watchlists?name=
    // =====================================================

    @PostMapping
    public ResponseEntity<WatchlistResponseDto> createWatchlist(
            @RequestParam String name,
            Authentication authentication) {

        WatchlistResponseDto response =
                watchlistService.createWatchlist(
                        name,
                        authentication
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =====================================================
    // GET LOGGED-IN USER WATCHLISTS
    // GET /api/watchlists
    // =====================================================

    @GetMapping
    public ResponseEntity<List<WatchlistResponseDto>>
    getUserWatchlists(
            Authentication authentication) {

        return ResponseEntity.ok(
                watchlistService.getUserWatchlists(
                        authentication
                )
        );
    }


    // =====================================================
    // ADD STOCK TO WATCHLIST
    // POST /api/watchlists/{watchlistId}/stocks/{stockId}
    // =====================================================

    @PostMapping("/{watchlistId}/stocks/{stockId}")
    public ResponseEntity<WatchlistStockResponseDto> addStock(
            @PathVariable Long watchlistId,
            @PathVariable Long stockId,
            Authentication authentication) {

        WatchlistStockResponseDto response =
                watchlistService.addStockToWatchlist(
                        watchlistId,
                        stockId,
                        authentication
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =====================================================
    // GET STOCKS FROM WATCHLIST
    // GET /api/watchlists/{watchlistId}/stocks
    // =====================================================

    @GetMapping("/{watchlistId}/stocks")
    public ResponseEntity<List<WatchlistStockResponseDto>>
    getStocks(
            @PathVariable Long watchlistId,
            Authentication authentication) {

        return ResponseEntity.ok(
                watchlistService.getStocksFromWatchlist(
                        watchlistId,
                        authentication
                )
        );
    }


    // =====================================================
    // REMOVE STOCK FROM WATCHLIST
    // DELETE /api/watchlists/{watchlistId}/stocks/{stockId}
    // =====================================================

    @DeleteMapping("/{watchlistId}/stocks/{stockId}")
    public ResponseEntity<Void> removeStock(
            @PathVariable Long watchlistId,
            @PathVariable Long stockId,
            Authentication authentication) {

        watchlistService.removeStockFromWatchlist(
                watchlistId,
                stockId,
                authentication
        );

        return ResponseEntity
                .noContent()
                .build();
    }
}