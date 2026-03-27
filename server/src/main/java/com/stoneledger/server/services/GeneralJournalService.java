package com.stoneledger.server.services;


import com.stoneledger.server.api.exeptions.TransactionValidationException;
import com.stoneledger.server.api.models.TransactionModel;
import com.stoneledger.server.api.repositories.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;

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

    public List<TransactionModel> findTransactionsForPage(int pageNumber) {
        Pageable pageable = PageRequest.of(pageNumber - 1, _transactionsPerPage, Sort.by("createdDate").descending());
        return transactionRepository.findAll(pageable).getContent();
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
