package com.atelicove.dto;

import java.time.LocalDateTime;

import com.atelicove.entities.Document;
import com.atelicove.enums.DocumentType;
import com.atelicove.enums.ProjectStatus;
import com.atelicove.enums.WorkOrderStatus;

public class DocumentDTO {

    private int documentID;
    private Integer workOrderID;
    private WorkOrderStatus workOrderStatus;
    private Integer projectID;
    private String projectName;
    private ProjectStatus projectStatus;
    private String companyName;
    private String fileName;
    private DocumentType documentType;
    private String mimeType;
    private long fileSize;
    private int uploadedByWorkerID;
    private String uploadedBy;
    private LocalDateTime createdAt;
    private LocalDateTime lastModifiedAt;

    public DocumentDTO() {}

    public DocumentDTO(Document document) {
        this.documentID = document.getDocumentID();
        if (document.getWorkOrder() != null) {
            this.workOrderID = document.getWorkOrder().getWorkOrderID();
            this.workOrderStatus = document.getWorkOrder().getStatus();
            if (document.getWorkOrder().getCompany() != null) {
                this.companyName = document.getWorkOrder().getCompany().getCompanyName();
            }
        }
        if (document.getProject() != null) {
            this.projectID = document.getProject().getProjectID();
            this.projectName = document.getProject().getProjectName();
            this.projectStatus = document.getProject().getProjectStatus();
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

    public Integer getWorkOrderID() {
        return workOrderID;
    }

    public WorkOrderStatus getWorkOrderStatus() {
        return workOrderStatus;
    }

    public Integer getProjectID() {
        return projectID;
    }

    public String getProjectName() {
        return projectName;
    }

    public ProjectStatus getProjectStatus() {
        return projectStatus;
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
