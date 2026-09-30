package com.advik.PortfolioPro.transaction.service;

import com.advik.PortfolioPro.globalexception.AccountNotFound;
import com.advik.PortfolioPro.globalexception.HoldingNotFound;
import com.advik.PortfolioPro.globalexception.InsufficientHoldingQuantityException;
import com.advik.PortfolioPro.globalexception.InvalidTransactionException;
import com.advik.PortfolioPro.globalexception.StockNotFound;
import com.advik.PortfolioPro.marketdata.dto.MarketPriceResponseDto;
import com.advik.PortfolioPro.marketdata.service.MarketDataService;
import com.advik.PortfolioPro.portfolio.entity.Holding;
import com.advik.PortfolioPro.portfolio.repository.HoldingRepository;
import com.advik.PortfolioPro.stock.entity.Stock;
import com.advik.PortfolioPro.stock.repository.StockRepository;
import com.advik.PortfolioPro.transaction.dto.TransactionRequestDto;
import com.advik.PortfolioPro.transaction.dto.TransactionResponseDto;
import com.advik.PortfolioPro.transaction.entity.Transaction;
import com.advik.PortfolioPro.transaction.entity.TransactionType;
import com.advik.PortfolioPro.transaction.mapper.TransactionMapper;
import com.advik.PortfolioPro.transaction.repository.TransactionRepository;
import com.advik.PortfolioPro.user.entity.User;
import com.advik.PortfolioPro.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final HoldingRepository holdingRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final MarketDataService marketDataService;
    private final TransactionMapper transactionMapper;

    public TransactionService(
            TransactionRepository transactionRepository,
            HoldingRepository holdingRepository,
            UserRepository userRepository,
            StockRepository stockRepository,
            MarketDataService marketDataService,
            TransactionMapper transactionMapper) {
        this.transactionRepository = transactionRepository;
        this.holdingRepository = holdingRepository;
        this.userRepository = userRepository;
        this.stockRepository = stockRepository;
        this.marketDataService = marketDataService;
        this.transactionMapper = transactionMapper;
    }

    private User getLoggedInUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccountNotFound("User not found: " + email));
    }

    private BigDecimal resolveExecutionPrice(Stock stock, BigDecimal requestedPrice) {
        if (requestedPrice != null && requestedPrice.compareTo(BigDecimal.ZERO) > 0) {
            return requestedPrice.setScale(2, RoundingMode.HALF_UP);
        }

        try {
            MarketPriceResponseDto priceDto = marketDataService.getCurrentPrice(stock.getId());
            if (priceDto != null && priceDto.getPrice() != null) {
                return priceDto.getPrice().setScale(2, RoundingMode.HALF_UP);
            }
        } catch (Exception ignored) {
        }

        try {
            MarketPriceResponseDto priceDto = marketDataService.fetchAndSaveCurrentPrice(stock.getId());
            if (priceDto != null && priceDto.getPrice() != null) {
                return priceDto.getPrice().setScale(2, RoundingMode.HALF_UP);
            }
        } catch (Exception ex) {
            throw new InvalidTransactionException(
                    "Market price is currently unavailable for " + stock.getSymbol() + ". Please provide price manually."
            );
        }

        throw new InvalidTransactionException("Unable to determine execution price for stock: " + stock.getSymbol());
    }

    // =====================================================
    // BUY STOCK / RECORD ACQUISITION
    // =====================================================
    @Transactional
    public TransactionResponseDto buyStock(TransactionRequestDto request, Authentication authentication) {
        User user = getLoggedInUser(authentication);

        Stock stock = stockRepository.findById(request.getStockId())
                .orElseThrow(() -> new StockNotFound("Stock not found with ID: " + request.getStockId()));

        if (request.getQuantity() == null || request.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidTransactionException("Buy quantity must be greater than zero");
        }

        BigDecimal executionPrice = resolveExecutionPrice(stock, request.getPrice());
        BigDecimal totalAmount = executionPrice.multiply(request.getQuantity()).setScale(2, RoundingMode.HALF_UP);

        Optional<Holding> existingHoldingOpt = holdingRepository.findByUserIdAndStockId(user.getId(), stock.getId());

        if (existingHoldingOpt.isPresent()) {
            Holding holding = existingHoldingOpt.get();
            BigDecimal currentQty = holding.getQuantity();
            BigDecimal currentAvgPrice = holding.getAverageBuyPrice();

            BigDecimal newQuantity = currentQty.add(request.getQuantity());
            BigDecimal currentTotalCost = currentQty.multiply(currentAvgPrice);
            BigDecimal newTotalCost = currentTotalCost.add(totalAmount);
            BigDecimal newAverageBuyPrice = newTotalCost.divide(newQuantity, 2, RoundingMode.HALF_UP);

            holding.setQuantity(newQuantity);
            holding.setAverageBuyPrice(newAverageBuyPrice);
            holdingRepository.save(holding);
        } else {
            Holding newHolding = Holding.builder()
                    .user(user)
                    .stock(stock)
                    .quantity(request.getQuantity())
                    .averageBuyPrice(executionPrice)
                    .build();
            holdingRepository.save(newHolding);
        }

        Transaction transaction = Transaction.builder()
                .user(user)
                .stock(stock)
                .type(TransactionType.BUY)
                .quantity(request.getQuantity())
                .price(executionPrice)
                .totalAmount(totalAmount)
                .realizedPnL(null)
                .transactionDate(request.getTransactionDate() != null ? request.getTransactionDate() : LocalDateTime.now())
                .build();

        Transaction saved = transactionRepository.save(transaction);
        return transactionMapper.toResponse(saved);
    }

    // =====================================================
    // SELL STOCK / REDUCE HOLDING
    // =====================================================
    @Transactional
    public TransactionResponseDto sellStock(TransactionRequestDto request, Authentication authentication) {
        User user = getLoggedInUser(authentication);

        Stock stock = stockRepository.findById(request.getStockId())
                .orElseThrow(() -> new StockNotFound("Stock not found with ID: " + request.getStockId()));

        if (request.getQuantity() == null || request.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidTransactionException("Sell quantity must be greater than zero");
        }

        Holding holding = holdingRepository.findByUserIdAndStockId(user.getId(), stock.getId())
                .orElseThrow(() -> new HoldingNotFound("No holding found for stock: " + stock.getSymbol()));

        if (holding.getQuantity().compareTo(request.getQuantity()) < 0) {
            throw new InsufficientHoldingQuantityException(
                    "Insufficient holding quantity. You have " + holding.getQuantity() + " shares, but tried to sell " + request.getQuantity()
            );
        }

        BigDecimal executionPrice = resolveExecutionPrice(stock, request.getPrice());
        BigDecimal totalAmount = executionPrice.multiply(request.getQuantity()).setScale(2, RoundingMode.HALF_UP);

        BigDecimal profitPerShare = executionPrice.subtract(holding.getAverageBuyPrice());
        BigDecimal realizedPnL = profitPerShare.multiply(request.getQuantity()).setScale(2, RoundingMode.HALF_UP);

        BigDecimal remainingQuantity = holding.getQuantity().subtract(request.getQuantity());

        if (remainingQuantity.compareTo(BigDecimal.ZERO) == 0) {
            holdingRepository.delete(holding);
        } else {
            holding.setQuantity(remainingQuantity);
            holdingRepository.save(holding);
        }

        Transaction transaction = Transaction.builder()
                .user(user)
                .stock(stock)
                .type(TransactionType.SELL)
                .quantity(request.getQuantity())
                .price(executionPrice)
                .totalAmount(totalAmount)
                .realizedPnL(realizedPnL)
                .transactionDate(request.getTransactionDate() != null ? request.getTransactionDate() : LocalDateTime.now())
                .build();

        Transaction saved = transactionRepository.save(transaction);
        return transactionMapper.toResponse(saved);
    }

    // =====================================================
    // GET USER TRANSACTION HISTORY
    // =====================================================
    public List<TransactionResponseDto> getUserTransactions(Authentication authentication) {
        User user = getLoggedInUser(authentication);
        return transactionRepository.findByUserIdOrderByTransactionDateDesc(user.getId())
                .stream()
                .map(transactionMapper::toResponse)
                .toList();
    }

    // =====================================================
    // GET STOCK-SPECIFIC TRANSACTION HISTORY
    // =====================================================
    public List<TransactionResponseDto> getUserTransactionsForStock(Long stockId, Authentication authentication) {
        User user = getLoggedInUser(authentication);
        return transactionRepository.findByUserIdAndStockIdOrderByTransactionDateDesc(user.getId(), stockId)
                .stream()
                .map(transactionMapper::toResponse)
                .toList();
    }

    // =====================================================
    // GET TOTAL REALIZED P/L FOR USER
    // =====================================================
    public BigDecimal getTotalRealizedPnL(Long userId) {
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByTransactionDateDesc(userId);
        return transactions.stream()
                .filter(t -> t.getType() == TransactionType.SELL && t.getRealizedPnL() != null)
                .map(Transaction::getRealizedPnL)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
