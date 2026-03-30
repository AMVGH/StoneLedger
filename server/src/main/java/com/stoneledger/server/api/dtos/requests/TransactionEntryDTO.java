package com.stoneledger.server.api.dtos.requests;

import com.stoneledger.server.api.enums.EntryType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransactionEntryDTO {
    private Long accountId;
    private EntryType entryType;
    private BigDecimal amount;
}
