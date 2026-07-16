package com.atelicove.services;

import static com.atelicove.support.TestFixtures.DOCUMENT_ID;
import static com.atelicove.support.TestFixtures.PROJECT_ID;
import static com.atelicove.support.TestFixtures.WORK_ORDER_ID;
import static com.atelicove.support.TestFixtures.aDocument;
import static com.atelicove.support.TestFixtures.aProject;
import static com.atelicove.support.TestFixtures.aWorkOrder;
import static com.atelicove.support.TestFixtures.aWorker;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import com.atelicove.entities.Document;
import com.atelicove.entities.Project;
import com.atelicove.entities.WorkOrder;
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

    private static final String FILE_NAME = "inspection.pdf";
    private static final String PDF_MIME_TYPE = "application/pdf";

    @Mock WODocumentRepository repository;
    @Mock WorkOrderRepository workOrderRepository;
    @Mock WorkerRepository workerRepository;
    @Mock ProjectRepository projectRepository;
    @Mock AuthorizationService authorizationService;
    @Mock Authentication authentication;
    @InjectMocks WODocumentService service;

    @Nested
    class QueriesAndPersistence {
        @Test
        void basicOperations_ShouldDelegateToRepository() {
            // Given
            WorkOrder order = aWorkOrder().build();
            Document document = aDocument().forWorkOrder(order).build();
            when(repository.findAll()).thenReturn(List.of(document));
            when(repository.findById(DOCUMENT_ID)).thenReturn(Optional.of(document));
            when(repository.save(document)).thenReturn(document);

            // When / Then
            assertThat(service.findAll()).containsExactly(document);
            assertThat(service.findById(DOCUMENT_ID)).contains(document);
            assertThat(service.save(document)).isSameAs(document);
            service.deleteById(DOCUMENT_ID);
            verify(repository).deleteById(DOCUMENT_ID);
        }

        @Test
        void save_ShouldRequireExactlyOneParent() {
            // Given
            Document noParent = new Document();
            Document twoParents = aDocument().forWorkOrder(aWorkOrder().build()).build();
            twoParents.setProject(aProject().build());

            // When / Then
            assertThatThrownBy(() -> service.save(null))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Document is required");
            assertThatThrownBy(() -> service.save(noParent))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Document must belong to exactly one work order or project");
            assertThatThrownBy(() -> service.save(twoParents))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Document must belong to exactly one work order or project");
            verify(repository, never()).save(any());
        }

        @Test
        void scopedQueries_ShouldAuthorizeAndReturnNewestDocuments() {
            // Given
            Document orderDocument = aDocument().forWorkOrder(aWorkOrder().build()).build();
            Document projectDocument = aDocument().forProject(aProject().build()).build();
            when(repository.findByWorkOrder_WorkOrderIDOrderByCreatedAtDesc(WORK_ORDER_ID))
                    .thenReturn(List.of(orderDocument));
            when(repository.findByProject_ProjectIDOrderByCreatedAtDesc(PROJECT_ID))
                    .thenReturn(List.of(projectDocument));

            // When / Then
            assertThat(service.findByWorkOrder(WORK_ORDER_ID)).containsExactly(orderDocument);
            assertThat(service.findByWorkOrder(WORK_ORDER_ID, authentication)).containsExactly(orderDocument);
            assertThat(service.findByProject(PROJECT_ID)).containsExactly(projectDocument);
            assertThat(service.findByProject(PROJECT_ID, authentication)).containsExactly(projectDocument);
            verify(authorizationService).requireWorkOrderAccess(WORK_ORDER_ID, authentication);
            verify(authorizationService).requireProjectAccess(PROJECT_ID, authentication);
        }

        @Test
        void requiredDocuments_ShouldEnforceParentOwnershipAndExplainMissingDocuments() {
            // Given
            Document orderDocument = aDocument().forWorkOrder(aWorkOrder().build()).build();
            Document projectDocument = aDocument().forProject(aProject().build()).build();
            when(repository.findByDocumentIDAndWorkOrder_WorkOrderID(DOCUMENT_ID, WORK_ORDER_ID))
                    .thenReturn(Optional.of(orderDocument));
            when(repository.findByDocumentIDAndProject_ProjectID(DOCUMENT_ID, PROJECT_ID))
                    .thenReturn(Optional.of(projectDocument));

            // When / Then
            assertThat(service.getRequiredDocument(WORK_ORDER_ID, DOCUMENT_ID)).isSameAs(orderDocument);
            assertThat(service.getRequiredDocument(WORK_ORDER_ID, DOCUMENT_ID, authentication)).isSameAs(orderDocument);
            assertThat(service.getRequiredProjectDocument(PROJECT_ID, DOCUMENT_ID)).isSameAs(projectDocument);
            assertThat(service.getRequiredProjectDocument(PROJECT_ID, DOCUMENT_ID, authentication))
                    .isSameAs(projectDocument);

            // Given
            when(repository.findByDocumentIDAndWorkOrder_WorkOrderID(DOCUMENT_ID + 1, WORK_ORDER_ID))
                    .thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.getRequiredDocument(WORK_ORDER_ID, DOCUMENT_ID + 1))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Document not found");
        }
    }

    @Nested
    class Uploads {
        @Test
        void upload_ShouldPersistValidatedWorkOrderDocument() {
            // Given
            WorkOrder order = aWorkOrder().status(WorkOrderStatus.ACTIVE).build();
            Worker worker = aWorker().build();
            MockMultipartFile file = pdf(FILE_NAME);
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));
            when(authorizationService.requireWorkOrderAccess(WORK_ORDER_ID, authentication)).thenReturn(worker);
            when(repository.save(any(Document.class))).thenAnswer(call -> call.getArgument(0));

            // When
            Document saved = service.upload(WORK_ORDER_ID, file, DocumentType.OTHER, authentication);

            // Then
            assertThat(saved.getFileName()).isEqualTo(FILE_NAME);
            assertThat(saved.getMimeType()).isEqualTo(PDF_MIME_TYPE);
            assertThat(saved.getFileSize()).isEqualTo(3);
            assertThat(saved.getWorkOrder()).isSameAs(order);
            assertThat(saved.getUploadedByWorker()).isSameAs(worker);
        }

        @Test
        void uploadToProject_ShouldPersistValidatedProjectDocument() {
            // Given
            Project project = aProject().status(ProjectStatus.OPEN).build();
            Worker worker = aWorker().admin(true).build();
            MockMultipartFile file = pdf("proposal.pdf");
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));
            when(authorizationService.requireProjectAccess(PROJECT_ID, authentication)).thenReturn(worker);
            when(repository.save(any(Document.class))).thenAnswer(call -> call.getArgument(0));

            // When
            Document saved = service.uploadToProject(PROJECT_ID, file, DocumentType.REPORT, authentication);

            // Then
            assertThat(saved.getProject()).isSameAs(project);
            assertThat(saved.getDocumentType()).isEqualTo(DocumentType.REPORT);
            assertThat(saved.getUploadedByWorker()).isSameAs(worker);
        }

        @ParameterizedTest(name = "{0} should be rejected")
        @CsvSource(value = {
                "song.mp3|audio/mpeg|Only PDF, JPEG, PNG, DOCX, XLSX, and TXT files are allowed",
                "image.png|application/pdf|File extension does not match the selected file type"
        }, delimiter = '|')
        void upload_ShouldRejectUnsafeFileTypes(String name, String mimeType, String message) {
            // Given
            WorkOrder order = aWorkOrder().status(WorkOrderStatus.ACTIVE).build();
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));
            when(authorizationService.requireWorkOrderAccess(WORK_ORDER_ID, authentication)).thenReturn(aWorker().build());
            MockMultipartFile file = new MockMultipartFile("file", name, mimeType, new byte[] {1});

            // When / Then
            assertThatThrownBy(() -> service.upload(WORK_ORDER_ID, file, DocumentType.OTHER, authentication))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage(message);
            verify(repository, never()).save(any());
        }

        @Test
        void upload_ShouldRejectMissingTypeEmptyAndOversizedFiles() {
            // Given
            WorkOrder order = aWorkOrder().status(WorkOrderStatus.ACTIVE).build();
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));
            when(authorizationService.requireWorkOrderAccess(WORK_ORDER_ID, authentication)).thenReturn(aWorker().build());
            MockMultipartFile empty = new MockMultipartFile("file", FILE_NAME, PDF_MIME_TYPE, new byte[0]);
            MockMultipartFile oversized = new MockMultipartFile(
                    "file", FILE_NAME, PDF_MIME_TYPE, new byte[10 * 1024 * 1024 + 1]);

            // When / Then
            assertThatThrownBy(() -> service.upload(WORK_ORDER_ID, pdf(FILE_NAME), null, authentication))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Document type is required");
            assertThatThrownBy(() -> service.upload(WORK_ORDER_ID, empty, DocumentType.OTHER, authentication))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("A document file is required");
            assertThatThrownBy(() -> service.upload(WORK_ORDER_ID, oversized, DocumentType.OTHER, authentication))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Documents must be 10 MB or smaller");
        }

        @Test
        void upload_ShouldWrapFileReadFailures() throws IOException {
            // Given
            WorkOrder order = aWorkOrder().status(WorkOrderStatus.ACTIVE).build();
            MultipartFile broken = org.mockito.Mockito.mock(MultipartFile.class);
            when(broken.isEmpty()).thenReturn(false);
            when(broken.getSize()).thenReturn(1L);
            when(broken.getContentType()).thenReturn(PDF_MIME_TYPE);
            when(broken.getOriginalFilename()).thenReturn(FILE_NAME);
            when(broken.getBytes()).thenThrow(new IOException("disk error"));
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));
            when(authorizationService.requireWorkOrderAccess(WORK_ORDER_ID, authentication)).thenReturn(aWorker().build());

            // When / Then
            assertThatThrownBy(() -> service.upload(WORK_ORDER_ID, broken, DocumentType.OTHER, authentication))
                    .isInstanceOf(IllegalStateException.class).hasMessage("Document could not be uploaded");
        }
    }

    @Nested
    class MutabilityAndDeletion {
        @Test
        void upload_ShouldRejectMissingArchivedAndCompletedWorkOrders() {
            // Given / When / Then
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.upload(WORK_ORDER_ID, pdf(FILE_NAME), DocumentType.OTHER, authentication))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Work order not found");

            // Given / When / Then
            when(workOrderRepository.findById(WORK_ORDER_ID))
                    .thenReturn(Optional.of(aWorkOrder().archived(true).build()));
            assertThatThrownBy(() -> service.upload(WORK_ORDER_ID, pdf(FILE_NAME), DocumentType.OTHER, authentication))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Archived work orders cannot have documents changed");

            // Given / When / Then
            when(workOrderRepository.findById(WORK_ORDER_ID))
                    .thenReturn(Optional.of(aWorkOrder().status(WorkOrderStatus.COMPLETE).build()));
            assertThatThrownBy(() -> service.upload(WORK_ORDER_ID, pdf(FILE_NAME), DocumentType.OTHER, authentication))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Completed work orders are sealed and cannot be edited");
        }

        @Test
        void uploadToProject_ShouldRejectProtectedProjects() {
            // Given
            when(projectRepository.findById(PROJECT_ID))
                    .thenReturn(Optional.of(aProject().status(ProjectStatus.COMPLETE).build()));

            // When / Then
            assertThatThrownBy(() -> service.uploadToProject(
                    PROJECT_ID, pdf(FILE_NAME), DocumentType.REPORT, authentication))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Project documents can only be changed while the project is draft or active");
        }

        @Test
        void deleteMethods_ShouldAuthorizeValidateParentAndDelete() {
            // Given
            WorkOrder order = aWorkOrder().build();
            Project project = aProject().build();
            Document orderDocument = aDocument().forWorkOrder(order).build();
            Document projectDocument = aDocument().forProject(project).build();
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));
            when(repository.findByDocumentIDAndWorkOrder_WorkOrderID(DOCUMENT_ID, WORK_ORDER_ID))
                    .thenReturn(Optional.of(orderDocument));
            when(repository.findByDocumentIDAndProject_ProjectID(DOCUMENT_ID, PROJECT_ID))
                    .thenReturn(Optional.of(projectDocument));

            // When
            service.deleteFromWorkOrder(WORK_ORDER_ID, DOCUMENT_ID, authentication);
            service.deleteFromProject(PROJECT_ID, DOCUMENT_ID, authentication);

            // Then
            verify(repository).delete(orderDocument);
            verify(repository).delete(projectDocument);
            verify(authorizationService).requireWorkOrderAccess(WORK_ORDER_ID, authentication);
            verify(authorizationService).requireProjectAccess(PROJECT_ID, authentication);
        }
    }

    private MockMultipartFile pdf(String fileName) {
        return new MockMultipartFile("file", fileName, PDF_MIME_TYPE, new byte[] {1, 2, 3});
    }
}
