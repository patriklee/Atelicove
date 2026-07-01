package com.atelicove.controllers;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.Test;

import com.atelicove.controllers.WODocumentController;

class WODocumentControllerTest {

    @Test
    void controllerCanBeConstructed() {
        assertDoesNotThrow(WODocumentController::new);
    }
}
