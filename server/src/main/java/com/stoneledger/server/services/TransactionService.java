package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.requests.TransactionCreationDTO;
import com.stoneledger.server.api.dtos.responses.AccountInformationDTO;
import com.stoneledger.server.api.dtos.responses.AccountSummaryDTO;
import com.stoneledger.server.api.dtos.responses.TransactionInformationDTO;
import com.stoneledger.server.api.dtos.responses.TransactionPendingEntryDTO;
import com.stoneledger.server.api.enums.LoggingEvents;
import com.stoneledger.server.api.enums.LoggingTables;
import com.stoneledger.server.api.enums.TransactionStatus;
import com.stoneledger.server.api.exeptions.InvalidIdException;
import com.stoneledger.server.api.exeptions.TransactionValidationException;
import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.api.models.TransactionEntryModel;
import com.stoneledger.server.api.models.TransactionModel;
import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.api.repositories.AccountRepository;
import com.stoneledger.server.api.repositories.TransactionRepository;
import com.stoneledger.server.api.repositories.UserRepository;
import com.stoneledger.server.utils.MonetaryUtil;
import jakarta.mail.MessagingException;
import jakarta.transaction.Transactional;
import org.hibernate.annotations.NaturalId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {
    @Autowired
    private MonetaryUtil monetaryUtil;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private TransactionEntryService transactionEntryService;
    @Autowired
    private EventLoggingService eventLoggingService;
    @Autowired
    private ErrorMessageService errorMessageService;
    @Autowired
    private EmailService emailService;

    public List<TransactionPendingEntryDTO> getPendingTransactionEntries() {
        return transactionRepository.findByTransactionStatus(TransactionStatus.PENDING)
            .stream()
            .map(pendingEntry -> {
                List<AccountSummaryDTO> accounts = pendingEntry.getAccountsImpacted()
                    .stream()
                    .map(entry -> new AccountSummaryDTO(
                        entry.getAccountImpacted().getAccountName(),
                        entry.getAccountImpacted().getAccountNumber()
                    ))
                    .toList();

                return new TransactionPendingEntryDTO(
                    pendingEntry.getId(),
                    pendingEntry.getCreatedDate(),
                    accounts
                );
            })
            .toList();
    }

    // TODO: (Test) Transactional Logging, Business Logic on values, entry service to record each individual entry
    @Transactional
    public boolean createJournalTransaction(TransactionCreationDTO request, MultipartFile file) throws IOException, MessagingException {
        TransactionModel transaction = new TransactionModel();
        LocalDateTime transactionDate = LocalDateTime.now();

        // Ensures total DEBIT == total CREDIT
        monetaryUtil.validateIncomingTransaction(request.getAccountsImpacted());

        // Attach a file to the transaction if provided
        if (file != null && !file.isEmpty()) {
            transaction.setAttachment(file.getBytes());
            transaction.setAttachmentName(file.getOriginalFilename());
        }

        // Retrieves the transaction owner
        UserModel createdBy = userRepository
                .findById(request.getCreatedBy())
                .orElseThrow(() -> new InvalidIdException(
                        errorMessageService.getError(123)
                ));

        // Builds the transaction using content in the request
        transaction.setTransactionType(request.getTransactionType());
        transaction.setTransactionDescription(request.getTransactionDescription());
        transaction.setCreatedBy(createdBy);
        transaction.setCreatedDate(transactionDate);

        // All new transactions maintain default PENDING status
        transaction.setTransactionStatus(TransactionStatus.PENDING);

        // Maps the accounts impacted entries to a List of the TransactionEntryModels used in the DB
        List<TransactionEntryModel> entries = request.getAccountsImpacted().stream()
                .map(dto -> {
                    AccountModel account = accountRepository.findById(dto.getAccountId())
                            .orElseThrow(() -> new TransactionValidationException(
                                    errorMessageService.getError(123)
                            ));

                    TransactionEntryModel entry = new TransactionEntryModel();
                    entry.setParentTransaction(transaction);  // Assigned by cascade
                    entry.setAccountImpacted(account);
                    entry.setEntryType(dto.getEntryType());
                    entry.setAmount(dto.getAmount());
                    return entry;
                })
                .toList();
        // Sets the accounts impacted to entries
        transaction.setAccountsImpacted(entries);
        transactionRepository.save(transaction);

        eventLoggingService.logEvent(
            request.getCreatedBy(),
            LoggingTables.TRANSACTION_ENTRIES,
            LoggingEvents.CREATE,
            null,
            entries
        );

        eventLoggingService.logEvent(
            request.getCreatedBy(),
            LoggingTables.TRANSACTIONS,
            LoggingEvents.CREATE,
            null,
            transaction
        );

        return true;
    }
}
