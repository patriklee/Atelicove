package com.atelicove.dto;

import java.time.LocalDateTime;

import com.atelicove.entities.WorkOrderDocument;
import com.atelicove.enums.DocumentType;

public class WorkOrderDocumentDTO {

    private int documentID;
    private int workOrderID;
    private String fileName;
    private DocumentType documentType;
    private String mimeType;
    private long fileSize;
    private String uploadedBy;
    private LocalDateTime createdAt;
    private LocalDateTime lastModifiedAt;

    public WorkOrderDocumentDTO() {}

    public WorkOrderDocumentDTO(WorkOrderDocument document) {
        this.documentID = document.getDocumentID();
        this.workOrderID = document.getWorkOrder().getWorkOrderID();
        this.fileName = document.getFileName();
        this.documentType = document.getDocumentType();
        this.mimeType = document.getMimeType();
        this.fileSize = document.getFileSize();
        this.createdAt = document.getCreatedAt();
        this.lastModifiedAt = document.getLastModifiedAt();

        if (document.getUploadedByWorker() != null) {
            String firstName = document.getUploadedByWorker().getWorkerFName();
            String lastName = document.getUploadedByWorker().getWorkerLName();
            this.uploadedBy = String.join(" ",
                    firstName == null ? "" : firstName,
                    lastName == null ? "" : lastName).trim();

            if (this.uploadedBy.isBlank()) {
                this.uploadedBy = document.getUploadedByWorker().getWorkerUser();
            }
        }
    }

    public int getDocumentID() {
        return documentID;
    }

    public int getWorkOrderID() {
        return workOrderID;
    }

    public String getFileName() {
        return fileName;
    }

    public DocumentType getDocumentType() {
        return documentType;
    }

    public String getMimeType() {
        return mimeType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getLastModifiedAt() {
        return lastModifiedAt;
    }
}
