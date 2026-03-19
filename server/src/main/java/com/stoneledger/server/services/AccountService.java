package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.requests.AccountCreationRequestDTO;
import com.stoneledger.server.api.dtos.requests.AccountNumberRequestDTO;
import com.stoneledger.server.api.dtos.responses.AccountInformationDTO;
import com.stoneledger.server.api.enums.AccountCategory;
import com.stoneledger.server.api.exeptions.FinancialAccountException;
import com.stoneledger.server.api.exeptions.InvalidRequestException;
import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.api.repositories.AccountRepository;
import com.stoneledger.server.api.repositories.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    private ErrorMessageService errorMessageService;

    public List<AccountInformationDTO> getFinancialAccounts() {
        return accountRepository.findAllWithUser().stream()
                .map(accountFromTable -> {
                    AccountInformationDTO accountDTO = new AccountInformationDTO();
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

        accountRepository.save(financialAccount);

        // TODO: Add event logging

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
}
