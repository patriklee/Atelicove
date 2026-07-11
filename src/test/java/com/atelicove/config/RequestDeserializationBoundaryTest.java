package com.atelicove.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.atelicove.dto.ProjectDTO;
import com.atelicove.entities.WorkOrder;
import com.atelicove.enums.WorkOrderStatus;
import com.fasterxml.jackson.databind.ObjectMapper;

class RequestDeserializationBoundaryTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void genericProjectPayloadCannotSetStatusOrServerOwnedFields() throws Exception {
        ProjectDTO request = objectMapper.readValue("""
                {"projectID":44,"projectName":"Safe","budget":10,
                 "projectStatus":"COMPLETE","archived":true}
                """, ProjectDTO.class);

        assertThat(request.getProjectID()).isZero();
        assertThat(request.getProjectStatus()).isNull();
        assertThat(request.isArchived()).isFalse();
        assertThat(request.getProjectName()).isEqualTo("Safe");
    }

    @Test
    void workOrderCreatePayloadCannotSetIdStatusOrNestedProject() throws Exception {
        WorkOrder request = objectMapper.readValue("""
                {"workOrderID":71,"status":"COMPLETE","project":{"projectID":9},"comment":"Allowed"}
                """, WorkOrder.class);

        assertThat(request.getWorkOrderID()).isZero();
        assertThat(request.getStatus()).isEqualTo(WorkOrderStatus.OPEN);
        assertThat(request.getProject()).isNull();
        assertThat(request.getComment()).isEqualTo("Allowed");
    }
}
