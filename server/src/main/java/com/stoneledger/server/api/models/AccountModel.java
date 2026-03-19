package com.stoneledger.server.api.models;

import com.stoneledger.server.api.enums.AccountCategory;
import com.stoneledger.server.api.enums.AccountSubcategory;
import com.stoneledger.server.api.enums.AssociatedStatement;
import com.stoneledger.server.api.enums.NormalSide;
import jakarta.persistence.*;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="accounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id", nullable = false, updatable = false)
    private long id;
    @Column(name="account_number", nullable = false, unique = true)
    private long accountNumber;
    @Column(name="account_name", nullable = false, unique = true)
    private String accountName;
    @Column(name="account_description")
    private String accountDescription;
    @Column(name="is_active")
    private boolean isActive;
    @Enumerated(EnumType.STRING)
    @Column(name="normal_side", nullable = false)
    private NormalSide normalSide;
    @Enumerated(EnumType.STRING)
    @Column(name="account_category", nullable = false)
    private AccountCategory accountCategory;
    @Enumerated(EnumType.STRING)
    @Column(name="account_subcategory")
    private AccountSubcategory accountSubcategory;
    @Column(name="initial_balance", precision = 15, scale = 2, nullable = false)
    @Digits(integer = 13, fraction = 2)
    @PositiveOrZero
    private BigDecimal initialBalance; // Two decimal restriction, BigDecimal for precision.
    @Column(name="debit", precision = 15, scale = 2, nullable = false)
    @Digits(integer = 13, fraction = 2)
    @PositiveOrZero
    private BigDecimal debit; // Two decimal restriction, BigDecimal for precision.
    @Column(name="credit", precision = 15, scale = 2, nullable = false)
    @Digits(integer = 13, fraction = 2)
    @PositiveOrZero
    private BigDecimal credit; // Two decimal restriction, BigDecimal for precision.
    @Column(name="balance", precision = 15, scale = 2, nullable = false)
    @Digits(integer = 13, fraction = 2)
    private BigDecimal balance; // Two decimal restriction, BigDecimal for precision.
    @Column(name="account_add_date")
    private LocalDateTime accountAddDate;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="added_by", nullable = false)
    private UserModel user;
    @Column(name="account_order",nullable = false)
    private int order;
    @Enumerated(EnumType.STRING)
    @Column(name="associated_statement", nullable = false)
    private AssociatedStatement associatedStatement;
    @Column(name="comment")
    private String comment;
}
