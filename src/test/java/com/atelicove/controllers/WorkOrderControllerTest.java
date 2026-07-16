package com.atelicove.controllers;

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

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.atelicove.controllers.WorkOrderController;
import com.atelicove.entities.WorkOrder;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.exceptions.GlobalExceptionHandler;
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
        mockMvc = MockMvcBuilders
                .standaloneSetup(new WorkOrderController(workOrderService, authorizationService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
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

    private WorkOrder order(int id, WorkOrderStatus status) {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setWorkOrderID(id);
        workOrder.setStatus(status);
        return workOrder;
    }
}
