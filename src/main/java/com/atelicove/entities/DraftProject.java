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

	public String getDraftName() {
		return draftName;
	}

	public void setDraftName(String draftName) {
		this.draftName = draftName;
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
		this.draftWorkOrders = draftWorkOrders == null ? new ArrayList<>() : draftWorkOrders;
	}

	public List<PlannedStaffing> getPlannedStaffing() {
		return plannedStaffing;
	}

	public void setPlannedStaffing(List<PlannedStaffing> plannedStaffing) {
		this.plannedStaffing = plannedStaffing == null ? new ArrayList<>() : plannedStaffing;
	}

    // getters/setters
}
