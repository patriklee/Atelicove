package com.atelicove.entities;

import jakarta.persistence.*; // Defines how objects will map to the DB

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "worker") // Maps the worker class to the worker table in the DB
public class Worker extends ArchivableEntity {
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //AutoGenerates an ID
    private int workerID;

    @Column(name = "worker_first_name")
    private String workerFName;

    @Column(name = "worker_last_name")
    private String workerLName;

    @Column(name = "worker_display_name")
    private String workerDisplayName;

    @Column(name = "worker_username", unique = true)
    private String workerUser;
    
    @Column(name = "worker_email", nullable = false, unique = true)
    private String workerEmail;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "worker_password")
    private String workerPW;
    
	@ManyToMany(mappedBy = "workers")
	@JsonIgnore
	private Set<WorkOrder> workOrders = new HashSet<>();

    private boolean isAdmin;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    public Worker() {}

    public Worker(String workerFName, String workerLName, String workerUser, String workerEmail, String workerPW, boolean isAdmin) 
    {
        this.workerFName = workerFName;
        this.workerLName = workerLName;
        this.workerUser = workerUser;
        this.workerEmail = workerEmail;
        this.workerPW = workerPW;
        this.isAdmin = isAdmin;
    }


    public String getWorkerFName() {
        return workerFName;
    }
    
    public String getWorkerPW() {
        return workerPW;
    }
    
    public int getWorkerID() {
        return workerID;
    }
    
    public String getWorkerLName() {
        return workerLName;
    }

    public String getWorkerDisplayName() {
        return workerDisplayName;
    }
    
	public String getWorkerUser() {
		return workerUser;
	}
	
	public String getWorkerEmail() {
		return workerEmail;
	}

	public Set<WorkOrder> getWorkOrders() {
		return workOrders;
	}

    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }


    public void setWorkerFName(String workerFName) {
        this.workerFName = workerFName;
    }

    
    public void setWorkerID(int workerID) {
        this.workerID = workerID;
    }


    public void setWorkerLName(String workerLName) {
        this.workerLName = workerLName;
    }

    public void setWorkerDisplayName(String workerDisplayName) {
        this.workerDisplayName = workerDisplayName;
    }


    public void setWorkerPW(String workerPW) {
        this.workerPW = workerPW;
    }
    
    public void setWorkerUser(String workerUser) {
    	this.workerUser = workerUser;
    }
    
    public void setWorkerEmail(String workerEmail) {
    	this.workerEmail = workerEmail;
    }

	public void setWorkOrders(Set<WorkOrder> workOrders) {
		for (WorkOrder workOrder : new HashSet<>(this.workOrders)) {
			workOrder.removeWorker(this);
		}

		if (workOrders != null) {
			for (WorkOrder workOrder : workOrders) {
				workOrder.addWorker(this);
			}
		}
	}

    public void setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public boolean isAdmin() {
        return Boolean.TRUE.equals(isAdmin);
    }
    
    public void setAdmin(boolean isAdmin) {
        this.isAdmin = isAdmin;
    }
}
