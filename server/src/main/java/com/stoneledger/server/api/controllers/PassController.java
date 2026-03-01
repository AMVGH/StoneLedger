package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.requests.PasswordUpdateRequestDTO;
import com.stoneledger.server.services.ErrorMessageService;
import com.stoneledger.server.utils.ValidationUtil;
import org.apache.coyote.Request;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

// TODO: Implement the PassController Endpoints; Also Need to Implement Password Polling
@RestController("/passwords")
public class PassController {
    @Autowired
    private ValidationUtil validationUtil;

    @Autowired
    private ErrorMessageService errorMessageService;
    @PostMapping("/update")
    public ResponseEntity<ApiResponseDTO<?>> updateUserPassword(@RequestBody PasswordUpdateRequestDTO request) {
        return  ResponseEntity.ok(ApiResponseDTO.error(errorMessageService.getError(500)));
    }
}
