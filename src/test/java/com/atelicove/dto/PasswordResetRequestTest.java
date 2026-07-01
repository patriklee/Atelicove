package com.atelicove.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.atelicove.dto.PasswordResetRequest;

class PasswordResetRequestTest {

    @Test
    void storesNewPassword() {
        PasswordResetRequest request = new PasswordResetRequest();

        request.setNewPassword("new-password");

        assertEquals("new-password", request.getNewPassword());
    }
}
