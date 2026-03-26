package com.stoneledger.server.utils;

import com.stoneledger.server.api.dtos.requests.TransactionEntryDTO;
import com.stoneledger.server.api.enums.NormalSide;
import com.stoneledger.server.api.exeptions.FinancialAccountException;
import com.stoneledger.server.api.exeptions.TransactionValidationException;
import com.stoneledger.server.services.ErrorMessageService;
import jakarta.transaction.InvalidTransactionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class MonetaryUtil {
    @Autowired
    private ErrorMessageService errorMessageService;
    public void validateAccountBalance(NormalSide normalSide, BigDecimal initialBalance, BigDecimal debit, BigDecimal credit, BigDecimal balance) {
        BigDecimal calculatedBalance;
        BigDecimal balanceActual = balance;

        switch(normalSide) {
            case LEFT -> calculatedBalance = initialBalance
                .add(debit)
                .subtract(credit);
            case RIGHT -> calculatedBalance = initialBalance
                .add(credit)
                .subtract(debit);
            default -> throw new FinancialAccountException(errorMessageService.getError(100));
        }

        if (calculatedBalance.compareTo(balanceActual) != 0) {
            throw new FinancialAccountException(errorMessageService.getError(128));
        }
    }

    public void validateIncomingTransaction(List<TransactionEntryDTO> transactionEntries) {
        BigDecimal debitBalance = BigDecimal.ZERO;
        BigDecimal creditBalance = BigDecimal.ZERO;

        for (TransactionEntryDTO entry : transactionEntries) {
            switch (entry.getEntryType()) {
                case DEBIT -> debitBalance = debitBalance.add(entry.getAmount());
                case CREDIT -> creditBalance = creditBalance.add(entry.getAmount());
            }
        }

        if (debitBalance.compareTo(creditBalance) != 0) {
            throw new TransactionValidationException(errorMessageService.getError(126));
        }
    }
}
