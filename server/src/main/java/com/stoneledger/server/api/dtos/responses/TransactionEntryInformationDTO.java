package com.stoneledger.server.api.dtos.responses;

import com.stoneledger.server.api.enums.EntryType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionEntryInformationDTO {
    private Long accountId;
    private EntryType entryType;
    private BigDecimal amount;
}
