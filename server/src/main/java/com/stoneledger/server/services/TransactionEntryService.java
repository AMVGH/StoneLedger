package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.requests.TransactionEntryDTO;
import com.stoneledger.server.api.enums.LoggingEvents;
import com.stoneledger.server.api.enums.LoggingTables;
import com.stoneledger.server.api.models.TransactionEntryModel;
import com.stoneledger.server.api.repositories.TransactionEntryRepository;
import jakarta.transaction.Transactional;
import jdk.jfr.Event;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransactionEntryService {
    @Autowired
    private TransactionEntryRepository transactionEntryRepository;
    @Autowired
    private EventLoggingService eventLoggingService;
    @Transactional
    public void saveInnerTransactionEntries(Long userId, List<TransactionEntryModel> transactionInnerEntries) {
        transactionEntryRepository.saveAll(transactionInnerEntries);

        eventLoggingService.logEvent(
            userId,
            LoggingTables.TRANSACTION_ENTRIES,
            LoggingEvents.CREATE,
            null,
            transactionInnerEntries
        );
    }
}
