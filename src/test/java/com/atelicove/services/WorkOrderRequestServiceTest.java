package com.atelicove.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.dto.CreateWorkOrderRequest;
import com.atelicove.dto.UpdateWorkOrderItemRequest;
import com.atelicove.entities.Company;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.entities.Worker;
import com.atelicove.enums.ItemType;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;
import com.atelicove.repositories.WODocumentRepository;
import com.atelicove.repositories.WOItemRepository;

@ExtendWith(MockitoExtension.class)
class WorkOrderRequestServiceTest {

    @Mock WorkOrderRepository workOrderRepository;
    @Mock WorkerRepository workerRepository;
    @Mock CompanyRepository companyRepository;
    @Mock WODocumentRepository documentRepository;
    @Mock WOItemRepository itemRepository;
    @InjectMocks WorkOrderService service;

    @Test
    void createChoosesStatusAndArchiveState() {
        when(workOrderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        WorkOrder result = service.createWorkOrder(
                new CreateWorkOrderRequest(null, null, "New job", null, List.of()));

        assertThat(result.getStatus()).isEqualTo(WorkOrderStatus.OPEN);
        assertThat(result.isArchived()).isFalse();
        assertThat(result.getArchivedAt()).isNull();
    }

    @Test
    void createResolvesWorkerIdsToManagedWorkers() {
        Worker managedWorker = new Worker();
        managedWorker.setWorkerID(7);
        when(workerRepository.findById(7)).thenReturn(Optional.of(managedWorker));
        when(workOrderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        WorkOrder result = service.createWorkOrder(
                new CreateWorkOrderRequest(null, null, null, null, List.of(7)));

        assertThat(result.getWorkers()).containsExactly(managedWorker);
        assertThat(result.getStatus()).isEqualTo(WorkOrderStatus.IN_PROCESS);
    }

    @Test
    void createRejectsMissingWorkerWithIdInMessage() {
        when(workerRepository.findById(7)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createWorkOrder(
                new CreateWorkOrderRequest(null, null, null, null, List.of(7))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Worker not found: 7");
        verify(workOrderRepository, never()).save(any());
    }

    @Test
    void createRejectsArchivedWorker() {
        Worker archivedWorker = new Worker();
        archivedWorker.setWorkerID(7);
        archivedWorker.setArchived(true);
        when(workerRepository.findById(7)).thenReturn(Optional.of(archivedWorker));

        assertThatThrownBy(() -> service.createWorkOrder(
                new CreateWorkOrderRequest(null, null, null, null, List.of(7))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Archived workers cannot be assigned");
    }

    @Test
    void createRejectsArchivedCompany() {
        Company archivedCompany = new Company();
        archivedCompany.setCompanyID(4);
        archivedCompany.setArchived(true);
        when(companyRepository.findById(4)).thenReturn(Optional.of(archivedCompany));

        assertThatThrownBy(() -> service.createWorkOrder(
                new CreateWorkOrderRequest(null, null, null, 4, List.of())))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Archived companies cannot be assigned");
    }

    @Test
    void updateItemCannotChangeItsParentWorkOrder() {
        WorkOrder parent = new WorkOrder();
        parent.setWorkOrderID(1);
        WorkOrderItem item = new WorkOrderItem("Old", 1, BigDecimal.ONE, ItemType.LABOR, parent);
        item.setWorkOrderItemID(9);
        parent.addItem(item);
        when(workOrderRepository.findById(1)).thenReturn(Optional.of(parent));
        when(workOrderRepository.save(parent)).thenReturn(parent);

        service.updateItem(1, 9,
                new UpdateWorkOrderItemRequest("Updated", 2, new BigDecimal("12.00"), ItemType.MATERIAL));

        assertThat(item.getWorkOrder()).isSameAs(parent);
        assertThat(item.getItemName()).isEqualTo("Updated");
    }
}
