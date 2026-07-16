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
import org.springframework.security.core.Authentication;

import com.atelicove.entities.Project;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Document;
import com.atelicove.entities.Worker;
import com.atelicove.enums.DocumentType;
import com.atelicove.enums.ProjectStatus;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.ProjectRepository;
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

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private AuthorizationService authorizationService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private WODocumentService service;

    @Test
    void findAllReturnsDocumentsFromRepository() {
        List<Document> documents =
                List.of(new Document(), new Document());
        when(repository.findAll()).thenReturn(documents);

        assertSame(documents, service.findAll());
    }

    @Test
    void findByIdReturnsRepositoryResult() {
        Document document = new Document();
        when(repository.findById(1)).thenReturn(Optional.of(document));

        assertEquals(Optional.of(document), service.findById(1));
    }

    @Test
    void saveReturnsSavedDocument() {
        Document document = new Document();
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
        workOrder.setStatus(WorkOrderStatus.ACTIVE);
        Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "encoded-password", false);
        MockMultipartFile file = new MockMultipartFile(
                "file", "inspection.pdf", "application/pdf", new byte[] { 1, 2, 3 });

        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(authorizationService.requireWorkOrderAccess(1, authentication)).thenReturn(worker);
        when(repository.save(any(Document.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Document saved = service.upload(1, file, DocumentType.OTHER, authentication);

        assertEquals("inspection.pdf", saved.getFileName());
        assertEquals("application/pdf", saved.getMimeType());
        assertEquals(3, saved.getFileSize());
        assertSame(workOrder, saved.getWorkOrder());
        assertSame(worker, saved.getUploadedByWorker());
    }

    @Test
    void uploadToProjectSavesValidatedDocumentForDraftProject() {
        Project project = new Project();
        project.setProjectID(7);
        project.setProjectStatus(ProjectStatus.OPEN);
        Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "encoded-password", true);
        MockMultipartFile file = new MockMultipartFile(
                "file", "proposal.pdf", "application/pdf", new byte[] { 4, 5, 6 });

        when(projectRepository.findById(7)).thenReturn(Optional.of(project));
        when(authorizationService.requireProjectAccess(7, authentication)).thenReturn(worker);
        when(repository.save(any(Document.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Document saved = service.uploadToProject(7, file, DocumentType.REPORT, authentication);

        assertEquals("proposal.pdf", saved.getFileName());
        assertEquals(DocumentType.REPORT, saved.getDocumentType());
        assertSame(project, saved.getProject());
        assertSame(worker, saved.getUploadedByWorker());
    }

    @Test
    void uploadToProjectRejectsActiveProject() {
        Project project = new Project();
        project.setProjectStatus(ProjectStatus.OPEN);
        MockMultipartFile file = new MockMultipartFile(
                "file", "proposal.pdf", "application/pdf", new byte[] { 4 });

        when(projectRepository.findById(7)).thenReturn(Optional.of(project));

        assertThrows(IllegalStateException.class, () -> service.uploadToProject(7, file, DocumentType.REPORT, authentication));
    }

    @Test
    void uploadRejectsCompletedWorkOrder() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setStatus(WorkOrderStatus.COMPLETE);
        MockMultipartFile file = new MockMultipartFile(
                "file", "inspection.pdf", "application/pdf", new byte[] { 1 });

        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        assertThrows(IllegalStateException.class, () -> service.upload(1, file, DocumentType.OTHER, authentication));
    }

    @Test
    void uploadRejectsArchivedWorkOrder() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setStatus(WorkOrderStatus.OPEN);
        workOrder.setArchived(true);
        MockMultipartFile file = new MockMultipartFile(
                "file", "inspection.pdf", "application/pdf", new byte[] { 1 });

        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));

        assertThrows(IllegalStateException.class,
                () -> service.upload(1, file, DocumentType.OTHER, authentication));
    }

    @Test
    void uploadRejectsUnsupportedFileType() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setStatus(WorkOrderStatus.ACTIVE);
        Worker worker = new Worker("Pat", "Lee", "plee", "plee@test.com", "encoded-password", false);
        MockMultipartFile file = new MockMultipartFile(
                "file", "song.mp3", "audio/mpeg", new byte[] { 1 });

        when(workOrderRepository.findById(1)).thenReturn(Optional.of(workOrder));
        when(authorizationService.requireWorkOrderAccess(1, authentication)).thenReturn(worker);

        assertThrows(IllegalArgumentException.class, () -> service.upload(1, file, DocumentType.OTHER, authentication));
    }
}
