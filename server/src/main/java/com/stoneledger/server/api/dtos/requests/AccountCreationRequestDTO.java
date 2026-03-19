package com.stoneledger.server.api.dtos.requests;

import com.stoneledger.server.api.enums.AccountCategory;
import com.stoneledger.server.api.enums.AccountSubcategory;
import com.stoneledger.server.api.enums.AssociatedStatement;
import com.stoneledger.server.api.enums.NormalSide;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AccountCreationRequestDTO {
    private Long accountNumber;
    private String accountName;
    private String accountDescription;
    private NormalSide normalSide;
    private AccountCategory accountCategory;
    private AccountSubcategory accountSubcategory;
    private BigDecimal initialBalance;
    private BigDecimal debit;
    private BigDecimal credit;
    private BigDecimal balance;
    private Long userId;
    private Integer order;
    private AssociatedStatement associatedStatement;
    private String comment;
}
