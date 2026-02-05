package com.stoneledger.server.api.dtos;


import com.stoneledger.server.api.enums.ResponseStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponseDTO<T> {
    private ResponseStatus status;
    private String message;
    private T data;

    public static <T> ApiResponseDTO<T> of (ResponseStatus status){
        return new ApiResponseDTO<>(status, null, null);
    }

    public static <T> ApiResponseDTO<T> of (ResponseStatus status, T data){
        return new ApiResponseDTO<>(status, null, data);
    }

    public static <T> ApiResponseDTO<T> of (ResponseStatus status, String message, T data){
        return new ApiResponseDTO<>(status, message, data);
    }
}

