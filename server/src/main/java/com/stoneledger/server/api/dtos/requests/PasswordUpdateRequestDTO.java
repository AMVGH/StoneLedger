package com.stoneledger.server.api.dtos.requests;

import lombok.Data;

@Data
public class PasswordUpdateRequestDTO {
    private Long id;
    private String updatedPassword;
}
