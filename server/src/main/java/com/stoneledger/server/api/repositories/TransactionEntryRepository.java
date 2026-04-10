package com.stoneledger.server.api.repositories;

import com.stoneledger.server.api.enums.EntryType;
import com.stoneledger.server.api.enums.TransactionType;
import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.api.models.TransactionEntryModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionEntryRepository extends JpaRepository <TransactionEntryModel, Long>{
    Optional<TransactionEntryModel> findByAccountImpactedAndEntryTypeAndParentTransactionIsNull(
        AccountModel accountImpacted,
        EntryType entryType
    );
    List<TransactionEntryModel> findByAccountImpactedAndIsApproved(AccountModel accountImpacted, boolean isApproved);
    List<TransactionEntryModel> findByAccountImpactedAndIsApprovedAndEntryDateLessThanEqual(
        AccountModel accountImpacted,
        boolean isApproved,
        LocalDateTime endDate
    );
    List<TransactionEntryModel> findByAccountImpactedAndIsApprovedAndEntryDateLessThanEqualAndParentTransactionTransactionType(
        AccountModel accountImpacted,
        boolean isApproved,
        LocalDateTime endDate,
        TransactionType transactionType
    );

    // In TransactionEntryRepository
    List<TransactionEntryModel> findByAccountImpactedAndIsApprovedAndEntryDateLessThan(
        AccountModel account,
        boolean isApproved,
        LocalDateTime date
    );

    List<TransactionEntryModel> findByAccountImpactedAndIsApprovedAndEntryDateBetween(
        AccountModel account,
        boolean isApproved,
        LocalDateTime startDate,
        LocalDateTime endDate
    );
}
