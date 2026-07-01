package com.atelicove.entities;

import com.atelicove.enums.DocumentType;

import jakarta.persistence.*;

@Entity
@Table(name = "work_order_document")
public class WorkOrderDocument extends BaseEntity {
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int documentID;

    @ManyToOne
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrder workOrder;

    @Column(nullable = false)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentType documentType;

    @Lob
    @Column(nullable = false)
    private byte[] documentData;

    @ManyToOne
    @JoinColumn(name = "uploaded_by_worker_id", nullable = false)
    private Worker uploadedByWorker;
    
    @Column(nullable = false)
    private String mimeType;
    
    private long fileSize;
    
    public WorkOrderDocument() {}
    
    public WorkOrderDocument(
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
    
	public int getDocumentID() {
		return documentID;
	}
	
	public WorkOrder getWorkOrder() {
		return workOrder;
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
}
