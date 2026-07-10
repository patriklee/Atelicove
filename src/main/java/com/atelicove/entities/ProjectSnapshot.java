package com.atelicove.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_snapshot")
public class ProjectSnapshot {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private int projectSnapshotID;

	@JsonIgnore
	@ManyToOne
	@JoinColumn(name = "project_id")
	private Project project;

	private String snapshotName;

	private Integer sourceDraftProjectID;

	private String projectName;

	@Column(length = 2000)
	private String description;

	private BigDecimal budget;

	private BigDecimal estimatedCost;

	private BigDecimal budgetDifference;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	public ProjectSnapshot() {}

	@PrePersist
	protected void onCreate() {
		createdAt = LocalDateTime.now();
	}

	public int getProjectSnapshotID() {
		return projectSnapshotID;
	}

	public Project getProject() {
		return project;
	}

	public String getSnapshotName() {
		return snapshotName;
	}

	public Integer getSourceDraftProjectID() {
		return sourceDraftProjectID;
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

	public BigDecimal getBudgetDifference() {
		return budgetDifference;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setProjectSnapshotID(int projectSnapshotID) {
		this.projectSnapshotID = projectSnapshotID;
	}

	public void setProject(Project project) {
		this.project = project;
	}

	public void setSnapshotName(String snapshotName) {
		this.snapshotName = snapshotName;
	}

	public void setSourceDraftProjectID(Integer sourceDraftProjectID) {
		this.sourceDraftProjectID = sourceDraftProjectID;
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

	public void setBudgetDifference(BigDecimal budgetDifference) {
		this.budgetDifference = budgetDifference;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
}
