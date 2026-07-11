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
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "staffing_slot")
public class StaffingSlot {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private int staffingSlotID;

	private Integer workerID;
	private String workerName;
	private String roleName;

	@Column(length = 1000)
	private String roleDescription;

	@JsonIgnore
	@ManyToOne
	@JoinColumn(name = "planned_staffing_id")
	private PlannedStaffing plannedStaffing;

	public int getStaffingSlotID() {
		return staffingSlotID;
	}

	public Integer getWorkerID() {
		return workerID;
	}

	public String getWorkerName() {
		return workerName;
	}

	@JsonProperty("workerDisplayName")
	@Transient
	public String getWorkerDisplayName() {
		return workerName;
	}

	public String getRoleName() {
		return roleName;
	}

	@JsonProperty("roleTitle")
	@Transient
	public String getRoleTitle() {
		return roleName;
	}

	public String getRoleDescription() {
		return roleDescription;
	}

	public PlannedStaffing getPlannedStaffing() {
		return plannedStaffing;
	}

	public void setStaffingSlotID(int staffingSlotID) {
		this.staffingSlotID = staffingSlotID;
	}

	public void setWorkerID(Integer workerID) {
		this.workerID = workerID;
	}

	public void setWorkerName(String workerName) {
		this.workerName = workerName;
	}

	@JsonProperty("workerDisplayName")
	public void setWorkerDisplayName(String workerName) {
		this.workerName = workerName;
	}

	public void setRoleName(String roleName) {
		this.roleName = roleName;
	}

	@JsonProperty("roleTitle")
	public void setRoleTitle(String roleTitle) {
		this.roleName = roleTitle;
	}

	public void setRoleDescription(String roleDescription) {
		this.roleDescription = roleDescription;
	}

	public void setPlannedStaffing(PlannedStaffing plannedStaffing) {
		this.plannedStaffing = plannedStaffing;
	}
}
