package com.stoneledger.server.api.models;

import com.stoneledger.server.api.enums.EntryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionEntryModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "transaction_id", nullable = true) // ONLY null on account creation entries, otherwise this should always have a reference.
    private TransactionModel parentTransaction;

    @ManyToOne
    @JoinColumn(name = "account_id", nullable = false)
    private AccountModel accountImpacted;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false)
    private EntryType entryType;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved;

    @Column (name="entry_date", nullable = false)
    private LocalDateTime entryDate;
}
