package com.atelicove.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.entities.Project;
import com.atelicove.entities.DraftProject;
import com.atelicove.dto.DraftProjectRequest;
import com.atelicove.services.DraftProjectLaunchService;
import com.atelicove.services.DraftProjectService;
import com.atelicove.services.DraftWorkOrderService;
import com.atelicove.services.PlannedStaffingService;

@ExtendWith(MockitoExtension.class)
class DraftProjectControllerTest {

    @Mock private DraftProjectService draftProjectService;
    @Mock private DraftWorkOrderService draftWorkOrderService;
    @Mock private PlannedStaffingService plannedStaffingService;
    @Mock private DraftProjectLaunchService draftProjectLaunchService;
    @InjectMocks private DraftProjectController controller;

    @Test
    void launchDelegatesToTheDedicatedLaunchService() {
        Project launched = new Project();
        launched.setProjectID(12);
        launched.setProjectName("Launched plan");
        when(draftProjectLaunchService.launch(7)).thenReturn(launched);

        assertThat(controller.launch(7)).satisfies(response -> {
            assertThat(response.projectID()).isEqualTo(12);
            assertThat(response.projectName()).isEqualTo("Launched plan");
            assertThat(response.projectStatus()).isEqualTo(launched.getProjectStatus());
        });
        verify(draftProjectLaunchService).launch(7);
    }

    @Test
    void createDelegatesToDraftProjectServiceAndReturnsDraftDto() {
        DraftProjectRequest request = new DraftProjectRequest("Plan", null, null, null);
        DraftProject draft = new DraftProject();
        draft.setDraftProjectId(5L);
        draft.setDraftName("Plan");
        when(draftProjectService.create(request)).thenReturn(draft);

        assertThat(controller.createDraftProject(request).draftProjectID()).isEqualTo(5L);
        verify(draftProjectService).create(request);
    }
}
