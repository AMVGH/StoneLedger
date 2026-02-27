package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.responses.UserInformationDTO;
import com.stoneledger.server.api.exeptions.MessagingLookupException;
import com.stoneledger.server.services.UserService;
import com.stoneledger.server.utils.ValidationUtil;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private ValidationUtil validationUtil;

    /**
     * Designed to return user information according to the incoming JSON Web Token. Does not return sensitive data such as
     * passwords.
     * */
    @GetMapping("/user-info")
    public ResponseEntity<ApiResponseDTO<?>> userInstanceInfo(@RequestHeader("Authorization") String authHeader){
        validationUtil.isValidJwt(authHeader);
        UserInformationDTO userInformation = userService.retrieveUserInformation(authHeader);
        return ResponseEntity.ok(ApiResponseDTO.success(userInformation));
    }

    /**
     * Designed to accept a user based on their user id; issues an email via tha mailing service and sets the user's
     * status as active in the tables.
     * */
    @GetMapping("/approve/{id}")
    public ResponseEntity<ApiResponseDTO<?>> approveUser(@PathVariable Long id) throws MessagingException, MessagingLookupException {
        validationUtil.isValidUserId(id);
        userService.approveUserById(id);
        return ResponseEntity.ok(ApiResponseDTO.success("User approved successfully."));
    }

    /**
     * Designed to reject a user based on their user id; issues an email via the mailing service notifying the user of
     * service rejection. Removes the user's records from the database tables.
     * */
    @GetMapping("/reject/{id}")
    public ResponseEntity<ApiResponseDTO<?>> rejectUser(@PathVariable Long id) throws MessagingException, MessagingLookupException{
        validationUtil.isValidUserId(id);
        userService.rejectUserById(id);
        return ResponseEntity.ok(ApiResponseDTO.success("User rejected successfully."));
    }
}
