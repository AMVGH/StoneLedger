package com.stoneledger.server.api.dtos.responses;

import com.stoneledger.server.api.enums.AccountCategory;
import com.stoneledger.server.api.enums.AccountSubcategory;
import com.stoneledger.server.api.enums.AssociatedStatement;
import com.stoneledger.server.api.enums.NormalSide;
import com.stoneledger.server.api.models.UserModel;
import jakarta.persistence.*;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountInformationDTO {
    private long id;
    private long accountNumber;
    private String accountName;
    private String accountDescription;
    private boolean isActive;
    private NormalSide normalSide;
    private AccountCategory accountCategory;
    private AccountSubcategory accountSubcategory;
    private BigDecimal initialBalance; // Two decimal restriction, BigDecimal for precision.
    private BigDecimal debit; // Two decimal restriction, BigDecimal for precision.
    private BigDecimal credit; // Two decimal restriction, BigDecimal for precision.
    private BigDecimal balance; // Two decimal restriction, BigDecimal for precision.
    private LocalDateTime accountAddDate;
    private long userId;
    private int order;
    private AssociatedStatement associatedStatement;
    private String comment;
}
