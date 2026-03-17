package com.stoneledger.server.services;

import com.stoneledger.server.api.models.ErrorMessageModel;
import com.stoneledger.server.api.repositories.ErrorMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ErrorMessageService {
    @Autowired
    private ErrorMessageRepository errorMessageRepository;

    public ErrorMessageModel getError (int errorCode) {
        return errorMessageRepository.findById(errorCode)
            .orElseThrow(() -> new RuntimeException("Error message not found"));
    }
}
