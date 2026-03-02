package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class InvalidIdException extends AppException {
    public InvalidIdException (ErrorMessageModel errorMessageModel) {
        super(errorMessageModel);
    }
}
