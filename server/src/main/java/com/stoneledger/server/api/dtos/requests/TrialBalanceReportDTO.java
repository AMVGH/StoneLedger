package com.stoneledger.server.api.dtos.requests;

import com.stoneledger.server.api.enums.ReportType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TrialBalanceReportDTO {
    private ReportType reportType;
    private LocalDateTime periodEnd;
}
