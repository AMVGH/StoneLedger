package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.responses.UserInformationDTO;
import com.stoneledger.server.api.exeptions.MessagingLookupException;
import com.stoneledger.server.api.exeptions.UserRepositoryLookupException;
import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.api.repositories.ErrorMessageRepository;
import com.stoneledger.server.api.repositories.UserRepository;
import com.stoneledger.server.utils.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.swing.text.html.Option;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmailService emailService;
    @Autowired
    private ErrorMessageService errorMessageService;

    public void approveUserById (Long id) throws MessagingException, MessagingLookupException {
        UserModel approvedUser = userRepository.findById(id)
            .orElseThrow(() -> new MessagingLookupException(errorMessageService.getError(105)));
        approvedUser.setActive(true);
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

    public UserInformationDTO retrieveUserInformation (String authHeader) throws UserRepositoryLookupException {
        String jwtToken = authHeader.substring(7);
        Claims claims = JwtUtil.decodeJwt(jwtToken);
        String username = claims.get("username", String.class);

        UserModel user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UserRepositoryLookupException(errorMessageService.getError(112)));

        return new UserInformationDTO (
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getUserAddress(),
            user.getDateOfBirth(),
            user.getUserRole()
        );
    }
}
