package com.stoneledger.server.api.dtos.requests;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BalanceSheetReportDTO {
    private LocalDateTime periodEnd;
}
