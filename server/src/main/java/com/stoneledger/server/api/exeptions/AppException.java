package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class AppException extends RuntimeException {
    private final ErrorMessageModel errorModel;

    public AppException(ErrorMessageModel errorModel){
        super(errorModel.getErrorMessage());
        this.errorModel = errorModel;
    }

    public ErrorMessageModel getErrorModel() {
        return errorModel;
    }
}
