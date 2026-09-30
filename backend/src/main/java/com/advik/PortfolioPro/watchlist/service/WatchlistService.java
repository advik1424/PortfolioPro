package com.advik.PortfolioPro.watchlist.service;

import com.advik.PortfolioPro.globalexception.AccountNotFound;
import com.advik.PortfolioPro.globalexception.StockAlreadyInWatchlist;
import com.advik.PortfolioPro.globalexception.StockNotFound;
import com.advik.PortfolioPro.globalexception.StockNotInWatchlist;
import com.advik.PortfolioPro.globalexception.UnauthorizedWatchlistAccess;
import com.advik.PortfolioPro.globalexception.WatchlistAlreadyExist;
import com.advik.PortfolioPro.globalexception.WatchlistNotFound;

import com.advik.PortfolioPro.stock.entity.Stock;
import com.advik.PortfolioPro.stock.repository.StockRepository;

import com.advik.PortfolioPro.user.entity.User;
import com.advik.PortfolioPro.user.repository.UserRepository;

import com.advik.PortfolioPro.watchlist.dto.WatchlistResponseDto;
import com.advik.PortfolioPro.watchlist.dto.WatchlistStockResponseDto;

import com.advik.PortfolioPro.watchlist.entity.Watchlist;
import com.advik.PortfolioPro.watchlist.entity.WatchlistStock;

import com.advik.PortfolioPro.watchlist.mapper.WatchlistMapper;

import com.advik.PortfolioPro.watchlist.repository.WatchlistRepository;
import com.advik.PortfolioPro.watchlist.repository.WatchlistStockRepository;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final WatchlistStockRepository watchlistStockRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final WatchlistMapper watchlistMapper;

    public WatchlistService(
            WatchlistRepository watchlistRepository,
            WatchlistStockRepository watchlistStockRepository,
            UserRepository userRepository,
            StockRepository stockRepository,
            WatchlistMapper watchlistMapper) {

        this.watchlistRepository = watchlistRepository;
        this.watchlistStockRepository = watchlistStockRepository;
        this.userRepository = userRepository;
        this.stockRepository = stockRepository;
        this.watchlistMapper = watchlistMapper;
    }


    // =====================================================
    // GET LOGGED-IN USER
    // =====================================================

    private User getLoggedInUser(
            Authentication authentication) {

        String email = authentication.getName();

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new AccountNotFound(
                                "User not found"
                        )
                );
    }


    // =====================================================
    // CHECK WATCHLIST OWNERSHIP
    // =====================================================

    private Watchlist getAuthorizedWatchlist(
            Long watchlistId,
            Authentication authentication) {

        Watchlist watchlist =
                watchlistRepository
                        .findById(watchlistId)
                        .orElseThrow(() ->
                                new WatchlistNotFound(
                                        "Watchlist not found"
                                )
                        );

        User loggedInUser =
                getLoggedInUser(authentication);

        if (!watchlist.getUser()
                .getId()
                .equals(loggedInUser.getId())) {

            throw new UnauthorizedWatchlistAccess(
                    "You are not authorized to access this watchlist"
            );
        }

        return watchlist;
    }


    // =====================================================
    // CREATE WATCHLIST
    // POST /api/watchlists?name=
    // =====================================================

    public WatchlistResponseDto createWatchlist(
            String name,
            Authentication authentication) {

        User user =
                getLoggedInUser(authentication);

        if (watchlistRepository
                .findByUserIdAndName(
                        user.getId(),
                        name
                )
                .isPresent()) {

            throw new WatchlistAlreadyExist(
                    "Watchlist already exists"
            );
        }

        Watchlist watchlist =
                Watchlist.builder()
                        .name(name)
                        .user(user)
                        .build();

        Watchlist savedWatchlist =
                watchlistRepository.save(
                        watchlist
                );

        return watchlistMapper.toResponse(
                savedWatchlist
        );
    }


    // =====================================================
    // GET LOGGED-IN USER WATCHLISTS
    // GET /api/watchlists
    // =====================================================

    public List<WatchlistResponseDto>
    getUserWatchlists(
            Authentication authentication) {

        User user =
                getLoggedInUser(authentication);

        return watchlistRepository
                .findByUserId(user.getId())
                .stream()
                .map(watchlistMapper::toResponse)
                .toList();
    }


    // =====================================================
    // ADD STOCK TO WATCHLIST
    // POST /api/watchlists/{watchlistId}/stocks/{stockId}
    // =====================================================

    public WatchlistStockResponseDto addStockToWatchlist(
            Long watchlistId,
            Long stockId,
            Authentication authentication) {

        Watchlist watchlist =
                getAuthorizedWatchlist(
                        watchlistId,
                        authentication
                );

        Stock stock =
                stockRepository
                        .findById(stockId)
                        .orElseThrow(() ->
                                new StockNotFound(
                                        "Stock not found: "
                                                + stockId
                                )
                        );

        if (watchlistStockRepository
                .existsByWatchlistIdAndStockId(
                        watchlistId,
                        stockId)) {

            throw new StockAlreadyInWatchlist(
                    "Stock already exists in watchlist"
            );
        }

        WatchlistStock watchlistStock =
                WatchlistStock.builder()
                        .watchlist(watchlist)
                        .stock(stock)
                        .build();

        WatchlistStock savedWatchlistStock =
                watchlistStockRepository.save(
                        watchlistStock
                );

        return watchlistMapper
                .toStockResponse(
                        savedWatchlistStock
                );
    }


    // =====================================================
    // REMOVE STOCK FROM WATCHLIST
    // DELETE /api/watchlists/{watchlistId}/stocks/{stockId}
    // =====================================================

    public void removeStockFromWatchlist(
            Long watchlistId,
            Long stockId,
            Authentication authentication) {

        getAuthorizedWatchlist(
                watchlistId,
                authentication
        );

        WatchlistStock watchlistStock =
                watchlistStockRepository
                        .findByWatchlistIdAndStockId(
                                watchlistId,
                                stockId
                        )
                        .orElseThrow(() ->
                                new StockNotInWatchlist(
                                        "Stock not found in watchlist"
                                )
                        );

        watchlistStockRepository.delete(
                watchlistStock
        );
    }


    // =====================================================
    // GET STOCKS FROM WATCHLIST
    // GET /api/watchlists/{watchlistId}/stocks
    // =====================================================

    public List<WatchlistStockResponseDto>
    getStocksFromWatchlist(
            Long watchlistId,
            Authentication authentication) {

        getAuthorizedWatchlist(
                watchlistId,
                authentication
        );

        return watchlistStockRepository
                .findByWatchlistId(watchlistId)
                .stream()
                .map(watchlistMapper::toStockResponse)
                .toList();
    }
}