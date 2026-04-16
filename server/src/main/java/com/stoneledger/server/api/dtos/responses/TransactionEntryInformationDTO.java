package com.stoneledger.server.api.dtos.responses;

import com.stoneledger.server.api.enums.EntryType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionEntryInformationDTO {
    private Long id;
    private LocalDateTime date;
    private String description;
    private BigDecimal debit;
    private BigDecimal credit;
    private String journalReference;
}
