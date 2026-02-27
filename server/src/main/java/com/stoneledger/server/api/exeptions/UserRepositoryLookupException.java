package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class UserRepositoryLookupException extends AppException {
    public UserRepositoryLookupException (ErrorMessageModel errorMessageModel) {
        super(errorMessageModel);
    }
}
