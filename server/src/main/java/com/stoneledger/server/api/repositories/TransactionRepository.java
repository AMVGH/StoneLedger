package com.stoneledger.server.api.repositories;

import com.stoneledger.server.api.enums.TransactionStatus;
import com.stoneledger.server.api.models.TransactionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionModel, Long> {
    List<TransactionModel> findByTransactionStatus(TransactionStatus status);
    List<TransactionModel> findAllByOrderByCreatedDateDesc();
}
