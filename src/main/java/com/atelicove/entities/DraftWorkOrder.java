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
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "draft_work_order")
public class DraftWorkOrder {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private int draftWorkOrderID;
	
	@ManyToOne
	@JoinColumn(name = "draft_project_id")
	private DraftProject draftProject;

	@ManyToOne(optional = false)
	@JoinColumn(name = "project_id", nullable = false)
	@JsonIgnore
	private Project project;

	private Integer sourceWorkOrderID;
	private Integer plannedTeamID;
	private String plannedTeamName;
	private Integer plannedCompanyID;
	private String plannedCompanyName;
	private Integer sourceProjectID;
	private String workOrderName;
	private boolean archived = false;

	@Column(length = 2000)
	private String comment;

	@OneToMany(mappedBy = "draftWorkOrder", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<DraftWorkOrderItem> items = new ArrayList<>();

	public int getDraftWorkOrderID() {
		return draftWorkOrderID;
	}

	@JsonProperty("workOrderID")
	@Transient
	public int getWorkOrderID() {
		return draftWorkOrderID;
	}

	public Project getProject() {
		return project;
	}

	@JsonProperty("projectID")
	@Transient
	public Integer getProjectID() {
		return project == null ? null : project.getProjectID();
	}

	@JsonProperty("projectName")
	@Transient
	public String getProjectName() {
		return project == null ? null : project.getProjectName();
	}

	public Integer getSourceWorkOrderID() {
		return sourceWorkOrderID;
	}

	public Integer getPlannedTeamID() {
		return plannedTeamID;
	}

	public String getPlannedTeamName() {
		return plannedTeamName;
	}

	public Integer getPlannedCompanyID() {
		return plannedCompanyID;
	}

	public String getPlannedCompanyName() {
		return plannedCompanyName;
	}

	public Integer getSourceProjectID() {
		return sourceProjectID;
	}

	public String getWorkOrderName() {
		return workOrderName;
	}

	public boolean isArchived() {
		return archived;
	}

	@JsonProperty("company")
	@Transient
	public CompanySnapshot getCompanySnapshot() {
		return plannedCompanyID == null && (plannedCompanyName == null || plannedCompanyName.isBlank())
				? null
				: new CompanySnapshot(plannedCompanyID, plannedCompanyName);
	}

	@JsonProperty("status")
	@Transient
	public String getStatus() {
		return "DRAFT";
	}

	public String getComment() {
		return comment;
	}

	public List<DraftWorkOrderItem> getItems() {
		return items;
	}

	public void setDraftWorkOrderID(int draftWorkOrderID) {
		this.draftWorkOrderID = draftWorkOrderID;
	}

	public void setProject(Project project) {
		this.project = project;
	}

	public void setSourceWorkOrderID(Integer sourceWorkOrderID) {
		this.sourceWorkOrderID = sourceWorkOrderID;
	}

	public void setPlannedTeamID(Integer plannedTeamID) {
		this.plannedTeamID = plannedTeamID;
	}

	public void setPlannedTeamName(String plannedTeamName) {
		this.plannedTeamName = plannedTeamName;
	}

	public void setPlannedCompanyID(Integer plannedCompanyID) {
		this.plannedCompanyID = plannedCompanyID;
	}

	public void setPlannedCompanyName(String plannedCompanyName) {
		this.plannedCompanyName = plannedCompanyName;
	}

	public void setSourceProjectID(Integer sourceProjectID) {
		this.sourceProjectID = sourceProjectID;
	}

	public void setWorkOrderName(String workOrderName) {
		this.workOrderName = workOrderName;
	}

	public void setArchived(boolean archived) {
		this.archived = archived;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}

	public void addItem(DraftWorkOrderItem item) {
		if (item != null && items.add(item)) {
			item.setDraftWorkOrder(this);
		}
	}

	public void removeItem(DraftWorkOrderItem item) {
		if (item != null && items.remove(item)) {
			item.setDraftWorkOrder(null);
		}
	}

	public record CompanySnapshot(Integer companyID, String companyName) {}
}
