package com.atelicove.entities;

import java.util.ArrayList;
import java.util.List;

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

@Entity
@Table(name = "draft_project")
public class DraftProject extends ArchivableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long draftProjectId;

    private String draftName;

    @Column(length = 2000)
    private String description;

    @ManyToOne
    @JoinColumn(name = "source_project_id")
    private Project sourceProject;

    @OneToMany(mappedBy = "draftProject", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DraftWorkOrder> draftWorkOrders = new ArrayList<>();

    @OneToMany(mappedBy = "draftProject", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlannedStaffing> plannedStaffing = new ArrayList<>();

	public Long getDraftProjectId() {
		return draftProjectId;
	}

	public void setDraftProjectId(Long draftProjectId) {
		this.draftProjectId = draftProjectId;
	}

	public String getDraftName() {
		return draftName;
	}

	public void setDraftName(String draftName) {
		this.draftName = draftName;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Project getSourceProject() {
		return sourceProject;
	}

	public void setSourceProject(Project sourceProject) {
		this.sourceProject = sourceProject;
	}

	public List<DraftWorkOrder> getDraftWorkOrders() {
		return draftWorkOrders;
	}

	public void setDraftWorkOrders(List<DraftWorkOrder> draftWorkOrders) {
		for (DraftWorkOrder draftWorkOrder : new ArrayList<>(this.draftWorkOrders)) {
			removeDraftWorkOrder(draftWorkOrder);
		}

		if (draftWorkOrders != null) {
			for (DraftWorkOrder draftWorkOrder : draftWorkOrders) {
				addDraftWorkOrder(draftWorkOrder);
			}
		}
	}

	public void addDraftWorkOrder(DraftWorkOrder draftWorkOrder) {
		if (draftWorkOrder != null) {
			if (draftWorkOrder.getDraftProject() != null && draftWorkOrder.getDraftProject() != this) {
				throw new IllegalStateException("Draft work order already belongs to a different draft project");
			}
			if (draftWorkOrders.contains(draftWorkOrder)) {
				return;
			}
			draftWorkOrders.add(draftWorkOrder);
			draftWorkOrder.setDraftProject(this);
		}
	}

	public void removeDraftWorkOrder(DraftWorkOrder draftWorkOrder) {
		if (draftWorkOrder != null && draftWorkOrders.remove(draftWorkOrder)
				&& draftWorkOrder.getDraftProject() == this) {
			draftWorkOrder.setDraftProject(null);
		}
	}

	public List<PlannedStaffing> getPlannedStaffing() {
		return plannedStaffing;
	}

	public void setPlannedStaffing(List<PlannedStaffing> plannedStaffing) {
		for (PlannedStaffing staffing : new ArrayList<>(this.plannedStaffing)) {
			removePlannedStaffing(staffing);
		}

		if (plannedStaffing != null) {
			for (PlannedStaffing staffing : plannedStaffing) {
				addPlannedStaffing(staffing);
			}
		}
	}

	public void addPlannedStaffing(PlannedStaffing staffing) {
		if (staffing != null) {
			if (staffing.getDraftProject() != null && staffing.getDraftProject() != this) {
				throw new IllegalStateException("Planned staffing already belongs to a different draft project");
			}
			if (plannedStaffing.contains(staffing)) {
				return;
			}
			plannedStaffing.add(staffing);
			staffing.setDraftProject(this);
		}
	}

	public void removePlannedStaffing(PlannedStaffing staffing) {
		if (staffing != null && plannedStaffing.remove(staffing)
				&& staffing.getDraftProject() == this) {
			staffing.setDraftProject(null);
		}
	}
}
