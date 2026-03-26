package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.requests.TransactionCreationDTO;
import com.stoneledger.server.services.TransactionService;
import com.stoneledger.server.utils.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    @Autowired
    private ValidationUtil validationUtil;
    @Autowired
    private TransactionService transactionService;

    @PostMapping(value = "/create-journal-transaction", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponseDTO<?>> createNewTransaction (@RequestPart("transaction") TransactionCreationDTO request,
                                                                   @RequestPart(value = "attachment", required = false) MultipartFile file) throws IOException {
        validationUtil.isValidTransactionCreationRequest(request);
        transactionService.createJournalTransaction(request, file);
        return ResponseEntity.ok(ApiResponseDTO.success(true));
    }



}
