package com.stoneledger.server.api.dtos.responses;

import com.stoneledger.server.api.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO {
    private String JsonWebToken;
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private UserRole userRole;
}
