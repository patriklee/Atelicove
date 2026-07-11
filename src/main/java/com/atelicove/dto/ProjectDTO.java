package com.atelicove.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.atelicove.entities.PlannedStaffing;
import com.atelicove.enums.ProjectStatus;

public class ProjectDTO {

	private int projectID;
	private String projectName;
	private String description;
	private BigDecimal budget;
	private BigDecimal estimatedCost;
	private BigDecimal actualCost;
	private List<PlannedStaffing> plannedTeams;
	private ProjectStatus projectStatus;
	private LocalDateTime createdAt;
	private LocalDateTime lastModifiedAt;
	private LocalDateTime activatedAt;
	private LocalDateTime completedAt;
	private boolean archived;
	private LocalDateTime archivedAt;
	private List<Integer> workOrderIDs;
	private List<Integer> teamIDs;
	private Integer associatedActiveProjectID;

	public int getProjectID() {
		return projectID;
	}

	public String getProjectName() {
		return projectName;
	}

	public String getDescription() {
		return description;
	}

	public BigDecimal getBudget() {
		return budget;
	}

	public BigDecimal getEstimatedCost() {
		return estimatedCost;
	}

	public BigDecimal getActualCost() {
		return actualCost;
	}

	public List<PlannedStaffing> getPlannedTeams() {
		return plannedTeams;
	}

	public ProjectStatus getProjectStatus() {
		return projectStatus;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getLastModifiedAt() {
		return lastModifiedAt;
	}

	public LocalDateTime getActivatedAt() {
		return activatedAt;
	}

	public LocalDateTime getCompletedAt() {
		return completedAt;
	}

	public boolean isArchived() {
		return archived;
	}

	public LocalDateTime getArchivedAt() {
		return archivedAt;
	}

	public List<Integer> getWorkOrderIDs() {
		return workOrderIDs;
	}

	public List<Integer> getTeamIDs() {
		return teamIDs;
	}

	public Integer getAssociatedActiveProjectID() {
		return associatedActiveProjectID;
	}

	public void setProjectID(int projectID) {
		this.projectID = projectID;
	}

	public void setProjectName(String projectName) {
		this.projectName = projectName;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public void setBudget(BigDecimal budget) {
		this.budget = budget;
	}

	public void setEstimatedCost(BigDecimal estimatedCost) {
		this.estimatedCost = estimatedCost;
	}

	public void setActualCost(BigDecimal actualCost) {
		this.actualCost = actualCost;
	}

	public void setPlannedTeams(List<PlannedStaffing> plannedTeams) {
		this.plannedTeams = plannedTeams;
	}

	public void setProjectStatus(ProjectStatus projectStatus) {
		this.projectStatus = projectStatus;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public void setLastModifiedAt(LocalDateTime lastModifiedAt) {
		this.lastModifiedAt = lastModifiedAt;
	}

	public void setActivatedAt(LocalDateTime activatedAt) {
		this.activatedAt = activatedAt;
	}

	public void setCompletedAt(LocalDateTime completedAt) {
		this.completedAt = completedAt;
	}

	public void setArchived(boolean archived) {
		this.archived = archived;
	}

	public void setArchivedAt(LocalDateTime archivedAt) {
		this.archivedAt = archivedAt;
	}

	public void setWorkOrderIDs(List<Integer> workOrderIDs) {
		this.workOrderIDs = workOrderIDs;
	}

	public void setTeamIDs(List<Integer> teamIDs) {
		this.teamIDs = teamIDs;
	}

	public void setAssociatedActiveProjectID(Integer associatedActiveProjectID) {
		this.associatedActiveProjectID = associatedActiveProjectID;
	}
}
