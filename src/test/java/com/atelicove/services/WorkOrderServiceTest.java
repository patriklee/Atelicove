package com.atelicove.services;

import static com.atelicove.support.TestFixtures.COMPANY_ID;
import static com.atelicove.support.TestFixtures.ITEM_ID;
import static com.atelicove.support.TestFixtures.WORK_ORDER_ID;
import static com.atelicove.support.TestFixtures.aCompany;
import static com.atelicove.support.TestFixtures.aWorkOrder;
import static com.atelicove.support.TestFixtures.aWorkOrderItem;
import static com.atelicove.support.TestFixtures.aWorker;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.entities.Company;
import com.atelicove.entities.DraftProject;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.DraftWorkOrderItem;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.entities.Worker;
import com.atelicove.enums.ItemType;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.DraftWorkOrderRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;
import com.atelicove.services.WorkOrderService;

@ExtendWith(MockitoExtension.class)
public class WorkOrderServiceTest {

    private static final int DRAFT_ID = 91;

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private DraftWorkOrderRepository draftWorkOrderRepository;

    @Mock
    private WorkerRepository workerRepository;

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private WorkOrderService workOrderService;

    @Nested
    class WorkOrderLifecycle {

    @Test
    void createWorkOrderResetsIdAndSetsOpenWhenUnassignedBeforeSaving() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setWorkOrderID(25);
        workOrder.setStatus(WorkOrderStatus.COMPLETE);
        when(workOrderRepository.save(workOrder)).thenReturn(workOrder);

        WorkOrder result = workOrderService.createWorkOrder(workOrder);

        assertSame(workOrder, result);
        assertEquals(0, workOrder.getWorkOrderID());
        assertEquals(WorkOrderStatus.OPEN, workOrder.getStatus());
    }

    @Test
    void createWorkOrderSetsInProcessWhenWorkerIsAssigned() {
        WorkOrder workOrder = new WorkOrder();
        Worker worker = new Worker();
        worker.setWorkerID(1);
        workOrder.addWorker(worker);
        when(workerRepository.findById(1)).thenReturn(Optional.of(worker));
        when(workOrderRepository.save(workOrder)).thenReturn(workOrder);

        WorkOrder result = workOrderService.createWorkOrder(workOrder);

        assertSame(workOrder, result);
        assertEquals(WorkOrderStatus.ACTIVE, workOrder.getStatus());
    }

    @Test
    void findAndCountMethodsReturnRepositoryResults() {
        WorkOrder workOrder = new WorkOrder();
        List<WorkOrder> workOrders = List.of(workOrder);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(workOrderRepository.findAll()).thenReturn(workOrders);
        when(workOrderRepository.findByCompany_CompanyIDAndArchivedFalse(2)).thenReturn(workOrders);
        when(workOrderRepository.countByArchivedFalse()).thenReturn(1L);

        assertEquals(Optional.of(workOrder), workOrderService.findById(1));
        assertSame(workOrders, workOrderService.findAll());
        assertSame(workOrders, workOrderService.findByCompanyID(2));
        assertEquals(1L, workOrderService.count());
    }

