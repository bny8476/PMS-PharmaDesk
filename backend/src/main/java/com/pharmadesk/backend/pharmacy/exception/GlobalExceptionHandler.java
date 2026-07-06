package com.pharmadesk.backend.pharmacy.exception;

import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Centralised exception → HTTP error response mapping.
 *
 * All handlers return {@link ApiResponse} so the frontend sees a consistent
 * {@code { success, message, data }} envelope regardless of the error type.
 *
 * Priority order (most specific → least specific):
 *   1. Bean-validation failures   → 400 with field-level detail map in {@code data}
 *   2. IllegalArgumentException   → 400 (bad caller input from service layer)
 *   3. Domain exceptions          → 400 / 404 as appropriate
 *   4. AuthenticationException    → 401
 *   5. Catch-all                  → 500 (logged at ERROR)
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── Bean-validation failures (@Valid) ──────────────────────────────────────

    /**
     * Converts field-level constraint violations into a structured 400 response.
     * Field errors are placed in {@code data} so the UI can map them to form fields.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex) {

        Map<String, String> fieldErrors = ex.getBindingResult().getAllErrors().stream()
                .filter(e -> e instanceof FieldError)
                .map(e -> (FieldError) e)
                .collect(Collectors.toMap(FieldError::getField,
                        e -> e.getDefaultMessage() != null ? e.getDefaultMessage() : "Invalid value",
                        (a, b) -> a));  // keep first message on duplicate fields

        ApiResponse<Map<String, String>> body = new ApiResponse<>(false, "Validation failed", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // ── Caller-input errors ────────────────────────────────────────────────────

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex) {
        log.error("Data integrity violation: ", ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Missing required field or database constraint violation."));
    }

    // ── Domain exceptions ──────────────────────────────────────────────────────

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ApiResponse<Void>> handleInsufficientStock(InsufficientStockException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(InvalidReturnException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidReturn(InvalidReturnException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(ExpiredStockException.class)
    public ResponseEntity<ApiResponse<Void>> handleExpiredStock(ExpiredStockException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    // ── Security ───────────────────────────────────────────────────────────────

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Authentication failed: " + ex.getMessage()));
    }

    // ── Catch-all ─────────────────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred. Please contact support."));
    }
}
