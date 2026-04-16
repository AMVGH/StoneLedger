package com.stoneledger.server.api.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrialBalanceContentDTO {
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private List<TrialBalanceEntryDTO> trialBalanceEntries;
}
