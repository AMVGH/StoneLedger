package com.stoneledger.server.api.dtos.requests;

import lombok.Data;

@Data
public class LoginRequestDTO {
    private String username;
    private String password;
}
