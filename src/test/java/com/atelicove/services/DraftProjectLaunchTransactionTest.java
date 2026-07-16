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
import com.atelicove.entities.Company;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.DraftWorkOrderItem;
import com.atelicove.entities.PlannedStaffing;
import com.atelicove.entities.Project;
import com.atelicove.entities.StaffingSlot;
import com.atelicove.entities.Team;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
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
    void emptyDraftReturnsClearValidationErrorAndCreatesNoOperationalProject() {
        Integer draftID = transactions.execute(status -> {
            DraftProject draft = new DraftProject();
            draft.setDraftName("Not ready");
            entityManager.persist(draft);
            entityManager.flush();
            return draft.getDraftProjectId().intValue();
        });

        assertThatThrownBy(() -> launchService.launch(draftID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Draft project must contain at least one work order before launch");

        transactions.executeWithoutResult(status -> {
            assertThat(entityManager.find(DraftProject.class, draftID.longValue())).isNotNull();
            assertThat(count("Project")).isZero();
        });
    }

    @Test
    void sourceBackedDraftCreatesNewWorkOrderAndLeavesSourceGraphUnchanged() {
        int[] ids = transactions.execute(status -> {
            WorkOrder source = new WorkOrder();
            source.setComment("Old comment");
            WorkOrderItem sourceItem = new WorkOrderItem();
            sourceItem.setItemName("Original item");
            sourceItem.setQuantity(7);
            sourceItem.setPrice(new BigDecimal("10.00"));
            sourceItem.setItemType(ItemType.MATERIAL);
            source.addItem(sourceItem);
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
            Project project = entityManager.find(Project.class, launched.getProjectID());
            assertThat(count("WorkOrder")).isEqualTo(2);
            assertThat(source.getComment()).isEqualTo("Old comment");
            assertThat(source.getItems()).singleElement().satisfies(item ->
                    assertThat(item.getQuantity()).isEqualTo(7));
            assertThat(source.getProject()).isNull();
            assertThat(project.getWorkOrders()).singleElement().satisfies(created -> {
                assertThat(created.getWorkOrderID()).isNotEqualTo(source.getWorkOrderID());
                assertThat(created.getComment()).isEqualTo("Approved comment");
                assertThat(created.getItems()).singleElement().satisfies(item -> {
                    assertThat(item.getQuantity()).isEqualTo(3);
                    assertThat(item.getWorkOrderItemID()).isNotEqualTo(source.getItems().get(0).getWorkOrderItemID());
                });
            });
        });
    }

    @Test
    void plannedStaffingAttachesExistingTeamUnchangedAndAssignsWorkersWithoutCreatingTeam() {
        int[] ids = transactions.execute(status -> {
            Team existingTeam = new Team();
            existingTeam.setTeamName("Existing team");
            Worker existingMember = worker("existing-member@example.com");
            Worker worker = worker("planned-worker@example.com");
            entityManager.persist(existingTeam);
            entityManager.persist(existingMember);
            entityManager.persist(worker);
            existingTeam.getWorkers().add(existingMember);

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
            StaffingSlot placeholder = new StaffingSlot();
            placeholder.setWorkerName("Future hire");
            created.addStaffingSlot(placeholder);
            draft.addPlannedStaffing(created);

            entityManager.persist(draft);
            entityManager.flush();
            draft.getDraftWorkOrders().get(0).setPlannedTeamID(created.getPlannedStaffingID());
            return new int[] {
                    draft.getDraftProjectId().intValue(), existingTeam.getTeamID(),
                    existingMember.getWorkerID(), worker.getWorkerID()
            };
        });

        Project launched = launchService.launch(ids[0]);

        transactions.executeWithoutResult(status -> {
            Project project = entityManager.find(Project.class, launched.getProjectID());
            assertThat(project.getTeams()).singleElement().satisfies(team -> {
                assertThat(team.getTeamID()).isEqualTo(ids[1]);
                assertThat(team.getTeamName()).isEqualTo("Existing team");
                assertThat(team.getWorkers()).extracting(Worker::getWorkerID).containsExactly(ids[2]);
            });
            assertThat(count("Team")).isEqualTo(1);
            assertThat(count("Worker")).isEqualTo(2);
            assertThat(project.getWorkOrders()).singleElement().satisfies(workOrder ->
                    assertThat(workOrder.getWorkers()).extracting(Worker::getWorkerID).containsExactly(ids[3]));
        });
    }

    @Test
    void missingActiveWorkerReferenceFailsButPlaceholderIsIgnored() {
        int[] ids = transactions.execute(status -> {
            DraftProject placeholderDraft = draftWithWorkOrder("Placeholder worker", 1);
            PlannedStaffing placeholderStaffing = new PlannedStaffing();
            StaffingSlot placeholder = new StaffingSlot();
            placeholder.setWorkerName("Future hire");
            placeholder.setRoleName("Electrician");
            placeholderStaffing.addStaffingSlot(placeholder);
            placeholderDraft.addPlannedStaffing(placeholderStaffing);

            DraftProject missingWorkerDraft = draftWithWorkOrder("Missing worker", 1);
            PlannedStaffing missingStaffing = new PlannedStaffing();
            StaffingSlot missing = new StaffingSlot();
            missing.setWorkerID(999999);
            missingStaffing.addStaffingSlot(missing);
            missingWorkerDraft.addPlannedStaffing(missingStaffing);

            entityManager.persist(placeholderDraft);
            entityManager.persist(missingWorkerDraft);
            entityManager.flush();
            return new int[] {
                    placeholderDraft.getDraftProjectId().intValue(),
                    missingWorkerDraft.getDraftProjectId().intValue()
            };
        });

        launchService.launch(ids[0]);
        assertThatThrownBy(() -> launchService.launch(ids[1]))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("worker 999999")
                .hasMessageContaining("does not exist");

        transactions.executeWithoutResult(status -> {
            assertThat(count("Worker")).isZero();
            assertThat(entityManager.find(DraftProject.class, (long) ids[0])).isNull();
            assertThat(entityManager.find(DraftProject.class, (long) ids[1])).isNotNull();
            assertThat(count("Project")).isEqualTo(1);
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

    @Test
    void archivedWorkerAndCompanyReferencesCannotLaunchAndPreserveDrafts() {
        int[] draftIDs = transactions.execute(status -> {
            Worker archivedWorker = worker("archived-planned@example.com");
            archivedWorker.setArchived(true);
            Company archivedCompany = new Company();
            archivedCompany.setCompanyName("Archived company");
            archivedCompany.setArchived(true);
            entityManager.persist(archivedWorker);
            entityManager.persist(archivedCompany);

            DraftProject workerDraft = draftWithWorkOrder("Archived worker", 1);
            PlannedStaffing staffing = new PlannedStaffing();
            StaffingSlot slot = new StaffingSlot();
            entityManager.flush();
            slot.setWorkerID(archivedWorker.getWorkerID());
            staffing.addStaffingSlot(slot);
            workerDraft.addPlannedStaffing(staffing);

            DraftProject companyDraft = draftWithWorkOrder("Archived company", 1);
            companyDraft.getDraftWorkOrders().get(0).setPlannedCompanyID(archivedCompany.getCompanyID());
            entityManager.persist(workerDraft);
            entityManager.persist(companyDraft);
            entityManager.flush();
            return new int[] {
                    workerDraft.getDraftProjectId().intValue(),
                    companyDraft.getDraftProjectId().intValue()
            };
        });

        assertThatThrownBy(() -> launchService.launch(draftIDs[0]))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("worker").hasMessageContaining("archived");
        assertThatThrownBy(() -> launchService.launch(draftIDs[1]))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("company").hasMessageContaining("archived");

        transactions.executeWithoutResult(status -> {
            assertThat(entityManager.find(DraftProject.class, (long) draftIDs[0])).isNotNull();
            assertThat(entityManager.find(DraftProject.class, (long) draftIDs[1])).isNotNull();
        });
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
