package com.advik.PortfolioPro.analysis.fundamental.service;

import com.advik.PortfolioPro.analysis.fundamental.dto.FundamentalResponseDto;
import com.advik.PortfolioPro.analysis.fundamental.entity.Fundamental;
import com.advik.PortfolioPro.analysis.fundamental.mapper.FundamentalMapper;
import com.advik.PortfolioPro.analysis.fundamental.repository.FundamentalRepository;
import com.advik.PortfolioPro.globalexception.FundamentalAnalysisNotFound;

import org.springframework.stereotype.Service;

@Service
public class FundamentalService {

    private final FundamentalRepository fundamentalRepository;
    private final FundamentalMapper fundamentalMapper;

    public FundamentalService(
            FundamentalRepository fundamentalRepository,
            FundamentalMapper fundamentalMapper) {

        this.fundamentalRepository = fundamentalRepository;
        this.fundamentalMapper = fundamentalMapper;
    }

    public FundamentalResponseDto getFundamentalByStockId(Long stockId) {

        Fundamental fundamental = fundamentalRepository
                .findByStockId(stockId)
                .orElseThrow(() ->
                        new FundamentalAnalysisNotFound(
                                "Fundamental analysis not found for stock: "
                                        + stockId
                        )
                );

        return fundamentalMapper.toResponse(fundamental);
    }
}