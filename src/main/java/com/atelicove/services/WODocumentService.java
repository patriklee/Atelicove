package com.atelicove.services;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.atelicove.entities.WorkOrderDocument;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Worker;
import com.atelicove.enums.DocumentType;
import com.atelicove.enums.WorkOrderStatus;
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
    private final WorkerRepository workerRepository;

    public WODocumentService(
            WODocumentRepository repository,
            WorkOrderRepository workOrderRepository,
            WorkerRepository workerRepository) {
        this.repository = repository;
        this.workOrderRepository = workOrderRepository;
        this.workerRepository = workerRepository;
    }

    public List<WorkOrderDocument> findAll() {
        return repository.findAll();
    }

    public Optional<WorkOrderDocument> findById(Integer id) {
        return repository.findById(id);
    }

    public WorkOrderDocument save(WorkOrderDocument document) {
        return repository.save(document);
    }

    public void deleteById(Integer id) {
        repository.deleteById(id);
    }

    public List<WorkOrderDocument> findByWorkOrder(Integer workOrderID) {
        return repository.findByWorkOrder_WorkOrderIDOrderByCreatedAtDesc(workOrderID);
    }

    public WorkOrderDocument getRequiredDocument(Integer workOrderID, Integer documentID) {
        return repository.findByDocumentIDAndWorkOrder_WorkOrderID(documentID, workOrderID)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
    }

    @Transactional
    public WorkOrderDocument upload(Integer workOrderID, MultipartFile file, String username) {
        WorkOrder workOrder = getEditableWorkOrder(workOrderID);
        Worker worker = workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(username)
                .orElseThrow(() -> new IllegalArgumentException("Uploader not found"));

        validateFile(file);

        try {
            WorkOrderDocument document = new WorkOrderDocument(
                    workOrder,
                    cleanFileName(file.getOriginalFilename()),
                    DocumentType.OTHER,
                    file.getBytes(),
                    worker,
                    file.getContentType(),
                    file.getSize());

            return repository.save(document);
        } catch (Exception exception) {
            throw new IllegalStateException("Document could not be uploaded");
        }
    }

    @Transactional
    public void deleteFromWorkOrder(Integer workOrderID, Integer documentID) {
        getEditableWorkOrder(workOrderID);
        WorkOrderDocument document = getRequiredDocument(workOrderID, documentID);
        repository.delete(document);
    }

    private WorkOrder getEditableWorkOrder(Integer workOrderID) {
        WorkOrder workOrder = workOrderRepository.findById(workOrderID)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found"));

        if (workOrder.getStatus() == WorkOrderStatus.COMPLETE) {
            throw new IllegalStateException("Completed work orders are sealed and cannot be edited");
        }

        return workOrder;
    }

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
}
