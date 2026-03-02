package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class AccountInactiveException extends AppException {
    public AccountInactiveException (ErrorMessageModel errorMessageModel) {
        super(errorMessageModel);
    }
}
