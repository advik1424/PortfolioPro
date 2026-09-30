package com.advik.PortfolioPro.marketdata.service.provide;

import com.advik.PortfolioPro.marketdata.dto.LiveMarketQuoteDto;
import com.advik.PortfolioPro.marketdata.entity.MarketCandle;
import com.advik.PortfolioPro.marketdata.entity.MarketPrice;
import com.advik.PortfolioPro.marketdata.service.MarketDataProviderService;

import com.fasterxml.jackson.annotation.JsonProperty;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExternalMarketDataProvider
        implements MarketDataProviderService {

    private final RestClient restClient;
    private final String apiKey;

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public ExternalMarketDataProvider(
            RestClient.Builder restClientBuilder,
            @Value("${twelvedata.api.key}") String apiKey,
            @Value("${twelvedata.base-url}") String baseUrl) {

        this.apiKey = apiKey;

        this.restClient = restClientBuilder
                .baseUrl(baseUrl)
                .build();
    }


    // =====================================================
    // CURRENT PRICE
    // =====================================================

    @Override
    public MarketPrice fetchCurrentPrice(String symbol) {

        String normalizedSymbol =
                symbol.trim().toUpperCase();

        try {

            PriceResponse response =
                    restClient
                            .get()
                            .uri(uriBuilder ->
                                    uriBuilder
                                            .path("/price")
                                            .queryParam(
                                                    "symbol",
                                                    normalizedSymbol + ":NSE"
                                            )
                                            .queryParam(
                                                    "apikey",
                                                    apiKey
                                            )
                                            .build()
                            )
                            .retrieve()
                            .body(PriceResponse.class);

            if (response == null ||
                    response.price() == null ||
                    response.price().isBlank()) {

                throw new RuntimeException(
                        "Unable to fetch market price for: "
                                + normalizedSymbol
                );
            }

            MarketPrice marketPrice =
                    new MarketPrice();

            marketPrice.setPrice(
                    new BigDecimal(response.price())
            );

            marketPrice.setTimestamp(
                    LocalDateTime.now()
            );

            marketPrice.setSource(
                    "TWELVE_DATA"
            );

            return marketPrice;

        } catch (RestClientResponseException exception) {

            throw createProviderException(
                    normalizedSymbol,
                    exception
            );
        }
    }


    // =====================================================
    // LIVE MARKET QUOTE
    // =====================================================

    @Override
    public LiveMarketQuoteDto fetchLiveQuote(String symbol) {

        String normalizedSymbol =
                symbol.trim().toUpperCase();

        try {

            QuoteResponse response =
                    restClient
                            .get()
                            .uri(uriBuilder ->
                                    uriBuilder
                                            .path("/quote")
                                            .queryParam(
                                                    "symbol",
                                                    normalizedSymbol + ":NSE"
                                            )
                                            .queryParam(
                                                    "apikey",
                                                    apiKey
                                            )
                                            .build()
                            )
                            .retrieve()
                            .body(QuoteResponse.class);

            if (response == null ||
                    response.close() == null ||
                    response.close().isBlank()) {

                throw new RuntimeException(
                        "Unable to fetch live quote for: "
                                + normalizedSymbol
                );
            }

            return new LiveMarketQuoteDto(

                    null,

                    normalizedSymbol,

                    toBigDecimal(response.close()),

                    toBigDecimal(response.change()),

                    toBigDecimal(response.percentChange()),

                    toBigDecimal(response.open()),

                    toBigDecimal(response.high()),

                    toBigDecimal(response.low()),

                    toBigDecimal(response.previousClose()),

                    toBigDecimal(response.volume()),

                    parseQuoteDateTime(response.datetime()),

                    "TWELVE_DATA"
            );

        } catch (RestClientResponseException exception) {

            throw createProviderException(
                    normalizedSymbol,
                    exception
            );
        }
    }


    // =====================================================
    // HISTORICAL DATA
    // =====================================================

    @Override
    public List<MarketCandle> fetchHistoricalData(
            String symbol,
            LocalDateTime start,
            LocalDateTime end) {

        String normalizedSymbol =
                symbol.trim().toUpperCase();

        try {

            TimeSeriesResponse response =
                    restClient
                            .get()
                            .uri(uriBuilder ->
                                    uriBuilder
                                            .path("/time_series")

                                            .queryParam(
                                                    "symbol",
                                                    normalizedSymbol + ":NSE"
                                            )

                                            .queryParam(
                                                    "interval",
                                                    "1day"
                                            )

                                            .queryParam(
                                                    "start_date",
                                                    start.format(
                                                            DATE_TIME_FORMATTER
                                                    )
                                            )

                                            .queryParam(
                                                    "end_date",
                                                    end.format(
                                                            DATE_TIME_FORMATTER
                                                    )
                                            )

                                            .queryParam(
                                                    "apikey",
                                                    apiKey
                                            )

                                            .build()
                            )
                            .retrieve()
                            .body(TimeSeriesResponse.class);

            if (response == null ||
                    response.values() == null) {

                throw new RuntimeException(
                        "Unable to fetch historical data for: "
                                + normalizedSymbol
                );
            }

            return response.values()
                    .stream()
                    .map(this::mapToMarketCandle)
                    .toList();

        } catch (RestClientResponseException exception) {

            throw createProviderException(
                    normalizedSymbol,
                    exception
            );
        }
    }


    // =====================================================
    // FETCH STOCK MASTER DATA
    // =====================================================

    @Override
    public List<MarketDataProviderService.ExternalStockDto>
    fetchStocks() {

        try {

            StocksResponse response =
                    restClient
                            .get()
                            .uri(uriBuilder ->
                                    uriBuilder
                                            .path("/stocks")

                                            .queryParam(
                                                    "exchange",
                                                    "NSE"
                                            )

                                            .queryParam(
                                                    "type",
                                                    "Common Stock"
                                            )

                                            .queryParam(
                                                    "show_plan",
                                                    true
                                            )

                                            .queryParam(
                                                    "apikey",
                                                    apiKey
                                            )

                                            .build()
                            )
                            .retrieve()
                            .body(StocksResponse.class);

            if (response == null ||
                    response.data() == null) {

                throw new RuntimeException(
                        "Unable to fetch stocks from Twelve Data"
                );
            }

            return response.data()
                    .stream()
                    .map(stock ->
                            new MarketDataProviderService.ExternalStockDto(

                                    stock.symbol(),

                                    stock.name(),

                                    stock.exchange(),

                                    stock.country(),

                                    stock.type(),

                                    stock.access() != null
                                            ? stock.access().global()
                                            : null,

                                    stock.access() != null
                                            ? stock.access().plan()
                                            : null,

                                    stock.access() != null
                                            ? stock.access().planBusiness()
                                            : null
                            )
                    )
                    .toList();

        } catch (RestClientResponseException exception) {

            throw new RuntimeException(
                    "Unable to fetch stock list from Twelve Data: "
                            + extractProviderMessage(exception)
            );
        }
    }


    // =====================================================
    // MAP API CANDLE → MARKET CANDLE
    // =====================================================

    private MarketCandle mapToMarketCandle(
            CandleResponse candle) {

        MarketCandle marketCandle =
                new MarketCandle();

        marketCandle.setOpen(
                new BigDecimal(candle.open())
        );

        marketCandle.setHigh(
                new BigDecimal(candle.high())
        );

        marketCandle.setLow(
                new BigDecimal(candle.low())
        );

        marketCandle.setClose(
                new BigDecimal(candle.close())
        );

        marketCandle.setVolume(
                new BigDecimal(candle.volume())
        );

        marketCandle.setTimestamp(
                parseDateTime(candle.datetime())
        );

        return marketCandle;
    }


    // =====================================================
    // STRING → BIG DECIMAL
    // =====================================================

    private BigDecimal toBigDecimal(String value) {

        if (value == null ||
                value.isBlank()) {

            return null;
        }

        return new BigDecimal(value);
    }


    // =====================================================
    // PARSE HISTORICAL DATE/TIME
    // =====================================================

    private LocalDateTime parseDateTime(
            String datetime) {

        try {

            return LocalDateTime.parse(
                    datetime,
                    DATE_TIME_FORMATTER
            );

        } catch (Exception exception) {

            return LocalDateTime.parse(datetime);
        }
    }


    // =====================================================
    // PARSE QUOTE DATE/TIME
    // =====================================================

    private LocalDateTime parseQuoteDateTime(
            String datetime) {

        if (datetime == null ||
                datetime.isBlank()) {

            return LocalDateTime.now();
        }

        try {

            return LocalDateTime.parse(
                    datetime,
                    DATE_TIME_FORMATTER
            );

        } catch (Exception exception) {

            try {

                return LocalDateTime.parse(datetime);

            } catch (Exception ignored) {

                return LocalDateTime.now();
            }
        }
    }


    // =====================================================
    // PROVIDER ERROR
    // =====================================================

    private RuntimeException createProviderException(
            String symbol,
            RestClientResponseException exception) {

        String providerMessage =
                extractProviderMessage(exception);

        String lowerCaseMessage =
                providerMessage.toLowerCase();

        if (lowerCaseMessage.contains("grow") ||
                lowerCaseMessage.contains("venture") ||
                lowerCaseMessage.contains("plan")) {

            return new RuntimeException(
                    "Market data for "
                            + symbol
                            + " is not available on your current "
                            + "Twelve Data plan. "
                            + providerMessage
            );
        }

        return new RuntimeException(
                "Twelve Data error for "
                        + symbol
                        + ": "
                        + providerMessage
        );
    }


    // =====================================================
    // EXTRACT TWELVE DATA ERROR MESSAGE
    // =====================================================

    private String extractProviderMessage(
            RestClientResponseException exception) {

        String responseBody =
                exception.getResponseBodyAsString();

        if (responseBody == null ||
                responseBody.isBlank()) {

            return exception.getStatusText();
        }

        return responseBody;
    }


    // =====================================================
    // PRICE RESPONSE
    // =====================================================

    private record PriceResponse(
            String price
    ) {
    }


    // =====================================================
    // LIVE QUOTE RESPONSE
    // =====================================================

    private record QuoteResponse(

            String symbol,

            String name,

            String exchange,

            String currency,

            String datetime,

            Long timestamp,

            String open,

            String high,

            String low,

            String close,

            String volume,

            @JsonProperty("previous_close")
            String previousClose,

            String change,

            @JsonProperty("percent_change")
            String percentChange

    ) {
    }


    // =====================================================
    // TIME SERIES RESPONSE
    // =====================================================

    private record TimeSeriesResponse(
            List<CandleResponse> values
    ) {
    }


    // =====================================================
    // CANDLE RESPONSE
    // =====================================================

    private record CandleResponse(

            String datetime,

            String open,

            String high,

            String low,

            String close,

            String volume

    ) {
    }


    // =====================================================
    // STOCKS RESPONSE
    // =====================================================

    private record StocksResponse(

            Integer count,

            List<StockResponse> data,

            String status

    ) {
    }


    // =====================================================
    // STOCK RESPONSE
    // =====================================================

    private record StockResponse(

            String symbol,

            String name,

            String currency,

            String exchange,

            String mic_code,

            String country,

            String type,

            AccessResponse access

    ) {
    }


    // =====================================================
    // STOCK ACCESS RESPONSE
    // =====================================================

    private record AccessResponse(

            String global,

            String plan,

            @JsonProperty("plan_business")
            String planBusiness

    ) {
    }
}