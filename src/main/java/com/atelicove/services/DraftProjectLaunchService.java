package com.atelicove.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
import com.atelicove.enums.DraftProposalStatus;
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
		project.setBudget(draftProject.getBudget());
		project.setProjectStatus(ProjectStatus.OPEN);
		project.setActivatedAt(launchedAt);
		entityManager.persist(project);
		StaffingConversion staffing = convertPlannedStaffing(draftProject, project);

		for (DraftWorkOrder draftWorkOrder : draftProject.getDraftWorkOrders()) {
			if (draftWorkOrder.isArchived()) {
				continue;
			}

			WorkOrder workOrder = convert(draftWorkOrder, launchedAt, staffing);
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
				if (slot.getWorkerID() == null) {
					continue;
				}
				Worker worker = entityManager.find(Worker.class, slot.getWorkerID());
				if (worker == null) {
					throw unavailable("worker", slot.getWorkerID(), "does not exist");
				}
				if (worker.isArchived()) {
					throw unavailable("worker", slot.getWorkerID(), "is archived");
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

			validateProposalStatus(draftWorkOrder);
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

	private void validateProposalStatus(DraftWorkOrder draftWorkOrder) {
		DraftProposalStatus status = draftWorkOrder.getProposalStatus();
		if (status != DraftProposalStatus.PRIVATE && status != DraftProposalStatus.ACCEPTED) {
			throw new IllegalStateException("Draft work order proposal is not approved for launch");
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
			boolean plannedTeamExists = draftWorkOrder.getDraftProject().getPlannedStaffing().stream()
					.anyMatch(staffing -> staffing.getPlannedStaffingID() == draftWorkOrder.getPlannedTeamID());
			if (!plannedTeamExists) {
				throw unavailable("planned staffing", draftWorkOrder.getPlannedTeamID(), "does not exist");
			}
		}
		if (draftWorkOrder.getSourceWorkOrderID() != null) {
			WorkOrder source = requireExisting(
					WorkOrder.class,
					draftWorkOrder.getSourceWorkOrderID(),
					"source work order");
			if (source.isArchived()) {
				throw unavailable("source work order", draftWorkOrder.getSourceWorkOrderID(), "is archived");
			}
			if (source.getStatus() != WorkOrderStatus.OPEN && source.getStatus() != WorkOrderStatus.ACTIVE) {
				throw unavailable("source work order", draftWorkOrder.getSourceWorkOrderID(), "is read-only");
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

	private StaffingConversion convertPlannedStaffing(DraftProject draftProject, Project project) {
		Map<Integer, Set<Worker>> staffingWorkers = new HashMap<>();

		for (PlannedStaffing staffing : draftProject.getPlannedStaffing()) {
			Set<Worker> workers = new HashSet<>();
			if (staffing.getSourceTeamID() != null) {
				Team team = requireExisting(Team.class, staffing.getSourceTeamID(), "team");
				project.addTeam(team);
				team.getWorkers().stream().filter(worker -> !worker.isArchived()).forEach(workers::add);
			}
			for (StaffingSlot slot : staffing.getStaffingSlots()) {
				if (slot.getWorkerID() == null) {
					continue;
				}
				Worker worker = entityManager.find(Worker.class, slot.getWorkerID());
				workers.add(worker);
			}
			staffingWorkers.put(staffing.getPlannedStaffingID(), workers);
		}

		return new StaffingConversion(staffingWorkers);
	}

	private WorkOrder convert(
			DraftWorkOrder draftWorkOrder,
			LocalDateTime launchedAt,
			StaffingConversion staffing) {
		WorkOrder workOrder = new WorkOrder();
		workOrder.setStatus(WorkOrderStatus.OPEN);
		workOrder.setStartDateTime(launchedAt);
		workOrder.setEndDateTime(null);
		workOrder.setComment(draftWorkOrder.getComment());

		Company company = draftWorkOrder.getPlannedCompanyID() == null
				? null
				: entityManager.getReference(Company.class, draftWorkOrder.getPlannedCompanyID());
		workOrder.setCompany(company);

		List<WorkOrderItem> items = new ArrayList<>();
		for (DraftWorkOrderItem draftItem : draftWorkOrder.getItems()) {
			WorkOrderItem item = new WorkOrderItem();
			item.setItemName(draftItem.getItemName());
			item.setQuantity(draftItem.getQuantity());
			item.setPrice(draftItem.getPrice());
			item.setItemType(draftItem.getItemType());
			items.add(item);
		}
		workOrder.setItems(items);

		if (draftWorkOrder.getPlannedTeamID() != null) {
			Set<Worker> workers = staffing.staffingWorkers().get(draftWorkOrder.getPlannedTeamID());
			workOrder.setWorkers(workers == null ? Set.of() : new HashSet<>(workers));
		}

		return workOrder;
	}

	private record StaffingConversion(Map<Integer, Set<Worker>> staffingWorkers) {}
}
