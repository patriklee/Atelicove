package com.atelicove.entities;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.atelicove.enums.ProjectStatus;
import com.atelicove.enums.WorkOrderStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "project")
public class Project extends ArchivableEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private int projectID;

	private String projectName;

	@Column(length = 2000)
	private String description;

	private BigDecimal budget;

	private BigDecimal estimatedCost;

	private BigDecimal actualCost;

	@Column(nullable = false)
	@Enumerated(EnumType.STRING)
	private ProjectStatus projectStatus = ProjectStatus.DRAFT;

	private LocalDateTime activatedAt;

	private LocalDateTime completedAt;

	@OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ProjectComments> comments = new ArrayList<>();

	@OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ProjectActionItem> actionItems = new ArrayList<>();

	@OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<ProjectSnapshot> snapshots = new ArrayList<>();

	@JsonIgnoreProperties({
			"associatedActiveProject",
			"associatedDrafts",
			"comments",
			"actionItems",
			"snapshots",
			"workOrders",
			"teams"
	})
	@ManyToOne
	@JoinColumn(name = "associated_active_project_id")
	private Project associatedActiveProject;

	@JsonIgnore
	@OneToMany(mappedBy = "associatedActiveProject")
	private List<Project> associatedDrafts = new ArrayList<>();

	@OneToMany(mappedBy = "project")
	private List<WorkOrder> workOrders = new ArrayList<>();

	@ManyToMany(cascade = { CascadeType.PERSIST, CascadeType.MERGE })
	@JoinTable(
			name = "project_team",
			joinColumns = @JoinColumn(name = "project_id"),
			inverseJoinColumns = @JoinColumn(name = "team_id"))
	private List<Team> teams = new ArrayList<>();

	public Project() {}

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
		return sumWorkOrderItems(WorkOrderStatus.DRAFT);
	}

	public BigDecimal getActualCost() {
		return sumWorkOrderItems(WorkOrderStatus.COMPLETE);
	}

	public ProjectStatus getProjectStatus() {
		return projectStatus;
	}

	public LocalDateTime getActivatedAt() {
		return activatedAt;
	}

	public LocalDateTime getCompletedAt() {
		return completedAt;
	}

	public List<ProjectComments> getComments() {
		return comments;
	}

	public List<ProjectActionItem> getActionItems() {
		return actionItems;
	}

	public List<ProjectSnapshot> getSnapshots() {
		return snapshots;
	}

	public Project getAssociatedActiveProject() {
		return associatedActiveProject;
	}

	public List<Project> getAssociatedDrafts() {
		return associatedDrafts;
	}

	public List<WorkOrder> getWorkOrders() {
		return workOrders;
	}

	public List<Team> getTeams() {
		return teams;
	}

	@JsonProperty("workOrderCount")
	@Transient
	public int getWorkOrderCount() {
		return workOrders == null ? 0 : workOrders.size();
	}

	@JsonProperty("teamCount")
	@Transient
	public int getTeamCount() {
		return teams == null ? 0 : teams.size();
	}

	@JsonProperty("ageInDays")
	@Transient
	public long getAgeInDays() {
		if (getCreatedAt() == null) {
			return 0;
		}

		LocalDateTime end = completedAt != null ? completedAt : LocalDateTime.now();
		return Duration.between(getCreatedAt(), end).toDays();
	}

	@JsonProperty("budgetDifference")
	@Transient
	public BigDecimal getBudgetDifference() {
		BigDecimal currentBudget = budget == null ? BigDecimal.ZERO : budget;
		return currentBudget.subtract(getEstimatedCost());
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

	public void setProjectStatus(ProjectStatus projectStatus) {
		this.projectStatus = projectStatus;
	}

	public void setActivatedAt(LocalDateTime activatedAt) {
		this.activatedAt = activatedAt;
	}

	public void setCompletedAt(LocalDateTime completedAt) {
		this.completedAt = completedAt;
	}

	public void setComments(List<ProjectComments> comments) {
		for (ProjectComments comment : new ArrayList<>(this.comments)) {
			removeComment(comment);
		}

		if (comments != null) {
			for (ProjectComments comment : comments) {
				addComment(comment);
			}
		}
	}

	public void setActionItems(List<ProjectActionItem> actionItems) {
		for (ProjectActionItem actionItem : new ArrayList<>(this.actionItems)) {
			removeActionItem(actionItem);
		}

		if (actionItems != null) {
			for (ProjectActionItem actionItem : actionItems) {
				addActionItem(actionItem);
			}
		}
	}

	public void setSnapshots(List<ProjectSnapshot> snapshots) {
		for (ProjectSnapshot snapshot : new ArrayList<>(this.snapshots)) {
			removeSnapshot(snapshot);
		}

		if (snapshots != null) {
			for (ProjectSnapshot snapshot : snapshots) {
				addSnapshot(snapshot);
			}
		}
	}

	public void setAssociatedActiveProject(Project associatedActiveProject) {
		this.associatedActiveProject = associatedActiveProject;
	}

	public void setAssociatedDrafts(List<Project> associatedDrafts) {
		this.associatedDrafts = associatedDrafts == null ? new ArrayList<>() : associatedDrafts;
	}

	public void setWorkOrders(List<WorkOrder> workOrders) {
		for (WorkOrder workOrder : new ArrayList<>(this.workOrders)) {
			removeWorkOrder(workOrder);
		}

		if (workOrders != null) {
			for (WorkOrder workOrder : workOrders) {
				addWorkOrder(workOrder);
			}
		}
	}

	public void setTeams(List<Team> teams) {
		for (Team team : new ArrayList<>(this.teams)) {
			removeTeam(team);
		}

		if (teams != null) {
			for (Team team : teams) {
				addTeam(team);
			}
		}
	}

	public void addComment(ProjectComments comment) {
		if (comment != null && comments.add(comment)) {
			comment.setProject(this);
		}
	}

	public void removeComment(ProjectComments comment) {
		if (comment != null && comments.remove(comment)) {
			comment.setProject(null);
		}
	}

	public void addActionItem(ProjectActionItem actionItem) {
		if (actionItem != null && actionItems.add(actionItem)) {
			actionItem.setProject(this);
		}
	}

	public void removeActionItem(ProjectActionItem actionItem) {
		if (actionItem != null && actionItems.remove(actionItem)) {
			actionItem.setProject(null);
		}
	}

	public void addSnapshot(ProjectSnapshot snapshot) {
		if (snapshot != null && snapshots.add(snapshot)) {
			snapshot.setProject(this);
		}
	}

	public void removeSnapshot(ProjectSnapshot snapshot) {
		if (snapshot != null && snapshots.remove(snapshot)) {
			snapshot.setProject(null);
		}
	}

	public void addWorkOrder(WorkOrder workOrder) {
		if (workOrder != null && workOrders.add(workOrder)) {
			workOrder.setProject(this);
		}
	}

	public void removeWorkOrder(WorkOrder workOrder) {
		if (workOrder != null && workOrders.remove(workOrder)) {
			workOrder.setProject(null);
		}
	}

	public void addTeam(Team team) {
		if (team != null && teams.add(team)) {
			if (projectStatus == ProjectStatus.ACTIVE && team.getProjectStartedAt() == null) {
				team.setProjectStartedAt(LocalDateTime.now());
			}
		}
	}

	public void removeTeam(Team team) {
		teams.remove(team);
	}

	private BigDecimal sumWorkOrderItems(WorkOrderStatus status) {
		return workOrders.stream()
				.filter(workOrder -> workOrder.getStatus() == status)
				.flatMap(workOrder -> workOrder.getItems().stream())
				.map(item -> BigDecimal.valueOf(item.getPrice())
						.multiply(BigDecimal.valueOf(item.getQuantity())))
				.reduce(BigDecimal.ZERO, BigDecimal::add)
				.setScale(2, RoundingMode.HALF_UP);
	}
}
