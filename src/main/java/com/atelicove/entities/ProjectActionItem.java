package com.atelicove.entities;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_action_item")
public class ProjectActionItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private int actionItemID;

	@JsonIgnore
	@ManyToOne
	@JoinColumn(name = "project_id")
	private Project project;

	@Column(length = 500)
	private String itemText;

	private boolean completed = false;

	private LocalDateTime completedAt;

	private LocalDateTime dueDate;

	@ManyToOne
	@JoinColumn(name = "assigned_worker_id")
	private Worker assignedWorker;

	@ManyToOne
	@JoinColumn(name = "assigned_team_id")
	private Team assignedTeam;

	public ProjectActionItem() {}

	public int getActionItemID() {
		return actionItemID;
	}

	public Project getProject() {
		return project;
	}

	public String getItemText() {
		return itemText;
	}

	public boolean isCompleted() {
		return completed;
	}

	public LocalDateTime getCompletedAt() {
		return completedAt;
	}

	public LocalDateTime getDueDate() {
		return dueDate;
	}

	public Worker getAssignedWorker() {
		return assignedWorker;
	}

	public Team getAssignedTeam() {
		return assignedTeam;
	}

	public void setActionItemID(int actionItemID) {
		this.actionItemID = actionItemID;
	}

	public void setProject(Project project) {
		this.project = project;
	}

	public void setItemText(String itemText) {
		this.itemText = itemText;
	}

	public void setCompleted(boolean completed) {
		this.completed = completed;
	}

	public void setCompletedAt(LocalDateTime completedAt) {
		this.completedAt = completedAt;
	}

	public void setDueDate(LocalDateTime dueDate) {
		this.dueDate = dueDate;
	}

	public void setAssignedWorker(Worker assignedWorker) {
		this.assignedWorker = assignedWorker;
	}

	public void setAssignedTeam(Team assignedTeam) {
		this.assignedTeam = assignedTeam;
	}
}
