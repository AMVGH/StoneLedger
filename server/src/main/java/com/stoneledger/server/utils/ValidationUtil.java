package com.stoneledger.server.utils;

import com.stoneledger.server.api.dtos.requests.*;
import com.stoneledger.server.api.exeptions.*;
import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.api.repositories.UserRepository;
import com.stoneledger.server.services.ErrorMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ValidationUtil {
    @Autowired
    private UserRepository userRepository;
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
            || request.getUserRole() == null) {
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
        // Ensures all fields are non-empty
        if (request.getId() == null || request.getSuspensionStartDate() == null || request.getSuspensionEndDate() == null) {
            throw new InvalidRequestException(errorMessageService.getError(100));
        }

        // Ensures that the user associated with the ID exists
        UserModel user = userRepository.findById(request.getId())
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));

        // Ensures that the suspension start date is not before today's date
        if (request.getSuspensionStartDate().isBefore(LocalDateTime.now())) {
            throw new InvalidLocalDateTimeException(errorMessageService.getError(114));
        }

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
        isValidUserId(id);
        UserModel user = userRepository.findById(id)
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));
        if (!user.isSuspended()) {
            throw new UserSuspensionException(errorMessageService.getError(116));
        }
        return true;
    }

    public boolean isValidRoleUpdateRequest(UpdateUserRoleDTO request) throws InvalidIdException, InvalidRequestException {
        isValidUserId(request.getId());
        UserModel user = userRepository.findById(request.getId())
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));
        if (user.getUserRole() == request.getUserRole()) {
            throw new InvalidRequestException(errorMessageService.getError(117));
        }
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

        if (request.getActivityStartDate().isBefore(LocalDateTime.now())) {
            throw new InvalidLocalDateTimeException(errorMessageService.getError(114));
        }

        if (request.getActivityEndDate() != null && request.getActivityEndDate().isBefore(request.getActivityStartDate())) {
            throw new InvalidLocalDateTimeException(errorMessageService.getError(115));
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new InvalidRequestException(errorMessageService.getError(101));
        }

        return true;
    }
}
