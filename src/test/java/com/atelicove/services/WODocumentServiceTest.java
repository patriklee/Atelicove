package com.atelicove.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import com.atelicove.entities.Document;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Worker;
import com.atelicove.enums.DocumentType;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.WODocumentRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class WODocumentServiceTest {

    private static final int ORDER_ID = 7;

    @Mock WODocumentRepository repository;
    @Mock WorkOrderRepository workOrderRepository;
    @Mock WorkerRepository workerRepository;
    @Mock ProjectRepository projectRepository;
    @Mock AuthorizationService authorizationService;
    @Mock Authentication authentication;
    @InjectMocks WODocumentService service;

    @Test
    void uploadStoresOriginalBytesAndCorrectMetadata() {
        WorkOrder order = order(WorkOrderStatus.IN_PROCESS, false);
        Worker uploader = new Worker();
        uploader.setWorkerID(3);
        MockMultipartFile file = new MockMultipartFile(
                "file", "inspection.pdf", "application/pdf", new byte[] {1, 2, 3});
        when(workOrderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
        when(authorizationService.requireWorkOrderAccess(ORDER_ID, authentication)).thenReturn(uploader);
        when(repository.save(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Document saved = service.upload(ORDER_ID, file, DocumentType.REPORT, authentication);

        assertThat(saved.getFileName()).isEqualTo("inspection.pdf");
        assertThat(saved.getMimeType()).isEqualTo("application/pdf");
        assertThat(saved.getDocumentType()).isEqualTo(DocumentType.REPORT);
        assertThat(saved.getFileSize()).isEqualTo(3);
        assertThat(saved.getDocumentData()).containsExactly((byte) 1, (byte) 2, (byte) 3);
        assertThat(saved.getWorkOrder()).isSameAs(order);
        assertThat(saved.getUploadedByWorker()).isSameAs(uploader);
    }

    @Test
    void accessibleWorkerReceivesWorkOrderDocumentMetadata() {
        Document document = new Document();
        when(repository.findByWorkOrder_WorkOrderIDOrderByCreatedAtDesc(ORDER_ID))
                .thenReturn(List.of(document));

        assertThat(service.findByWorkOrder(ORDER_ID, authentication)).containsExactly(document);
        verify(authorizationService).requireWorkOrderAccess(ORDER_ID, authentication);
    }

    @Test
    void unauthorizedWorkerCannotAccessUnrelatedDocuments() {
        when(authorizationService.requireWorkOrderAccess(ORDER_ID, authentication))
                .thenThrow(new AccessDeniedException("Worker is not assigned to this work order"));

        assertThatThrownBy(() -> service.findByWorkOrder(ORDER_ID, authentication))
                .isInstanceOf(AccessDeniedException.class);
        verify(repository, never()).findByWorkOrder_WorkOrderIDOrderByCreatedAtDesc(ORDER_ID);
    }

    @Test
    void uploadRejectsUnsafeFileType() {
        WorkOrder order = order(WorkOrderStatus.IN_PROCESS, false);
        when(workOrderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
        when(authorizationService.requireWorkOrderAccess(ORDER_ID, authentication))
                .thenReturn(new Worker());
        MockMultipartFile file = new MockMultipartFile(
                "file", "audio.mp3", "audio/mpeg", new byte[] {1});

        assertThatThrownBy(() -> service.upload(ORDER_ID, file, DocumentType.OTHER, authentication))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only PDF, JPEG, PNG, DOCX, XLSX, and TXT files are allowed");
        verify(repository, never()).save(any());
    }

    @Test
    void archivedAndCompletedWorkOrdersRejectDocumentChanges() {
        when(workOrderRepository.findById(ORDER_ID))
                .thenReturn(Optional.of(order(WorkOrderStatus.OPEN, true)));

        assertThatThrownBy(() -> service.upload(
                ORDER_ID, pdf(), DocumentType.REPORT, authentication))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Archived work orders cannot have documents changed");

        when(workOrderRepository.findById(ORDER_ID))
                .thenReturn(Optional.of(order(WorkOrderStatus.COMPLETE, false)));

        assertThatThrownBy(() -> service.upload(
                ORDER_ID, pdf(), DocumentType.REPORT, authentication))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Completed work orders are sealed and cannot be edited");
    }

    @Test
    void missingDocumentProducesClearResourceError() {
        when(repository.findByDocumentIDAndWorkOrder_WorkOrderID(99, ORDER_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getRequiredDocument(ORDER_ID, 99))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Document not found");
    }

    private WorkOrder order(WorkOrderStatus status, boolean archived) {
        WorkOrder order = new WorkOrder();
        order.setWorkOrderID(ORDER_ID);
        order.setStatus(status);
        order.setArchived(archived);
        return order;
    }

    private MockMultipartFile pdf() {
        return new MockMultipartFile(
                "file", "inspection.pdf", "application/pdf", new byte[] {1, 2, 3});
    }
}
