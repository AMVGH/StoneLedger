package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class TransactionValidationException extends AppException {
    public TransactionValidationException(ErrorMessageModel errorModel) {
        super(errorModel);
    }
}
