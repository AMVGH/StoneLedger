package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class AccountSuspendedException extends AppException {
    public AccountSuspendedException (ErrorMessageModel errorMessageModel) {
        super (errorMessageModel);
    }
}
