package com.atelicove.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.entities.Project;
import com.atelicove.entities.DraftProject;
import com.atelicove.dto.DraftProjectRequest;
import com.atelicove.dto.DraftWorkOrderRequest;
import com.atelicove.dto.PlannedStaffingRequest;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.PlannedStaffing;
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

    @Test
    void remainingDraftProjectEndpoints_ShouldDelegateAndMapResponses() {
        DraftProject draft = new DraftProject();
        draft.setDraftProjectId(5L);
        draft.setDraftName("Plan");
        DraftWorkOrder draftWorkOrder = new DraftWorkOrder();
        draftWorkOrder.setDraftWorkOrderID(8);
        draft.addDraftWorkOrder(draftWorkOrder);
        PlannedStaffing staffing = new PlannedStaffing();
        staffing.setPlannedStaffingID(9);
        staffing.setStaffingName("Design");
        draft.addPlannedStaffing(staffing);
        DraftProjectRequest projectRequest = new DraftProjectRequest("Plan", null, null, null);
        DraftWorkOrderRequest workOrderRequest = org.mockito.Mockito.mock(DraftWorkOrderRequest.class);
        PlannedStaffingRequest staffingRequest = org.mockito.Mockito.mock(PlannedStaffingRequest.class);
        when(draftProjectService.findActive()).thenReturn(List.of(draft));
        when(draftProjectService.findArchived()).thenReturn(List.of(draft));
        when(draftProjectService.findById(5L)).thenReturn(Optional.of(draft));
        when(draftProjectService.findById(99L)).thenReturn(Optional.empty());
        when(draftProjectService.update(5L, projectRequest)).thenReturn(draft);
        when(draftWorkOrderService.create(5L, workOrderRequest)).thenReturn(draft);
        when(draftWorkOrderService.find(5L, 8)).thenReturn(Optional.of(draftWorkOrder));
        when(draftWorkOrderService.update(5L, 8, workOrderRequest)).thenReturn(draft);
        when(draftWorkOrderService.delete(5L, 8)).thenReturn(draft);
        when(plannedStaffingService.create(5L, staffingRequest)).thenReturn(draft);
        when(plannedStaffingService.find(5L, 9)).thenReturn(Optional.of(staffing));
        when(plannedStaffingService.update(5L, 9, staffingRequest)).thenReturn(draft);
        when(plannedStaffingService.delete(5L, 9)).thenReturn(draft);
        when(draftProjectService.restore(5L)).thenReturn(draft);

        assertThat(controller.getDraftProjects()).hasSize(1);
        assertThat(controller.getArchivedDraftProjects()).hasSize(1);
        assertThat(controller.getDraftProject(5L).getBody().draftProjectID()).isEqualTo(5L);
        assertThat(controller.getDraftProject(99L).getStatusCode().value()).isEqualTo(404);
        assertThat(controller.updateDraftProject(5L, projectRequest).draftName()).isEqualTo("Plan");
        assertThat(controller.getDraftWorkOrders(5L)).hasSize(1);
        assertThat(controller.createDraftWorkOrder(5L, workOrderRequest).draftProjectID()).isEqualTo(5L);
        assertThat(controller.getDraftWorkOrder(5L, 8).getStatusCode().value()).isEqualTo(200);
        assertThat(controller.updateDraftWorkOrder(5L, 8, workOrderRequest).draftProjectID()).isEqualTo(5L);
        assertThat(controller.deleteDraftWorkOrder(5L, 8).draftProjectID()).isEqualTo(5L);
        assertThat(controller.getPlannedStaffing(5L)).hasSize(1);
        assertThat(controller.createPlannedStaffing(5L, staffingRequest).draftProjectID()).isEqualTo(5L);
        assertThat(controller.getPlannedStaffing(5L, 9).getStatusCode().value()).isEqualTo(200);
        assertThat(controller.updatePlannedStaffing(5L, 9, staffingRequest).draftProjectID()).isEqualTo(5L);
        assertThat(controller.deletePlannedStaffing(5L, 9).draftProjectID()).isEqualTo(5L);
        assertThat(controller.archive(5L).getStatusCode().value()).isEqualTo(204);
        assertThat(controller.restore(5L).draftProjectID()).isEqualTo(5L);
        assertThat(controller.deletePermanently(5L).getStatusCode().value()).isEqualTo(204);
        verify(draftProjectService).archive(5L);
        verify(draftProjectService).deletePermanently(5L);
    }
}
