package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.requests.BalanceSheetReportDTO;
import com.stoneledger.server.api.dtos.requests.IncomeStatementReportDTO;
import com.stoneledger.server.api.dtos.requests.RetainedEarningsStatementReportDTO;
import com.stoneledger.server.api.dtos.requests.TrialBalanceReportDTO;
import com.stoneledger.server.api.dtos.responses.*;
import com.stoneledger.server.services.ReportService;
import com.stoneledger.server.utils.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    @Autowired
    private ValidationUtil validationUtil;
    @Autowired
    private ReportService reportService;
    // TODO: Implement all endpoints for building reports (Trial Balance, Income Statement, Balance Sheet, Retained Earnings Statement)
    @GetMapping("/gather-trial-balance-content")
    public ResponseEntity<ApiResponseDTO<?>> gatherTrialBalanceContent(@RequestBody TrialBalanceReportDTO request) {
        validationUtil.isValidTrialBalanceGenerationRequest(request);
        TrialBalanceContentDTO trialBalanceContent = reportService.gatherTrialBalanceReportContent(request);
        return ResponseEntity.ok(ApiResponseDTO.success(trialBalanceContent));
    }

    @GetMapping("/gather-income-statement-content")
    public ResponseEntity<ApiResponseDTO<?>> gatherIncomeStatementContent(@RequestBody IncomeStatementReportDTO request) {
        validationUtil.isValidIncomeStatementGenerationRequest(request);
        IncomeStatementContentDTO incomeStatementContent = reportService.gatherIncomeStatementReportContent(request);
        return ResponseEntity.ok(ApiResponseDTO.success(incomeStatementContent));
    }

    @GetMapping("/gather-balance-sheet-content")
    public ResponseEntity<ApiResponseDTO<?>> gatherBalanceSheetContent(@RequestBody BalanceSheetReportDTO request) {
        validationUtil.isValidBalanceSheetGenerationRequest(request);
        BalanceSheetContentDTO balanceSheetContent = reportService.gatherBalanceSheetReportContent(request);
        return ResponseEntity.ok(ApiResponseDTO.success(balanceSheetContent));
    }

    // TODO: Retest once closing entries are validated. All financial data from these reports are correct excluding Retained and Dividends
    @GetMapping("/gather-retained-earnings-content")
    public ResponseEntity<ApiResponseDTO<?>> gatherRetainedEarningsContent(@RequestBody RetainedEarningsStatementReportDTO request) {
        validationUtil.isValidRetainedEarningsStatementGenerationRequest(request);
        RetainedEarningsStatementContentDTO retainedEarningsContent = reportService.gatherRetainedEarningsReportContent(request);
        return ResponseEntity.ok(ApiResponseDTO.success(retainedEarningsContent));
    }
}
