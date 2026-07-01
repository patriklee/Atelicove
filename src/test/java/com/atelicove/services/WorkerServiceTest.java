package com.atelicove.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Worker;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.WorkerRepository;
import com.atelicove.services.WorkerService;

@ExtendWith(MockitoExtension.class)
class WorkerServiceTest {

    @Mock
    private WorkerRepository workerRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private WorkerService workerService;

    @Test
    void createWorkerEncodesPasswordBeforeSaving() {
        Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "password123", false);
        when(workerRepository.findByWorkerUserIgnoreCase("plee")).thenReturn(Optional.empty());
        when(workerRepository.findByWorkerEmailIgnoreCase("plee@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(workerRepository.save(worker)).thenReturn(worker);

        Worker result = workerService.createWorker(worker);

        assertSame(worker, result);
        assertEquals("encoded-password", worker.getWorkerPW());
        verify(passwordEncoder).encode("password123");
        verify(workerRepository).save(worker);
    }

    @Test
    void createWorkerRejectsMissingOrShortPassword() {
        Worker missingPassword = new Worker("Pat", "Lee", "plee", "plee@test.com", " ", false);
        Worker shortPassword = new Worker("Sam", "Hill", "shill", "shill@test.com", "short", false);

        assertThrows(IllegalArgumentException.class,
                () -> workerService.createWorker(missingPassword));
        assertThrows(IllegalArgumentException.class,
                () -> workerService.createWorker(shortPassword));

        verify(workerRepository, never()).save(missingPassword);
        verify(workerRepository, never()).save(shortPassword);
    }

    @Test
    void findMethodsReturnRepositoryResults() {
        Worker worker = new Worker();
        List<Worker> workers = List.of(worker);
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("PAT")).thenReturn(Optional.of(worker));
        when(workerRepository.findById(1)).thenReturn(Optional.of(worker));
        when(workerRepository.findAll()).thenReturn(workers);
        when(workerRepository.findByArchivedFalse()).thenReturn(workers);

        assertEquals(Optional.of(worker), workerService.findByUsername("PAT"));
        assertEquals(Optional.of(worker), workerService.findById(1));
        assertSame(workers, workerService.findAll());
        assertSame(workers, workerService.findActive());
    }

    @Test
    void archiveByIdMarksWorkerArchived() {
        Worker worker = new Worker();
        when(workerRepository.findById(1)).thenReturn(Optional.of(worker));

        workerService.archiveById(1);

        assertEquals(true, worker.isArchived());
        assertNotNull(worker.getArchivedAt());
        verify(workerRepository).save(worker);
    }

    @Test
    void archiveByIdRejectsUnknownWorker() {
        when(workerRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> workerService.archiveById(99));
        verify(workerRepository, never()).deleteById(99);
    }

    @Test
    void archiveByIdRejectsWorkerAssignedToOpenWorkOrder() {
        Worker worker = new Worker();
        WorkOrder workOrder = new WorkOrder();
        workOrder.setStatus(WorkOrderStatus.IN_PROCESS);
        workOrder.addWorker(worker);
        when(workerRepository.findById(1)).thenReturn(Optional.of(worker));

        assertThrows(IllegalStateException.class, () -> workerService.archiveById(1));
        verify(workerRepository, never()).save(worker);
    }

    @Test
    void restoreByIdClearsArchiveFields() {
        Worker worker = new Worker();
        worker.setArchived(true);
        when(workerRepository.findById(1)).thenReturn(Optional.of(worker));
        when(workerRepository.save(worker)).thenReturn(worker);

        Worker result = workerService.restoreById(1);

        assertSame(worker, result);
        assertEquals(false, worker.isArchived());
        assertEquals(null, worker.getArchivedAt());
    }

    @Test
    void deletePermanentlyByIdRemovesArchivedWorkerAndDetachesWorkOrders() {
        Worker worker = new Worker();
        worker.setWorkerID(1);
        worker.setArchived(true);
        WorkOrder workOrder = new WorkOrder();
        workOrder.addWorker(worker);
        when(workerRepository.findById(1)).thenReturn(Optional.of(worker));

        workerService.deletePermanentlyById(1);

        assertEquals(0, workOrder.getWorkers().size());
        verify(workerRepository).delete(worker);
    }

    @Test
    void deletePermanentlyByIdRejectsActiveWorker() {
        Worker worker = new Worker();
        when(workerRepository.findById(1)).thenReturn(Optional.of(worker));

        assertThrows(IllegalStateException.class, () -> workerService.deletePermanentlyById(1));
    }

    @Test
    void resetPasswordEncodesAndSavesNewPassword() {
        Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "old-password", false);
        when(workerRepository.findById(1)).thenReturn(Optional.of(worker));
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-new-password");

        workerService.resetPassword(1, "new-password");

        assertEquals("encoded-new-password", worker.getWorkerPW());
        verify(workerRepository).save(worker);
    }

    @Test
    void resetPasswordRejectsInvalidPasswordAndUnknownWorker() {
        assertThrows(IllegalArgumentException.class,
                () -> workerService.resetPassword(1, "short"));

        when(workerRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class,
                () -> workerService.resetPassword(99, "valid-password"));
    }
}
