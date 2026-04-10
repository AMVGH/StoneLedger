package com.stoneledger.server.api.dtos.responses;

import com.stoneledger.server.api.enums.BalanceLean;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrialBalanceEntryDTO {
    private String financialAccountName;
    private BalanceLean balanceLean;
    private BigDecimal amount;
}
