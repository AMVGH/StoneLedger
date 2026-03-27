package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.responses.TransactionEntryInformationDTO;
import com.stoneledger.server.services.TransactionEntryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/transaction-entries")
public class TransactionEntryController {
    @Autowired
    private TransactionEntryService transactionEntryService;
    @GetMapping("/get-approved-transaction-entries/{accountId}")
    public ResponseEntity<ApiResponseDTO<?>> getApprovedTransactionEntriesForLedger(@PathVariable Long accountId) {
        List<TransactionEntryInformationDTO> postedAccountEntries = transactionEntryService.getPostedEntriesByAccountId(accountId);
        return ResponseEntity.ok(ApiResponseDTO.success(postedAccountEntries));
    }
}
