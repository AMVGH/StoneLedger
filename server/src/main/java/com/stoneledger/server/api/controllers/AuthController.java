package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.requests.LoginRequestDTO;
import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.requests.RegistrationRequestDTO;
import com.stoneledger.server.api.dtos.responses.LoginResponseDTO;
import com.stoneledger.server.api.exeptions.InvalidPasswordException;
import com.stoneledger.server.api.repositories.ErrorMessageRepository;
import com.stoneledger.server.services.LoginService;
import com.stoneledger.server.services.RegisterService;
import com.stoneledger.server.utils.ValidationUtil;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.GeneralSecurityException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private RegisterService registerService;
    @Autowired
    private LoginService loginService;
    @Autowired
    private ValidationUtil validationUtil;
    @Autowired
    private ErrorMessageRepository errorMessageRepository;

    /**
     * Endpoint designed to register new users with the service, initially parses the incoming information to
     * ensure that it is valid and meets business rules. If the incoming request is valid, writes a new inactive user
     * to the table. This user will remain in an inactive state until an administrator approves the registration
     * request.
     * */
    @PostMapping("/request-access")
    public ResponseEntity<ApiResponseDTO<?>> registerUser(@RequestBody RegistrationRequestDTO request) throws MessagingException {
        validationUtil.isValidRegistrationRequest(request);
        registerService.registerUser(request);
        return ResponseEntity.ok(ApiResponseDTO.success(null));
    }

    /**
     * Endpoint designed to allow an already approved user into the system, the user status must be active and the suspension status
     * must be false, moreover the unencrypted password must match the password passed in the request.
     * */
    @PostMapping("/login")
    public ResponseEntity<ApiResponseDTO<?>> loginUser (@RequestBody LoginRequestDTO request) throws InvalidPasswordException, GeneralSecurityException {
        validationUtil.isValidLoginRequest(request);
        LoginResponseDTO loginResponseInformation = loginService.loginUser(request);
        return ResponseEntity.ok(ApiResponseDTO.success(loginResponseInformation));
    }
}
