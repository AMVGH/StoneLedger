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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    @Autowired
    private ValidationUtil validationUtil;
    @Autowired
    private ReportService reportService;

    @GetMapping("/issue-post-closing-warning")
    public ResponseEntity<ApiResponseDTO<?>> issuePostClosingWarning() {
        PostClosingWarningDTO postClosingWarning = reportService.issuePostClosingWarning();
        return ResponseEntity.ok(ApiResponseDTO.success(postClosingWarning));
    }

    @PostMapping("/gather-trial-balance-content")
    public ResponseEntity<ApiResponseDTO<?>> gatherTrialBalanceContent(@RequestBody TrialBalanceReportDTO request) {
        validationUtil.isValidTrialBalanceGenerationRequest(request);
        TrialBalanceContentDTO trialBalanceContent = reportService.gatherTrialBalanceReportContent(request);
        return ResponseEntity.ok(ApiResponseDTO.success(trialBalanceContent));
    }


    @PostMapping("/gather-income-statement-content")
    public ResponseEntity<ApiResponseDTO<?>> gatherIncomeStatementContent(@RequestBody IncomeStatementReportDTO request) {
        validationUtil.isValidIncomeStatementGenerationRequest(request);
        IncomeStatementContentDTO incomeStatementContent = reportService.gatherIncomeStatementReportContent(request);
        return ResponseEntity.ok(ApiResponseDTO.success(incomeStatementContent));
    }

    // AV - Works
    @PostMapping("/gather-balance-sheet-content")
    public ResponseEntity<ApiResponseDTO<?>> gatherBalanceSheetContent(@RequestBody BalanceSheetReportDTO request) {
        validationUtil.isValidBalanceSheetGenerationRequest(request);
        BalanceSheetContentDTO balanceSheetContent = reportService.gatherBalanceSheetReportContent(request);
        return ResponseEntity.ok(ApiResponseDTO.success(balanceSheetContent));
    }

    // TODO: Retest once closing entries are validated. All financial data from these reports are correct excluding Retained and Dividends
    @PostMapping("/gather-retained-earnings-content")
    public ResponseEntity<ApiResponseDTO<?>> gatherRetainedEarningsContent(@RequestBody RetainedEarningsStatementReportDTO request) {
        validationUtil.isValidRetainedEarningsStatementGenerationRequest(request);
        RetainedEarningsStatementContentDTO retainedEarningsContent = reportService.gatherRetainedEarningsReportContent(request);
        return ResponseEntity.ok(ApiResponseDTO.success(retainedEarningsContent));
    }
}
