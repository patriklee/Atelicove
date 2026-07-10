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
import jakarta.persistence.Transient;

@Entity
public class PlannedStaffing {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String staffingName;

	@JsonIgnore
	@ManyToOne
	@JoinColumn(name = "project_id")
	private Project project;

	@ManyToOne
	@JoinColumn(name = "source_team_id")
	private Team sourceTeam;

	@Column(length = 1000)
	private String notes;

	@OneToMany(mappedBy = "plannedStaffing", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<StaffingSlot> staffingSlots = new ArrayList<>();

	public Long getId() {
		return id;
	}

	public String getStaffingName() {
		return staffingName;
	}

	public Project getProject() {
		return project;
	}

	public Team getSourceTeam() {
		return sourceTeam;
	}

	public String getNotes() {
		return notes;
	}

	public List<StaffingSlot> getStaffingSlots() {
		return staffingSlots;
	}

	@JsonProperty("teamID")
	@Transient
	public Long getTeamID() {
		return id;
	}

	@JsonProperty("teamName")
	@Transient
	public String getTeamName() {
		return staffingName;
	}

	@JsonProperty("workers")
	@Transient
	public List<Worker> getWorkers() {
		return staffingSlots.stream()
				.map(StaffingSlot::getWorker)
				.filter(worker -> worker != null)
				.toList();
	}

	@JsonProperty("sourceTeamID")
	@Transient
	public Integer getSourceTeamID() {
		return sourceTeam == null ? null : sourceTeam.getTeamID();
	}

	public void setId(Long id) {
		this.id = id;
	}

	public void setStaffingName(String staffingName) {
		this.staffingName = staffingName;
	}

	public void setTeamName(String teamName) {
		this.staffingName = teamName;
	}

	public void setTeamID(Long teamID) {
		this.id = teamID;
	}

	public void setProject(Project project) {
		this.project = project;
	}

	public void setSourceTeam(Team sourceTeam) {
		this.sourceTeam = sourceTeam;
	}

	public void setSourceTeamID(Integer sourceTeamID) {
		if (sourceTeamID == null) {
			this.sourceTeam = null;
			return;
		}
		Team team = new Team();
		team.setTeamID(sourceTeamID);
		this.sourceTeam = team;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public void setStaffingSlots(List<StaffingSlot> staffingSlots) {
		this.staffingSlots.clear();
		if (staffingSlots != null) {
			staffingSlots.forEach(this::addStaffingSlot);
		}
	}

	public void addStaffingSlot(StaffingSlot staffingSlot) {
		if (staffingSlot != null && staffingSlots.add(staffingSlot)) {
			staffingSlot.setPlannedStaffing(this);
		}
	}

	public void removeStaffingSlot(StaffingSlot staffingSlot) {
		if (staffingSlot != null && staffingSlots.remove(staffingSlot)) {
			staffingSlot.setPlannedStaffing(null);
		}
	}
}
