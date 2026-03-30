package com.stoneledger.server.api.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AccountSummaryDTO {
    private String accountName;
    private Long accountNumber;
}
