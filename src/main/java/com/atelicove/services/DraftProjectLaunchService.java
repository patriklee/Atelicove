package com.atelicove.services;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atelicove.entities.Company;
import com.atelicove.entities.DraftProject;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.DraftWorkOrderItem;
import com.atelicove.entities.PlannedStaffing;
import com.atelicove.entities.Project;
import com.atelicove.entities.StaffingSlot;
import com.atelicove.entities.Team;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.entities.Worker;
import com.atelicove.enums.ProjectStatus;
import com.atelicove.enums.WorkOrderStatus;

import jakarta.persistence.EntityManager;

@Service
public class DraftProjectLaunchService {

	private final EntityManager entityManager;

	public DraftProjectLaunchService(EntityManager entityManager) {
		this.entityManager = entityManager;
	}

	@Transactional
	public Project launch(Integer draftProjectID) {
		if (draftProjectID == null) {
			throw new IllegalArgumentException("Draft project ID is required");
		}

		DraftProject draftProject = entityManager.find(DraftProject.class, draftProjectID.longValue());
		if (draftProject == null) {
			throw new IllegalArgumentException("Draft project not found");
		}

		validate(draftProject);

		LocalDateTime launchedAt = LocalDateTime.now();
		Project project = new Project();
		project.setProjectName(draftProject.getDraftName().trim());
		project.setDescription(draftProject.getDescription());
		project.setProjectStatus(ProjectStatus.OPEN);
		project.setActivatedAt(launchedAt);
		entityManager.persist(project);

		for (DraftWorkOrder draftWorkOrder : draftProject.getDraftWorkOrders()) {
			if (draftWorkOrder.isArchived()) {
				continue;
			}

			WorkOrder workOrder = convert(draftWorkOrder, launchedAt);
			project.addWorkOrder(workOrder);
			entityManager.persist(workOrder);
		}

		entityManager.flush();
		entityManager.remove(draftProject);
		return project;
	}

	private void validate(DraftProject draftProject) {
		if (draftProject.isArchived()) {
			throw new IllegalStateException("Archived draft projects cannot be launched");
		}
		if (draftProject.getDraftName() == null || draftProject.getDraftName().isBlank()) {
			throw new IllegalStateException("Draft project name is required");
		}

		for (PlannedStaffing staffing : draftProject.getPlannedStaffing()) {
			if (staffing.getSourceTeamID() != null) {
				requireExisting(Team.class, staffing.getSourceTeamID(), "team");
			}
			for (StaffingSlot slot : staffing.getStaffingSlots()) {
				if (slot.getWorkerID() != null) {
					Worker worker = requireExisting(Worker.class, slot.getWorkerID(), "worker");
					if (worker.isArchived()) {
						throw unavailable("worker", slot.getWorkerID(), "is archived");
					}
				}
			}
		}

		for (DraftWorkOrder draftWorkOrder : draftProject.getDraftWorkOrders()) {
			if (draftWorkOrder == null) {
				throw new IllegalStateException("Draft project contains an invalid work order");
			}
			if (draftWorkOrder.isArchived()) {
				continue;
			}

			validateReferences(draftWorkOrder);
			for (DraftWorkOrderItem item : draftWorkOrder.getItems()) {
				if (item.getItemName() == null || item.getItemName().isBlank()) {
					throw new IllegalStateException("Draft work order item name is required");
				}
				if (item.getQuantity() <= 0) {
					throw new IllegalStateException("Draft work order item quantity must be positive");
				}
				if (item.getPrice() == null || item.getPrice().signum() < 0) {
					throw new IllegalStateException("Draft work order item price cannot be negative");
				}
			}
		}
	}

	private void validateReferences(DraftWorkOrder draftWorkOrder) {
		if (draftWorkOrder.getPlannedCompanyID() != null) {
			Company company = requireExisting(Company.class, draftWorkOrder.getPlannedCompanyID(), "company");
			if (company.isArchived()) {
				throw unavailable("company", draftWorkOrder.getPlannedCompanyID(), "is archived");
			}
		}
		if (draftWorkOrder.getPlannedTeamID() != null) {
			requireExisting(Team.class, draftWorkOrder.getPlannedTeamID(), "team");
		}
		if (draftWorkOrder.getSourceWorkOrderID() != null) {
			WorkOrder source = requireExisting(
					WorkOrder.class,
					draftWorkOrder.getSourceWorkOrderID(),
					"source work order");
			if (source.isArchived()) {
				throw unavailable("source work order", draftWorkOrder.getSourceWorkOrderID(), "is archived");
			}
		}
		if (draftWorkOrder.getSourceProjectID() != null) {
			Project source = requireExisting(Project.class, draftWorkOrder.getSourceProjectID(), "source project");
			if (source.isArchived()) {
				throw unavailable("source project", draftWorkOrder.getSourceProjectID(), "is archived");
			}
		}
	}

	private <T> T requireExisting(Class<T> entityType, Integer id, String referenceName) {
		T entity = entityManager.find(entityType, id);
		if (entity == null) {
			throw unavailable(referenceName, id, "does not exist");
		}
		return entity;
	}

	private IllegalStateException unavailable(String referenceName, Integer id, String reason) {
		return new IllegalStateException(
				"Draft project references " + referenceName + " " + id + " that " + reason);
	}

	private WorkOrder convert(DraftWorkOrder draftWorkOrder, LocalDateTime launchedAt) {
		WorkOrder workOrder = new WorkOrder();
		workOrder.setStatus(WorkOrderStatus.OPEN);
		workOrder.setStartDateTime(launchedAt);
		workOrder.setEndDateTime(null);
		workOrder.setComment(draftWorkOrder.getComment());

		if (draftWorkOrder.getPlannedCompanyID() != null) {
			Company company = entityManager.getReference(Company.class, draftWorkOrder.getPlannedCompanyID());
			workOrder.setCompany(company);
		}

		for (DraftWorkOrderItem draftItem : draftWorkOrder.getItems()) {
			WorkOrderItem item = new WorkOrderItem();
			item.setItemName(draftItem.getItemName());
			item.setQuantity(draftItem.getQuantity());
			item.setPrice(draftItem.getPrice());
			item.setItemType(draftItem.getItemType());
			workOrder.addItem(item);
		}

		return workOrder;
	}
}
