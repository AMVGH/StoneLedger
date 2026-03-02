package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class InvalidEmailException extends AppException {
    public InvalidEmailException(ErrorMessageModel errorMessageModel) {
        super(errorMessageModel);
    }
}
