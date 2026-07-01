package com.atelicove.services;

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
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.entities.Company;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.entities.Worker;
import com.atelicove.enums.ItemType;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;
import com.atelicove.services.WorkOrderService;

@ExtendWith(MockitoExtension.class)
public class WorkOrderServiceTest {

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private WorkerRepository workerRepository;

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private WorkOrderService workOrderService;

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
        assertEquals(WorkOrderStatus.IN_PROCESS, workOrder.getStatus());
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
        assertEquals(WorkOrderStatus.IN_PROCESS, workOrder.getStatus());
    }

    @Test
    void startWorkOrderRejectsOrderThatIsNotOpen() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.IN_PROCESS);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        assertThrows(IllegalStateException.class, () -> workOrderService.startWorkOrder(1));
        verify(workOrderRepository, never()).save(workOrder);
    }

    @Test
    void submitForReviewMovesInProcessOrderToReview() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.IN_PROCESS);
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
        item.setPrice(100);
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

        assertEquals(WorkOrderStatus.IN_PROCESS, workOrder.getStatus());
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
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.IN_PROCESS);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        assertThrows(IllegalStateException.class, () -> workOrderService.archiveById(1));
        verify(workOrderRepository, never()).save(workOrder);
    }

    @Test
    void deletePermanentlyByIdRemovesArchivedWorkOrder() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setArchived(true);
        Worker worker = new Worker();
        workOrder.addWorker(worker);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        workOrderService.deletePermanentlyById(1);

        assertEquals(0, worker.getWorkOrders().size());
        verify(workOrderRepository).delete(workOrder);
    }

    @Test
    void deletePermanentlyByIdRejectsActiveWorkOrder() {
        WorkOrder workOrder = new WorkOrder();
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        assertThrows(IllegalStateException.class, () -> workOrderService.deletePermanentlyById(1));
    }

    @Test
    void reassignWorkOrderAddsWorkerOnIncompleteOrder() {
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.IN_PROCESS);
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
        assertEquals(WorkOrderStatus.IN_PROCESS, workOrder.getStatus());
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
        WorkOrder workOrder = orderWithStatus(WorkOrderStatus.IN_PROCESS);
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
}
