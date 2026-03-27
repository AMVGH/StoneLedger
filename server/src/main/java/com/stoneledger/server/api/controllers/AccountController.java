package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.requests.*;
import com.stoneledger.server.api.dtos.responses.AccountInformationDTO;
import com.stoneledger.server.api.repositories.AccountRepository;
import com.stoneledger.server.services.AccountService;
import com.stoneledger.server.services.ErrorMessageService;
import com.stoneledger.server.utils.ValidationUtil;
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


    @GetMapping("/get-financial-accounts")
    public ResponseEntity<ApiResponseDTO<?>> getUsers() {
        List<AccountInformationDTO> systemFinancialAccounts = accountService.getFinancialAccounts();
        return ResponseEntity.ok(ApiResponseDTO.success(systemFinancialAccounts));
    }

    @PostMapping("/generate-account-number")
    public ResponseEntity<ApiResponseDTO<?>> generateAccountNumber(@RequestBody AccountNumberRequestDTO request) {
        validationUtil.isValidAccountNumberRequest(request);
        long accountNumber = accountService.generateAccountNumber(request);
        return ResponseEntity.ok(ApiResponseDTO.success(accountNumber));
    }

    @PostMapping("/create-financial-account")
    public ResponseEntity<ApiResponseDTO<?>> createFinancialAccount(@RequestBody AccountCreationRequestDTO request) {
        validationUtil.isValidAccountCreationRequest(request);
        boolean creationSuccess = accountService.createNewFinancialAccount(request);
        return ResponseEntity.ok(ApiResponseDTO.success(creationSuccess));
    }

    @PostMapping("/edit-financial-account")
    public ResponseEntity<ApiResponseDTO<?>> editFinancialAccount(@RequestBody UpdateAccountInformationDTO request) {
        validationUtil.isValidFinancialAccountEditRequest(request);
        boolean financialAccountEditingSuccess = accountService.editFinancialAccount(request);
        return ResponseEntity.ok(ApiResponseDTO.success(financialAccountEditingSuccess));
    }

    @PostMapping("/activate-financial-account")
    public ResponseEntity<ApiResponseDTO<?>> activateFinancialAccount(@RequestBody ActivationRequestDTO request) {
        validationUtil.isValidFinancialAccountActivationRequest(request);
        boolean activationSuccess = accountService.activateAccount(request);
        return ResponseEntity.ok(ApiResponseDTO.success(activationSuccess));
    }

    @PostMapping("/deactivate-financial-account")
    public ResponseEntity<ApiResponseDTO<?>> deactivateFinancialAccount(@RequestBody DeactivationRequestDTO request) {
        validationUtil.isValidFinancialAccountDeactivationRequest(request);
        boolean deactivationSuccess = accountService.deactivateAccount(request);
        return ResponseEntity.ok(ApiResponseDTO.success(deactivationSuccess));
    }
}
