package com.stoneledger.server.services;


import com.stoneledger.server.api.dtos.requests.TransactionEntryDTO;
import com.stoneledger.server.api.dtos.responses.TransactionInformationDTO;
import com.stoneledger.server.api.exeptions.TransactionValidationException;
import com.stoneledger.server.api.models.TransactionModel;
import com.stoneledger.server.api.repositories.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GeneralJournalService {
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private ErrorMessageService errorMessageService;

    private static final int _transactionsPerPage = 10;

    public int calculateTotalJournalPages() {
        long totalTransactions = transactionRepository.count();
        return (int) Math.ceil((double) totalTransactions / _transactionsPerPage);
    }

    public List<TransactionInformationDTO> findTransactionsForPage(int pageNumber) {
        Pageable pageable = PageRequest.of(
            pageNumber - 1,
            _transactionsPerPage,
            Sort.by("createdDate").ascending()
        );

        List<TransactionModel> transactions = transactionRepository.findAll(pageable).getContent();

        return transactions.stream()
            .map(txn -> {
                TransactionInformationDTO dto = new TransactionInformationDTO();
                dto.setId(txn.getId());
                dto.setTransactionType(txn.getTransactionType());
                dto.setTransactionDescription(txn.getTransactionDescription());
                dto.setAttachment(txn.getAttachment());
                dto.setAttachmentName(txn.getAttachmentName());
                dto.setCreatedBy(txn.getCreatedBy() != null ? txn.getCreatedBy().getId() : null);
                dto.setCreatedDate(txn.getCreatedDate());
                dto.setTransactionStatus(txn.getTransactionStatus());
                dto.setApprovedBy(txn.getUpdatedBy() != null ? txn.getUpdatedBy().getId() : null);
                dto.setApprovedDate(txn.getUpdateDate());
                dto.setApprovalComment(txn.getUpdateComment());

                List<TransactionEntryDTO> entryDTOs = txn.getAccountsImpacted() == null
                    ? List.of()
                    : txn.getAccountsImpacted().stream()
                    .map(entry -> {
                        TransactionEntryDTO entryDTO = new TransactionEntryDTO();
                        entryDTO.setAccountId(entry.getAccountImpacted() != null ? entry.getAccountImpacted().getId() : null);
                        entryDTO.setEntryType(entry.getEntryType());
                        entryDTO.setAmount(entry.getAmount());
                        return entryDTO;
                    })
                    .collect(Collectors.toList());

                dto.setAccountsImpacted(entryDTOs);
                return dto;
            })
            .collect(Collectors.toList());
    }

    public int calculateTransactionPage(Long transactionId) {
        transactionRepository.findById(transactionId)
            .orElseThrow(() -> new TransactionValidationException(
                errorMessageService.getError(132)
            ));

        List<TransactionModel> allTransactions = transactionRepository
            .findAll(Sort.by("createdDate").descending());

        int index = 0;
        for (TransactionModel transaction : allTransactions) {
            if (transaction.getId().equals(transactionId)) {
                return (int) Math.ceil((double) (index + 1) / _transactionsPerPage);
            }
            index++;
        }

        throw new TransactionValidationException(errorMessageService.getError(132));
    }
}
