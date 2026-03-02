package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class InvalidJwtException extends AppException {
    public InvalidJwtException (ErrorMessageModel errorMessageModel) {
        super(errorMessageModel);
    }
}
