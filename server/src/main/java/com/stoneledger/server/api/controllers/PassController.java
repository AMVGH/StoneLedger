package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.requests.PasswordUpdateRequestDTO;
import com.stoneledger.server.api.dtos.requests.SecurityQuestionVerifyRequestDTO;
import com.stoneledger.server.services.ErrorMessageService;
import com.stoneledger.server.services.PasswordService;
import com.stoneledger.server.utils.ValidationUtil;
import org.apache.coyote.Request;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.GeneralSecurityException;

// TODO: Implement the PassController Endpoints
@RestController
@RequestMapping("api/passwords")
public class PassController {
    @Autowired
    private ValidationUtil validationUtil;
    @Autowired
    private PasswordService passwordService;
    @Autowired
    private ErrorMessageService errorMessageService;

    /**
     * Allows user to update password.
     * */
    @PostMapping("/update-password")
    public ResponseEntity<ApiResponseDTO<?>> updateUserPassword(@RequestBody PasswordUpdateRequestDTO request) throws GeneralSecurityException {
        validationUtil.isValidPasswordUpdateRequest(request);
        String passwordUpdateResponse = passwordService.updatePassword(request);
        return ResponseEntity.ok(ApiResponseDTO.success(passwordUpdateResponse));
    }

    /**
     * Validates security question and answer for updating a password.
     * */
    @PostMapping("/validate-security-question")
    public ResponseEntity<ApiResponseDTO<?>> verifySecurityQuestion(@RequestBody SecurityQuestionVerifyRequestDTO request) {
        validationUtil.isValidSecurityQuestionRequest(request);
        Boolean isQuestionAndAnswerCorrect = passwordService.validateSecurityQuestionAndAnswer(request);
        return ResponseEntity.ok(ApiResponseDTO.success(isQuestionAndAnswerCorrect));
    }
}
