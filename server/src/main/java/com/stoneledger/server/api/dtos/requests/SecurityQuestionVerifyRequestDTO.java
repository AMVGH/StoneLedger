package com.stoneledger.server.api.dtos.requests;

import lombok.Data;

@Data
public class SecurityQuestionVerifyRequestDTO {
    private long id;
    private String securityQuestion;
    private String securityQuestionAnswer;
}
