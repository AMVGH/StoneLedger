package com.stoneledger.server.api.dtos.requests;

import com.stoneledger.server.api.enums.TransactionType;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class TransactionCreationDTO {
    private TransactionType transactionType;
    private String transactionDescription;
    private Long createdBy;
    private List<TransactionEntryDTO> accountsImpacted;
}
