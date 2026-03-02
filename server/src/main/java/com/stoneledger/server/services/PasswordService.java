package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.requests.PasswordUpdateRequestDTO;
import com.stoneledger.server.api.exeptions.InvalidIdException;
import com.stoneledger.server.api.models.PasswordModel;
import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.api.repositories.PasswordRepository;
import com.stoneledger.server.api.repositories.UserRepository;
import com.stoneledger.server.utils.EncryptionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.GeneralSecurityException;
import java.time.LocalDateTime;

@Service
public class PasswordService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordRepository passwordRepository;
    @Autowired
    private EncryptionUtil encryptionUtil;
    @Autowired
    private ErrorMessageService errorMessageService;

    public String updatePassword(PasswordUpdateRequestDTO request) throws GeneralSecurityException {
        UserModel user = userRepository.findById(request.getId())
            .orElseThrow(() -> new InvalidIdException(errorMessageService.getError(112)));

        LocalDateTime currentDateTime = LocalDateTime.now();
        LocalDateTime expiryDateTime = currentDateTime.plusDays(90);
        String encryptedPassword = encryptionUtil.encrypt(request.getUpdatedPassword());

        user.setPassword(encryptedPassword);
        user.setPasswordExpirationDate(expiryDateTime);

        PasswordModel passwordHistoryInstance = PasswordModel.builder()
            .user(user)
            .password(encryptedPassword)
            .validFrom(currentDateTime)
            .validTo(expiryDateTime)
            .build();

        userRepository.save(user);
        passwordRepository.save(passwordHistoryInstance);

        return "User ID: " + user.getId() + " password update successful";
    }
}
