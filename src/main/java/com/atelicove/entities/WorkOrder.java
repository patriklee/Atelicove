package com.atelicove.entities;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.*;

import com.atelicove.enums.WorkOrderStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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

	@ManyToOne
	@JoinColumn(name = "project_id")
	@JsonIgnoreProperties({
		"associatedActiveProject",
		"associatedDrafts",
		"comments",
		"actionItems",
		"snapshots",
		"workOrders",
		"teams",
		"documents"
	})
	private Project project;
    
	@JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private WorkOrderStatus status = WorkOrderStatus.OPEN;
    
    @Column
    private LocalDateTime startDateTime = LocalDateTime.now();
    
	private LocalDateTime endDateTime;
	private String comment;
	private Integer previousProjectID;
	private String previousProjectName;
	private Integer sourceWorkOrderID;
	private Integer sourceProjectID;
	private Integer plannedTeamID;
	private String plannedTeamName;
	private String workOrderName;
	
	// get all items in WO
	@OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<WorkOrderItem> items = new ArrayList<>();

	@JsonIgnore
	@OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Document> documents = new ArrayList<>();
	
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

	public Project getProject() {
		return project;
	}

	@JsonProperty("projectID")
	@Transient
	public Integer getProjectID() {
		return project == null ? null : project.getProjectID();
	}

	@JsonProperty("projectName")
	@Transient
	public String getProjectName() {
		return project == null ? null : project.getProjectName();
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

	public Integer getPreviousProjectID() {
		return previousProjectID;
	}

	public String getPreviousProjectName() {
		return previousProjectName;
	}

	public Integer getSourceWorkOrderID() {
		return sourceWorkOrderID;
	}

	public Integer getSourceProjectID() {
		return sourceProjectID;
	}

	public Integer getPlannedTeamID() {
		return plannedTeamID;
	}

	public String getPlannedTeamName() {
		return plannedTeamName;
	}

	public String getWorkOrderName() {
		return workOrderName;
	}

	@JsonProperty("title")
	@Transient
	public String getTitle() {
		return workOrderName;
	}

	@JsonProperty("plannedCompanyID")
	@Transient
	public Integer getPlannedCompanyID() {
		return company == null ? null : company.getCompanyID();
	}

	@JsonProperty("plannedCompanyName")
	@Transient
	public String getPlannedCompanyName() {
		return company == null ? null : company.getCompanyName();
	}

	@JsonProperty("draftWorkOrderID")
	@Transient
	public int getDraftWorkOrderID() {
		return workOrderID;
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
	
	/**
	 * Replaces assigned workers while keeping each worker's work order collection in
	 * sync.
	 *
	 * @param workers new worker assignments
	 */
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

	public void setProject(Project project) {
		this.project = project;
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

	public void setPreviousProjectID(Integer previousProjectID) {
		this.previousProjectID = previousProjectID;
	}

	public void setPreviousProjectName(String previousProjectName) {
		this.previousProjectName = previousProjectName;
	}

	public void setSourceWorkOrderID(Integer sourceWorkOrderID) {
		this.sourceWorkOrderID = sourceWorkOrderID;
	}

	public void setSourceProjectID(Integer sourceProjectID) {
		this.sourceProjectID = sourceProjectID;
	}

	public void setPlannedTeamID(Integer plannedTeamID) {
		this.plannedTeamID = plannedTeamID;
	}

	public void setPlannedTeamName(String plannedTeamName) {
		this.plannedTeamName = plannedTeamName;
	}

	public void setWorkOrderName(String workOrderName) {
		this.workOrderName = workOrderName;
	}
	
	/**
	 * Replaces work order items while keeping each item's parent work order in sync.
	 *
	 * @param items new item list
	 */
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
	
	/**
	 * Adds an item and points that item back to this work order.
	 *
	 * @param item item to add
	 */
	public void addItem(WorkOrderItem item) {
	    items.add(item);
	    item.setWorkOrder(this);
	}

	/**
	 * Removes an item and clears its work order reference.
	 *
	 * @param item item to remove
	 */
	public void removeItem(WorkOrderItem item) {
	    items.remove(item);
	    item.setWorkOrder(null);
	}

	/**
	 * Adds a worker assignment on both sides of the relationship.
	 *
	 * @param worker worker to assign
	 */
	public void addWorker(Worker worker) {
		if (worker != null && workers.add(worker)) {
			worker.getWorkOrders().add(this);
		}
	}

	/**
	 * Removes a worker assignment on both sides of the relationship.
	 *
	 * @param worker worker to remove
	 */
	public void removeWorker(Worker worker) {
		if (worker != null && workers.remove(worker)) {
			worker.getWorkOrders().remove(this);
		}
	}
}
