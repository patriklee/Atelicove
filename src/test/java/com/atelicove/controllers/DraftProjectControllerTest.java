package com.atelicove.controllers;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.entities.Project;
import com.atelicove.services.DraftProjectLaunchService;
import com.atelicove.services.DraftProjectService;

@ExtendWith(MockitoExtension.class)
class DraftProjectControllerTest {

    @Mock private DraftProjectService draftProjectService;
    @Mock private DraftProjectLaunchService draftProjectLaunchService;
    @InjectMocks private DraftProjectController controller;

    @Test
    void launchDelegatesToTheDedicatedLaunchService() {
        Project launched = new Project();
        when(draftProjectLaunchService.launch(7)).thenReturn(launched);

        assertSame(launched, controller.launch(7));
        verify(draftProjectLaunchService).launch(7);
    }
}
