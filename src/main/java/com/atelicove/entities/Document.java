package com.atelicove.entities;

import com.atelicove.enums.DocumentType;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "work_order_document")
public class Document extends BaseEntity {
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private int documentID;

    @ManyToOne
    @JoinColumn(name = "work_order_id")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private WorkOrder workOrder;

    @ManyToOne
    @JoinColumn(name = "project_id")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Project project;

    @Column(nullable = false, length = 255)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentType documentType;

    @Lob
    @Column(nullable = false)
    private byte[] documentData;

    @ManyToOne
    @JoinColumn(name = "uploaded_by_worker_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Worker uploadedByWorker;
    
    @Column(nullable = false, length = 100)
    private String mimeType;
    
    private long fileSize;
    
    public Document() {}
    
    public Document(
    		WorkOrder workOrder, 
    		String fileName, 
    		DocumentType documentType, 
    		byte[] documentData,  
    		Worker uploadedByWorker,
    		String mimeType,
    		long fileSize) 
    {
    	this.workOrder=workOrder;
    	this.fileName=fileName;
    	this.documentType = documentType;
    	this.documentData = documentData;
    	this.uploadedByWorker=uploadedByWorker;
    	this.mimeType = mimeType;
    	this.fileSize=fileSize;
    	
    }

    public Document(
            Project project,
            String fileName,
            DocumentType documentType,
            byte[] documentData,
            Worker uploadedByWorker,
            String mimeType,
            long fileSize)
    {
        this.project = project;
        this.fileName = fileName;
        this.documentType = documentType;
        this.documentData = documentData;
        this.uploadedByWorker = uploadedByWorker;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
    }
    
	public int getDocumentID() {
		return documentID;
	}
	
	public WorkOrder getWorkOrder() {
		return workOrder;
	}

    public Project getProject() {
        return project;
    }
	
	public String getFileName() {
		return fileName;
	}

    public DocumentType getDocumentType() {
    	return documentType;
    }
	
	public byte[] getDocumentData() {
	    return documentData;
	}
	
	public Worker getUploadedByWorker() {
		return uploadedByWorker;
	}
	
	public String getMimeType() {
		return mimeType;
	}
	
	public long getFileSize() {
		return fileSize;
	}
	
	public void setDocumentID(int documentID) {
		this.documentID = documentID;
	}
	
	public void setWorkOrder(WorkOrder workOrder) {
		this.workOrder = workOrder;
	}

    public void setProject(Project project) {
        this.project = project;
    }
	public void setFileName(String fileName) {
		this.fileName = fileName;
	}

    public void setDocumentType(DocumentType documentType) {
    	this.documentType = documentType;
    }
    
	public void setDocumentData(byte[] documentData) {
	    this.documentData = documentData;
	}

	public void setUploadedByWorker(Worker uploadedByWorker) {
		this.uploadedByWorker = uploadedByWorker;
	}
	
	public void setMimeType(String mimeType) {
		this.mimeType = mimeType;
	}

	public void setFileSize(long fileSize) {
		this.fileSize = fileSize;
	}

    @PrePersist
    @PreUpdate
    private void validateSingleParent() {
        if ((workOrder == null) == (project == null)) {
            throw new IllegalStateException("Document must belong to exactly one work order or project");
        }
    }
}
