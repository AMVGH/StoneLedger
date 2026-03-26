package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.requests.*;
import com.stoneledger.server.api.dtos.responses.AccountInformationDTO;
import com.stoneledger.server.api.enums.*;
import com.stoneledger.server.api.exeptions.FinancialAccountException;
import com.stoneledger.server.api.exeptions.InvalidRequestException;
import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.api.repositories.AccountRepository;
import com.stoneledger.server.api.repositories.UserRepository;
import com.stoneledger.server.utils.MonetaryUtil;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccountService {
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MonetaryUtil monetaryUtil;
    @Autowired
    private EventLoggingService eventLoggingService;
    @Autowired
    private ErrorMessageService errorMessageService;

    public List<AccountInformationDTO> getFinancialAccounts() {
        return accountRepository.findAllWithUser().stream()
                .map(accountFromTable -> {
                    AccountInformationDTO accountDTO = new AccountInformationDTO();
                    accountDTO.setId(accountFromTable.getId());
                    accountDTO.setAccountNumber(accountFromTable.getAccountNumber());
                    accountDTO.setAccountName(accountFromTable.getAccountName());
                    accountDTO.setAccountDescription(accountFromTable.getAccountDescription());
                    accountDTO.setActive(accountFromTable.isActive());
                    accountDTO.setNormalSide(accountFromTable.getNormalSide());
                    accountDTO.setAccountCategory(accountFromTable.getAccountCategory());
                    accountDTO.setAccountSubcategory(accountFromTable.getAccountSubcategory());
                    accountDTO.setInitialBalance(accountFromTable.getInitialBalance());
                    accountDTO.setDebit(accountFromTable.getDebit());
                    accountDTO.setCredit(accountFromTable.getCredit());
                    accountDTO.setBalance(accountFromTable.getBalance());
                    accountDTO.setAccountAddDate(accountFromTable.getAccountAddDate());
                    accountDTO.setUserId(accountFromTable.getUser().getId());
                    accountDTO.setOrder(accountFromTable.getOrder());
                    accountDTO.setAssociatedStatement(accountFromTable.getAssociatedStatement());
                    accountDTO.setComment(accountFromTable.getComment());
                    return accountDTO;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public boolean createNewFinancialAccount(AccountCreationRequestDTO request) {
        AccountModel financialAccount = new AccountModel();
        LocalDateTime currentDateTime = LocalDateTime.now();

        // Validates that the account balance associated with the account is correct
        monetaryUtil.validateAccountBalance(
            request.getNormalSide(),
            request.getInitialBalance(),
            request.getDebit(),
            request.getCredit(),
            request.getBalance()
        );

        // Builds all fields using the content passed in the request
        financialAccount.setAccountNumber(request.getAccountNumber());
        financialAccount.setAccountName(request.getAccountName());
        financialAccount.setAccountDescription(request.getAccountDescription());
        financialAccount.setNormalSide(request.getNormalSide());
        financialAccount.setAccountCategory(request.getAccountCategory());
        financialAccount.setAccountSubcategory(request.getAccountSubcategory());
        financialAccount.setInitialBalance(request.getInitialBalance());
        financialAccount.setDebit(request.getDebit());
        financialAccount.setCredit(request.getCredit());
        financialAccount.setBalance(request.getBalance());
        financialAccount.setUser(userRepository.getReferenceById(request.getUserId()));
        financialAccount.setOrder(request.getOrder());
        financialAccount.setAssociatedStatement(request.getAssociatedStatement());
        financialAccount.setComment(request.getComment());

        // Activity and creation date are set by the server
        financialAccount.setActive(true);
        financialAccount.setAccountAddDate(currentDateTime);

        // Saves the new account to the database
        accountRepository.save(financialAccount);

        // Logs the account creation event with the eventLoggingService
        eventLoggingService.logEvent(
            request.getUserId(),
            LoggingTables.ACCOUNTS,
            LoggingEvents.CREATE,
            null, // On CREATE the before image is null
            financialAccount
        );

        return true;
    }

    @Transactional
    public boolean editFinancialAccount(UpdateAccountInformationDTO request) {
        // Gathers images for both the old account and an account instance we will be updating for logging comparison
        AccountModel beforeImageAccount = accountRepository.findById(request.getId())
            .orElseThrow(() -> new FinancialAccountException(
                errorMessageService.getError(123)
            ));

        AccountModel afterImageAccount = accountRepository.findById(request.getId())
            .orElseThrow(() -> new FinancialAccountException(
                errorMessageService.getError(123)
            ));

        // If the category is being changed from, ASSET or LIABILITY, enforce null on subcategory
        boolean isAssetOrLiability = request.getAccountCategory() == AccountCategory.ASSET || request.getAccountCategory() == AccountCategory.LIABILITY;

        if (!isAssetOrLiability) {
            afterImageAccount.setAccountSubcategory(AccountSubcategory.NONE);
        } else {
            afterImageAccount.setAccountSubcategory(request.getAccountSubcategory());
        }

        // Determines if any of the monetary fields have changed against what is stored in the database
        boolean monetaryFieldChanged = request.getInitialBalance().compareTo(beforeImageAccount.getInitialBalance()) != 0
            || request.getDebit().compareTo(beforeImageAccount.getDebit()) != 0
            || request.getCredit().compareTo(beforeImageAccount.getCredit()) != 0
            || request.getBalance().compareTo(beforeImageAccount.getBalance()) != 0;

        // If any of the fields have changed, we must revalidate the balance to ensure that the balance displayed on the account is always valid
        if (monetaryFieldChanged) {
            NormalSide normalSide = !request.getNormalSide().equals(beforeImageAccount.getNormalSide())
                ? request.getNormalSide()
                : beforeImageAccount.getNormalSide();
            BigDecimal initialBalance = request.getInitialBalance().compareTo(beforeImageAccount.getInitialBalance()) != 0
                ? request.getInitialBalance()
                : beforeImageAccount.getInitialBalance();

            BigDecimal debit = request.getDebit().compareTo(beforeImageAccount.getDebit()) != 0
                ? request.getDebit()
                : beforeImageAccount.getDebit();

            BigDecimal credit = request.getCredit().compareTo(beforeImageAccount.getCredit()) != 0
                ? request.getCredit()
                : beforeImageAccount.getCredit();

            BigDecimal balance = request.getBalance().compareTo(beforeImageAccount.getBalance()) != 0
                ? request.getBalance()
                : beforeImageAccount.getBalance();

            monetaryUtil.validateAccountBalance(
                normalSide,
                initialBalance,
                debit,
                credit,
                balance);
        }

        // Updated the afterImageAccount with the values from the request
        afterImageAccount.setAccountNumber(request.getAccountNumber());
        afterImageAccount.setAccountName(request.getAccountName());
        afterImageAccount.setAccountDescription(request.getAccountDescription());
        afterImageAccount.setNormalSide(request.getNormalSide());
        afterImageAccount.setAccountCategory(request.getAccountCategory());
        afterImageAccount.setInitialBalance(request.getInitialBalance());
        afterImageAccount.setDebit(request.getDebit());
        afterImageAccount.setCredit(request.getCredit());
        afterImageAccount.setBalance(request.getBalance());
        afterImageAccount.setUser(userRepository.getReferenceById(request.getUserId()));
        afterImageAccount.setOrder(request.getOrder());
        afterImageAccount.setAssociatedStatement(request.getAssociatedStatement());
        afterImageAccount.setComment(request.getComment());

        // Saves changes to the database
        accountRepository.save(afterImageAccount);

        // Logs event with the event owner's userId, table/event, and both images
        eventLoggingService.logEvent(
            request.getUserId(),
            LoggingTables.ACCOUNTS,
            LoggingEvents.UPDATE,
            beforeImageAccount,
            afterImageAccount
        );

        return true;
    }

    public long generateAccountNumber(AccountNumberRequestDTO request) {
        long lowerBound;
        long upperBound;
        int accountExpansionValue = 20;

        if (request.getAccountCategory() == AccountCategory.ASSET) {
            lowerBound = 10000;
            upperBound = 19999;
        } else if (request.getAccountCategory() == AccountCategory.EXPENSE) {
            lowerBound = 20000;
            upperBound = 29999;
        } else if (request.getAccountCategory() == AccountCategory.LIABILITY) {
            lowerBound = 30000;
            upperBound = 39999;
        } else if (request.getAccountCategory() == AccountCategory.EQUITY) {
            lowerBound = 40000;
            upperBound = 49999;
        } else if (request.getAccountCategory() == AccountCategory.REVENUE) {
            lowerBound = 50000;
            upperBound = 59999;
        } else {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }

        for (long accountNumber = lowerBound; accountNumber <= upperBound; accountNumber += accountExpansionValue){
            if (!accountRepository.existsByAccountNumber(accountNumber)) {
                return accountNumber;
            }
        }

        for (long accountNumber = lowerBound; accountNumber <= upperBound; accountNumber++) {
            if (!accountRepository.existsByAccountNumber(accountNumber)){
                return accountNumber;
            }
        }

        throw new FinancialAccountException(errorMessageService.getError(121));
    }

    @Transactional
    public boolean activateAccount(ActivationRequestDTO request) {
        AccountModel beforeImageAccount = accountRepository
            .findByAccountNumber(request.getAccountNumber())
            .orElseThrow(() -> new FinancialAccountException(errorMessageService.getError(123)));

        AccountModel afterImageAccount = accountRepository
            .findByAccountNumber(request.getAccountNumber())
            .orElseThrow(() -> new FinancialAccountException(errorMessageService.getError(123)));

        if (!afterImageAccount.isActive()) {
            afterImageAccount.setActive(true);
            accountRepository.save(afterImageAccount);
        } else throw new FinancialAccountException(errorMessageService.getError(125));

        eventLoggingService.logEvent(
            request.getUserId(),
            LoggingTables.ACCOUNTS,
            LoggingEvents.ACTIVATE,
            beforeImageAccount,
            afterImageAccount
        );

        return true;
    }

    @Transactional
    public boolean deactivateAccount(DeactivationRequestDTO request) {
        AccountModel beforeImageAccount = accountRepository
            .findByAccountNumber(request.getAccountNumber())
            .orElseThrow(() -> new FinancialAccountException(errorMessageService.getError(123)));

        AccountModel afterImageAccount = accountRepository
            .findByAccountNumber(request.getAccountNumber())
            .orElseThrow(() -> new FinancialAccountException(errorMessageService.getError(123)));

        if (afterImageAccount.isActive()) {
            afterImageAccount.setActive(false);
            accountRepository.save(afterImageAccount);
        } else throw new FinancialAccountException(errorMessageService.getError(125));

        eventLoggingService.logEvent(
            request.getUserId(),
            LoggingTables.ACCOUNTS,
            LoggingEvents.DEACTIVATE,
            beforeImageAccount,
            afterImageAccount
        );

        return true;
    }
}
