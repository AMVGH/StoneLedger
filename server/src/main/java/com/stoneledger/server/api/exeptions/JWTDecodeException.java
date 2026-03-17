package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class JWTDecodeException extends AppException {
    public JWTDecodeException (ErrorMessageModel errorMessageModel){
        super(errorMessageModel);
    }
}
