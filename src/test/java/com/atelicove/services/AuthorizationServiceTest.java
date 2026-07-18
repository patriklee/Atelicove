package com.atelicove.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;

import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Worker;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class AuthorizationServiceTest {

    @Mock WorkerRepository workerRepository;
    @Mock WorkOrderRepository workOrderRepository;
    @Mock ProjectRepository projectRepository;
    @InjectMocks AuthorizationService service;

    private final Authentication authentication =
            new TestingAuthenticationToken("pat", "n/a", "ROLE_WORKER");

    @Test
    void adminSeesEveryActiveWorkOrder() {
        Worker admin = worker(1, true);
        WorkOrder first = order(10);
        WorkOrder second = order(11);
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("pat"))
                .thenReturn(Optional.of(admin));
        when(workOrderRepository.findByArchivedFalse()).thenReturn(List.of(first, second));

        assertThat(service.visibleActiveWorkOrders(authentication)).containsExactly(first, second);
    }

    @Test
    void workerSeesOnlyAssignedActiveWorkOrders() {
        Worker worker = worker(2, false);
        WorkOrder assigned = order(10);
        assigned.addWorker(worker);
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("pat"))
                .thenReturn(Optional.of(worker));
        when(workOrderRepository.findDistinctByWorkers_WorkerIDAndArchivedFalse(2))
                .thenReturn(List.of(assigned));

        assertThat(service.visibleActiveWorkOrders(authentication)).containsExactly(assigned);
        verify(workOrderRepository, never()).findByArchivedFalse();
    }

    @Test
    void assignedWorkerCanAccessWorkOrder() {
        Worker worker = worker(2, false);
        WorkOrder assigned = order(10);
        assigned.addWorker(worker);
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("pat"))
                .thenReturn(Optional.of(worker));
        when(workOrderRepository.findById(10)).thenReturn(Optional.of(assigned));

        assertThat(service.requireWorkOrderAccess(10, authentication)).isSameAs(worker);
    }

    @Test
    void workerCannotAccessUnrelatedWorkOrder() {
        Worker worker = worker(2, false);
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("pat"))
                .thenReturn(Optional.of(worker));
        when(workOrderRepository.findById(10)).thenReturn(Optional.of(order(10)));

        assertThatThrownBy(() -> service.requireWorkOrderAccess(10, authentication))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Worker is not assigned to this work order");
    }

    @Test
    void missingWorkOrderIsReportedSeparatelyFromForbiddenAccess() {
        Worker worker = worker(2, false);
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("pat"))
                .thenReturn(Optional.of(worker));
        when(workOrderRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.requireWorkOrderAccess(99, authentication))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Work order not found");
    }

    private Worker worker(int id, boolean admin) {
        Worker worker = new Worker("Pat", "Lee", "pat", "pat@example.com", "encoded", admin);
        worker.setWorkerID(id);
        return worker;
    }

    private WorkOrder order(int id) {
        WorkOrder order = new WorkOrder();
        order.setWorkOrderID(id);
        return order;
    }
}
