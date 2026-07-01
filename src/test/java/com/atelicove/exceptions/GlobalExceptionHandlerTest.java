package com.atelicove.exceptions;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.atelicove.exceptions.GlobalExceptionHandler;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void illegalArgumentReturnsBadRequestWithMessage() {
        ResponseEntity<Map<String, String>> response =
                handler.handleIllegalArgument(
                        new IllegalArgumentException("Invalid request"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody())
                .containsEntry("message", "Invalid request");
    }

    @Test
    void illegalStateReturnsConflictWithMessage() {
        ResponseEntity<Map<String, String>> response =
                handler.handleIllegalState(
                        new IllegalStateException("Invalid state"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody())
                .containsEntry("message", "Invalid state");
    }
}
