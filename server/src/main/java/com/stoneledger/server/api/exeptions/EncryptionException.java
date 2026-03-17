package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;

public class EncryptionException extends AppException {
    public EncryptionException(ErrorMessageModel errorModel) {
        super(errorModel);
    }
}
