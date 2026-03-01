package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class InvalidLocalDateTimeException extends AppException {
    public InvalidLocalDateTimeException (ErrorMessageModel errorMessageModel){
        super(errorMessageModel);
    }
}
