package com.atelicove.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.support.TransactionTemplate;

import com.atelicove.entities.DraftProject;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.DraftWorkOrderItem;
import com.atelicove.entities.Project;
import com.atelicove.enums.ItemType;

import jakarta.persistence.EntityManager;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:draft-launch-test;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class DraftProjectLaunchTransactionTest {

    @Autowired private DraftProjectLaunchService launchService;
    @Autowired private EntityManager entityManager;
    @Autowired private TransactionTemplate transactions;

    @Test
    void validDraftLaunchesCompleteGraphThenDeletesDraft() {
        Integer draftID = persistDraft("Launch me", 2);

        Project launched = launchService.launch(draftID);

        transactions.executeWithoutResult(status -> {
            Project project = entityManager.find(Project.class, launched.getProjectID());
            assertThat(project.getProjectName()).isEqualTo("Launch me");
            assertThat(project.getWorkOrders()).hasSize(1);
            assertThat(project.getWorkOrders().get(0).getItems()).hasSize(1);
            assertThat(project.getWorkOrders().get(0).getItems().get(0).getQuantity()).isEqualTo(2);
            assertThat(entityManager.find(DraftProject.class, draftID.longValue())).isNull();
        });
    }

    @Test
    void invalidConversionInputPreservesDraftAndLeavesNoPartialGraph() {
        Integer draftID = persistDraft("Rollback me", 0);

        assertThatThrownBy(() -> launchService.launch(draftID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("quantity");

        transactions.executeWithoutResult(status -> {
            assertThat(entityManager.find(DraftProject.class, draftID.longValue())).isNotNull();
            assertThat(count("Project")).isZero();
            assertThat(count("WorkOrder")).isZero();
            assertThat(count("Team")).isZero();
            assertThat(count("WorkOrderItem")).isZero();
        });
    }

    private Integer persistDraft(String name, int quantity) {
        return transactions.execute(status -> {
            DraftProject draft = new DraftProject();
            draft.setDraftName(name);
            DraftWorkOrder workOrder = new DraftWorkOrder();
            DraftWorkOrderItem item = new DraftWorkOrderItem();
            item.setItemName("Labor");
            item.setQuantity(quantity);
            item.setPrice(new BigDecimal("25.00"));
            item.setItemType(ItemType.LABOR);
            workOrder.addItem(item);
            draft.addDraftWorkOrder(workOrder);
            entityManager.persist(draft);
            entityManager.flush();
            return draft.getDraftProjectId().intValue();
        });
    }

    private long count(String entityName) {
        return entityManager.createQuery("select count(e) from " + entityName + " e", Long.class)
                .getSingleResult();
    }
}
