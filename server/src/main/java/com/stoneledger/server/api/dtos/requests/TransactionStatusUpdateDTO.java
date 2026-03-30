package com.stoneledger.server.api.dtos.requests;

import com.stoneledger.server.api.enums.TransactionStatus;
import lombok.Data;

@Data
public class TransactionStatusUpdateDTO {
    private Long transactionId;
    private String statusUpdateReason;
    private Long userId;
}
