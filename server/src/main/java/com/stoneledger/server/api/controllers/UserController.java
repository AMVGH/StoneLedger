package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.requests.*;
import com.stoneledger.server.api.dtos.responses.PersonalUserInformationDTO;
import com.stoneledger.server.api.dtos.responses.UserInformationDTO;
import com.stoneledger.server.api.exeptions.MessagingLookupException;
import com.stoneledger.server.services.UserService;
import com.stoneledger.server.utils.ValidationUtil;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private ValidationUtil validationUtil;

    /*
     TODO: Implement Endpoint for: 1) Setting Security Questions and Answers
     */


    /**
     * Creates a new user with the StoneLedger system.
     * */
    @PostMapping("/create")
    public ResponseEntity<ApiResponseDTO<?>> createUser(@RequestBody CreateUserDTO request) throws GeneralSecurityException, MessagingException {
        validationUtil.isValidUserCreationRequest(request);
        String creationResponse = userService.createNewUser(request);
        return ResponseEntity.ok(ApiResponseDTO.success(creationResponse));
    }

    /**
     * Returns all users associated with the platform. Excludes sensitive information such as password, security question and answer.
     * */
    @GetMapping("/get-users")
    public ResponseEntity<ApiResponseDTO<?>> getAllUsers() {
        List<UserInformationDTO> systemUsers = userService.getSystemUsers();
        return ResponseEntity.ok(ApiResponseDTO.success(systemUsers));
    }

    /**
     * Designed to return user information according to the incoming JSON Web Token. Does not return sensitive data such as
     * passwords.
     * */
    @GetMapping("/logged-in-instance-info")
    public ResponseEntity<ApiResponseDTO<?>> userInstanceInfo(@RequestHeader("Authorization") String authHeader){
        validationUtil.isValidJwt(authHeader);
        PersonalUserInformationDTO userInformation = userService.retrieveUserInformation(authHeader);
        return ResponseEntity.ok(ApiResponseDTO.success(userInformation));
    }

    /**
     * Designed to accept a user based on their user id; issues an email via tha mailing service and sets the user's
     * status as active in the tables.
     * */
    @PostMapping("/approve/{id}")
    public ResponseEntity<ApiResponseDTO<?>> approveUser(@PathVariable Long id,
                                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime activityEndDate)
        throws MessagingException, MessagingLookupException, GeneralSecurityException {
        validationUtil.isValidUserId(id);
        userService.approveUserById(id, activityEndDate);
        return ResponseEntity.ok(ApiResponseDTO.success("User approved successfully."));
    }

    /**
     * Designed to reject a user based on their user id; issues an email via the mailing service notifying the user of
     * service rejection. Removes the user's records from the database tables.
     * */
    @PostMapping("/reject/{id}")
    public ResponseEntity<ApiResponseDTO<?>> rejectUser(@PathVariable Long id) throws MessagingException, MessagingLookupException{
        validationUtil.isValidUserId(id);
        userService.rejectUserById(id);
        return ResponseEntity.ok(ApiResponseDTO.success("User rejected successfully."));
    }

    /**
     * Designed to update user personal information, does not deal with information concerning user management such as Role, Suspension, etc.
     * */
    @PostMapping("/update-information")
    public ResponseEntity<ApiResponseDTO<?>> updateUserInformation(@RequestBody UpdateUserInformationDTO request) {
        validationUtil.isValidUpdateInformationRequest(request);
        String updateInformationResponse = userService.updateUserInformation(request);
        return ResponseEntity.ok(ApiResponseDTO.success(updateInformationResponse));
    }

    /**
     * Designed to update the activity of a user based on their user id, an activity status, and optional end date.
     * */
    @PostMapping("/update-activity")
    public ResponseEntity<ApiResponseDTO<?>> updateUserActivity(@RequestBody UserActivityDTO request) {
        validationUtil.isValidActivityRequest(request);
        String activityResponse = userService.setUserActivationStatus(request);
        return ResponseEntity.ok(ApiResponseDTO.success(activityResponse));
    }

    /**
     * Designed to update the role of a given user based on their user ID.
     * */
    @PostMapping("/update-role")
    public ResponseEntity<ApiResponseDTO<?>> updateUserRole(@RequestBody UpdateUserRoleDTO request) {
        validationUtil.isValidRoleUpdateRequest(request);
        String roleAssignmentResponse = userService.updateUserRole(request);
        return ResponseEntity.ok(ApiResponseDTO.success(roleAssignmentResponse));
    }

    /**
     * Designed to suspend a user from a start date to a defined end date.
     * */
    @PostMapping("/suspend-user")
    public ResponseEntity<ApiResponseDTO<?>> updateUserSuspension(@RequestBody UserSuspensionDTO request) {
        validationUtil.isValidSuspensionRequest(request);
        String suspensionResponse = userService.suspendUser(request);
        return ResponseEntity.ok(ApiResponseDTO.success(suspensionResponse));
    }

    /**
     * Designed to revoke a user suspension.
     * */
    @PostMapping("/revoke-suspension/{id}")
    public ResponseEntity<ApiResponseDTO<?>> revokeUserSuspension(@PathVariable Long id){
        validationUtil.isValidSuspensionRevocationRequest(id);
        String revokeResponse = userService.revokeSuspension(id);
        return ResponseEntity.ok(ApiResponseDTO.success(revokeResponse));
    }

    /**
     * Resets login attempts and restores system access for a user who has been locked out.
     * */
    @PostMapping("/reset-login-attempts/{id}")
    public ResponseEntity<ApiResponseDTO<?>> resetAttemptsAndRestoreSystemAccess(@PathVariable Long id){
        validationUtil.isValidUserId(id);
        String resetAndRestorationResponse = userService.resetAttemptsAndRestoreSystemAccess(id);
        return ResponseEntity.ok(ApiResponseDTO.success(resetAndRestorationResponse));
    }

    /**
     * Designed to allow an admin to restore an individual's access to the system after a lapse in pass expiration.
     * Admin provides a new password and an email notifies the user of their restored access and new password. Server
     * manages things like pass history as well as active state and user pass expiry in tables.
     * */
    @PostMapping("/admin-restore")
    public ResponseEntity<ApiResponseDTO<?>> resetPassExpirationAndIssueNewPassword(@RequestBody PasswordUpdateRequestDTO request) throws MessagingException, GeneralSecurityException {
        validationUtil.isValidPasswordUpdateRequest(request);
        String resetRestoreAndIssuanceResponse = userService.resetPasswordExpirationAndRestoreSystemAccess(request);
        return ResponseEntity.ok(ApiResponseDTO.success(resetRestoreAndIssuanceResponse));
    }

    /**
     * Designed to issue an email to a user, takes a userID and a message body string and utilizes the email service to issue an
     * email to the target.
     * */
    @PostMapping("/issue-email")
    public ResponseEntity<ApiResponseDTO<?>> issueEmailToUser(@RequestBody IssueEmailDTO request) throws MessagingException {
        validationUtil.isValidEmailIssuance(request);
        String issueEmailToUserResponse = userService.issueEmailToUser(request);
        return ResponseEntity.ok(ApiResponseDTO.success(issueEmailToUserResponse));
    }
}
