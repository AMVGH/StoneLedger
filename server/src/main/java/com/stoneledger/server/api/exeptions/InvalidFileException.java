package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class InvalidFileException extends AppException {
    public InvalidFileException (ErrorMessageModel errorMessageModel) {
        super(errorMessageModel);
    }
}
