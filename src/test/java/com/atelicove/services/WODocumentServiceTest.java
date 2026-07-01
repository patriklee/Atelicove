package com.atelicove.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderDocument;
import com.atelicove.entities.Worker;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.WODocumentRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class WODocumentServiceTest {

    @Mock
    private WODocumentRepository repository;

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private WorkerRepository workerRepository;

    @InjectMocks
    private WODocumentService service;

    @Test
    void findAllReturnsDocumentsFromRepository() {
        List<WorkOrderDocument> documents =
                List.of(new WorkOrderDocument(), new WorkOrderDocument());
        when(repository.findAll()).thenReturn(documents);

        assertSame(documents, service.findAll());
    }

    @Test
    void findByIdReturnsRepositoryResult() {
        WorkOrderDocument document = new WorkOrderDocument();
        when(repository.findById(1)).thenReturn(Optional.of(document));

        assertEquals(Optional.of(document), service.findById(1));
    }

    @Test
    void saveReturnsSavedDocument() {
        WorkOrderDocument document = new WorkOrderDocument();
        when(repository.save(document)).thenReturn(document);

        assertSame(document, service.save(document));
    }

    @Test
    void deleteByIdDelegatesToRepository() {
        service.deleteById(1);

        verify(repository).deleteById(1);
    }

    @Test
    void uploadSavesValidatedDocument() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setWorkOrderID(1);
        workOrder.setStatus(WorkOrderStatus.IN_PROCESS);
        Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "encoded-password", false);
        MockMultipartFile file = new MockMultipartFile(
                "file", "inspection.pdf", "application/pdf", new byte[] { 1, 2, 3 });

        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("plee")).thenReturn(Optional.of(worker));
        when(repository.save(any(WorkOrderDocument.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WorkOrderDocument saved = service.upload(1, file, "plee");

        assertEquals("inspection.pdf", saved.getFileName());
        assertEquals("application/pdf", saved.getMimeType());
        assertEquals(3, saved.getFileSize());
        assertSame(workOrder, saved.getWorkOrder());
        assertSame(worker, saved.getUploadedByWorker());
    }

    @Test
    void uploadRejectsCompletedWorkOrder() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setStatus(WorkOrderStatus.COMPLETE);
        MockMultipartFile file = new MockMultipartFile(
                "file", "inspection.pdf", "application/pdf", new byte[] { 1 });

        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        assertThrows(IllegalStateException.class, () -> service.upload(1, file, "plee"));
    }

    @Test
    void uploadRejectsUnsupportedFileType() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setStatus(WorkOrderStatus.IN_PROCESS);
        Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "encoded-password", false);
        MockMultipartFile file = new MockMultipartFile(
                "file", "song.mp3", "audio/mpeg", new byte[] { 1 });

        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("plee")).thenReturn(Optional.of(worker));

        assertThrows(IllegalArgumentException.class, () -> service.upload(1, file, "plee"));
    }
}
