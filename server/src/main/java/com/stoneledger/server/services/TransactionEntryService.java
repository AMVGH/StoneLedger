package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.requests.TransactionEntryDTO;
import com.stoneledger.server.api.dtos.responses.TransactionEntryInformationDTO;
import com.stoneledger.server.api.dtos.responses.TransactionInformationDTO;
import com.stoneledger.server.api.enums.EntryType;
import com.stoneledger.server.api.enums.LoggingEvents;
import com.stoneledger.server.api.enums.LoggingTables;
import com.stoneledger.server.api.exeptions.FinancialAccountException;
import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.api.models.TransactionEntryModel;
import com.stoneledger.server.api.models.TransactionModel;
import com.stoneledger.server.api.repositories.AccountRepository;
import com.stoneledger.server.api.repositories.TransactionEntryRepository;
import com.stoneledger.server.api.repositories.TransactionRepository;
import jakarta.transaction.Transaction;
import jakarta.transaction.Transactional;
import jdk.jfr.Event;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Service
public class TransactionEntryService {
    @Autowired
    private TransactionEntryRepository transactionEntryRepository;
    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private TransactionService transactionService;
    @Autowired
    private EventLoggingService eventLoggingService;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private ErrorMessageService errorMessageService;

    private static final int _transactionsPerPage = 10;


    // A.V - As of right now I'm managing entries on their corresponding outer transaction since there are many ways to manipulate this data.
    // This might get ripped out in the future, and we just manage entries along with the corresponding transaction.
    @Transactional
    public void saveInnerTransactionEntries(Long userId, List<TransactionEntryModel> transactionInnerEntries) {
        transactionEntryRepository.saveAll(transactionInnerEntries);

        eventLoggingService.logEvent(
            userId,
            LoggingTables.TRANSACTION_ENTRIES,
            LoggingEvents.CREATE,
            null,
            transactionInnerEntries
        );
    }

    public List<TransactionEntryInformationDTO> getPostedEntriesByAccountId(Long accountId) {
        AccountModel account = accountRepository.findById(accountId)
            .orElseThrow(() -> new FinancialAccountException(
                errorMessageService.getError(123)
            ));

        // Build page lookup map once — one DB call instead of one per entry
        List<TransactionModel> allTransactions = transactionRepository
            .findAll(Sort.by("createdDate").descending());

        Map<Long, Integer> transactionPageMap = new HashMap<>();
        for (int i = 0; i < allTransactions.size(); i++) {
            int page = (int) Math.ceil((double) (i + 1) / _transactionsPerPage);
            transactionPageMap.put(allTransactions.get(i).getId(), page);
        }

        return transactionEntryRepository.findByAccountImpactedAndIsApproved(account, true)
            .stream()
            .map(entry -> {
                TransactionEntryInformationDTO response = new TransactionEntryInformationDTO();

                boolean isOpeningEntry = entry.getParentTransaction() == null;

                response.setId(entry.getId());

                response.setDate(isOpeningEntry
                    ? entry.getAccountImpacted().getAccountAddDate()
                    : entry.getParentTransaction().getCreatedDate());

                response.setDescription(isOpeningEntry
                    ? "Initial Account Open"
                    : entry.getParentTransaction().getTransactionDescription());

                response.setDebit(entry.getEntryType() == EntryType.DEBIT ? entry.getAmount() : BigDecimal.ZERO);
                response.setCredit(entry.getEntryType() == EntryType.CREDIT ? entry.getAmount() : BigDecimal.ZERO);

                response.setJournalReference(isOpeningEntry
                        ? null
                        : String.valueOf(
                        transactionPageMap.getOrDefault(
                            entry.getParentTransaction().getId(), 1
                        )
                    )
                );

                return response;
            }).collect(Collectors.toList());
    }

    public TransactionInformationDTO getParentTransactionOfEntry(TransactionEntryModel transactionEntry) {
        TransactionModel parentTransaction = transactionEntry.getParentTransaction();

        TransactionInformationDTO parentTransactionInformation = new TransactionInformationDTO();
        parentTransactionInformation.setId(parentTransaction.getId());
        parentTransactionInformation.setTransactionType(parentTransaction.getTransactionType());
        parentTransactionInformation.setTransactionDescription(parentTransaction.getTransactionDescription());
        parentTransactionInformation.setAttachment(parentTransaction.getAttachment());
        parentTransactionInformation.setAttachmentName(parentTransaction.getAttachmentName());
        parentTransactionInformation.setCreatedBy(parentTransaction.getCreatedBy() != null ? parentTransaction.getCreatedBy().getId() : null);
        parentTransactionInformation.setCreatedDate(parentTransaction.getCreatedDate());
        parentTransactionInformation.setTransactionStatus(parentTransaction.getTransactionStatus());
        parentTransactionInformation.setApprovedBy(parentTransaction.getUpdatedBy() != null ? parentTransaction.getUpdatedBy().getId() : null);
        parentTransactionInformation.setApprovedDate(parentTransaction.getUpdateDate());
        parentTransactionInformation.setApprovalComment(parentTransaction.getUpdateComment());

        List<TransactionEntryDTO> entryDTOs = parentTransaction.getAccountsImpacted() == null ? List.of()
            : parentTransaction.getAccountsImpacted().stream()
            .map(entry -> {
                TransactionEntryDTO entryDTO = new TransactionEntryDTO();
                entryDTO.setAccountId(entry.getAccountImpacted() != null ? entry.getAccountImpacted().getId() : null);
                entryDTO.setEntryType(entry.getEntryType());
                entryDTO.setAmount(entry.getAmount());
                return entryDTO;
            })
            .collect(Collectors.toList());

        parentTransactionInformation.setAccountsImpacted(entryDTOs);
        return parentTransactionInformation;
    }
}
