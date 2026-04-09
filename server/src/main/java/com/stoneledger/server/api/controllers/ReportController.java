package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    // TODO: Implement all endpoints for building reports (Trial Balance, Income Statement, Balance Sheet, Retained Earnings Statement)
    @GetMapping("/gather-trial-balance-content")
    public ResponseEntity<ApiResponseDTO<?>> gatherTrialBalanceContent() {
        // Will need a DTO for a statement type (adjusted, unadjusted, etc.), date or date range.
        return null;
    }

    @GetMapping("/gather-income-statement-content")
    public ResponseEntity<ApiResponseDTO<?>> gatherIncomeStatementContent() {
        // Will need a DTO for a statement type (adjusted, unadjusted, etc.), date or date range.
        return null;
    }

    @GetMapping("/gather-balance-sheet-content")
    public ResponseEntity<ApiResponseDTO<?>> gatherBalanceSheetContent() {
        // Will need a DTO for a statement type (adjusted, unadjusted, etc.), date or date range.
        return null;
    }

    @GetMapping("/gather-retained-earnings-content")
    public ResponseEntity<ApiResponseDTO<?>> gatherRetainedEarningsContent() {
        // Will need a DTO for a statement type (adjusted, unadjusted, etc.), date or date range.
        return null;
    }
}
