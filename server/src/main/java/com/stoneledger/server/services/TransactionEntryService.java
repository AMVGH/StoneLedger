package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.requests.TransactionEntryDTO;
import com.stoneledger.server.api.dtos.responses.TransactionEntryInformationDTO;
import com.stoneledger.server.api.enums.EntryType;
import com.stoneledger.server.api.enums.LoggingEvents;
import com.stoneledger.server.api.enums.LoggingTables;
import com.stoneledger.server.api.exeptions.FinancialAccountException;
import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.api.models.TransactionEntryModel;
import com.stoneledger.server.api.repositories.AccountRepository;
import com.stoneledger.server.api.repositories.TransactionEntryRepository;
import jakarta.transaction.Transactional;
import jdk.jfr.Event;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionEntryService {
    @Autowired
    private TransactionEntryRepository transactionEntryRepository;
    @Autowired
    private EventLoggingService eventLoggingService;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private ErrorMessageService errorMessageService;

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
        // Retrieve the financial account associated with the ID
        AccountModel account = accountRepository.findById(accountId)
            .orElseThrow(() -> new FinancialAccountException(
                errorMessageService.getError(123)
            ));

        return transactionEntryRepository.findByAccountImpactedAndIsApproved(account, true)
            .stream()
            .map(entry -> {
                TransactionEntryInformationDTO response = new TransactionEntryInformationDTO();

                // Inline check to see if the entry is an opening entry or standard entry
                boolean isOpeningEntry = entry.getParentTransaction() == null;

                // If the entry is an opening entry use the account add date, else use the creation date stamped on the parent transaction
                response.setDate(isOpeningEntry
                    ? entry.getAccountImpacted().getAccountAddDate()
                    : entry.getParentTransaction().getCreatedDate());

                // If the entry is an opening entry use IAO description, else use the description associated with the parent transaction
                response.setDescription(isOpeningEntry
                    ? "Initial Account Open"
                    : entry.getParentTransaction().getTransactionDescription());

                // Set the debit and credit by checking the entry type associated with the entry and stamping either 0 or the associated amount
                response.setDebit(entry.getEntryType() == EntryType.DEBIT ? entry.getAmount() : BigDecimal.ZERO);
                response.setCredit(entry.getEntryType() == EntryType.CREDIT ? entry.getAmount() : BigDecimal.ZERO);

                // If the entry is an opening entry there is no journal reference
                response.setJournalReference(isOpeningEntry
                    ? null
                    // TODO: Add pagination from Transaction Service
                    : entry.getParentTransaction().getId().toString()
                );
                return response;
            }).collect(Collectors.toList());
    }
}
