package com.atelicove.dto;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.atelicove.dto.LoginResponse;

class LoginResponseTest {

    @Test
    void constructorStoresWorkerInformation() {
        LoginResponse response =
                new LoginResponse(7, "plee", "Pat", "Lee", "plee@test.com", true);

        assertAll(
                () -> assertEquals(7, response.getWorkerID()),
                () -> assertEquals("plee", response.getWorkerUser()),
                () -> assertEquals("Pat", response.getWorkerFName()),
                () -> assertEquals("Lee", response.getWorkerLName()),
                () -> assertEquals("plee@test.com", response.getWorkerEmail()),
                () -> assertTrue(response.isAdmin()));
    }
}
