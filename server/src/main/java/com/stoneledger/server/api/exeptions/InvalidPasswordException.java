package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class InvalidPasswordException extends AppException {
    public InvalidPasswordException(ErrorMessageModel errorMessageModel){
        super(errorMessageModel);
    }
}
