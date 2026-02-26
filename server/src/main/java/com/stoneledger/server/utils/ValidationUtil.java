package com.stoneledger.server.utils;

import com.stoneledger.server.api.dtos.requests.LoginRequestDTO;
import com.stoneledger.server.api.dtos.requests.RegistrationRequestDTO;
import com.stoneledger.server.api.models.ErrorMessageModel;
import com.stoneledger.server.api.repositories.ErrorMessageRepository;
import com.stoneledger.server.api.repositories.UserRepository;
import com.stoneledger.server.api.exeptions.InvalidRequestException;
import com.stoneledger.server.services.ErrorMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.swing.text.html.Option;
import java.util.Optional;

@Service
public class ValidationUtil {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ErrorMessageService errorMessageService;

    public boolean isValidRegistrationRequest(RegistrationRequestDTO request) throws InvalidRequestException {
        //Checks that all fields contain content and are not empty coming in from the client
        if (request.getFirstName() == null || request.getFirstName().isBlank()
            || request.getLastName() == null || request.getLastName().isBlank()
            || request.getEmail() == null || request.getEmail().isBlank()
            || request.getPassword() == null || request.getPassword().isBlank()
            || request.getUserAddress() == null || request.getUserAddress().isBlank()
            || request.getDateOfBirth() == null
            || request.getUserRole() == null) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }

        //Checks that the email is unique and there is not an account already associated with the email
        else if (userRepository.existsByEmail(request.getEmail())) {
            throw new InvalidRequestException(errorMessageService.getError(101));
        }

        return true;
    }

    public boolean isValidLoginRequest(LoginRequestDTO request) throws InvalidRequestException {
        //Checks that all fields contain content and are not empty coming in from the client
        if (request.getUsername() == null || request.getUsername().isBlank()
            || request.getPassword() == null || request.getPassword().isBlank()) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        } else if (!userRepository.existsByUsername(request.getUsername())) {
            throw new InvalidRequestException(errorMessageService.getError(107));
        }
        return true;
    }
}
