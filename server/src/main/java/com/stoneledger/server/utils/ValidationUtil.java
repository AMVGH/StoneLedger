package com.stoneledger.server.utils;

import com.stoneledger.server.api.dtos.requests.*;
import com.stoneledger.server.api.enums.AccountCategory;
import com.stoneledger.server.api.enums.AccountSubcategory;
import com.stoneledger.server.api.exeptions.*;
import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.api.models.PasswordModel;
import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.api.repositories.AccountRepository;
import com.stoneledger.server.api.repositories.PasswordRepository;
import com.stoneledger.server.api.repositories.UserRepository;
import com.stoneledger.server.services.ErrorMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ValidationUtil {
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordRepository passwordRepository;
    @Autowired
    private EncryptionUtil encryptionUtil;
    @Autowired
    private ErrorMessageService errorMessageService;


    public boolean isValidRegistrationRequest(RegistrationRequestDTO request) throws InvalidRequestException {
        // Checks that all fields contain content and are not empty coming in from the client
        if (request.getFirstName() == null || request.getFirstName().isBlank()
            || request.getLastName() == null || request.getLastName().isBlank()
            || request.getEmail() == null || request.getEmail().isBlank()
            || request.getPassword() == null || request.getPassword().isBlank()
            || request.getUserAddress() == null || request.getUserAddress().isBlank()
            || request.getDateOfBirth() == null
            || request.getUserRole() == null
            || request.getSecurityQuestion() == null || request.getSecurityQuestion().isBlank()
            || request.getSecurityQuestionAnswer() == null || request.getSecurityQuestionAnswer().isBlank()) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }

        // Checks that the email is unique and there is not an account already associated with the email
        else if (userRepository.existsByEmail(request.getEmail())) {
            throw new InvalidRequestException(errorMessageService.getError(101));
        }
        return true;
    }

    public boolean isValidLoginRequest(LoginRequestDTO request) throws InvalidRequestException {
        // Checks that all fields contain content and are not empty coming in from the client
        if (request.getUsername() == null || request.getUsername().isBlank()
            || request.getPassword() == null || request.getPassword().isBlank()) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        } else if (!userRepository.existsByUsername(request.getUsername())) {
            throw new InvalidRequestException(errorMessageService.getError(107));
        }
        return true;
    }

    public boolean isValidUserId(long id) throws InvalidIdException {
        // Ensures the user ID exists in the table
        if (!userRepository.existsById(id)) {
            throw new InvalidIdException(errorMessageService.getError(112));
        }
        return true;
    }

    public boolean isValidAccountId(long id) throws InvalidIdException {
        // Ensures the account ID exists in the table
        if (!accountRepository.existsById(id)) {
            throw new InvalidIdException(errorMessageService.getError(123));
        }
        return true;
    }

    public boolean isValidJwt(String authHeader) throws InvalidJwtException {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new InvalidJwtException(errorMessageService.getError(106));
        }
        return true;
    }

    public boolean isValidActivityRequest(UserActivityDTO request) throws InvalidRequestException, InvalidIdException, UserActivityException, InvalidLocalDateTimeException{
        // Ensures no fields are null -- EndDate can be null
        if (request.getId() == null || request.getActivityStatus() == null) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }

        // Ensures that the user associated with the ID exists
        UserModel user = userRepository.findById(request.getId())
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));

        // Throws a UserActivityException if the incoming status is the same as the current status
        if (user.isActive() == request.getActivityStatus()) {
            throw new UserActivityException(errorMessageService.getError(113));
        }

        // Throws an exception if the end date is in the past
        if (request.getActivityEndDate() != null && request.getActivityEndDate().isBefore(LocalDateTime.now())) {
            throw new InvalidLocalDateTimeException(errorMessageService.getError(114));
        }

        return true;
    }

    public boolean isValidSuspensionRequest(UserSuspensionDTO request)
        throws InvalidRequestException, InvalidIdException, InvalidLocalDateTimeException, UserSuspensionException {
        if (request.getId() == null || request.getSuspensionStartDate() == null || request.getSuspensionEndDate() == null) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }

        // Ensures that the user associated with the ID exists
        UserModel user = userRepository.findById(request.getId())
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));

        // TODO: Fix before LocalDate.now() cases.
        // if (request.getSuspensionStartDate().toLocalDate().isBefore(LocalDate.now())) {
           // throw new InvalidLocalDateTimeException(errorMessageService.getError(114));
        // }

        // Ensures that the suspension end date is not before the suspension start date
        if (request.getSuspensionEndDate().isBefore(request.getSuspensionStartDate())) {
            throw new InvalidLocalDateTimeException(errorMessageService.getError(115));
        }


        //Ensures that the suspension status is not already true
        if (user.isSuspended()) {
            throw new UserSuspensionException(errorMessageService.getError(116));
        }

        return true;
    }

    public boolean isValidSuspensionRevocationRequest(Long id) throws InvalidIdException, UserSuspensionException {
        if (id == null) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }
        isValidUserId(id);
        UserModel user = userRepository.findById(id)
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));
        if (!user.isSuspended()) {
            throw new UserSuspensionException(errorMessageService.getError(116));
        }
        return true;
    }

    public boolean isValidRoleUpdateRequest(UpdateUserRoleDTO request) throws InvalidIdException, InvalidRequestException {
        if (request.getId() == null || request.getUserRole() == null) {
            System.out.println("One or more request fields are null.");
            throw new InvalidRequestException(errorMessageService.getError(100));
        }
        isValidUserId(request.getId());
        UserModel user = userRepository.findById(request.getId())
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));
        if (user.getUserRole() == request.getUserRole()) {
            throw new InvalidRequestException(errorMessageService.getError(117));
        }
        System.out.println("Role update request body is valid.");
        return true;
    }

    public boolean isValidUserCreationRequest(CreateUserDTO request) {
        if (request.getFirstName() == null || request.getFirstName().isBlank()
        || request.getLastName() == null || request.getLastName().isBlank()
        || request.getEmail() == null || request.getEmail().isBlank()
        || request.getPassword() == null || request.getPassword().isBlank()
        || request.getUserAddress() == null || request.getUserAddress().isBlank()
        || request.getDateOfBirth() == null
        || request.getUserRole() == null
        || request.getActive() == null
        || request.getActivityStartDate() == null) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }

        // TODO: Fix before LocalDate.now() cases.
        // if (request.getActivityStartDate().isBefore(LocalDateTime.now().minusMinutes(5))) {
        //     throw new InvalidLocalDateTimeException(errorMessageService.getError(114));
        // }

        if (request.getActivityEndDate() != null && request.getActivityEndDate().isBefore(request.getActivityStartDate())) {
            throw new InvalidLocalDateTimeException(errorMessageService.getError(115));
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new InvalidRequestException(errorMessageService.getError(101));
        }

        return true;
    }

    public boolean isValidPasswordUpdateRequest(PasswordUpdateRequestDTO request) throws GeneralSecurityException {
        if (request.getId() == null || request.getUpdatedPassword() == null || request.getUpdatedPassword().isBlank()) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }

        isValidUserId(request.getId());

        List<PasswordModel> passwordHistory = passwordRepository.findByUser_Id(request.getId());
        boolean passwordPreviouslyUsed = passwordHistory.stream()
            .anyMatch(p -> {
                try {
                    return p.getPassword().equals(encryptionUtil.encrypt(request.getUpdatedPassword()));
                } catch (GeneralSecurityException e) {
                    throw new RuntimeException(e);
                }
            });

        if (passwordPreviouslyUsed) {
            throw new InvalidRequestException(errorMessageService.getError(118));
        }

        return true;
    }

    public boolean isValidUpdateInformationRequest(UpdateUserInformationDTO request) {
        if (request.getId() == null) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }
        isValidUserId(request.getId());
        return true;
    }

    public boolean isValidEmailIssuance(IssueEmailDTO request) {
        // Ensures all fields have content
        if (request.getTargetEmail() == null || request.getTargetEmail().isBlank()
        || request.getEmailBody() == null || request.getEmailBody().isBlank()) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }

        // Ensures the target email exists
        if (!userRepository.existsByEmail(request.getTargetEmail())) {
            throw new InvalidEmailException(errorMessageService.getError(111));
        }

        return true;
    }

    public boolean isValidSecurityQuestionRequest(SecurityQuestionVerifyRequestDTO request) {
        isValidUserId(request.getId());
        if (request.getSecurityQuestion() == null || request.getSecurityQuestion().isBlank()
            || request.getSecurityQuestionAnswer() == null || request.getSecurityQuestionAnswer().isBlank()) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }
        return true;
    }

    public boolean isValidAccountCreationRequest(AccountCreationRequestDTO request) {
        // Ensures all required fields are non-empty
        if (request.getAccountNumber() == null
                || request.getAccountName() == null || request.getAccountName().isBlank()
                || request.getNormalSide() == null
                || request.getAccountCategory() == null
                || request.getAccountSubcategory() == null
                || request.getInitialBalance() == null
                || request.getDebit() == null
                || request.getCredit() == null
                || request.getBalance() == null
                || request.getUserId() == null
                || request.getOrder() == null
                || request.getAssociatedStatement() == null) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }

        // Ensures that all monetary values have two decimal places
        if (!hasTwoDecimalPlaces(request.getInitialBalance())
                || !hasTwoDecimalPlaces(request.getDebit())
                || !hasTwoDecimalPlaces(request.getCredit())
                || !hasTwoDecimalPlaces(request.getBalance())) {
            throw new FinancialAccountException(errorMessageService.getError(120));
        }

        // Checks if the category is an asset or liability
        boolean isAssetOrLiability = request.getAccountCategory() == AccountCategory.ASSET || request.getAccountCategory() == AccountCategory.LIABILITY;

        // If there is a subcategory associated with anything other than an asset or liability throw an exception
        if (!isAssetOrLiability && request.getAccountSubcategory() != AccountSubcategory.NONE) {
            throw new FinancialAccountException(errorMessageService.getError(127));
        }

        // Ensures that the userId associated with the request exists and is valid
        isValidUserId(request.getUserId());

        // Ensures that a financial account does not already exist with the associated account name or account number
        if (accountRepository.existsByAccountName(request.getAccountName())
                || accountRepository.existsByAccountNumber(request.getAccountNumber())) {
            throw new FinancialAccountException(errorMessageService.getError(119));
        }

        return true;
    }

    public boolean isValidFinancialAccountEditRequest(UpdateAccountInformationDTO request) {
        // Ensures all required fields are non-empty
        if (request.getAccountNumber() == null
            || request.getAccountName() == null || request.getAccountName().isBlank()
            || request.getNormalSide() == null
            || request.getAccountCategory() == null
            || request.getAccountSubcategory() == null
            || request.getInitialBalance() == null
            || request.getDebit() == null
            || request.getCredit() == null
            || request.getBalance() == null
            || request.getUserId() == null
            || request.getOrder() == null
            || request.getAssociatedStatement() == null) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }

        // Ensures that all monetary values have two decimal places
        if (!hasTwoDecimalPlaces(request.getInitialBalance())
            || !hasTwoDecimalPlaces(request.getDebit())
            || !hasTwoDecimalPlaces(request.getCredit())
            || !hasTwoDecimalPlaces(request.getBalance())) {
            throw new FinancialAccountException(errorMessageService.getError(120));
        }

        // Ensures ownership userId is valid
        isValidUserId(request.getUserId());

        // Ensures that a valid account exists associated with the account ID (Not account number since it can change on edit)
        AccountModel account = accountRepository.findById(request.getId())
            .orElseThrow(() -> new FinancialAccountException(errorMessageService.getError(123)));

        // If the account number is being changed, ensure that it doesn't already exist
        if (!request.getAccountNumber().equals(account.getAccountNumber())) {
            if (accountRepository.existsByAccountNumber(request.getAccountNumber())) {
                throw new FinancialAccountException(errorMessageService.getError(123));
            }
        }

        // If account name is being changed, ensure it doesn't already exist
        if (!request.getAccountName().equals(account.getAccountName())) {
            if (accountRepository.existsByAccountName(request.getAccountName())) {
                throw new FinancialAccountException(errorMessageService.getError(123));
            }
        }

        // Checks if the category is an asset or liability
        boolean isAssetOrLiability = request.getAccountCategory() == AccountCategory.ASSET || request.getAccountCategory() == AccountCategory.LIABILITY;

        // If there is a subcategory associated with anything other than an asset or liability throw an exception
        if (!isAssetOrLiability && request.getAccountSubcategory() != AccountSubcategory.NONE) {
            throw new FinancialAccountException(errorMessageService.getError(127));
        }

        return true;
    }

    /**
     * Helper method for determining if a value has the correct amount of decimal places.
     */
    private boolean hasTwoDecimalPlaces(BigDecimal value) {
        return value.stripTrailingZeros().scale() <= 2;
    }

    public boolean isValidAccountNumberRequest(AccountNumberRequestDTO request) {
        if (request.getAccountCategory() == null) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }
        return true;
    }

    public boolean isValidFinancialAccountActivationRequest(ActivationRequestDTO request) {
        // Check if ownership userId is valid
        isValidUserId(request.getUserId());

        // Retrieve the account associated with the accountNumber, throw an exception w/ error code if the lookup came back empty
        AccountModel account = accountRepository.findByAccountNumber(request.getAccountNumber())
            .orElseThrow(() -> new FinancialAccountException(
                errorMessageService.getError(123)
            ));

        // Check if already activated
        if (account.isActive()) {
            throw new FinancialAccountException(errorMessageService.getError(125));
        }

        return true;
    }

    public boolean isValidFinancialAccountDeactivationRequest(DeactivationRequestDTO request) {
        // Check if ownership userId is valid
        isValidUserId(request.getUserId());

        // Retrieve the account associated with the accountNumber, throw an exception w/ error code if the lookup came back empty
        AccountModel account = accountRepository.findByAccountNumber(request.getAccountNumber())
            .orElseThrow(() -> new FinancialAccountException(
                errorMessageService.getError(123)
            ));

        // Check if already deactivated
        if (!account.isActive()) {
            throw new FinancialAccountException(
                errorMessageService.getError(125)
            );
        }

        // Check if account has non-zero balance
        if (account.getBalance().compareTo(BigDecimal.ZERO) != 0) {
            throw new FinancialAccountException(
                errorMessageService.getError(124)
            );
        }

        return true;
    }


    public boolean isValidTransactionCreationRequest(TransactionCreationDTO request) {
        // Ensures the creation request is valid
        if (request.getTransactionType() == null || request.getCreatedBy() == null || request.getAccountsImpacted() == null) {
            throw new TransactionValidationException(errorMessageService.getError(100));
        }

        // Ensures that the user id passed by the request is valid
        isValidUserId(request.getCreatedBy());

        // If the number of accounts impacted is less than two, throw an exception
        if (request.getAccountsImpacted().size() < 2) {
            throw new TransactionValidationException(errorMessageService.getError(129));
        }

        // Iterates over the accounts impacted and validates each one
        for (TransactionEntryDTO transactionInnerAccountEntry : request.getAccountsImpacted()) {
            if (transactionInnerAccountEntry == null) {
                throw new TransactionValidationException(errorMessageService.getError(100));
            }

            if (transactionInnerAccountEntry.getAccountId() == null) {
                throw new TransactionValidationException(errorMessageService.getError(123));
            }

            // Ensures that an account id is associated with each inner entry
            isValidAccountId(transactionInnerAccountEntry.getAccountId());

            // Ensures that the inner entry has an entry type associated with it (DEBIT or CREDIT)
            if (transactionInnerAccountEntry.getEntryType() == null) {
                throw new TransactionValidationException(errorMessageService.getError(130));
            }

            // Ensures that each inner entry has an amount associated with it
            if (transactionInnerAccountEntry.getAmount() == null) {
                throw new TransactionValidationException(errorMessageService.getError(131));
            }

            // Ensures that the amount for every inner entry is formatted correctly
            if (!hasTwoDecimalPlaces(transactionInnerAccountEntry.getAmount())) {
                throw new TransactionValidationException(errorMessageService.getError(120));
            }
        }
        return true;
    }
}
