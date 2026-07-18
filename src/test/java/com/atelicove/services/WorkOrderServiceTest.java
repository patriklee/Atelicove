package com.atelicove.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
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
import com.atelicove.repositories.DraftWorkOrderRepository;
import com.atelicove.repositories.WODocumentRepository;
import com.atelicove.repositories.WOItemRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class WorkOrderServiceTest {

    @Mock WorkOrderRepository workOrderRepository;
    @Mock DraftWorkOrderRepository draftWorkOrderRepository;
    @Mock WorkerRepository workerRepository;
    @Mock CompanyRepository companyRepository;
    @Mock WODocumentRepository documentRepository;
    @Mock WOItemRepository itemRepository;
    @InjectMocks WorkOrderService service;

    @Test
    void openWorkOrderMovesToInProcess() {
        WorkOrder order = order(WorkOrderStatus.OPEN);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(order));
        when(workOrderRepository.save(order)).thenReturn(order);

        assertThat(service.startWorkOrder(1).getStatus()).isEqualTo(WorkOrderStatus.IN_PROCESS);
    }

    @ParameterizedTest
    @EnumSource(value = WorkOrderStatus.class, names = {"OPEN", "IN_PROCESS"})
    void editableWorkOrderMovesToReview(WorkOrderStatus initialStatus) {
        WorkOrder order = order(initialStatus);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(order));
        when(workOrderRepository.save(order)).thenReturn(order);

        assertThat(service.submitForReview(1).getStatus()).isEqualTo(WorkOrderStatus.IN_REVIEW);
    }

    @Test
    void reviewedWorkOrderCanBeCompleted() {
        WorkOrder order = validOrderForCompletion();
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(order));
        when(workOrderRepository.save(order)).thenReturn(order);

        assertThat(service.approveWorkOrder(1).getStatus()).isEqualTo(WorkOrderStatus.COMPLETE);
    }

    @Test
    void rejectedReviewReturnsToInProcess() {
        WorkOrder order = order(WorkOrderStatus.IN_REVIEW);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(order));
        when(workOrderRepository.save(order)).thenReturn(order);

        assertThat(service.rejectWorkOrder(1).getStatus()).isEqualTo(WorkOrderStatus.IN_PROCESS);
    }

    @Test
    void inReviewWorkOrderCannotBeEdited() {
        assertCommentEditRejected(order(WorkOrderStatus.IN_REVIEW),
                "Work orders can only be edited while open or in process");
    }

    @Test
    void completedWorkOrderCannotBeEdited() {
        assertCommentEditRejected(order(WorkOrderStatus.COMPLETE),
                "Work orders can only be edited while open or in process");
    }

    @Test
    void archivedWorkOrderCannotBeEdited() {
        WorkOrder order = order(WorkOrderStatus.OPEN);
        order.setArchived(true);
        assertCommentEditRejected(order, "Archived work orders cannot be edited");
    }

    @Test
    void workerAssignmentUsesManagedWorkerAndPersists() {
        WorkOrder order = order(WorkOrderStatus.OPEN);
        Worker managed = worker(7);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(order));
        when(workerRepository.findById(7)).thenReturn(Optional.of(managed));
        when(workOrderRepository.save(order)).thenReturn(order);

        WorkOrder result = service.reassignWorkOrder(1, 7);

        assertThat(result.getWorkers()).containsExactly(managed);
        assertThat(result.getStatus()).isEqualTo(WorkOrderStatus.IN_PROCESS);
        verify(workOrderRepository).save(order);
    }

    @Test
    void duplicateWorkerAssignmentDoesNotCreateAnotherRelationship() {
        WorkOrder order = order(WorkOrderStatus.IN_PROCESS);
        Worker worker = worker(7);
        order.addWorker(worker);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(order));
        when(workerRepository.findById(7)).thenReturn(Optional.of(worker));

        assertThat(service.reassignWorkOrder(1, 7).getWorkers()).containsExactly(worker);
        verify(workOrderRepository, never()).save(any());
    }

    @Test
    void companyAssignmentUsesManagedCompanyAndPersists() {
        WorkOrder order = order(WorkOrderStatus.OPEN);
        Company company = new Company();
        company.setCompanyID(4);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(order));
        when(companyRepository.findById(4)).thenReturn(Optional.of(company));
        when(workOrderRepository.save(order)).thenReturn(order);

        assertThat(service.assignCompanyToWorkOrder(1, 4).getCompany()).isSameAs(company);
        verify(workOrderRepository).save(order);
    }

    @Test
    void missingWorkOrderProducesClearResourceError() {
        when(workOrderRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.startWorkOrder(99))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Work order not found");
    }

    private void assertCommentEditRejected(WorkOrder order, String message) {
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.updateComment(1, "changed"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(message);
        verify(workOrderRepository, never()).save(any());
    }

    private WorkOrder order(WorkOrderStatus status) {
        WorkOrder order = new WorkOrder();
        order.setWorkOrderID(1);
        order.setStatus(status);
        return order;
    }

    private Worker worker(int id) {
        Worker worker = new Worker();
        worker.setWorkerID(id);
        return worker;
    }

    private WorkOrder validOrderForCompletion() {
        WorkOrder order = order(WorkOrderStatus.IN_REVIEW);
        Company company = new Company();
        company.setCompanyID(4);
        order.setCompany(company);
        order.addWorker(worker(7));
        order.setStartDateTime(LocalDateTime.now().minusHours(1));
        order.setEndDateTime(LocalDateTime.now());
        order.addItem(new WorkOrderItem(
                "Labor", 1, BigDecimal.TEN, ItemType.LABOR, order));
        return order;
    }
}
