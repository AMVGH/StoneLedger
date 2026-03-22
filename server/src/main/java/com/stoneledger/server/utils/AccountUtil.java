package com.stoneledger.server.utils;

import com.stoneledger.server.api.enums.NormalSide;
import com.stoneledger.server.api.exeptions.FinancialAccountException;
import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.services.ErrorMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class AccountUtil {
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
}
