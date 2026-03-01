package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class UserSuspensionException extends AppException {
    public UserSuspensionException (ErrorMessageModel errorMessageModel) {
        super (errorMessageModel) ;
    }
}
