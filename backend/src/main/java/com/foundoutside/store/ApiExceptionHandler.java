package com.foundoutside.store;

import com.foundoutside.WebErrorController.ErrorDetail;
import com.foundoutside.WebErrorController.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handle(ApiException exception) {
        return ResponseEntity.status(exception.status()).body(
                new ErrorResponse(new ErrorDetail(exception.code(), exception.getMessage())));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> invalidJson() {
        return ResponseEntity.badRequest().body(new ErrorResponse(
                new ErrorDetail("VALIDATION_FAILED", "Request body must be valid JSON")));
    }
}
