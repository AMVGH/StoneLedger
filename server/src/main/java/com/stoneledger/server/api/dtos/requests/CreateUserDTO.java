package com.stoneledger.server.api.dtos.requests;

import com.stoneledger.server.api.enums.UserRole;
import lombok.Data;
import org.springframework.cglib.core.Local;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class CreateUserDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String userAddress;
    private LocalDate dateOfBirth;
    private UserRole userRole;
    private Boolean active;
    private LocalDateTime activityStartDate;
    private LocalDateTime activityEndDate;
}
