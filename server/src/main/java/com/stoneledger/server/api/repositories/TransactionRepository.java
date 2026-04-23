package com.stoneledger.server.api.repositories;

import com.stoneledger.server.api.enums.TransactionStatus;
import com.stoneledger.server.api.enums.TransactionType;
import com.stoneledger.server.api.models.TransactionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionModel, Long> {
    List<TransactionModel> findByTransactionStatus(TransactionStatus status);
    List<TransactionModel> findAllByOrderByCreatedDateDesc();
    List<TransactionModel> findByTransactionStatusAndCreatedDateLessThanEqualOrderByCreatedDateAsc(
        TransactionStatus status,
        LocalDateTime endDate
    );

    Optional<TransactionModel> findFirstByTransactionTypeAndTransactionStatusAndCreatedDateLessThanEqualOrderByCreatedDateDesc(
        TransactionType type,
        TransactionStatus status,
        LocalDateTime endDate
    );
}
