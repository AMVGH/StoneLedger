package com.stoneledger.server.api.dtos.requests;

import lombok.Data;

import java.time.LocalDateTime;
import java.time.YearMonth;

@Data
public class RetainedEarningsStatementReportDTO {
    private String retainedEarningsTargetAccount;
    private YearMonth period;
}
