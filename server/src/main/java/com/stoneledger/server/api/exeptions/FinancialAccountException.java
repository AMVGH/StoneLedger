package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class FinancialAccountException extends AppException {
    public FinancialAccountException(ErrorMessageModel errorMessageModel) {
        super(errorMessageModel);
    }
}
