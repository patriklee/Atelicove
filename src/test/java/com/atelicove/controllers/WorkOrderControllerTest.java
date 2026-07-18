package com.atelicove.controllers;

import static com.atelicove.support.ControllerTestSupport.mockMvcFor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

import com.atelicove.dto.CreateWorkOrderRequest;
import com.atelicove.entities.WorkOrder;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.services.AuthorizationService;
import com.atelicove.services.WorkOrderService;

@ExtendWith(MockitoExtension.class)
class WorkOrderControllerTest {

    @Mock WorkOrderService workOrderService;
    @Mock AuthorizationService authorizationService;

    private MockMvc mockMvc;
    private Authentication worker;

    @BeforeEach
    void setUp() {
        mockMvc = mockMvcFor(new WorkOrderController(workOrderService, authorizationService));
        worker = new TestingAuthenticationToken("worker", "n/a", "ROLE_WORKER");
    }

    @Test
    void visibleWorkOrdersAreReturned() throws Exception {
        when(authorizationService.visibleActiveWorkOrders(worker))
                .thenReturn(List.of(order(1, WorkOrderStatus.OPEN)));

        mockMvc.perform(get("/workorders").principal(worker))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].workOrderID").value(1));
    }

    @Test
    void missingWorkOrderReturnsNotFound() throws Exception {
        when(workOrderService.findById(99)).thenReturn(Optional.empty());

        mockMvc.perform(get("/workorders/99").principal(worker))
                .andExpect(status().isNotFound());
    }

    @Test
    void unrelatedWorkerReceivesForbidden() throws Exception {
        doThrow(new AccessDeniedException("Worker is not assigned to this work order"))
                .when(authorizationService).requireWorkOrderAccess(1, worker);

        mockMvc.perform(get("/workorders/1").principal(worker))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message")
                        .value("Worker is not assigned to this work order"));
    }

    @Test
    void invalidFocusedRequestsReturnBadRequest() throws Exception {
        mockMvc.perform(put("/workorders/1/assign").principal(worker)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"workerID\":0}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/workorders/1/comment").principal(worker)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"   \"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/workorders/1/items").principal(worker)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemName\":\"Part\",\"quantity\":0,\"price\":10,\"itemType\":\"MATERIAL\"}"))
                .andExpect(status().isBadRequest());

        verify(workOrderService, never()).reassignWorkOrder(any(), any());
        verify(workOrderService, never()).updateComment(any(), any());
        verify(workOrderService, never()).addItem(any(), any());
    }

    @Test
    void createRequestCannotForceServerOwnedState() throws Exception {
        when(workOrderService.createWorkOrder(any(CreateWorkOrderRequest.class)))
                .thenReturn(order(2, WorkOrderStatus.OPEN));

        mockMvc.perform(post("/workorders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"New job\",\"status\":\"COMPLETE\",\"archived\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workOrderID").value(2))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.archived").value(false));
    }

    @Test
    void lifecycleViolationReturnsConflict() throws Exception {
        when(workOrderService.startWorkOrder(1))
                .thenThrow(new IllegalStateException("Only open work orders can be started"));

        mockMvc.perform(put("/workorders/1/start").principal(worker))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message")
                        .value("Only open work orders can be started"));
    }

    @Test
    void validSubmitRequestPreservesCurrentBehavior() throws Exception {
        when(workOrderService.submitForReview(1))
                .thenReturn(order(1, WorkOrderStatus.IN_REVIEW));

        mockMvc.perform(put("/workorders/1/submit").principal(worker))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_REVIEW"));

        verify(authorizationService).requireWorkOrderAccess(1, worker);
    }

    private WorkOrder order(int id, WorkOrderStatus status) {
        WorkOrder order = new WorkOrder();
        order.setWorkOrderID(id);
        order.setStatus(status);
        return order;
    }
}
