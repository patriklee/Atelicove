package com.atelicove.services;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

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

@Service
public class WODocumentService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024L * 1024L;
    private static final Map<String, String> ALLOWED_EXTENSIONS_BY_MIME_TYPE = Map.of(
            "application/pdf", "pdf",
            "image/jpeg", "jpg",
            "image/png", "png",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx",
            "text/plain", "txt"
    );

	private final WODocumentRepository repository;
    private final WorkOrderRepository workOrderRepository;
    private final ProjectRepository projectRepository;
    private final AuthorizationService authorizationService;

    public WODocumentService(
            WODocumentRepository repository,
            WorkOrderRepository workOrderRepository,
            WorkerRepository workerRepository,
            ProjectRepository projectRepository,
            AuthorizationService authorizationService) {
        this.repository = repository;
        this.workOrderRepository = workOrderRepository;
        this.projectRepository = projectRepository;
        this.authorizationService = authorizationService;
    }

    public List<Document> findAll() {
        return repository.findAll();
    }

    public Optional<Document> findById(Integer id) {
        return repository.findById(id);
    }

    public Document save(Document document) {
        validateParent(document);
        return repository.save(document);
    }

    public void deleteById(Integer id) {
        repository.deleteById(id);
    }

    public List<Document> findByWorkOrder(Integer workOrderID) {
        return repository.findByWorkOrder_WorkOrderIDOrderByCreatedAtDesc(workOrderID);
    }

    public List<Document> findByWorkOrder(Integer workOrderID, Authentication authentication) {
        authorizationService.requireWorkOrderAccess(workOrderID, authentication);
        return findByWorkOrder(workOrderID);
    }

    public List<Document> findByProject(Integer projectID) {
        return repository.findByProject_ProjectIDOrderByCreatedAtDesc(projectID);
    }

    public List<Document> findByProject(Integer projectID, Authentication authentication) {
        authorizationService.requireProjectAccess(projectID, authentication);
        return findByProject(projectID);
    }

    public Document getRequiredDocument(Integer workOrderID, Integer documentID) {
        return repository.findByDocumentIDAndWorkOrder_WorkOrderID(documentID, workOrderID)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
    }

    public Document getRequiredDocument(Integer workOrderID, Integer documentID, Authentication authentication) {
        authorizationService.requireWorkOrderAccess(workOrderID, authentication);
        return getRequiredDocument(workOrderID, documentID);
    }

    public Document getRequiredProjectDocument(Integer projectID, Integer documentID) {
        return repository.findByDocumentIDAndProject_ProjectID(documentID, projectID)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
    }

    public Document getRequiredProjectDocument(Integer projectID, Integer documentID, Authentication authentication) {
        authorizationService.requireProjectAccess(projectID, authentication);
        return getRequiredProjectDocument(projectID, documentID);
    }

    /**
     * Uploads a document to an editable work order after checking the uploader,
     * document type, size, MIME type, and file extension.
     *
     * @param workOrderID work order receiving the document
     * @param file uploaded file contents
     * @param documentType business category selected for the document
     * @param username authenticated uploader username
     * @return the saved work order document
     */
    @Transactional
    public Document upload(Integer workOrderID, MultipartFile file, DocumentType documentType, Authentication authentication) {
        WorkOrder workOrder = getEditableWorkOrder(workOrderID);
        Worker worker = authorizationService.requireWorkOrderAccess(workOrderID, authentication);

        if (documentType == null) {
            throw new IllegalArgumentException("Document type is required");
        }
        validateFile(file);

        try {
            Document document = new Document(
                    workOrder,
                    cleanFileName(file.getOriginalFilename()),
                    documentType,
                    file.getBytes(),
                    worker,
                    file.getContentType(),
                    file.getSize());

            validateParent(document);
            return repository.save(document);
        } catch (Exception exception) {
            throw new IllegalStateException("Document could not be uploaded");
        }
    }

    /**
     * Uploads a document to a draft project after checking project membership,
     * document type, size, MIME type, and file extension.
     *
     * @param projectID draft project receiving the document
     * @param file uploaded file contents
     * @param documentType business category selected for the document
     * @param username authenticated uploader username
     * @return the saved project document
     */
    @Transactional
    public Document uploadToProject(Integer projectID, MultipartFile file, DocumentType documentType, Authentication authentication) {
        Project project = getEditableProject(projectID);
        Worker worker = authorizationService.requireProjectAccess(projectID, authentication);

        if (documentType == null) {
            throw new IllegalArgumentException("Document type is required");
        }
        validateFile(file);

        try {
            Document document = new Document(
                    project,
                    cleanFileName(file.getOriginalFilename()),
                    documentType,
                    file.getBytes(),
                    worker,
                    file.getContentType(),
                    file.getSize());

            validateParent(document);
            return repository.save(document);
        } catch (Exception exception) {
            throw new IllegalStateException("Document could not be uploaded");
        }
    }

    /**
     * Deletes a document from a work order only when that work order is still
     * editable.
     *
     * @param workOrderID work order that owns the document
     * @param documentID document to remove
     */
    @Transactional
    public void deleteFromWorkOrder(Integer workOrderID, Integer documentID, Authentication authentication) {
        authorizationService.requireWorkOrderAccess(workOrderID, authentication);
        getEditableWorkOrder(workOrderID);
        Document document = getRequiredDocument(workOrderID, documentID);
        repository.delete(document);
    }

    /**
     * Deletes a document from an editable project only when the uploader is allowed
     * to manage that project's documents.
     *
     * @param projectID project that owns the document
     * @param documentID document to remove
     * @param username authenticated user requesting deletion
     */
    @Transactional
    public void deleteFromProject(Integer projectID, Integer documentID, Authentication authentication) {
        Project project = getEditableProject(projectID);
        authorizationService.requireProjectAccess(projectID, authentication);
        Document document = getRequiredProjectDocument(projectID, documentID);
        repository.delete(document);
    }

    /**
     * Finds a work order that can accept document changes.
     *
     * @param workOrderID work order to check
     * @return editable work order
     */
    private WorkOrder getEditableWorkOrder(Integer workOrderID) {
        WorkOrder workOrder = workOrderRepository.findById(workOrderID)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found"));

        if (workOrder.getStatus() == WorkOrderStatus.COMPLETE) {
            throw new IllegalStateException("Completed work orders are sealed and cannot be edited");
        }

        return workOrder;
    }

    private Project getEditableProject(Integer projectID) {
        Project project = projectRepository.findById(projectID)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (project.isArchived()) {
            throw new IllegalStateException("Archived projects cannot have documents changed");
        }

		if (project.getProjectStatus() != ProjectStatus.OPEN) {
            throw new IllegalStateException("Project documents can only be changed while the project is draft or active");
        }

        return project;
    }

    /**
     * Validates uploaded files against the document safety rules used by the app.
     *
     * @param file uploaded file to validate
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("A document file is required");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("Documents must be 10 MB or smaller");
        }

        String mimeType = file.getContentType();
        String expectedExtension = ALLOWED_EXTENSIONS_BY_MIME_TYPE.get(mimeType);
        if (expectedExtension == null) {
            throw new IllegalArgumentException("Only PDF, JPEG, PNG, DOCX, XLSX, and TXT files are allowed");
        }

        String fileName = cleanFileName(file.getOriginalFilename()).toLowerCase(Locale.ROOT);
        if (expectedExtension.equals("jpg")) {
            if (!fileName.endsWith(".jpg") && !fileName.endsWith(".jpeg")) {
                throw new IllegalArgumentException("File extension does not match the selected file type");
            }
            return;
        }

        if (!fileName.endsWith("." + expectedExtension)) {
            throw new IllegalArgumentException("File extension does not match the selected file type");
        }
    }

    private String cleanFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return "document";
        }

        return originalFileName.replace("\\", "/").substring(originalFileName.replace("\\", "/").lastIndexOf('/') + 1);
    }

    private void validateParent(Document document) {
        if (document == null) {
            throw new IllegalArgumentException("Document is required");
        }
        if ((document.getWorkOrder() == null) == (document.getProject() == null)) {
            throw new IllegalArgumentException("Document must belong to exactly one work order or project");
        }
    }
}
