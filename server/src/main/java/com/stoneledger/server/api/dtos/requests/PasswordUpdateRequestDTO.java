package com.stoneledger.server.api.dtos.requests;

import lombok.Data;

@Data
public class PasswordUpdateRequestDTO {
    private long id;
    private String updatedPassword;
}
