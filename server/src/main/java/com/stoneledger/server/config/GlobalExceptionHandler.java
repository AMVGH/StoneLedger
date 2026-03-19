package com.stoneledger.server.config;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.exeptions.AppException;
import com.stoneledger.server.services.ErrorMessageService;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @Autowired
    private ErrorMessageService errorMessageService;
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponseDTO<?>> handleAppException(AppException e) {
        return ResponseEntity.badRequest().body(ApiResponseDTO.error(e.getErrorModel()));
    }

    @ExceptionHandler(MessagingException.class)
    public ResponseEntity<ApiResponseDTO<?>> handleMessagingException(MessagingException e) {
        return ResponseEntity.internalServerError().body(
            ApiResponseDTO.error(errorMessageService.getError(104))
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponseDTO<?>> handleException(Exception e) {
        return ResponseEntity.internalServerError().body(ApiResponseDTO.error(errorMessageService.getError(500)));
    }
}
