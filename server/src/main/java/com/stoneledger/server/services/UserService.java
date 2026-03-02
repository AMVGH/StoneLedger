package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.requests.*;
import com.stoneledger.server.api.dtos.responses.PersonalUserInformationDTO;
import com.stoneledger.server.api.dtos.responses.UserInformationDTO;
import com.stoneledger.server.api.exeptions.*;
import com.stoneledger.server.api.models.PasswordModel;
import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.api.repositories.PasswordRepository;
import com.stoneledger.server.api.repositories.UserRepository;
import com.stoneledger.server.utils.EncryptionUtil;
import com.stoneledger.server.utils.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordRepository passwordRepository;
    @Autowired
    private EmailService emailService;
    @Autowired
    private ErrorMessageService errorMessageService;
    @Autowired
    private EncryptionUtil encryptionUtil;

    public String createNewUser(CreateUserDTO request) throws GeneralSecurityException, MessagingException {
        String userFirstName = request.getFirstName();
        String userLastName = request.getLastName();
        LocalDateTime accountCreationDate = LocalDateTime.now();

        String month = String.format("%02d", accountCreationDate.getMonthValue());
        String year = String.valueOf(accountCreationDate.getYear()).substring(2);

        String baseUsername = userFirstName.charAt(0) + userLastName + month + year;
        String finalUsername;

        int overlapValue = 2;
        if (!userRepository.existsByUsername(baseUsername)) {
            finalUsername = baseUsername;
        } else {
            while (userRepository.existsByUsername(baseUsername + overlapValue)) {
                overlapValue++;
            }
            finalUsername = baseUsername + overlapValue;
        }

        String encryptedPassword;
        try {
            encryptedPassword = encryptionUtil.encrypt(request.getPassword());
        } catch (GeneralSecurityException e) {
            throw new EncryptionException(errorMessageService.getError(103));
        }

        UserModel newUser = new UserModel().builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .username(finalUsername)
            .email(request.getEmail())
            .password(encryptedPassword)
            .passwordExpirationDate(accountCreationDate.plusDays(90))
            .userAddress(request.getUserAddress())
            .dateOfBirth(request.getDateOfBirth())
            .profilePictureUrl(null)
            .userRole(request.getUserRole())
            .accountCreationDate(accountCreationDate)
            .active(request.getActive())
            .activityStartDate(request.getActivityStartDate())
            .activityEndDate(request.getActivityEndDate())
            .suspended(false)
            .suspendStartDate(null)
            .suspendEndDate(null)
            .lastLogin(null)
            .failedLoginAttempts(0)
            .securityQuestion(null)
            .securityAnswer(null)
            .build();
        userRepository.save(newUser);
        emailService.sendApprovalNotification(newUser);

        return "User ID: " + newUser.getId() +
            "\nEmail: " + newUser.getEmail() +
            "\nActivity Status: " + newUser.isActive() +
            "\nCreation Status: Successful";
    }
    public void approveUserById (Long id, LocalDateTime activityEndDate) throws MessagingException, MessagingLookupException, GeneralSecurityException {
        LocalDateTime currentDateTime = LocalDateTime.now();
        UserModel approvedUser = userRepository.findById(id)
            .orElseThrow(() -> new MessagingLookupException(errorMessageService.getError(105)));
        approvedUser.setActivityStartDate(currentDateTime);
        approvedUser.setActivityEndDate(activityEndDate);
        approvedUser.setActive(true);

        PasswordModel passwordHistoryInstance =  PasswordModel.builder()
            .user(approvedUser)
            // This pass is already encrypted because we are building from the information from the table
            .password(approvedUser.getPassword())
            .validFrom(currentDateTime)
            .validTo(approvedUser.getPasswordExpirationDate())
            .build();

        passwordRepository.save(passwordHistoryInstance);
        userRepository.save(approvedUser);
        emailService.sendApprovalNotification(approvedUser);
    }

    //TODO: Confer with professor about approach. Should rejected records be maintained or deleted?
    public void rejectUserById (Long id) throws MessagingException, MessagingLookupException {
        UserModel rejectedUser = userRepository.findById(id)
            .orElseThrow(() -> new MessagingLookupException(errorMessageService.getError(105)));
        userRepository.deleteById(id);
        emailService.sendRejectionNotification(rejectedUser);
    }

    public List<UserInformationDTO> getSystemUsers() {


        return userRepository.findAll().stream()
            .map(systemUserFromTable -> {
                UserInformationDTO systemUserDTO = new UserInformationDTO();
                systemUserDTO.setId(systemUserFromTable.getId());
                systemUserDTO.setFirstName(systemUserFromTable.getFirstName());
                systemUserDTO.setLastName(systemUserFromTable.getLastName());
                systemUserDTO.setUsername(systemUserFromTable.getUsername());
                systemUserDTO.setEmail(systemUserFromTable.getEmail());
                systemUserDTO.setPasswordExpirationDate(systemUserFromTable.getPasswordExpirationDate());
                systemUserDTO.setUserAddress(systemUserFromTable.getUserAddress());
                systemUserDTO.setDateOfBirth(systemUserFromTable.getDateOfBirth());
                systemUserDTO.setProfilePictureUrl(systemUserFromTable.getProfilePictureUrl());
                systemUserDTO.setUserRole(systemUserFromTable.getUserRole());
                systemUserDTO.setAccountCreationDate(systemUserFromTable.getAccountCreationDate());
                systemUserDTO.setActive(systemUserFromTable.isActive());
                systemUserDTO.setActivityStartDate(systemUserFromTable.getActivityStartDate());
                systemUserDTO.setActivityEndDate(systemUserFromTable.getActivityEndDate());
                systemUserDTO.setSuspended(systemUserFromTable.isSuspended());
                systemUserDTO.setSuspendStartDate(systemUserFromTable.getSuspendStartDate());
                systemUserDTO.setSuspendEndDate(systemUserFromTable.getSuspendEndDate());
                systemUserDTO.setLastLogin(systemUserFromTable.getLastLogin());
                systemUserDTO.setFailedLoginAttempts(systemUserFromTable.getFailedLoginAttempts());
                return systemUserDTO;
            })
            .collect(Collectors.toList());
    }

    public PersonalUserInformationDTO retrieveUserInformation (String authHeader) throws UserRepositoryLookupException {
        String jwtToken = authHeader.substring(7);
        Claims claims = JwtUtil.decodeJwt(jwtToken);
        String username = claims.get("username", String.class);

        UserModel user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UserRepositoryLookupException(errorMessageService.getError(112)));

        return new PersonalUserInformationDTO(
            user.getId(),
            user.getFirstName(),
            user.getLastName(),
            user.getUsername(),
            user.getEmail(),
            user.getUserAddress(),
            user.getDateOfBirth(),
            user.getUserRole()
        );
    }

    public String setUserActivationStatus (UserActivityDTO request) throws InvalidIdException {
        UserModel user = userRepository.findById(request.getId())
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));

        LocalDateTime localDateTimeNow = LocalDateTime.now();

        user.setActivityStartDate(localDateTimeNow);
        user.setActivityEndDate(request.getActivityEndDate());
        user.setActive(request.getActivityStatus());

        userRepository.save(user);

        String startDateString = String.valueOf(localDateTimeNow);
        String endDateString = (request.getActivityEndDate() == null) ? "No End Date" : String.valueOf(request.getActivityEndDate());
        String userActivityStatus = (request.getActivityStatus() == true) ? "Active" : "Inactive";

        return "User ID: " + user.getId() +
            "\nActivity Status: " + userActivityStatus +
            "\nFrom: " + startDateString +
            "\nTo: " + endDateString;
    }

    public String suspendUser (UserSuspensionDTO request) throws InvalidIdException {
        UserModel user = userRepository.findById(request.getId())
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));

        user.setSuspended(true);
        user.setSuspendStartDate(request.getSuspensionStartDate());
        user.setSuspendEndDate(request.getSuspensionEndDate());

        userRepository.save(user);
        return "User ID: " + user.getId() +
            "\nSuspension Status: Suspended " +
            "\nFrom: " + request.getSuspensionStartDate() +
            "\nTo: " + request.getSuspensionEndDate();
    }

    public String revokeSuspension (Long id) throws InvalidIdException {
        UserModel user = userRepository.findById(id)
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));

        user.setSuspended(false);
        user.setSuspendStartDate(null);
        user.setSuspendEndDate(null);

        userRepository.save(user);
        return "User ID: " + user.getId() +
            "\nSuspension Status: Revoked";
    }

    public String updateUserRole(UpdateUserRoleDTO request) throws InvalidIdException {
        UserModel user = userRepository.findById(request.getId())
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));

        String previousUserRole = String.valueOf(user.getUserRole());
        user.setUserRole(request.getUserRole());

        userRepository.save(user);
        return "User ID: " + user.getId() + "" +
            "\nPrevious Role: " + previousUserRole +
            "\nUpdated Role: " + String.valueOf(request.getUserRole());
    }

    public String resetAttemptsAndRestoreSystemAccess(Long id) {
        UserModel user = userRepository.findById(id)
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));

        user.setSuspended(false);
        user.setFailedLoginAttempts(0);

        userRepository.save(user);

        String suspensionString  = (user.isSuspended()) ? "Suspended" : "Not Suspended";
        return "User ID: " + user.getId() +
            "\nFailed Login Attempts: " + 0 +
            "\nSuspension Status: " + suspensionString;
    }


    // TODO: Endpoint for expired pass access restoration - (i.e. An administrator has updated your password, your new StoneLedger Password is: )
    public String resetPasswordExpirationAndRestoreSystemAccess(PasswordUpdateRequestDTO request) throws GeneralSecurityException, MessagingException{
        UserModel user = userRepository.findById(request.getId())
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));

        LocalDateTime currentDateTime = LocalDateTime.now();
        LocalDateTime expiryDateTime = currentDateTime.plusDays(90);
        String encryptedPassword = encryptionUtil.encrypt(request.getUpdatedPassword());

        user.setPassword(encryptedPassword);
        user.setPasswordExpirationDate(expiryDateTime);
        user.setActive(true);

        PasswordModel passwordHistoryInstance = PasswordModel.builder()
            .user(user)
            .password(encryptedPassword)
            .validFrom(currentDateTime)
            .validTo(expiryDateTime)
            .build();

        userRepository.save(user);
        passwordRepository.save(passwordHistoryInstance);
        emailService.sendPasswordAdminUpdateNotification(user);

        return "User ID: " + user.getId() +
            "\nActivity Status: " + user.isActive() +
            "\nPassword Update Status: Successful";
    }
}
