package com.atelicove.controllers;

import static com.atelicove.support.ControllerTestSupport.mockMvcFor;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.atelicove.controllers.WorkOrderController;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.DraftWorkOrderItem;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.services.WorkOrderService;
import com.atelicove.services.AuthorizationService;

@ExtendWith(MockitoExtension.class)
class WorkOrderControllerTest {

    @Mock
    private WorkOrderService workOrderService;
    @Mock private AuthorizationService authorizationService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = mockMvcFor(new WorkOrderController(workOrderService, authorizationService));
    }

    @Test
    void getAllAndCompanyWorkOrdersReturnServiceResults() throws Exception {
        WorkOrder workOrder = order(1, WorkOrderStatus.OPEN);
        when(workOrderService.findActive()).thenReturn(List.of(workOrder));
        when(workOrderService.findByCompanyID(5)).thenReturn(List.of(workOrder));
        when(authorizationService.visibleWorkOrders(any(), any()))
                .thenReturn(List.of(workOrder));

        mockMvc.perform(get("/workorders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].workOrderID").value(1));
        mockMvc.perform(get("/workorders/company/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("OPEN"));

        verify(authorizationService, org.mockito.Mockito.times(2))
                .visibleWorkOrders(any(), any());
    }

    @Test
    void getWorkOrderByIdReturnsOrderOrNotFound() throws Exception {
        when(workOrderService.findById(1))
                .thenReturn(Optional.of(order(1, WorkOrderStatus.OPEN)));
        when(workOrderService.findById(99)).thenReturn(Optional.empty());

        mockMvc.perform(get("/workorders/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workOrderID").value(1));
        mockMvc.perform(get("/workorders/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void addAndDeleteWorkOrderDelegateToService() throws Exception {
        when(workOrderService.createWorkOrder(any(WorkOrder.class)))
                .thenReturn(order(2, WorkOrderStatus.OPEN));

        mockMvc.perform(post("/workorders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"New job\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workOrderID").value(2));
        mockMvc.perform(delete("/workorders/2"))
                .andExpect(status().isNoContent());

        verify(workOrderService).archiveById(2);
    }

    @Test
    void countReturnsServiceCount() throws Exception {
        when(workOrderService.count()).thenReturn(12L);

        mockMvc.perform(get("/workorders/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(12));
    }

    @Test
    void workflowEndpointsReturnUpdatedOrders() throws Exception {
        when(workOrderService.startWorkOrder(1))
                .thenReturn(order(1, WorkOrderStatus.ACTIVE));
        when(workOrderService.reassignWorkOrder(1, 3))
                .thenReturn(order(1, WorkOrderStatus.ACTIVE));
        when(workOrderService.submitForReview(1))
                .thenReturn(order(1, WorkOrderStatus.IN_REVIEW));
        when(workOrderService.approveWorkOrder(1))
                .thenReturn(order(1, WorkOrderStatus.COMPLETE));
        when(workOrderService.rejectWorkOrder(2))
                .thenReturn(order(2, WorkOrderStatus.ACTIVE));

        mockMvc.perform(put("/workorders/1/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        mockMvc.perform(put("/workorders/1/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"workerID\":3}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        mockMvc.perform(put("/workorders/1/submit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_REVIEW"));
        mockMvc.perform(put("/workorders/1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETE"));
        mockMvc.perform(put("/workorders/2/reject"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void illegalWorkflowTransitionBecomesConflict() throws Exception {
        when(workOrderService.startWorkOrder(1))
                .thenThrow(new IllegalStateException("Only open work orders can be started"));

        mockMvc.perform(put("/workorders/1/start"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message")
                        .value("Only open work orders can be started"));
    }

    @Test
    void remainingWorkOrderEndpoints_ShouldDelegateAndReturnExpectedBodies() throws Exception {
        WorkOrder order = order(1, WorkOrderStatus.ACTIVE);
        WorkOrderItem item = new WorkOrderItem();
        DraftWorkOrder draft = new DraftWorkOrder();
        draft.setDraftWorkOrderID(5);
        DraftWorkOrderItem draftItem = new DraftWorkOrderItem();
        when(workOrderService.findDrafts()).thenReturn(List.of(draft));
        when(workOrderService.findDraftById(5)).thenReturn(Optional.of(draft));
        when(workOrderService.findDraftById(99)).thenReturn(Optional.empty());
        when(workOrderService.findArchivedDrafts()).thenReturn(List.of(draft));
        when(workOrderService.findAll()).thenReturn(List.of(order));
        when(workOrderService.findArchived()).thenReturn(List.of(order));
        when(authorizationService.visibleWorkOrders(any(), any())).thenReturn(List.of(order));
        when(workOrderService.removeWorkerFromWorkOrder(1, 3)).thenReturn(order);
        when(workOrderService.removeCompanyFromWorkOrder(1)).thenReturn(order);
        when(workOrderService.assignCompanyToWorkOrder(1, 4)).thenReturn(order);
        when(workOrderService.updateComment(1, "done")).thenReturn(order);
        when(workOrderService.addItem(1, item)).thenReturn(order);
        when(workOrderService.updateItem(1, 2, item)).thenReturn(order);
        when(workOrderService.deleteItem(1, 2)).thenReturn(order);
        when(workOrderService.addDraftItem(5, draftItem)).thenReturn(draft);
        when(workOrderService.updateDraftItem(5, 6, draftItem)).thenReturn(draft);
        when(workOrderService.deleteDraftItem(5, 6)).thenReturn(draft);
        when(workOrderService.restoreDraftById(5)).thenReturn(draft);
        when(workOrderService.restoreById(1)).thenReturn(order);

        mockMvc.perform(get("/workorders/drafts")).andExpect(status().isOk()).andExpect(jsonPath("$[0].draftWorkOrderID").value(5));
        mockMvc.perform(get("/workorders/drafts/5")).andExpect(status().isOk());
        mockMvc.perform(get("/workorders/drafts/99")).andExpect(status().isNotFound());
        mockMvc.perform(get("/workorders/drafts/archived")).andExpect(status().isOk());
        mockMvc.perform(get("/workorders/all-with-archived")).andExpect(status().isOk());
        mockMvc.perform(get("/workorders/archived")).andExpect(status().isOk());
        mockMvc.perform(delete("/workorders/1/workers/3")).andExpect(status().isOk());
        mockMvc.perform(delete("/workorders/1/company")).andExpect(status().isOk());
        mockMvc.perform(put("/workorders/1/company").contentType(MediaType.APPLICATION_JSON).content("{\"companyID\":4}"))
                .andExpect(status().isOk());
        mockMvc.perform(put("/workorders/1/comment").contentType(MediaType.APPLICATION_JSON).content("{\"comment\":\"done\"}"))
                .andExpect(status().isOk());

        WorkOrderController controller = new WorkOrderController(workOrderService, authorizationService);
        assertThat(controller.addItem(1, item, null)).isSameAs(order);
        assertThat(controller.updateItem(1, 2, item, null)).isSameAs(order);
        assertThat(controller.deleteItem(1, 2, null)).isSameAs(order);
        assertThat(controller.addDraftItem(5, draftItem)).isSameAs(draft);
        assertThat(controller.updateDraftItem(5, 6, draftItem)).isSameAs(draft);
        assertThat(controller.deleteDraftItem(5, 6)).isSameAs(draft);
        assertThat(controller.archiveDraftWorkOrder(5).getStatusCode().value()).isEqualTo(204);
        assertThat(controller.restoreDraftWorkOrder(5)).isSameAs(draft);
        assertThat(controller.deleteDraftWorkOrderPermanently(5).getStatusCode().value()).isEqualTo(204);
        assertThat(controller.restoreWorkOrder(1)).isSameAs(order);
        assertThat(controller.deleteWorkOrderPermanently(1).getStatusCode().value()).isEqualTo(204);
        verify(workOrderService).archiveDraftById(5);
        verify(workOrderService).deleteDraftPermanentlyById(5);
        verify(workOrderService).deletePermanentlyById(1);
    }

    private WorkOrder order(int id, WorkOrderStatus status) {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setWorkOrderID(id);
        workOrder.setStatus(status);
        return workOrder;
    }
}
