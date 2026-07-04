package com.atelicove.controllers;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;

import com.atelicove.services.WODocumentService;

class ProjectDocumentControllerTest {

    @Test
    void constructorAcceptsService() {
        assertDoesNotThrow(() -> new ProjectDocumentController(mock(WODocumentService.class)));
    }
}