    @Test
    void startWorkOrderMovesOpenOrderToInProcess() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.OPEN);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(workOrderRepository.save(workOrder)).thenReturn(workOrder);

        WorkOrder result = workOrderService.startWorkOrder(1);

        assertSame(workOrder, result);
        assertEquals(WorkOrderStatus.ACTIVE, workOrder.getStatus());
    }

    @Test
    void startWorkOrderRejectsOrderThatIsNotOpen() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.ACTIVE);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        assertThrows(IllegalStateException.class, () -> workOrderService.startWorkOrder(1));
        verify(workOrderRepository, never()).save(workOrder);
    }

    @Test
    void submitForReviewMovesInProcessOrderToReview() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.ACTIVE);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(workOrderRepository.save(workOrder)).thenReturn(workOrder);

        workOrderService.submitForReview(1);

        assertEquals(WorkOrderStatus.IN_REVIEW, workOrder.getStatus());
    }

    @Test
    void updateCommentChangesWorkOrderComment() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.OPEN);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(workOrderRepository.save(workOrder)).thenReturn(workOrder);

        workOrderService.updateComment(1, "Updated notes");

        assertEquals("Updated notes", workOrder.getComment());
    }

    @Test
    void addItemAssociatesItemToWorkOrder() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.OPEN);
        WorkOrderItem item = new WorkOrderItem();
        item.setItemName("Inspection");
        item.setQuantity(1);
        item.setPrice(new java.math.BigDecimal("100"));
        item.setItemType(ItemType.LABOR);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(workOrderRepository.save(workOrder)).thenReturn(workOrder);

        workOrderService.addItem(1, item);

        assertEquals(1, workOrder.getItems().size());
        assertEquals(ItemType.LABOR, item.getItemType());
        assertSame(workOrder, item.getWorkOrder());
    }

    @Test
    void rejectWorkOrderReturnsReviewOrderToInProcess() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.IN_REVIEW);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(workOrderRepository.save(workOrder)).thenReturn(workOrder);

        workOrderService.rejectWorkOrder(1);

        assertEquals(WorkOrderStatus.ACTIVE, workOrder.getStatus());
    }

    @Test
    void approveWorkOrderCompletesValidReviewOrder() {
        WorkOrder workOrder = validOrderForCompletion();
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(workOrderRepository.save(workOrder)).thenReturn(workOrder);

        WorkOrder result = workOrderService.approveWorkOrder(1);

        assertSame(workOrder, result);
        assertEquals(WorkOrderStatus.COMPLETE, workOrder.getStatus());
    }

    @Test
    void approveWorkOrderRejectsIncompleteOrder() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.IN_REVIEW);
        workOrder.setWorkOrderID(1);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        assertThrows(IllegalStateException.class,
                () -> workOrderService.approveWorkOrder(1));
        verify(workOrderRepository, never()).save(workOrder);
    }

    @Test
    void workflowMethodsRejectUnknownWorkOrder() {
        when(workOrderRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> workOrderService.startWorkOrder(99));
        assertThrows(IllegalArgumentException.class,
                () -> workOrderService.archiveById(99));
    }

    @Test
    void archiveByIdMarksFoundWorkOrderArchived() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.COMPLETE);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        workOrderService.archiveById(1);

        assertEquals(true, workOrder.isArchived());
        verify(workOrderRepository).save(workOrder);
    }

    @Test
    void archiveByIdRejectsIncompleteWorkOrder() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.ACTIVE);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        assertThrows(IllegalStateException.class, () -> workOrderService.archiveById(1));
        verify(workOrderRepository, never()).save(workOrder);
    }

    @Test
    void deletePermanentlyByIdRejectsArchivedHistoricalWorkOrder() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setArchived(true);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        assertThrows(IllegalStateException.class, () -> workOrderService.deletePermanentlyById(1));
        verify(workOrderRepository, never()).delete(workOrder);
    }

    @Test
    void deletePermanentlyByIdRemovesOnlyEmptyOpenWorkOrder() {
        WorkOrder workOrder = new WorkOrder();
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        workOrderService.deletePermanentlyById(1);

        verify(workOrderRepository).delete(workOrder);
    }

    @Test
    void archivedWorkOrderCannotBeEditedEvenWhenStatusIsOpen() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.OPEN);
        workOrder.setArchived(true);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        assertThrows(IllegalStateException.class, () -> workOrderService.updateComment(1, "changed"));
        assertThrows(IllegalStateException.class, () -> workOrderService.startWorkOrder(1));
        verify(workOrderRepository, never()).save(workOrder);
    }

    @Test
    void reassignWorkOrderAddsWorkerOnIncompleteOrder() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.ACTIVE);
        Worker currentWorker = new Worker();
        currentWorker.setWorkerID(2);
        Worker newWorker = new Worker();
        newWorker.setWorkerID(3);
        workOrder.addWorker(currentWorker);

        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(workerRepository.findById(3)).thenReturn(Optional.of(newWorker));
        when(workOrderRepository.save(workOrder)).thenReturn(workOrder);

        WorkOrder result = workOrderService.reassignWorkOrder(1, 3);

        assertSame(workOrder, result);
        assertEquals(2, workOrder.getWorkers().size());
        assertEquals(WorkOrderStatus.ACTIVE, workOrder.getStatus());
    }

    @Test
    void reassignWorkOrderRejectsCompletedOrder() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.COMPLETE);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        assertThrows(IllegalStateException.class,
                () -> workOrderService.reassignWorkOrder(1, 3));
        verify(workOrderRepository, never()).save(workOrder);
    }

    @Test
    void removeWorkerFromWorkOrderReturnsEmptyOrderToOpen() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.ACTIVE);
        Worker worker = new Worker();
        worker.setWorkerID(2);
        workOrder.addWorker(worker);

        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(workerRepository.findById(2)).thenReturn(Optional.of(worker));
        when(workOrderRepository.save(workOrder)).thenReturn(workOrder);

        WorkOrder result = workOrderService.removeWorkerFromWorkOrder(1, 2);

        assertSame(workOrder, result);
        assertEquals(0, workOrder.getWorkers().size());
        assertEquals(WorkOrderStatus.OPEN, workOrder.getStatus());
    }

    @Test
    void removeCompanyFromWorkOrderClearsCompany() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.OPEN);
        workOrder.setCompany(new Company());

        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(workOrderRepository.save(workOrder)).thenReturn(workOrder);

        WorkOrder result = workOrderService.removeCompanyFromWorkOrder(1);

        assertSame(workOrder, result);
        assertEquals(null, workOrder.getCompany());
    }

    }

    @Nested
    class Queries {
        @Test
        void queryMethods_ShouldExposeActiveArchivedAndDraftViews() {
            // Given
            WorkOrder order = aWorkOrder().build();
            DraftWorkOrder draft = draftWorkOrder();
            when(workOrderRepository.findByArchivedFalse()).thenReturn(List.of(order));
            when(workOrderRepository.findByArchivedTrue()).thenReturn(List.of(order));
            when(draftWorkOrderRepository.findByArchivedFalse()).thenReturn(List.of(draft));
            when(draftWorkOrderRepository.findByArchivedTrue()).thenReturn(List.of(draft));
            when(draftWorkOrderRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));

            // When / Then
            assertThat(workOrderService.findActive()).containsExactly(order);
            assertThat(workOrderService.findArchived()).containsExactly(order);
            assertThat(workOrderService.findDrafts()).containsExactly(draft);
            assertThat(workOrderService.findArchivedDrafts()).containsExactly(draft);
            assertThat(workOrderService.findDraftById(DRAFT_ID)).contains(draft);
        }

        @Test
        void draftQueries_ShouldHideArchivedDraftsAndDraftsOwnedByArchivedProjects() {
            // Given
            DraftWorkOrder archived = draftWorkOrder();
            archived.setArchived(true);
            DraftProject archivedProject = new DraftProject();
            archivedProject.setArchived(true);
            DraftWorkOrder hiddenByProject = draftWorkOrder();
            hiddenByProject.setDraftProject(archivedProject);
            when(draftWorkOrderRepository.findByArchivedFalse()).thenReturn(List.of(hiddenByProject));
            when(draftWorkOrderRepository.findById(DRAFT_ID)).thenReturn(Optional.of(archived));

            // When / Then
            assertThat(workOrderService.findDrafts()).isEmpty();
            assertThat(workOrderService.findDraftById(DRAFT_ID)).isEmpty();
        }
    }

    @Nested
    class AssignmentsAndItems {
        @Test
        void assignCompany_ShouldResolveActiveCompanyAndPersist() {
            // Given
            WorkOrder order = aWorkOrder().build();
            Company company = aCompany().build();
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));
            when(workOrderRepository.save(order)).thenReturn(order);

            // When
            WorkOrder result = workOrderService.assignCompanyToWorkOrder(WORK_ORDER_ID, COMPANY_ID);

            // Then
            assertThat(result.getCompany()).isSameAs(company);
            verify(workOrderRepository).save(order);
        }

        @Test
        void assignCompany_ShouldRejectUnknownAndArchivedCompanies() {
            // Given
            WorkOrder order = aWorkOrder().build();
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> workOrderService.assignCompanyToWorkOrder(WORK_ORDER_ID, COMPANY_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Company not found");

            // Given
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(aCompany().archived().build()));

            // When / Then
            assertThatThrownBy(() -> workOrderService.assignCompanyToWorkOrder(WORK_ORDER_ID, COMPANY_ID))
                    .isInstanceOf(IllegalStateException.class).hasMessage("Archived companies cannot be assigned");
            verify(workOrderRepository, never()).save(order);
        }

        @Test
        void updateAndDeleteItem_ShouldMutateOnlyTheRequestedItem() {
            // Given
            WorkOrder order = aWorkOrder().build();
            WorkOrderItem existing = aWorkOrderItem().withId(ITEM_ID).forWorkOrder(order).build();
            order.addItem(existing);
            WorkOrderItem update = aWorkOrderItem().named("Updated labor").withQuantity(3).pricedAt("25.00").build();
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));
            when(workOrderRepository.save(order)).thenReturn(order);

            // When
            workOrderService.updateItem(WORK_ORDER_ID, ITEM_ID, update);

            // Then
            assertThat(existing.getItemName()).isEqualTo("Updated labor");
            assertThat(existing.getQuantity()).isEqualTo(3);

            // When
            workOrderService.deleteItem(WORK_ORDER_ID, ITEM_ID);

            // Then
            assertThat(order.getItems()).isEmpty();
            verify(workOrderRepository, org.mockito.Mockito.times(2)).save(order);
        }

        @Test
        void itemMutations_ShouldValidateContentAndExplainMissingItems() {
            // Given
            WorkOrder order = aWorkOrder().build();
            WorkOrderItem invalid = aWorkOrderItem().named(" ").build();
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));

            // When / Then
            assertThatThrownBy(() -> workOrderService.addItem(WORK_ORDER_ID, invalid))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Item name is required");
            assertThatThrownBy(() -> workOrderService.updateItem(
                    WORK_ORDER_ID, ITEM_ID, aWorkOrderItem().build()))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Work order item not found");
            assertThatThrownBy(() -> workOrderService.deleteItem(WORK_ORDER_ID, ITEM_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Work order item not found");
        }
    }

    @Nested
    class DraftItemsAndLifecycle {
        @Test
        void draftItemOperations_ShouldAddUpdateAndDeleteItems() {
            // Given
            DraftWorkOrder draft = draftWorkOrder();
            DraftWorkOrderItem item = draftItem(0, "Planning", 1);
            when(draftWorkOrderRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));
            when(draftWorkOrderRepository.save(draft)).thenReturn(draft);

            // When
            workOrderService.addDraftItem(DRAFT_ID, item);
            item.setDraftWorkOrderItemID(ITEM_ID);
            workOrderService.updateDraftItem(DRAFT_ID, ITEM_ID, draftItem(0, "Updated planning", 2));

            // Then
            assertThat(item.getItemName()).isEqualTo("Updated planning");
            assertThat(item.getQuantity()).isEqualTo(2);

            // When
            workOrderService.deleteDraftItem(DRAFT_ID, ITEM_ID);

            // Then
            assertThat(draft.getItems()).isEmpty();
            verify(draftWorkOrderRepository, org.mockito.Mockito.times(3)).save(draft);
        }

        @Test
        void draftItemOperations_ShouldRejectInvalidAndMissingItems() {
            // Given
            DraftWorkOrder draft = draftWorkOrder();
            when(draftWorkOrderRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));

            // When / Then
            assertThatThrownBy(() -> workOrderService.addDraftItem(DRAFT_ID, draftItem(0, "", 1)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Item name is required");
            assertThatThrownBy(() -> workOrderService.updateDraftItem(
                    DRAFT_ID, ITEM_ID, draftItem(0, "Valid", 1)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft work order item not found");
            assertThatThrownBy(() -> workOrderService.deleteDraftItem(DRAFT_ID, ITEM_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft work order item not found");
        }

        @Test
        void archiveRestoreAndPermanentDelete_ShouldPreserveDraftLifecycleRules() {
            // Given
            DraftWorkOrder draft = draftWorkOrder();
            when(draftWorkOrderRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));
            when(draftWorkOrderRepository.save(draft)).thenReturn(draft);

            // When
            workOrderService.archiveDraftById(DRAFT_ID);

            // Then
            assertThat(draft.isArchived()).isTrue();
            assertThat(draft.getArchivedAt()).isNotNull();

            // When
            workOrderService.restoreDraftById(DRAFT_ID);

            // Then
            assertThat(draft.isArchived()).isFalse();
            assertThat(draft.getArchivedAt()).isNull();

            // When / Then
            assertThatThrownBy(() -> workOrderService.deleteDraftPermanentlyById(DRAFT_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Only archived draft work orders can be permanently deleted");

            // Given / When
            draft.setArchived(true);
            workOrderService.deleteDraftPermanentlyById(DRAFT_ID);

            // Then
            verify(draftWorkOrderRepository).delete(draft);
        }

        @Test
        void draftMutations_ShouldExplainMissingDraft() {
            // Given
            when(draftWorkOrderRepository.findById(DRAFT_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> workOrderService.addDraftItem(DRAFT_ID, draftItem(0, "Valid", 1)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft work order not found");
            assertThatThrownBy(() -> workOrderService.archiveDraftById(DRAFT_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft work order not found");
        }
    }

    private WorkOrder orderWithStatus(WorkOrderStatus status) {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setStatus(status);
        return workOrder;
    }

    private WorkOrder validOrderForCompletion() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.IN_REVIEW);
        Company company = new Company();
        company.setCompanyID(1);

        workOrder.setWorkOrderID(1);
        workOrder.setCompany(company);
        workOrder.addWorker(new Worker());
        workOrder.setStartDateTime(LocalDateTime.now().minusHours(1));
        workOrder.setEndDateTime(LocalDateTime.now());
        workOrder.addItem(new WorkOrderItem());
        return workOrder;
    }

    private DraftWorkOrder draftWorkOrder() {
        DraftWorkOrder draft = new DraftWorkOrder();
        draft.setDraftWorkOrderID(DRAFT_ID);
        draft.setWorkOrderName("Draft scope");
        return draft;
    }

    private DraftWorkOrderItem draftItem(int id, String name, int quantity) {
        DraftWorkOrderItem item = new DraftWorkOrderItem();
        item.setDraftWorkOrderItemID(id);
        item.setItemName(name);
        item.setQuantity(quantity);
        item.setPrice(new java.math.BigDecimal("10.00"));
        item.setItemType(ItemType.LABOR);
        return item;
    }
}
