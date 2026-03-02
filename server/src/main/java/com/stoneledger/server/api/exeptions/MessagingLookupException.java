package com.stoneledger.server.api.exeptions;

import com.stoneledger.server.api.models.ErrorMessageModel;
import org.springframework.mail.MailException;

public class MessagingLookupException extends AppException {
    public MessagingLookupException(ErrorMessageModel errorModel) {
        super(errorModel);
    }
}
