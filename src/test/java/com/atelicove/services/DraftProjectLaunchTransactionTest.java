package com.atelicove.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.support.TransactionTemplate;

import com.atelicove.entities.DraftProject;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.DraftWorkOrderItem;
import com.atelicove.entities.PlannedStaffing;
import com.atelicove.entities.Project;
import com.atelicove.entities.StaffingSlot;
import com.atelicove.entities.Team;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Worker;
import com.atelicove.enums.ItemType;
import com.atelicove.enums.WorkOrderStatus;

import jakarta.persistence.EntityManager;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:draft-launch-test;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
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

    @Test
    void sourceBackedDraftUpdatesExistingWorkOrderWithoutCreatingDuplicate() {
        int[] ids = transactions.execute(status -> {
            WorkOrder source = new WorkOrder();
            source.setComment("Old comment");
            entityManager.persist(source);
            entityManager.flush();

            DraftProject draft = draftWithWorkOrder("Update source", 3);
            DraftWorkOrder draftWorkOrder = draft.getDraftWorkOrders().get(0);
            draftWorkOrder.setSourceWorkOrderID(source.getWorkOrderID());
            draftWorkOrder.setComment("Approved comment");
            entityManager.persist(draft);
            entityManager.flush();
            return new int[] { draft.getDraftProjectId().intValue(), source.getWorkOrderID() };
        });

        Project launched = launchService.launch(ids[0]);

        transactions.executeWithoutResult(status -> {
            WorkOrder source = entityManager.find(WorkOrder.class, ids[1]);
            assertThat(count("WorkOrder")).isEqualTo(1);
            assertThat(source.getComment()).isEqualTo("Approved comment");
            assertThat(source.getItems()).singleElement().satisfies(item ->
                    assertThat(item.getQuantity()).isEqualTo(3));
            assertThat(source.getProject().getProjectID()).isEqualTo(launched.getProjectID());
        });
    }

    @Test
    void plannedStaffingResolvesExistingTeamAndCreatesNewTeamWithAssignedWorkers() {
        int[] ids = transactions.execute(status -> {
            Team existingTeam = new Team();
            existingTeam.setTeamName("Existing team");
            Worker worker = worker("planned-worker@example.com");
            entityManager.persist(existingTeam);
            entityManager.persist(worker);

            DraftProject draft = draftWithWorkOrder("Staffed launch", 1);
            PlannedStaffing existing = new PlannedStaffing();
            existing.setSourceTeamID(existingTeam.getTeamID());
            existing.setStaffingName("Existing plan");
            draft.addPlannedStaffing(existing);

            PlannedStaffing created = new PlannedStaffing();
            created.setStaffingName("Created team");
            StaffingSlot slot = new StaffingSlot();
            slot.setWorkerID(worker.getWorkerID());
            created.addStaffingSlot(slot);
            draft.addPlannedStaffing(created);

            entityManager.persist(draft);
            entityManager.flush();
            draft.getDraftWorkOrders().get(0).setPlannedTeamID(created.getPlannedStaffingID());
            return new int[] { draft.getDraftProjectId().intValue(), existingTeam.getTeamID(), worker.getWorkerID() };
        });

        Project launched = launchService.launch(ids[0]);

        transactions.executeWithoutResult(status -> {
            Project project = entityManager.find(Project.class, launched.getProjectID());
            assertThat(project.getTeams()).hasSize(2);
            assertThat(project.getTeams()).extracting(Team::getTeamID).contains(ids[1]);
            Team created = project.getTeams().stream()
                    .filter(team -> team.getTeamID() != ids[1])
                    .findFirst().orElseThrow();
            assertThat(created.getTeamName()).isEqualTo("Created team");
            assertThat(created.getWorkers()).extracting(Worker::getWorkerID).containsExactly(ids[2]);
            assertThat(project.getWorkOrders()).singleElement().satisfies(workOrder ->
                    assertThat(workOrder.getWorkers()).extracting(Worker::getWorkerID).containsExactly(ids[2]));
        });
    }

    @Test
    void archivedOrCompletedSourceWorkOrderCannotLaunch() {
        int[] draftIDs = transactions.execute(status -> {
            WorkOrder archived = new WorkOrder();
            archived.setArchived(true);
            WorkOrder completed = new WorkOrder();
            completed.setStatus(WorkOrderStatus.COMPLETE);
            entityManager.persist(archived);
            entityManager.persist(completed);
            entityManager.flush();

            DraftProject archivedDraft = draftWithWorkOrder("Archived source", 1);
            archivedDraft.getDraftWorkOrders().get(0).setSourceWorkOrderID(archived.getWorkOrderID());
            DraftProject completedDraft = draftWithWorkOrder("Completed source", 1);
            completedDraft.getDraftWorkOrders().get(0).setSourceWorkOrderID(completed.getWorkOrderID());
            entityManager.persist(archivedDraft);
            entityManager.persist(completedDraft);
            entityManager.flush();
            return new int[] {
                    archivedDraft.getDraftProjectId().intValue(),
                    completedDraft.getDraftProjectId().intValue()
            };
        });

        assertThatThrownBy(() -> launchService.launch(draftIDs[0]))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("archived");
        assertThatThrownBy(() -> launchService.launch(draftIDs[1]))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("read-only");
    }

    private Integer persistDraft(String name, int quantity) {
        return transactions.execute(status -> {
            DraftProject draft = draftWithWorkOrder(name, quantity);
            entityManager.persist(draft);
            entityManager.flush();
            return draft.getDraftProjectId().intValue();
        });
    }

    private DraftProject draftWithWorkOrder(String name, int quantity) {
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
        return draft;
    }

    private Worker worker(String email) {
        Worker worker = new Worker();
        worker.setWorkerEmail(email);
        worker.setWorkerFName("Planned");
        worker.setWorkerLName("Worker");
        return worker;
    }

    private long count(String entityName) {
        return entityManager.createQuery("select count(e) from " + entityName + " e", Long.class)
                .getSingleResult();
    }
}
