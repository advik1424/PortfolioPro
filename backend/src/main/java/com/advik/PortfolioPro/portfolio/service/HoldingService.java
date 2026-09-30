package com.advik.PortfolioPro.portfolio.service;

import com.advik.PortfolioPro.globalexception.AccountNotFound;
import com.advik.PortfolioPro.globalexception.HoldingNotFound;
import com.advik.PortfolioPro.marketdata.entity.MarketPrice;
import com.advik.PortfolioPro.marketdata.repository.MarketPriceRepository;
import com.advik.PortfolioPro.portfolio.dto.HoldingResponseDto;
import com.advik.PortfolioPro.portfolio.dto.PortfolioSummaryDto;
import com.advik.PortfolioPro.portfolio.entity.Holding;
import com.advik.PortfolioPro.portfolio.mapper.HoldingMapper;
import com.advik.PortfolioPro.portfolio.repository.HoldingRepository;
import com.advik.PortfolioPro.transaction.entity.Transaction;
import com.advik.PortfolioPro.transaction.entity.TransactionType;
import com.advik.PortfolioPro.transaction.repository.TransactionRepository;
import com.advik.PortfolioPro.user.entity.User;
import com.advik.PortfolioPro.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
public class HoldingService {

    private final HoldingRepository holdingRepository;
    private final HoldingMapper holdingMapper;
    private final UserRepository userRepository;
    private final MarketPriceRepository marketPriceRepository;
    private final TransactionRepository transactionRepository;

    public HoldingService(
            HoldingRepository holdingRepository,
            HoldingMapper holdingMapper,
            UserRepository userRepository,
            MarketPriceRepository marketPriceRepository,
            TransactionRepository transactionRepository) {
        this.holdingRepository = holdingRepository;
        this.holdingMapper = holdingMapper;
        this.userRepository = userRepository;
        this.marketPriceRepository = marketPriceRepository;
        this.transactionRepository = transactionRepository;
    }

    private User getLoggedInUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccountNotFound("User not found: " + email));
    }

    private BigDecimal getLatestMarketPrice(Long stockId) {
        Optional<MarketPrice> latestPrice = marketPriceRepository.findTopByStockIdOrderByTimestampDesc(stockId);
        return latestPrice.map(MarketPrice::getPrice).orElse(null);
    }

    // =====================================================
    // GET ALL HOLDINGS WITH LIVE P/L METRICS
    // =====================================================
    public List<HoldingResponseDto> getUserHoldings(Authentication authentication) {
        User user = getLoggedInUser(authentication);

        return holdingRepository.findByUserId(user.getId())
                .stream()
                .map(holding -> {
                    BigDecimal currentPrice = getLatestMarketPrice(holding.getStock().getId());
                    return holdingMapper.toDetailedResponse(holding, currentPrice);
                })
                .toList();
    }

    // =====================================================
    // GET SPECIFIC STOCK HOLDING
    // =====================================================
    public HoldingResponseDto getUserHolding(Long stockId, Authentication authentication) {
        User user = getLoggedInUser(authentication);

        Holding holding = holdingRepository.findByUserIdAndStockId(user.getId(), stockId)
                .orElseThrow(() -> new HoldingNotFound("Holding not found for stock ID: " + stockId));

        BigDecimal currentPrice = getLatestMarketPrice(stockId);
        return holdingMapper.toDetailedResponse(holding, currentPrice);
    }

    // =====================================================
    // GET COMPLETE PORTFOLIO SUMMARY
    // =====================================================
    public PortfolioSummaryDto getPortfolioSummary(Authentication authentication) {
        User user = getLoggedInUser(authentication);
        List<HoldingResponseDto> holdings = getUserHoldings(authentication);

        BigDecimal totalInvested = BigDecimal.ZERO;
        BigDecimal totalCurrentValue = BigDecimal.ZERO;

        for (HoldingResponseDto h : holdings) {
            if (h.getInvestedValue() != null) {
                totalInvested = totalInvested.add(h.getInvestedValue());
            }
            if (h.getCurrentValue() != null) {
                totalCurrentValue = totalCurrentValue.add(h.getCurrentValue());
            }
        }

        BigDecimal totalUnrealizedPnL = totalCurrentValue.subtract(totalInvested);
        BigDecimal totalUnrealizedPnLPercent = totalInvested.compareTo(BigDecimal.ZERO) > 0
                ? totalUnrealizedPnL.multiply(BigDecimal.valueOf(100)).divide(totalInvested, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<Transaction> transactions = transactionRepository.findByUserIdOrderByTransactionDateDesc(user.getId());
        BigDecimal totalRealizedPnL = transactions.stream()
                .filter(t -> t.getType() == TransactionType.SELL && t.getRealizedPnL() != null)
                .map(Transaction::getRealizedPnL)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return PortfolioSummaryDto.builder()
                .totalInvested(totalInvested.setScale(2, RoundingMode.HALF_UP))
                .totalCurrentValue(totalCurrentValue.setScale(2, RoundingMode.HALF_UP))
                .totalUnrealizedPnL(totalUnrealizedPnL.setScale(2, RoundingMode.HALF_UP))
                .totalUnrealizedPnLPercentage(totalUnrealizedPnLPercent)
                .totalRealizedPnL(totalRealizedPnL.setScale(2, RoundingMode.HALF_UP))
                .holdingsCount(holdings.size())
                .holdings(holdings)
                .build();
    }
}