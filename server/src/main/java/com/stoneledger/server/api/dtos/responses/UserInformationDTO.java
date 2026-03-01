package com.stoneledger.server.api.dtos.responses;

import com.stoneledger.server.api.enums.UserRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInformationDTO {
    private long id;
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private LocalDateTime passwordExpirationDate;
    private String userAddress;
    private LocalDate dateOfBirth;
    private String profilePictureUrl;
    private UserRole userRole;
    private LocalDateTime accountCreationDate;
    private boolean active;
    private LocalDateTime activityStartDate;
    private LocalDateTime activityEndDate;
    private boolean suspended;
    private LocalDateTime suspendStartDate;
    private LocalDateTime suspendEndDate;
    private LocalDateTime lastLogin;
    private int failedLoginAttempts;
}
