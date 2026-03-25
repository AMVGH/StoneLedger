package com.stoneledger.server.api.dtos.requests;

import lombok.Data;

@Data
public class ActivationRequestDTO {
    private Long userId;
    private Long accountNumber;
}
