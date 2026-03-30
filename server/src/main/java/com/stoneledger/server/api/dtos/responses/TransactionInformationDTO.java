package com.stoneledger.server.api.dtos.responses;

import com.stoneledger.server.api.dtos.requests.TransactionEntryDTO;
import com.stoneledger.server.api.enums.TransactionStatus;
import com.stoneledger.server.api.enums.TransactionType;
import com.stoneledger.server.api.models.TransactionEntryModel;
import com.stoneledger.server.api.models.UserModel;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class TransactionInformationDTO {
    private Long id;
    private TransactionType transactionType;
    private String transactionDescription;
    private byte[] attachment;
    private String attachmentName;
    private List<TransactionEntryDTO> accountsImpacted;
    private Long createdBy;
    private LocalDateTime createdDate;
    private TransactionStatus transactionStatus;
    private Long approvedBy;
    private LocalDateTime approvedDate;
    private String approvalComment;
}
