package com.stoneledger.server.api.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetainedEarningsStatementContentDTO {
    private BigDecimal retainedEarningsBeginning;
    private BigDecimal retainedEarningsEnding;
    private BigDecimal netIncome;
    private BigDecimal dividends;
}
