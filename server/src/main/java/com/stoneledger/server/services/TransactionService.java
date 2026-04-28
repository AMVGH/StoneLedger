package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.requests.TransactionCreationDTO;
import com.stoneledger.server.api.dtos.requests.TransactionEntryDTO;
import com.stoneledger.server.api.dtos.requests.TransactionStatusUpdateDTO;
import com.stoneledger.server.api.dtos.responses.AccountSummaryDTO;
import com.stoneledger.server.api.dtos.responses.TransactionInformationDTO;
import com.stoneledger.server.api.dtos.responses.TransactionPendingEntryDTO;
import com.stoneledger.server.api.enums.*;
import com.stoneledger.server.api.exeptions.FinancialAccountException;
import com.stoneledger.server.api.exeptions.InvalidFileException;
import com.stoneledger.server.api.exeptions.InvalidIdException;
import com.stoneledger.server.api.exeptions.TransactionValidationException;
import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.api.models.TransactionEntryModel;
import com.stoneledger.server.api.models.TransactionModel;
import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.api.repositories.AccountRepository;
import com.stoneledger.server.api.repositories.TransactionEntryRepository;
import com.stoneledger.server.api.repositories.TransactionRepository;
import com.stoneledger.server.api.repositories.UserRepository;
import com.stoneledger.server.utils.MonetaryUtil;
import jakarta.mail.MessagingException;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.math.BigDecimal;
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
    private TransactionEntryRepository transactionEntryRepository;
    @Autowired
    private EventLoggingService eventLoggingService;
    @Autowired
    private ErrorMessageService errorMessageService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private EntityManager entityManager;
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; //10MB
    private static final int MAX_FILE_NAME_LENGTH = 255;

    @Autowired
    private ObjectMapper objectMapper;
    public List<TransactionInformationDTO> getAllEntries() {
        List<TransactionModel> transactions = transactionRepository.findAllByOrderByCreatedDateDesc();

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

    // TODO: Fix logging for after images crashing on attachment send.
    @Transactional
    public boolean createJournalTransaction(TransactionCreationDTO request, MultipartFile file) throws IOException, MessagingException {
        TransactionModel transaction = new TransactionModel();
        LocalDateTime transactionDate = LocalDateTime.now();

        // Ensures total DEBIT == total CREDIT
        monetaryUtil.validateIncomingTransaction(request.getAccountsImpacted());

        // TODO: Refine and add fixes and messages for size and attachment name length.
        // Attach a file to the transaction if provided
        if (file != null && !file.isEmpty()) {
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new InvalidFileException(errorMessageService.getError(138));
            } else if (file.getOriginalFilename() != null && file.getOriginalFilename().length() > MAX_FILE_NAME_LENGTH) {
                throw new InvalidFileException(errorMessageService.getError(139));
            }
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
                    entry.setIsApproved(false);
                    entry.setEntryDate(transactionDate);
                    return entry;
                })
                .toList();
        // Sets the accounts impacted to entries
        transaction.setAccountsImpacted(entries);
        transactionRepository.saveAndFlush(transaction);
        entityManager.detach(transaction);
        transaction.setAttachment(null);

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

    @Transactional
    public boolean approveTransaction(TransactionStatusUpdateDTO request) {
        LocalDateTime currentDateTime = LocalDateTime.now();

        TransactionModel beforeImageTransaction = transactionRepository.findById(request.getTransactionId())
            .orElseThrow(() -> new TransactionValidationException(
                errorMessageService.getError(132)
            ));

        Hibernate.initialize(beforeImageTransaction.getAccountsImpacted());
        entityManager.detach(beforeImageTransaction);
        beforeImageTransaction.setAttachment(null);
        String beforeImageTransactionJson = objectMapper.writeValueAsString(beforeImageTransaction);

        TransactionModel afterImageTransaction = transactionRepository.findById(request.getTransactionId())
            .orElseThrow(() -> new TransactionValidationException(
                errorMessageService.getError(132)
            ));

        if (afterImageTransaction.getTransactionStatus() == TransactionStatus.APPROVED || afterImageTransaction.getTransactionStatus() != TransactionStatus.PENDING) {
            throw new TransactionValidationException(errorMessageService.getError(133));
        }

        afterImageTransaction.setTransactionStatus(TransactionStatus.APPROVED);
        afterImageTransaction.setUpdatedBy(userRepository.findById(request.getUserId())
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112))
            ));
        afterImageTransaction.setUpdateDate(currentDateTime);
        afterImageTransaction.setUpdateComment(request.getStatusUpdateReason());

        for (TransactionEntryModel entry : afterImageTransaction.getAccountsImpacted()) {
            AccountModel beforeImageAccount = accountRepository.findById(entry.getAccountImpacted().getId())
                .orElseThrow(() -> new FinancialAccountException(
                    errorMessageService.getError(123)
                ));

            String beforeImageAccountJson = objectMapper.writeValueAsString(beforeImageAccount);

            AccountModel afterImageAccount = accountRepository.findById(entry.getAccountImpacted().getId())
                .orElseThrow(() -> new FinancialAccountException(
                    errorMessageService.getError(123)
                ));

            switch (entry.getEntryType()) {
                case DEBIT -> afterImageAccount.setDebit(afterImageAccount.getDebit().add(entry.getAmount()));
                case CREDIT -> afterImageAccount.setCredit(afterImageAccount.getCredit().add(entry.getAmount()));
            }

            BigDecimal newBalance;
            if (afterImageAccount.getNormalSide() == NormalSide.LEFT) {
                newBalance = entry.getEntryType() == EntryType.DEBIT
                    ? afterImageAccount.getBalance().add(entry.getAmount())
                    : afterImageAccount.getBalance().subtract(entry.getAmount());
            } else {
                newBalance = entry.getEntryType() == EntryType.CREDIT
                    ? afterImageAccount.getBalance().add(entry.getAmount())
                    : afterImageAccount.getBalance().subtract(entry.getAmount());
            }

            afterImageAccount.setBalance(newBalance);
            accountRepository.saveAndFlush(afterImageAccount);

            String beforeImageEntryJson = objectMapper.writeValueAsString(entry);

            TransactionEntryModel afterImageEntry = transactionEntryRepository.findById(entry.getId())
                .orElseThrow(() -> new TransactionValidationException(
                    errorMessageService.getError(132)
                ));

            afterImageEntry.setIsApproved(true);
            transactionEntryRepository.saveAndFlush(afterImageEntry);

            eventLoggingService.logEvent(
                request.getUserId(),
                LoggingTables.ACCOUNTS,
                LoggingEvents.UPDATE,
                beforeImageAccountJson,
                afterImageAccount
            );

            eventLoggingService.logEvent(
                request.getUserId(),
                LoggingTables.TRANSACTION_ENTRIES,
                LoggingEvents.UPDATE,
                beforeImageEntryJson,
                afterImageEntry
            );
        }

        transactionRepository.saveAndFlush(afterImageTransaction);
        Hibernate.initialize(afterImageTransaction.getAccountsImpacted());
        entityManager.detach(afterImageTransaction);
        afterImageTransaction.setAttachment(null);

        eventLoggingService.logEvent(
            request.getUserId(),
            LoggingTables.TRANSACTIONS,
            LoggingEvents.UPDATE,
            beforeImageTransactionJson,
            afterImageTransaction
        );

        return true;
    }

    @Transactional
    public boolean rejectTransaction(TransactionStatusUpdateDTO request) {
        LocalDateTime currentDateTime = LocalDateTime.now();

        TransactionModel beforeImageTransaction = transactionRepository.findById(request.getTransactionId())
            .orElseThrow(() -> new TransactionValidationException(
                errorMessageService.getError(132)
            ));

        Hibernate.initialize(beforeImageTransaction.getAccountsImpacted());
        entityManager.detach(beforeImageTransaction);
        beforeImageTransaction.setAttachment(null);
        String beforeImageJson = objectMapper.writeValueAsString(beforeImageTransaction);

        TransactionModel afterImageTransaction = transactionRepository.findById(request.getTransactionId())
            .orElseThrow(() -> new TransactionValidationException(
                errorMessageService.getError(132)
            ));

        if (afterImageTransaction.getTransactionStatus() == TransactionStatus.REJECTED || afterImageTransaction.getTransactionStatus() != TransactionStatus.PENDING) {
            throw new TransactionValidationException(errorMessageService.getError(133));
        } else {
            afterImageTransaction.setTransactionStatus(TransactionStatus.REJECTED);
            afterImageTransaction.setUpdatedBy(userRepository.findById(request.getUserId())
                .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112))
                ));
            afterImageTransaction.setUpdateDate(currentDateTime);
            afterImageTransaction.setUpdateComment(request.getStatusUpdateReason());
        }

        transactionRepository.saveAndFlush(afterImageTransaction);
        Hibernate.initialize(afterImageTransaction.getAccountsImpacted());
        entityManager.detach(afterImageTransaction);
        afterImageTransaction.setAttachment(null);

        eventLoggingService.logEvent(
            request.getUserId(),
            LoggingTables.TRANSACTIONS,
            LoggingEvents.UPDATE,
            beforeImageJson,
            afterImageTransaction
        );

        return true;
    }
}
