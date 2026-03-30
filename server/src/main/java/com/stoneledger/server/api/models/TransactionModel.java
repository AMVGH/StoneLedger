package com.stoneledger.server.api.models;

import com.stoneledger.server.api.enums.TransactionStatus;
import com.stoneledger.server.api.enums.TransactionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;
    @Column(name = "transaction_description", length = 500)
    private String transactionDescription;
    @Column(name = "attachment", columnDefinition = "LONGBLOB")
    private byte[] attachment;
    @Column(name = "attachment_name")
    private String attachmentName;
    @OneToMany(mappedBy = "parentTransaction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TransactionEntryModel> accountsImpacted;
    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false, updatable = false)
    private UserModel createdBy;
    @Column(name = "created_date", updatable = false)
    private LocalDateTime createdDate;
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_status", nullable = false)
    private TransactionStatus transactionStatus;
    @ManyToOne
    @JoinColumn(name = "updated_by")
    private UserModel updatedBy;
    @Column(name = "update_date")
    private LocalDateTime updateDate;
    @Column(name = "update_comment")
    private String updateComment;
}


