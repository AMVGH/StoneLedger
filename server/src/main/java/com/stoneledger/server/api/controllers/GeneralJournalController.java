package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.responses.TransactionInformationDTO;
import com.stoneledger.server.api.models.TransactionModel;
import com.stoneledger.server.api.repositories.TransactionRepository;
import com.stoneledger.server.services.ErrorMessageService;
import com.stoneledger.server.services.GeneralJournalService;
import com.stoneledger.server.utils.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/general-journal")
public class GeneralJournalController {
    // TODO: Three tiers of pagination, total pages, transactions for page X, find page for transaction X
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private GeneralJournalService generalJournalService;
    @Autowired
    private ValidationUtil validationUtil;
    @Autowired
    private ErrorMessageService errorMessageService;

    @GetMapping("/get-total-pages")
    public ResponseEntity<ApiResponseDTO<?>> getTotalJournalPages() {
        return ResponseEntity.ok(ApiResponseDTO.success(generalJournalService.calculateTotalJournalPages()));
    }

    @GetMapping("/get-transactions-for-page/{pageNumber}")
    public ResponseEntity<ApiResponseDTO<?>> getTransactionsForPage(@PathVariable int pageNumber) {
        int totalJournalPages = generalJournalService.calculateTotalJournalPages();
        validationUtil.isValidPageNumber(pageNumber, totalJournalPages);
        List<TransactionInformationDTO> pageTransactions = generalJournalService.findTransactionsForPage(pageNumber);
        return ResponseEntity.ok(ApiResponseDTO.success(pageTransactions));
    }

    @GetMapping("/get-page-reference/{transactionId}")
    public ResponseEntity<ApiResponseDTO<?>> getTransactionPage(@PathVariable Long transactionId) {
        int pageReference = generalJournalService.calculateTransactionPage(transactionId);
        return ResponseEntity.ok(ApiResponseDTO.success(pageReference));
    }

    @GetMapping("/get-attachment/transaction/{transactionId}")
    public ResponseEntity<byte[]> getAttachment(@PathVariable Long transactionId) {
        TransactionModel transaction = validationUtil.isValidTransactionId(transactionId);
        byte[] transactionAttachment = generalJournalService.retrieveTransactionAttachment(transaction);

        MediaType mediaType = MediaTypeFactory
            .getMediaType(transaction.getAttachmentName())
            .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok()
            .contentType(mediaType)
            .body(transactionAttachment);
    }
}
