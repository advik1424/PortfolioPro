package com.advik.PortfolioPro.globalexception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandling {

    // =====================================================
    // USER / AUTH
    // =====================================================

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<Map<String, String>> handleDuplicateEmail(
            DuplicateEmailException ex) {

        return buildResponse(
                HttpStatus.CONFLICT,
                ex.getMessage()
        );
    }


    @ExceptionHandler(InvalidCredential.class)
    public ResponseEntity<Map<String, String>> handleInvalidCredential(
            InvalidCredential ex) {

        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                ex.getMessage()
        );
    }


    // =====================================================
    // ACCOUNT
    // =====================================================

    @ExceptionHandler(AccountNotFound.class)
    public ResponseEntity<Map<String, String>> handleAccountNotFound(
            AccountNotFound ex) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
    }


    // =====================================================
    // STOCK
    // =====================================================

    @ExceptionHandler(StockAlreadyExist.class)
    public ResponseEntity<Map<String, String>> handleStockAlreadyExist(
            StockAlreadyExist ex) {

        return buildResponse(
                HttpStatus.CONFLICT,
                ex.getMessage()
        );
    }


    @ExceptionHandler(StockNotFound.class)
    public ResponseEntity<Map<String, String>> handleStockNotFound(
            StockNotFound ex) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
    }


    // =====================================================
    // WATCHLIST
    // =====================================================

    @ExceptionHandler(WatchlistNotFound.class)
    public ResponseEntity<Map<String, String>> handleWatchlistNotFound(
            WatchlistNotFound ex) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
    }


    @ExceptionHandler(StockAlreadyInWatchlist.class)
    public ResponseEntity<Map<String, String>> handleStockAlreadyInWatchlist(
            StockAlreadyInWatchlist ex) {

        return buildResponse(
                HttpStatus.CONFLICT,
                ex.getMessage()
        );
    }


    @ExceptionHandler(StockNotInWatchlist.class)
    public ResponseEntity<Map<String, String>> handleStockNotInWatchlist(
            StockNotInWatchlist ex) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
    }


    @ExceptionHandler(WatchlistAlreadyExist.class)
    public ResponseEntity<Map<String, String>> handleWatchlistAlreadyExist(
            WatchlistAlreadyExist ex) {

        return buildResponse(
                HttpStatus.CONFLICT,
                ex.getMessage()
        );
    }


    @ExceptionHandler(UnauthorizedWatchlistAccess.class)
    public ResponseEntity<Map<String, String>> handleUnauthorizedWatchlistAccess(
            UnauthorizedWatchlistAccess ex) {

        return buildResponse(
                HttpStatus.FORBIDDEN,
                ex.getMessage()
        );
    }


    // =====================================================
    // VALIDATION
    // =====================================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        Map<String, String> response = new HashMap<>();

        ex.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        response.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }


    // =====================================================
    // DATABASE
    // =====================================================

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(
            DataIntegrityViolationException ex) {

        return buildResponse(
                HttpStatus.CONFLICT,
                "Database constraint violation"
        );
    }


    // =====================================================
    // UNEXPECTED ERROR
    // =====================================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpectedException(
            Exception ex) {

        ex.printStackTrace();

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                ex.getMessage()
        );
    }


    // =====================================================
    // COMMON RESPONSE BUILDER
    // =====================================================

    private ResponseEntity<Map<String, String>> buildResponse(
            HttpStatus status,
            String message) {

        Map<String, String> response = new HashMap<>();

        response.put("message", message);

        return ResponseEntity
                .status(status)
                .body(response);
    }


    @ExceptionHandler(TechnicalAnalysisNotFound.class)
    public ResponseEntity<Map<String, String>> handleTechnicalAnalysisNotFound(
            TechnicalAnalysisNotFound ex) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
    }

    @ExceptionHandler(FundamentalAnalysisNotFound.class)
    public ResponseEntity<Map<String, String>> handleFundamentalAnalysisNotFound(
            FundamentalAnalysisNotFound ex) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
    }


    @ExceptionHandler(MarketPriceNotFound.class)
    public ResponseEntity<Map<String, String>> handleMarketPriceNotFound(
            MarketPriceNotFound ex) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
    }

    @ExceptionHandler(HoldingNotFound.class)
    public ResponseEntity<Map<String, String>> handleHoldingNotFound(
            HoldingNotFound ex) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
    }

    @ExceptionHandler(InsufficientHoldingQuantityException.class)
    public ResponseEntity<Map<String, String>> handleInsufficientHoldingQuantity(
            InsufficientHoldingQuantityException ex) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
    }

    @ExceptionHandler(InvalidTransactionException.class)
    public ResponseEntity<Map<String, String>> handleInvalidTransaction(
            InvalidTransactionException ex) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
    }

}