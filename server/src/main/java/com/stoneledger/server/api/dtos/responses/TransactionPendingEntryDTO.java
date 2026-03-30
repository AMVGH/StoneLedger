package com.stoneledger.server.api.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionPendingEntryDTO {
        private Long transactionId;
        private LocalDateTime transactionAddDate;
        private List<AccountSummaryDTO> accountsImpacted;
}
