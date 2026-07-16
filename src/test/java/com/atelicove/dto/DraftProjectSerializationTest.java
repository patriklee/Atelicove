package com.atelicove.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.atelicove.entities.DraftProject;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.DraftWorkOrderItem;
import com.atelicove.entities.Project;
import com.atelicove.enums.ItemType;
import com.atelicove.enums.ProjectStatus;
import com.fasterxml.jackson.databind.ObjectMapper;

class DraftProjectSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void nestedDraftResponseSerializesWithoutBackReferences() throws Exception {
        DraftProject draft = new DraftProject();
        draft.setDraftProjectId(7L);
        draft.setDraftName("Safe draft");
        DraftWorkOrder workOrder = new DraftWorkOrder();
        workOrder.setDraftWorkOrderID(8);
        DraftWorkOrderItem item = new DraftWorkOrderItem();
        item.setItemName("Labor");
        item.setQuantity(2);
        item.setPrice(new BigDecimal("25.00"));
        item.setItemType(ItemType.LABOR);
        workOrder.addItem(item);
        draft.addDraftWorkOrder(workOrder);

        String json = objectMapper.writeValueAsString(DraftProjectDTO.from(draft));

        assertThat(json).contains("\"draftProjectID\":7", "\"draftWorkOrderID\":8");
        assertThat(json).doesNotContain("draftProject\"");
    }

    @Test
    void launchResponseContainsOnlyStableProjectIdentity() throws Exception {
        Project project = new Project();
        project.setProjectID(42);
        project.setProjectName("Operational project");
        project.setProjectStatus(ProjectStatus.OPEN);

        String json = objectMapper.writeValueAsString(DraftProjectLaunchResponse.from(project));

        assertThat(json).isEqualTo(
                "{\"projectID\":42,\"projectName\":\"Operational project\",\"projectStatus\":\"OPEN\"}");
    }
}
