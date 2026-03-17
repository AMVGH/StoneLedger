package com.stoneledger.server.api.dtos;


import com.stoneledger.server.api.models.ErrorMessageModel;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ApiResponseDTO<T> {
    private int code;
    private String key;
    private String message;
    private T data;

    public static <T> ApiResponseDTO<T> success(T data){
        return new ApiResponseDTO<>(200, "Success", "Request completed successfully.", data);
    }

    public static <T> ApiResponseDTO<T> error(ErrorMessageModel error) {
        return new ApiResponseDTO<>(error.getErrorCode(), error.getErrorKey(), error.getErrorMessage(), null);
    }
}

