package com.atelicove.entities;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "planned_staffing")
public class PlannedStaffing {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private int plannedStaffingID;

	private Integer sourceTeamID;
	private String staffingName;

	@Column(length = 1000)
	private String notes;

	@JsonIgnore
	@ManyToOne
	@JoinColumn(name = "project_id")
	private Project project;

	@JsonIgnore
	@ManyToOne
	@JoinColumn(name = "draft_project_id")
	private DraftProject draftProject;

	@OneToMany(mappedBy = "plannedStaffing", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<StaffingSlot> staffingSlots = new ArrayList<>();

	public int getPlannedStaffingID() {
		return plannedStaffingID;
	}

	@JsonProperty("teamID")
	@Transient
	public int getTeamID() {
		return plannedStaffingID;
	}

	public Integer getSourceTeamID() {
		return sourceTeamID;
	}

	public String getStaffingName() {
		return staffingName;
	}

	@JsonProperty("teamName")
	@Transient
	public String getTeamName() {
		return staffingName;
	}

	public String getNotes() {
		return notes;
	}

	public Project getProject() {
		return project;
	}

	public DraftProject getDraftProject() {
		return draftProject;
	}

	public List<StaffingSlot> getStaffingSlots() {
		return staffingSlots;
	}

	@JsonProperty("workers")
	@Transient
	public List<StaffingSlot> getWorkers() {
		return staffingSlots;
	}

	public void setPlannedStaffingID(int plannedStaffingID) {
		this.plannedStaffingID = plannedStaffingID;
	}

	public void setSourceTeamID(Integer sourceTeamID) {
		this.sourceTeamID = sourceTeamID;
	}

	public void setStaffingName(String staffingName) {
		this.staffingName = staffingName;
	}

	@JsonProperty("teamName")
	public void setTeamName(String teamName) {
		this.staffingName = teamName;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public void setProject(Project project) {
		this.project = project;
	}

	public void setDraftProject(DraftProject draftProject) {
		this.draftProject = draftProject;
	}

	public void setStaffingSlots(List<StaffingSlot> staffingSlots) {
		for (StaffingSlot slot : new ArrayList<>(this.staffingSlots)) {
			removeStaffingSlot(slot);
		}

		if (staffingSlots != null) {
			for (StaffingSlot slot : staffingSlots) {
				addStaffingSlot(slot);
			}
		}
	}

	@JsonProperty("workers")
	public void setWorkers(List<StaffingSlot> staffingSlots) {
		setStaffingSlots(staffingSlots);
	}

	public void addStaffingSlot(StaffingSlot slot) {
		if (slot != null && staffingSlots.add(slot)) {
			slot.setPlannedStaffing(this);
		}
	}

	public void removeStaffingSlot(StaffingSlot slot) {
		if (slot != null && staffingSlots.remove(slot)) {
			slot.setPlannedStaffing(null);
		}
	}
}
