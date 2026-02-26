package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class InvalidRequestException extends AppException {
    public InvalidRequestException(ErrorMessageModel errorModel) {
        super(errorModel);
    }
}
