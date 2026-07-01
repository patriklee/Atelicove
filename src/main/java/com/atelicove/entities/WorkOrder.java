package com.atelicove.entities;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.*;

import com.atelicove.enums.WorkOrderStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "work_order")
public class WorkOrder extends ArchivableEntity {
	
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int workOrderID;
    
	@ManyToMany
	@JoinTable(
		name = "work_order_worker",
		joinColumns = @JoinColumn(name = "work_order_id"),
		inverseJoinColumns = @JoinColumn(name = "worker_id")
	)
	private Set<Worker> workers = new HashSet<>();
	
	@ManyToOne
	@JoinColumn(name = "company_id")
    private Company company;
    
	@JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private WorkOrderStatus status = WorkOrderStatus.OPEN;
    
    @Column( nullable = false)
    private LocalDateTime startDateTime = LocalDateTime.now();
    
    private LocalDateTime endDateTime;
	private String comment;
	
	// get all items in WO
	@OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<WorkOrderItem> items = new ArrayList<>();

	@JsonIgnore
	@OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<WorkOrderDocument> documents = new ArrayList<>();
	
	public WorkOrder() {}
	
	public WorkOrder(
			int workOrderID, 
			Set<Worker> workers,
			Company company, 
			WorkOrderStatus status, 
			LocalDateTime startDateTime, 
			LocalDateTime endDateTime,
			String comment) 
	{
		this.workOrderID = workOrderID;
		setWorkers(workers);
		this.company = company;
		this.status = status;
		this.startDateTime = startDateTime;
		this.endDateTime = endDateTime;
		this.comment = comment;
		
	}
	
	public int getWorkOrderID() {
		return workOrderID;
	}
	
	public Set<Worker> getWorkers() {
		return workers;
	}
	
	public Company getCompany() {
		return company;
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

	public String getComment() {
		return comment;
	}
	
	public List<WorkOrderItem> getItems() {
	    return items;
	}

	@JsonProperty("fileNo")
	@Transient
	public int getFileNo() {
		return documents == null ? 0 : documents.size();
	}


	public void setWorkOrderID(int workOrderID) {
		this.workOrderID = workOrderID;
	}
	
	public void setWorkers(Set<Worker> workers) {
		for (Worker worker : new HashSet<>(this.workers)) {
			removeWorker(worker);
		}

		if (workers != null) {
			for (Worker worker : workers) {
				addWorker(worker);
			}
		}
	}
	
	public void setCompany(Company company) {
		this.company = company;
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

	public void setComment(String comment) {
		this.comment = comment;
	}
	
	public void setItems(List<WorkOrderItem> items) {
		for (WorkOrderItem item : new ArrayList<>(this.items)) {
			removeItem(item);
		}
		
		if(items != null) {
			for (WorkOrderItem item :items) {
				addItem(item);
			}
		}
	}
	
	// Helper methods to add/delete items
	public void addItem(WorkOrderItem item) {
	    items.add(item);
	    item.setWorkOrder(this);
	}

	public void removeItem(WorkOrderItem item) {
	    items.remove(item);
	    item.setWorkOrder(null);
	}

	public void addWorker(Worker worker) {
		if (worker != null && workers.add(worker)) {
			worker.getWorkOrders().add(this);
		}
	}

	public void removeWorker(Worker worker) {
		if (worker != null && workers.remove(worker)) {
			worker.getWorkOrders().remove(this);
		}
	}
}
