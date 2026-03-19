package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.requests.AccountCreationRequestDTO;
import com.stoneledger.server.api.dtos.requests.AccountNumberRequestDTO;
import com.stoneledger.server.api.dtos.requests.RegistrationRequestDTO;
import com.stoneledger.server.api.dtos.responses.AccountInformationDTO;
import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.api.repositories.AccountRepository;
import com.stoneledger.server.services.AccountService;
import com.stoneledger.server.services.ErrorMessageService;
import com.stoneledger.server.utils.ValidationUtil;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/financial-accounts")
public class AccountController {
    @Autowired
    private ValidationUtil validationUtil;
    @Autowired
    private AccountService accountService;
    @Autowired
    private ErrorMessageService errorMessageService;
    @Autowired
    private AccountRepository accountRepository;

    @GetMapping("/get-accounts")
    public ResponseEntity<ApiResponseDTO<?>> getUsers() {
        List<AccountInformationDTO> systemFinancialAccounts = accountService.getFinancialAccounts();
        return ResponseEntity.ok(ApiResponseDTO.success(systemFinancialAccounts));
    }

    @PostMapping("/create-account")
    public ResponseEntity<ApiResponseDTO<?>> registerUser(@RequestBody AccountCreationRequestDTO request) {
        validationUtil.isValidAccountCreationRequest(request);
        boolean creationSuccess = accountService.createNewFinancialAccount(request);
        return ResponseEntity.ok(ApiResponseDTO.success(creationSuccess));
    }

    // TODO: Confer whether this is the best approach for generating account numbers or if that should be at the discretion of user.
    @PostMapping("/generate-account-number")
    public ResponseEntity<ApiResponseDTO<?>> generateAccountNumber(@RequestBody AccountNumberRequestDTO request) {
        validationUtil.isValidAccountNumberRequest(request);
        long accountNumber = accountService.generateAccountNumber(request);
        return ResponseEntity.ok(ApiResponseDTO.success(accountNumber));
    }
}
