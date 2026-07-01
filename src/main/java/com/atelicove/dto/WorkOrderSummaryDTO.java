package com.atelicove.dto;

import java.time.LocalDateTime;

import com.atelicove.enums.WorkOrderStatus;

// A summary page for the front end to pull up so it is not constantly searching for the items. Not a query table!

public class WorkOrderSummaryDTO {
	
	private int workOrderID;
	private String companyName;
	private String workerName;
	private String workAddress;
	private WorkOrderStatus status;
	private LocalDateTime startDateTime;
	private LocalDateTime endDateTime;
	private LocalDateTime createdAt;
	private LocalDateTime lastModifiedAt;
	private LocalDateTime archivedAt;
	private String comment;
	private boolean archived;
	private double totalPrice;
	private int fileNo;
	
	public WorkOrderSummaryDTO() {}
	
	public WorkOrderSummaryDTO(
			int workOrderID,
			String companyName,
			String workerName,
			String workAddress,
			WorkOrderStatus status,
			LocalDateTime startDateTime,
			LocalDateTime endDateTime,
			LocalDateTime createdAt,
			LocalDateTime lastModifiedAt,
			boolean archived,
			LocalDateTime archivedAt,
			String comment,
			double totalPrice,
			int fileNo) 
	{
		this.workOrderID = workOrderID;
		this.setCompanyName(companyName);
		this.setWorkerName(workerName);
		this.setWorkAddress(workAddress);
		this.setStatus(status);
		this.setStartDateTime(startDateTime);
		this.setEndDateTime(endDateTime);
		this.setCreatedAt(createdAt);
		this.setLastModifiedAt(lastModifiedAt);
		this.setArchived(archived);
		this.setArchivedAt(archivedAt);
		this.setComment(comment);
		this.setTotalPrice(totalPrice);
		this.setFileNo(fileNo);
		
	}

	public int getworkOrderID() {
		return workOrderID;
	}
	public String getCompanyName() {
		return companyName;
	}

	public String getWorkerName() {
		return workerName;
	}
	public String getWorkAddress() {
		return workAddress;
	}
	public WorkOrderStatus getStatus() {
		return status;
	}
	public LocalDateTime getStartDateTime() {
		return startDateTime;
	}
	public LocalDateTime getEndDateTime() {
		return endDateTime;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getLastModifiedAt() {
		return lastModifiedAt;
	}

	public boolean isArchived() {
		return archived;
	}

	public LocalDateTime getArchivedAt() {
		return archivedAt;
	}
	
	public String getComment() {
		return comment;
	}
	public double getTotalPrice() {
		return totalPrice;
	}
	public int getFileNo() {
		return fileNo;
	}
	
	public void setworkOrderID(int workOrderID) {
		this.workOrderID = workOrderID;
	}
	
	public void setCompanyName(String companyName) {
		this.companyName = companyName;
	}
	
	public void setWorkerName(String workerName) {
		this.workerName = workerName;
	}
	
	public void setWorkAddress(String workAddress) {
		this.workAddress = workAddress;
	}

	public void setStatus(WorkOrderStatus status) {
		this.status = status;
	}

	public void setStartDateTime(LocalDateTime startDateTime) {
		this.startDateTime = startDateTime;
	}

	public void setEndDateTime(LocalDateTime endDateTime) {
		this.endDateTime = endDateTime;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public void setLastModifiedAt(LocalDateTime lastModifiedAt) {
		this.lastModifiedAt = lastModifiedAt;
	}

	public void setArchived(boolean archived) {
		this.archived = archived;
	}

	public void setArchivedAt(LocalDateTime archivedAt) {
		this.archivedAt = archivedAt;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}

	public void setTotalPrice(double totalPrice) {
		this.totalPrice = totalPrice;
	}

	public void setFileNo(int fileNo) {
		this.fileNo = fileNo;
	}
}
