package com.atelicove.dto;

import java.time.LocalDateTime;

import com.atelicove.entities.WorkOrderDocument;
import com.atelicove.enums.DocumentType;
import com.atelicove.enums.WorkOrderStatus;

public class WorkOrderDocumentDTO {

    private int documentID;
    private int workOrderID;
    private WorkOrderStatus workOrderStatus;
    private String companyName;
    private String fileName;
    private DocumentType documentType;
    private String mimeType;
    private long fileSize;
    private int uploadedByWorkerID;
    private String uploadedBy;
    private LocalDateTime createdAt;
    private LocalDateTime lastModifiedAt;

    public WorkOrderDocumentDTO() {}

    public WorkOrderDocumentDTO(WorkOrderDocument document) {
        this.documentID = document.getDocumentID();
        this.workOrderID = document.getWorkOrder().getWorkOrderID();
        this.workOrderStatus = document.getWorkOrder().getStatus();
        if (document.getWorkOrder().getCompany() != null) {
            this.companyName = document.getWorkOrder().getCompany().getCompanyName();
        }
        this.fileName = document.getFileName();
        this.documentType = document.getDocumentType();
        this.mimeType = document.getMimeType();
        this.fileSize = document.getFileSize();
        this.createdAt = document.getCreatedAt();
        this.lastModifiedAt = document.getLastModifiedAt();

        if (document.getUploadedByWorker() != null) {
            this.uploadedByWorkerID = document.getUploadedByWorker().getWorkerID();
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

    public WorkOrderStatus getWorkOrderStatus() {
        return workOrderStatus;
    }

    public String getCompanyName() {
        return companyName;
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

    public int getUploadedByWorkerID() {
        return uploadedByWorkerID;
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
