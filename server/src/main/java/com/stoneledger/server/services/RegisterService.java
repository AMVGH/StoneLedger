package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.requests.RegistrationRequestDTO;
import com.stoneledger.server.api.exeptions.EncryptionException;
import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.utils.EncryptionUtil;
import com.stoneledger.server.api.repositories.UserRepository;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.GeneralSecurityException;
import java.time.LocalDateTime;

@Service
public class RegisterService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EncryptionUtil encryptionUtil;
    @Autowired
    private EmailService emailService;
    @Autowired
    private ErrorMessageService errorMessageService;

    public void registerUser(RegistrationRequestDTO request) throws MessagingException {
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
                .passwordExpirationDate(LocalDateTime.now().plusDays(90))
                .userAddress(request.getUserAddress())
                .dateOfBirth(request.getDateOfBirth())
                .profilePictureUrl(null)
                .userRole(request.getUserRole())
                .accountCreationDate(accountCreationDate)
                .active(false)
                .activityStartDate(null)
                .activityEndDate(null)
                .suspended(false)
                .suspendStartDate(null)
                .suspendEndDate(null)
                .lastLogin(null)
                .failedLoginAttempts(0)
                .securityQuestion(null)
                .securityAnswer(null)
                .build();
            userRepository.save(newUser);
            emailService.sendAdminApprovalRequest(newUser);
    }
}
