package com.stoneledger.server.api.dtos.requests;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateUserInformationDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String userAddress;
    private LocalDate dateOfBirth;
}
