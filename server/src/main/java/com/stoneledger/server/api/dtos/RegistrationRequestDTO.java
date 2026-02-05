package com.stoneledger.server.api.dtos;

import com.stoneledger.server.api.enums.UserRole;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.LocalDate;


//TODO: Enforce additional ruling constraints using @NotBlank, @Size, and @Pattern

@Data
public class RegistrationRequestDTO {
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private String password;
    private LocalDate dateOfBirth;
    private UserRole userRole;

}
