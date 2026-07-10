package com.atelicove.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Transient;

@Entity
public class StaffingSlot {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne
	@JoinColumn(name = "worker_id")
	private Worker worker;

	private String roleName;

	@Column(length = 1000)
	private String roleDescription;

	@ManyToOne
	@JoinColumn(name = "planned_staffing_id")
	@JsonIgnore
	private PlannedStaffing plannedStaffing;

	public Long getId() {
		return id;
	}

	public Integer getWorkerID() {
		return worker == null ? null : worker.getWorkerID();
	}

	public String getWorkerName() {
		if (worker == null) {
			return null;
		}
		return "%s %s".formatted(
				worker.getWorkerFName() == null ? "" : worker.getWorkerFName(),
				worker.getWorkerLName() == null ? "" : worker.getWorkerLName()).trim();
	}

	public Worker getWorker() {
		return worker;
	}

	public String getRoleName() {
		return roleName;
	}

	public String getRoleDescription() {
		return roleDescription;
	}

	public PlannedStaffing getPlannedStaffing() {
		return plannedStaffing;
	}

	@JsonProperty("workerDisplayName")
	@Transient
	public String getWorkerDisplayName() {
		return worker == null ? null : worker.getWorkerDisplayName();
	}

	public void setId(Long id) {
		this.id = id;
	}

	public void setWorkerID(Integer workerID) {
		if (workerID == null) {
			this.worker = null;
			return;
		}
		Worker workerRef = new Worker();
		workerRef.setWorkerID(workerID);
		this.worker = workerRef;
	}

	public void setWorkerName(String workerName) {
		// Kept for request compatibility; worker names are derived from Worker.
	}

	public void setWorker(Worker worker) {
		this.worker = worker;
	}

	public void setRoleName(String roleName) {
		this.roleName = roleName;
	}

	public void setRoleDescription(String roleDescription) {
		this.roleDescription = roleDescription;
	}

	public void setPlannedStaffing(PlannedStaffing plannedStaffing) {
		this.plannedStaffing = plannedStaffing;
	}
}
