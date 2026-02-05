package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.RegistrationRequestDTO;
import com.stoneledger.server.api.enums.ResponseStatus;
import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.services.RegisterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.text.MessageFormat;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    public RegisterService registerService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponseDTO<Void>> registerUser(@RequestBody RegistrationRequestDTO request) {
        //Parse incoming information and ensure that its valid
        //Step into the registration service and write a new user into the table
        //Use a ResponseEntity to send the API response indicating a success or fail for registration
        try {
            registerService.registerUser(request);

            return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponseDTO.of(ResponseStatus.SUCCESS));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponseDTO.of(
                    ResponseStatus.FAIL,
                    e.getMessage(),
                    null
                ));
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponseDTO.of(
                    ResponseStatus.FAIL,
                    "Internal error durin registration: " + e.getMessage(),
                    null
                ));
        }
    }

    //Login that returns a JWT
    @PostMapping("/login")
    public ResponseEntity<ApiResponseDTO<String>> loginUser (@RequestBody RegistrationRequestDTO request){
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(ApiResponseDTO.of(
            ResponseStatus.FAIL,
            "Login endpoint not implemented yet.",
            null
        ));
    }
}
