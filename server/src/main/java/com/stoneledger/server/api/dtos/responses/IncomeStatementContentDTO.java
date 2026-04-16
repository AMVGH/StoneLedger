package com.stoneledger.server.api.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.antlr.v4.runtime.misc.Pair;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncomeStatementContentDTO {
    private List<Pair<String,BigDecimal>> revenueList;
    private BigDecimal totalRevenues;
    private List<Pair<String,BigDecimal>> expenseList;
    private BigDecimal totalExpenses;
    private BigDecimal netIncome;
}
