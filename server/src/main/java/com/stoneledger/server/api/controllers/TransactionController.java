package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.requests.TransactionCreationDTO;
import com.stoneledger.server.api.dtos.requests.TransactionStatusUpdateDTO;
import com.stoneledger.server.api.dtos.responses.TransactionInformationDTO;
import com.stoneledger.server.api.dtos.responses.TransactionPendingEntryDTO;
import com.stoneledger.server.services.TransactionService;
import com.stoneledger.server.utils.ValidationUtil;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    @Autowired
    private ValidationUtil validationUtil;
    @Autowired
    private TransactionService transactionService;

    // TODO: Implement: 1) Status Updating 2) Entry Pagination 3) Interior Entry Collection 4) End to End Testing

    @PostMapping(value = "/create-journal-transaction", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponseDTO<?>> createNewTransaction (@RequestPart("transaction") TransactionCreationDTO request,
                                                                   @RequestPart(value = "attachment", required = false) MultipartFile file)
                                                                    throws IOException, MessagingException {
        validationUtil.isValidTransactionCreationRequest(request);
        boolean transactionWriteSuccess = transactionService.createJournalTransaction(request, file);
        return ResponseEntity.ok(ApiResponseDTO.success(transactionWriteSuccess));
    }

    @PostMapping("/update-transaction-status")
    public ResponseEntity<ApiResponseDTO<?>> updateTransactionStatus(@RequestBody TransactionStatusUpdateDTO request) {
        //validationUtil.isValidTransactionStatusUpdateRequest(request);
        return ResponseEntity.ok(ApiResponseDTO.success(true));
    }

    @GetMapping("/get-pending-entries")
    public ResponseEntity<ApiResponseDTO<?>> updateTransactionStatus() {
        List<TransactionPendingEntryDTO> pendingTransactionEntries = transactionService.getPendingTransactionEntries();
        return ResponseEntity.ok(ApiResponseDTO.success(pendingTransactionEntries));
    }


}
