package com.atelicove.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.atelicove.dto.LoginRequest;

class LoginRequestTest {

    @Test
    void storesUsernameAndPassword() {
        LoginRequest request = new LoginRequest();

        request.setUsername("plee");
        request.setPassword("password123");

        assertEquals("plee", request.getUsername());
        assertEquals("password123", request.getPassword());
    }
}
