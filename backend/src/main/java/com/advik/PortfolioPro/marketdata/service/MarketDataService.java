package com.advik.PortfolioPro.marketdata.service;

import com.advik.PortfolioPro.globalexception.MarketPriceNotFound;
import com.advik.PortfolioPro.marketdata.dto.LiveMarketQuoteDto;
import com.advik.PortfolioPro.marketdata.dto.MarketCandleResponseDto;
import com.advik.PortfolioPro.marketdata.dto.MarketPriceResponseDto;
import com.advik.PortfolioPro.marketdata.entity.MarketCandle;
import com.advik.PortfolioPro.marketdata.entity.MarketPrice;
import com.advik.PortfolioPro.marketdata.mapper.MarketDataMapper;
import com.advik.PortfolioPro.marketdata.repository.MarketCandleRepository;
import com.advik.PortfolioPro.marketdata.repository.MarketPriceRepository;
import com.advik.PortfolioPro.stock.entity.Stock;
import com.advik.PortfolioPro.stock.repository.StockRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MarketDataService {

    private final MarketPriceRepository marketPriceRepository;
    private final MarketCandleRepository marketCandleRepository;
    private final MarketDataMapper marketDataMapper;
    private final MarketDataProviderService marketDataProviderService;
    private final StockRepository stockRepository;

    public MarketDataService(
            MarketPriceRepository marketPriceRepository,
            MarketCandleRepository marketCandleRepository,
            MarketDataMapper marketDataMapper,
            MarketDataProviderService marketDataProviderService,
            StockRepository stockRepository) {

        this.marketPriceRepository = marketPriceRepository;
        this.marketCandleRepository = marketCandleRepository;
        this.marketDataMapper = marketDataMapper;
        this.marketDataProviderService = marketDataProviderService;
        this.stockRepository = stockRepository;
    }


    // =====================================================
    // GET LATEST SAVED PRICE
    // =====================================================

    public MarketPriceResponseDto getCurrentPrice(Long stockId) {

        MarketPrice marketPrice = marketPriceRepository
                .findTopByStockIdOrderByTimestampDesc(stockId)
                .orElseThrow(() ->
                        new MarketPriceNotFound(
                                "Market price not found for stock: "
                                        + stockId
                        )
                );

        return marketDataMapper.toPriceResponse(marketPrice);
    }


    // =====================================================
    // FETCH LIVE MARKET QUOTE
    // =====================================================

    public LiveMarketQuoteDto fetchLiveQuote(Long stockId) {

        Stock stock = stockRepository
                .findById(stockId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Stock not found: " + stockId
                        )
                );

        String symbol = stock.getSymbol();

        LiveMarketQuoteDto quote =
                marketDataProviderService
                        .fetchLiveQuote(symbol);

        return new LiveMarketQuoteDto(
                stock.getId(),
                quote.getSymbol(),
                quote.getPrice(),
                quote.getChange(),
                quote.getChangePercent(),
                quote.getOpen(),
                quote.getHigh(),
                quote.getLow(),
                quote.getPreviousClose(),
                quote.getVolume(),
                quote.getTimestamp(),
                quote.getSource()
        );
    }


    // =====================================================
    // FETCH LIVE MARKET QUOTE USING SYMBOL
    // =====================================================

    public LiveMarketQuoteDto fetchLiveQuote(
            String symbol) {

        String normalizedSymbol =
                symbol.trim().toUpperCase();

        Stock stock = stockRepository
                .findBySymbol(normalizedSymbol)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Stock not found: "
                                        + normalizedSymbol
                        )
                );

        LiveMarketQuoteDto quote =
                marketDataProviderService
                        .fetchLiveQuote(normalizedSymbol);

        return new LiveMarketQuoteDto(
                stock.getId(),
                quote.getSymbol(),
                quote.getPrice(),
                quote.getChange(),
                quote.getChangePercent(),
                quote.getOpen(),
                quote.getHigh(),
                quote.getLow(),
                quote.getPreviousClose(),
                quote.getVolume(),
                quote.getTimestamp(),
                quote.getSource()
        );
    }


    // =====================================================
    // FETCH CURRENT PRICE FROM EXTERNAL API
    // AND SAVE INTO DATABASE
    // =====================================================

    @Transactional
    public MarketPriceResponseDto fetchAndSaveCurrentPrice(
            Long stockId) {

        Stock stock = stockRepository
                .findById(stockId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Stock not found: " + stockId
                        )
                );

        String symbol = stock.getSymbol();

        MarketPrice marketPrice =
                marketDataProviderService
                        .fetchCurrentPrice(symbol);

        marketPrice.setStock(stock);

        MarketPrice savedPrice =
                marketPriceRepository.save(marketPrice);

        return marketDataMapper.toPriceResponse(savedPrice);
    }


    // =====================================================
    // FETCH CURRENT PRICE USING SYMBOL
    // =====================================================

    @Transactional
    public MarketPriceResponseDto fetchAndSaveCurrentPrice(
            String symbol) {

        String normalizedSymbol =
                symbol.trim().toUpperCase();

        Stock stock = stockRepository
                .findBySymbol(normalizedSymbol)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Stock not found: "
                                        + normalizedSymbol
                        )
                );

        MarketPrice marketPrice =
                marketDataProviderService
                        .fetchCurrentPrice(normalizedSymbol);

        marketPrice.setStock(stock);

        MarketPrice savedPrice =
                marketPriceRepository.save(marketPrice);

        return marketDataMapper.toPriceResponse(savedPrice);
    }


    // =====================================================
    // ALL HISTORICAL DATA
    // =====================================================

    public List<MarketCandleResponseDto> getHistoricalData(
            Long stockId) {

        return marketCandleRepository
                .findByStockIdOrderByTimestampAsc(stockId)
                .stream()
                .map(marketDataMapper::toCandleResponse)
                .toList();
    }


    // =====================================================
    // HISTORICAL DATA BY RANGE
    // =====================================================

    public List<MarketCandleResponseDto> getHistoricalData(
            Long stockId,
            LocalDateTime start,
            LocalDateTime end) {

        return marketCandleRepository
                .findByStockIdAndTimestampBetweenOrderByTimestampAsc(
                        stockId,
                        start,
                        end
                )
                .stream()
                .map(marketDataMapper::toCandleResponse)
                .toList();
    }

    // =====================================================
// FETCH AND SAVE HISTORICAL CANDLES
// =====================================================

    @Transactional
    public int fetchAndSaveHistoricalData(
            Long stockId,
            LocalDateTime start,
            LocalDateTime end) {

        Stock stock = stockRepository
                .findById(stockId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Stock not found: " + stockId
                        )
                );

        String symbol = stock.getSymbol();

        List<MarketCandle> candles =
                marketDataProviderService
                        .fetchHistoricalData(
                                symbol,
                                start,
                                end
                        );

        int savedCount = 0;

        for (MarketCandle candle : candles) {

            candle.setStock(stock);

            boolean exists =
                    !marketCandleRepository
                            .findByStockIdAndTimestampBetweenOrderByTimestampAsc(
                                    stockId,
                                    candle.getTimestamp(),
                                    candle.getTimestamp()
                            )
                            .isEmpty();

            if (exists) {
                continue;
            }

            marketCandleRepository.save(candle);
            savedCount++;
        }

        return savedCount;
    }
}