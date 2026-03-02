package com.stoneledger.server.api.dtos.requests;

import com.stoneledger.server.api.enums.UserRole;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegistrationRequestDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String userAddress;
    private LocalDate dateOfBirth;
    private UserRole userRole;
}
