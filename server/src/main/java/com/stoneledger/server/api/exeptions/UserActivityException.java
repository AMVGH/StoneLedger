package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class UserActivityException extends AppException {
    public UserActivityException(ErrorMessageModel errorMessageModel) {
        super(errorMessageModel);
    }
}
