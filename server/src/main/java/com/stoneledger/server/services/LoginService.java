package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.requests.LoginRequestDTO;
import com.stoneledger.server.api.dtos.responses.LoginResponseDTO;
import com.stoneledger.server.api.exeptions.AccountInactiveException;
import com.stoneledger.server.api.exeptions.AccountSuspendedException;
import com.stoneledger.server.api.exeptions.InvalidPasswordException;
import com.stoneledger.server.api.exeptions.InvalidRequestException;
import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.api.repositories.UserRepository;
import com.stoneledger.server.utils.EncryptionUtil;
import com.stoneledger.server.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.swing.text.html.Option;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class LoginService {
    @Autowired
    private ErrorMessageService errorMessageService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EncryptionUtil encryptionUtil;


    // TODO: Make sure that all business rules associated with account login are met.
    public LoginResponseDTO loginUser (LoginRequestDTO request) throws AccountInactiveException, AccountSuspendedException,
        InvalidRequestException, InvalidPasswordException, GeneralSecurityException {
        UserModel user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new InvalidRequestException(errorMessageService.getError(107)));

        if (!user.isActive()) {
            throw new AccountInactiveException(errorMessageService.getError(108));
        } else if (user.isSuspended()) {
            throw new AccountSuspendedException(errorMessageService.getError(109));
        }

        if (user.getFailedLoginAttempts() >= 3) {
            LocalDateTime lockoutDateTime = LocalDateTime.now();
            user.setSuspended(true);
            user.setSuspendStartDate(lockoutDateTime);
            userRepository.save(user);
            throw new AccountSuspendedException(errorMessageService.getError(110));
        }

        String encryptedPassword = encryptionUtil.encrypt(request.getPassword());
        if (MessageDigest.isEqual(
            encryptedPassword.getBytes(StandardCharsets.UTF_8),
            user.getPassword().getBytes(StandardCharsets.UTF_8)
        )) {
            LocalDateTime currentDateTime = LocalDateTime.now();
            user.setLastLogin(currentDateTime);

            // TODO: Confer with professor about failed login attempt handling, after X period set to 0? Set to 0 after a successful attempt?
            user.setFailedLoginAttempts(0);
            userRepository.save(user);

            String UserJwt = JwtUtil.createJwt(
                    user.getId(),
                    user.getUsername()
            );

            return new LoginResponseDTO(
                    UserJwt,
                    user.getFirstName(),
                    user.getLastName(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getUserRole()
            );
        } else {
            int loginAttempts = user.getFailedLoginAttempts();
            loginAttempts++;
            user.setFailedLoginAttempts(loginAttempts);
            if (loginAttempts >= 3) {
                LocalDateTime lockoutDateTime = LocalDateTime.now();
                user.setSuspendStartDate(lockoutDateTime);
                user.setSuspended(true);
                userRepository.save(user);
                throw new AccountSuspendedException(errorMessageService.getError(110));
            }
            userRepository.save(user);
            throw new InvalidPasswordException(errorMessageService.getError(107));
        }
    }
}
