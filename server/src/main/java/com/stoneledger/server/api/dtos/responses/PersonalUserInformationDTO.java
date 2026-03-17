package com.stoneledger.server.api.dtos.responses;

import com.stoneledger.server.api.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PersonalUserInformationDTO {
    private long id;
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private String userAddress;
    private LocalDate dateOfBirth;
    private UserRole userRole;
}
