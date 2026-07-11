package com.atelicove.entities;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Transient;

@Entity
public class DraftProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String draftName;

    @Column(length = 2000)
    private String description;

    private boolean archived = false;

    @OneToMany(mappedBy = "draftProject", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DraftWorkOrder> draftWorkOrders = new ArrayList<>();

    @Transient
    private List<PlannedStaffing> plannedStaffing = new ArrayList<>();

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
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

	public boolean isArchived() {
		return archived;
	}

	public void setArchived(boolean archived) {
		this.archived = archived;
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
		if (draftWorkOrder != null && !draftWorkOrders.contains(draftWorkOrder)) {
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
		this.plannedStaffing = plannedStaffing == null ? new ArrayList<>() : plannedStaffing;
	}

    // getters/setters
}
