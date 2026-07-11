package com.atelicove.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.atelicove.enums.ProjectStatus;
import com.fasterxml.jackson.annotation.JsonProperty;

public class ProjectDTO {

	@JsonProperty(access = JsonProperty.Access.READ_ONLY)
	private int projectID;
	private String projectName;
	private String description;
	private BigDecimal budget;
	@JsonProperty(access = JsonProperty.Access.READ_ONLY)
	private BigDecimal actualCost;
	@JsonProperty(access = JsonProperty.Access.READ_ONLY)
	private ProjectStatus projectStatus;
	@JsonProperty(access = JsonProperty.Access.READ_ONLY)
	private LocalDateTime createdAt;
	@JsonProperty(access = JsonProperty.Access.READ_ONLY)
	private LocalDateTime lastModifiedAt;
	@JsonProperty(access = JsonProperty.Access.READ_ONLY)
	private LocalDateTime activatedAt;
	@JsonProperty(access = JsonProperty.Access.READ_ONLY)
	private LocalDateTime completedAt;
	@JsonProperty(access = JsonProperty.Access.READ_ONLY)
	private boolean archived;
	@JsonProperty(access = JsonProperty.Access.READ_ONLY)
	private LocalDateTime archivedAt;
	private List<Integer> workOrderIDs;
	private List<Integer> teamIDs;

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

	public BigDecimal getActualCost() {
		return actualCost;
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

	public void setActualCost(BigDecimal actualCost) {
		this.actualCost = actualCost;
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

}
