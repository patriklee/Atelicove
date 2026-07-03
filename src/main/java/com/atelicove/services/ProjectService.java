package com.atelicove.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atelicove.dto.ProjectDTO;
import com.atelicove.entities.Company;
import com.atelicove.entities.Project;
import com.atelicove.entities.ProjectActionItem;
import com.atelicove.entities.ProjectComments;
import com.atelicove.entities.ProjectSnapshot;
import com.atelicove.entities.Team;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.entities.Worker;
import com.atelicove.enums.ProjectStatus;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.TeamRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Service
public class ProjectService {

	private final ProjectRepository projectRepository;
	private final WorkOrderRepository workOrderRepository;
	private final WorkerRepository workerRepository;
	private final TeamRepository teamRepository;
	private final CompanyRepository companyRepository;
	private final ObjectMapper objectMapper;

	public ProjectService(
			ProjectRepository projectRepository,
			WorkOrderRepository workOrderRepository,
			WorkerRepository workerRepository,
			TeamRepository teamRepository,
			CompanyRepository companyRepository,
			ObjectMapper objectMapper) {
		this.projectRepository = projectRepository;
		this.workOrderRepository = workOrderRepository;
		this.workerRepository = workerRepository;
		this.teamRepository = teamRepository;
		this.companyRepository = companyRepository;
		this.objectMapper = objectMapper;
	}

	public List<Project> findActive() {
		return projectRepository.findByArchivedFalse();
	}

	public List<Project> findAll() {
		return projectRepository.findAll();
	}

	public List<Project> findArchived() {
		return projectRepository.findByArchivedTrue();
	}

	public List<Project> findDrafts() {
		return projectRepository.findByProjectStatusAndArchivedFalse(ProjectStatus.DRAFT);
	}

	public Optional<Project> findById(Integer id) {
		return projectRepository.findById(id);
	}

	public long count() {
		return projectRepository.countByArchivedFalse();
	}

	@Transactional
	public Project createProject(Project project) {
		project.setProjectID(0);
		project.setArchived(false);
		project.setArchivedAt(null);
		project.setCompletedAt(null);
		project.setActivatedAt(null);

		if (project.getProjectStatus() == null) {
			project.setProjectStatus(ProjectStatus.DRAFT);
		}

		return projectRepository.save(project);
	}

	@Transactional
	public Project createProject(ProjectDTO projectDTO) {
		Project project = new Project();
		applyDTO(project, projectDTO);
		project.setProjectStatus(ProjectStatus.DRAFT);
		Project saved = createProject(project);
		addAssociatedDraftSnapshot(saved);
		return saved;
	}

	@Transactional
	public Project updateProject(Integer projectID, ProjectDTO projectDTO) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);
		applyDTO(project, projectDTO);
		addAssociatedDraftSnapshot(project);

		return projectRepository.save(project);
	}

	@Transactional
	public Project activateProject(Integer projectID) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);

		if (project.getProjectStatus() != ProjectStatus.DRAFT) {
			throw new IllegalStateException("Only draft projects can be activated");
		}

		if (project.getAssociatedActiveProject() != null) {
			throw new IllegalStateException("Draft projects attached to an active project cannot be activated");
		}

		createDraftSnapshot(project, "Launch snapshot");
		project.setProjectStatus(ProjectStatus.ACTIVE);
		project.setActivatedAt(LocalDateTime.now());
		for (Team team : project.getTeams()) {
			if (team.getProjectStartedAt() == null) {
				team.setProjectStartedAt(LocalDateTime.now());
			}
		}
		for (WorkOrder workOrder : project.getWorkOrders()) {
			if (workOrder.getStatus() == WorkOrderStatus.DRAFT) {
				launchDraftWorkOrder(workOrder);
			}
		}

		return projectRepository.save(project);
	}

	@Transactional
	public Project submitForReview(Integer projectID) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);

		if (project.getProjectStatus() != ProjectStatus.ACTIVE) {
			throw new IllegalStateException("Only active projects can be submitted for review");
		}

		if (!allWorkOrdersComplete(project)) {
			throw new IllegalStateException("Projects can only be submitted when all work orders are complete");
		}

		project.setProjectStatus(ProjectStatus.IN_REVIEW);

		return projectRepository.save(project);
	}

	@Transactional
	public Project completeProject(Integer projectID) {
		Project project = getRequiredProject(projectID);

		if (project.getProjectStatus() != ProjectStatus.IN_REVIEW) {
			throw new IllegalStateException("Only projects under review can be completed");
		}

		if (!allWorkOrdersComplete(project)) {
			throw new IllegalStateException("Projects can only be completed when all work orders are complete");
		}

		project.setProjectStatus(ProjectStatus.COMPLETED);
		project.setCompletedAt(LocalDateTime.now());

		return projectRepository.save(project);
	}

	@Transactional
	public Project rejectProject(Integer projectID) {
		Project project = getRequiredProject(projectID);

		if (project.getProjectStatus() != ProjectStatus.IN_REVIEW) {
			throw new IllegalStateException("Only projects under review can be rejected");
		}

		project.setProjectStatus(ProjectStatus.ACTIVE);

		return projectRepository.save(project);
	}

	@Transactional
	public void archiveById(Integer projectID) {
		Project project = getRequiredProject(projectID);

		if (project.getProjectStatus() == ProjectStatus.DRAFT) {
			throw new IllegalStateException("Draft projects cannot be archived");
		}

		if (!allWorkOrdersComplete(project)) {
			throw new IllegalStateException("Projects can only be archived when all work orders are complete");
		}

		project.setArchived(true);
		project.setArchivedAt(LocalDateTime.now());
		for (Project draft : new ArrayList<>(projectRepository.findByAssociatedActiveProject_ProjectID(projectID))) {
			deleteDraftProjectContents(draft);
			projectRepository.delete(draft);
		}
		projectRepository.save(project);
	}

	@Transactional
	public Project restoreById(Integer projectID) {
		Project project = getRequiredProject(projectID);
		project.setArchived(false);
		project.setArchivedAt(null);

		return projectRepository.save(project);
	}

	@Transactional
	public void deletePermanentlyById(Integer projectID) {
		Project project = getRequiredProject(projectID);

		if (!project.isArchived() && project.getProjectStatus() != ProjectStatus.DRAFT) {
			throw new IllegalStateException("Only archived or draft projects can be permanently deleted");
		}

		for (WorkOrder workOrder : new java.util.ArrayList<>(project.getWorkOrders())) {
			project.removeWorkOrder(workOrder);
		}

		projectRepository.delete(project);
	}

	@Transactional
	public Project assignWorkOrder(Integer projectID, Integer workOrderID) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);

		WorkOrder workOrder = workOrderRepository.findById(workOrderID)
				.orElseThrow(() -> new IllegalArgumentException("Work order not found"));

		project.addWorkOrder(workOrder);

		return projectRepository.save(project);
	}

	@Transactional
	public Project createDraftWorkOrderForTeam(
			Integer projectID,
			Integer teamID,
			Integer companyID,
			String comment) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);

		if (project.getProjectStatus() != ProjectStatus.DRAFT) {
			throw new IllegalStateException("Draft work orders can only be created for draft projects");
		}

		Team team = teamRepository.findById(teamID)
				.orElseThrow(() -> new IllegalArgumentException("Team not found"));

		if (!project.getTeams().contains(team)) {
			project.addTeam(team);
		}

		WorkOrder workOrder = new WorkOrder();
		workOrder.setStatus(WorkOrderStatus.DRAFT);
		workOrder.setComment(comment);
		workOrder.setStartDateTime(null);
		workOrder.setEndDateTime(null);
		workOrder.setWorkers(new HashSet<>(team.getWorkers()));

		if (companyID != null) {
			Company company = companyRepository.findById(companyID)
					.orElseThrow(() -> new IllegalArgumentException("Company not found"));
			if (company.isArchived()) {
				throw new IllegalStateException("Archived companies cannot be assigned");
			}
			workOrder.setCompany(company);
		}

		workOrder = workOrderRepository.save(workOrder);
		project.addWorkOrder(workOrder);

		return projectRepository.save(project);
	}

	@Transactional
	public Project removeWorkOrder(Integer projectID, Integer workOrderID) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);

		WorkOrder workOrder = project.getWorkOrders().stream()
				.filter(item -> item.getWorkOrderID() == workOrderID)
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException("Work order is not assigned to this project"));

		project.removeWorkOrder(workOrder);

		return projectRepository.save(project);
	}

	@Transactional
	public Project addComment(Integer projectID, ProjectComments comment, Integer authorWorkerID) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanReceiveComments(project);

		if (comment == null || comment.getCommentText() == null || comment.getCommentText().isBlank()) {
			throw new IllegalArgumentException("Comment text is required");
		}

		if (comment.getCommentType() == null) {
			throw new IllegalArgumentException("Comment type is required");
		}

		if (authorWorkerID == null) {
			throw new IllegalArgumentException("Comment author is required");
		}

		Worker author = workerRepository.findById(authorWorkerID)
				.orElseThrow(() -> new IllegalArgumentException("Comment author not found"));

		if (!author.isAdmin() && !isAssignedToProject(project, author.getWorkerID())) {
			throw new IllegalStateException("Only admins or assigned workers can comment on this project");
		}

		comment.setProjectCommentID(0);
		comment.setAuthor(author);
		project.addComment(comment);

		return projectRepository.save(project);
	}

	@Transactional
	public Project addActionItem(Integer projectID, ProjectActionItem actionItem) {
		Project project = getRequiredProject(projectID);
		ensureProjectActionItemsCanBeEdited(project);
		prepareActionItem(actionItem);

		actionItem.setActionItemID(0);
		actionItem.setCompleted(false);
		actionItem.setCompletedAt(null);
		project.addActionItem(actionItem);

		return projectRepository.save(project);
	}

	@Transactional
	public Project updateActionItem(Integer projectID, Integer actionItemID, ProjectActionItem request) {
		Project project = getRequiredProject(projectID);
		ensureProjectActionItemsCanBeEdited(project);

		ProjectActionItem actionItem = getRequiredActionItem(project, actionItemID);
		prepareActionItem(request);
		actionItem.setItemText(request.getItemText());
		actionItem.setAssignedWorker(request.getAssignedWorker());
		actionItem.setAssignedTeam(request.getAssignedTeam());

		return projectRepository.save(project);
	}

	@Transactional
	public Project removeActionItem(Integer projectID, Integer actionItemID) {
		Project project = getRequiredProject(projectID);
		ensureProjectActionItemsCanBeEdited(project);

		project.removeActionItem(getRequiredActionItem(project, actionItemID));

		return projectRepository.save(project);
	}

	@Transactional
	public Project removeSnapshot(Integer projectID, Integer snapshotID) {
		Project project = getRequiredProject(projectID);
		ProjectSnapshot snapshot = project.getSnapshots().stream()
				.filter(item -> item.getProjectSnapshotID() == snapshotID)
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException("Snapshot not found"));

		project.removeSnapshot(snapshot);

		return projectRepository.save(project);
	}

	@Transactional
	public Project setActionItemCompleted(Integer projectID, Integer actionItemID, boolean completed) {
		Project project = getRequiredProject(projectID);

		if (project.isArchived() || project.getProjectStatus() == ProjectStatus.COMPLETED) {
			throw new IllegalStateException("Action items cannot be completed on completed or archived projects");
		}

		if (project.getProjectStatus() == ProjectStatus.DRAFT) {
			throw new IllegalStateException("Action items can only be completed after a project is active");
		}

		ProjectActionItem actionItem = getRequiredActionItem(project, actionItemID);
		actionItem.setCompleted(completed);
		actionItem.setCompletedAt(completed ? LocalDateTime.now() : null);

		return projectRepository.save(project);
	}

	private void applyDTO(Project project, ProjectDTO projectDTO) {
		if (projectDTO == null) {
			return;
		}

		project.setProjectName(projectDTO.getProjectName());
		project.setDescription(projectDTO.getDescription());
		project.setBudget(projectDTO.getBudget());

		if (projectDTO.getWorkOrderIDs() != null) {
			Set<WorkOrder> workOrders = new HashSet<>(workOrderRepository.findAllById(projectDTO.getWorkOrderIDs()));
			if (workOrders.size() != projectDTO.getWorkOrderIDs().size()) {
				throw new IllegalArgumentException("One or more work orders were not found");
			}
			project.setWorkOrders(List.copyOf(workOrders));
		}

		if (projectDTO.getTeamIDs() != null) {
			Set<Team> teams = new HashSet<>(teamRepository.findAllById(projectDTO.getTeamIDs()));
			if (teams.size() != projectDTO.getTeamIDs().size()) {
				throw new IllegalArgumentException("One or more teams were not found");
			}
			project.setTeams(List.copyOf(teams));
		}

		if (projectDTO.getAssociatedActiveProjectID() != null) {
			if (project.getProjectStatus() != ProjectStatus.DRAFT) {
				throw new IllegalStateException("Only draft projects can be attached to an active project");
			}
			if (project.getProjectID() == projectDTO.getAssociatedActiveProjectID()) {
				throw new IllegalStateException("A project cannot be attached to itself");
			}
			Project activeProject = projectRepository.findById(projectDTO.getAssociatedActiveProjectID())
					.orElseThrow(() -> new IllegalArgumentException("Associated active project not found"));
			if (activeProject.isArchived() || activeProject.getProjectStatus() != ProjectStatus.ACTIVE) {
				throw new IllegalStateException("Draft projects can only be attached to active projects");
			}
			project.setAssociatedActiveProject(activeProject);
		} else {
			project.setAssociatedActiveProject(null);
		}
	}

	private void addAssociatedDraftSnapshot(Project draftProject) {
		if (draftProject.getAssociatedActiveProject() == null) {
			return;
		}

		Project activeProject = draftProject.getAssociatedActiveProject();
		createDraftSnapshot(activeProject, draftProject, "Associated draft snapshot");
		projectRepository.save(activeProject);
	}

	private Project getRequiredProject(Integer projectID) {
		return projectRepository.findById(projectID)
				.orElseThrow(() -> new IllegalArgumentException("Project not found"));
	}

	private ProjectActionItem getRequiredActionItem(Project project, Integer actionItemID) {
		return project.getActionItems().stream()
				.filter(item -> item.getActionItemID() == actionItemID)
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException("Action item not found"));
	}

	private void prepareActionItem(ProjectActionItem actionItem) {
		if (actionItem == null || actionItem.getItemText() == null || actionItem.getItemText().isBlank()) {
			throw new IllegalArgumentException("Action item text is required");
		}

		if (actionItem.getAssignedWorker() != null &&
				actionItem.getAssignedWorker().getWorkerID() > 0 &&
				actionItem.getAssignedTeam() != null &&
				actionItem.getAssignedTeam().getTeamID() > 0) {
			throw new IllegalStateException("Action items can be assigned to a worker or a team, but not both");
		}

		if (actionItem.getAssignedWorker() != null && actionItem.getAssignedWorker().getWorkerID() > 0) {
			Worker worker = workerRepository.findById(actionItem.getAssignedWorker().getWorkerID())
					.orElseThrow(() -> new IllegalArgumentException("Assigned worker not found"));
			if (worker.isArchived()) {
				throw new IllegalStateException("Archived workers cannot be assigned");
			}
			actionItem.setAssignedWorker(worker);
		} else {
			actionItem.setAssignedWorker(null);
		}

		if (actionItem.getAssignedTeam() != null && actionItem.getAssignedTeam().getTeamID() > 0) {
			Team team = teamRepository.findById(actionItem.getAssignedTeam().getTeamID())
					.orElseThrow(() -> new IllegalArgumentException("Assigned team not found"));
			actionItem.setAssignedTeam(team);
		} else {
			actionItem.setAssignedTeam(null);
		}
	}

	private void ensureProjectCanBeEdited(Project project) {
		if (project.isArchived()) {
			throw new IllegalStateException("Archived projects cannot be edited");
		}

		if (project.getProjectStatus() == ProjectStatus.COMPLETED ||
				project.getProjectStatus() == ProjectStatus.IN_REVIEW) {
			throw new IllegalStateException("Completed or review projects cannot be edited");
		}
	}

	private void ensureProjectCanReceiveComments(Project project) {
		if (project.isArchived() ||
				project.getProjectStatus() == ProjectStatus.COMPLETED) {
			throw new IllegalStateException("Completed or archived projects cannot receive comments");
		}
	}

	private void ensureProjectActionItemsCanBeEdited(Project project) {
		if (project.isArchived() ||
				project.getProjectStatus() == ProjectStatus.COMPLETED) {
			throw new IllegalStateException("Action items cannot be edited on completed or archived projects");
		}
	}

	private boolean allWorkOrdersComplete(Project project) {
		return project.getWorkOrders().stream()
				.allMatch(workOrder -> workOrder.getStatus() == WorkOrderStatus.COMPLETE);
	}

	private void launchDraftWorkOrder(WorkOrder workOrder) {
		for (var item : new ArrayList<>(workOrder.getItems())) {
			workOrder.removeItem(item);
		}

		workOrder.setComment(null);
		workOrder.setCompany(null);
		workOrder.setEndDateTime(null);
		workOrder.setStartDateTime(LocalDateTime.now());
		workOrder.setStatus(workOrder.getWorkers().isEmpty() ? WorkOrderStatus.OPEN : WorkOrderStatus.IN_PROCESS);
	}

	private void deleteDraftProjectContents(Project draft) {
		for (WorkOrder workOrder : new ArrayList<>(draft.getWorkOrders())) {
			draft.removeWorkOrder(workOrder);
			workOrder.setWorkers(null);
			workOrderRepository.delete(workOrder);
		}
	}

	private void createDraftSnapshot(Project project, String snapshotName) {
		createDraftSnapshot(project, project, snapshotName);
	}

	private void createDraftSnapshot(Project snapshotOwner, Project draftProject, String snapshotName) {
		ProjectSnapshot snapshot = new ProjectSnapshot();
		snapshot.setSnapshotName(snapshotName);
		snapshot.setSourceDraftProjectID(draftProject.getProjectID());
		snapshot.setProjectName(draftProject.getProjectName());
		snapshot.setDescription(draftProject.getDescription());
		snapshot.setBudget(draftProject.getBudget());
		snapshot.setEstimatedCost(draftProject.getEstimatedCost());
		snapshot.setBudgetDifference(draftProject.getBudgetDifference());
		snapshot.setSnapshotData(buildSnapshotData(draftProject));
		snapshotOwner.addSnapshot(snapshot);
	}

	private String buildSnapshotData(Project project) {
		try {
			ObjectNode root = objectMapper.createObjectNode();
			root.put("projectID", project.getProjectID());
			root.put("projectName", project.getProjectName());
			root.put("description", project.getDescription());
			root.put("status", project.getProjectStatus().name());
			root.put("budget", project.getBudget() == null ? null : project.getBudget().toPlainString());
			root.put("estimatedCost", project.getEstimatedCost().toPlainString());
			root.put("budgetDifference", project.getBudgetDifference().toPlainString());

			ArrayNode workOrders = root.putArray("draftWorkOrders");
			for (WorkOrder workOrder : project.getWorkOrders()) {
				if (workOrder.getStatus() != WorkOrderStatus.DRAFT) {
					continue;
				}

				ObjectNode workOrderNode = workOrders.addObject();
				workOrderNode.put("workOrderID", workOrder.getWorkOrderID());
				workOrderNode.put("comment", workOrder.getComment());

				ArrayNode workers = workOrderNode.putArray("workers");
				for (Worker worker : workOrder.getWorkers()) {
					ObjectNode workerNode = workers.addObject();
					workerNode.put("workerID", worker.getWorkerID());
					workerNode.put("name", worker.getWorkerFName() + " " + worker.getWorkerLName());
				}

				ArrayNode items = workOrderNode.putArray("items");
				for (WorkOrderItem item : workOrder.getItems()) {
					ObjectNode itemNode = items.addObject();
					itemNode.put("workOrderItemID", item.getWorkOrderItemID());
					itemNode.put("itemType", item.getItemType() == null ? null : item.getItemType().name());
					itemNode.put("itemName", item.getItemName());
					itemNode.put("quantity", item.getQuantity());
					itemNode.put("price", item.getPrice());
					itemNode.put("lineTotal", item.getQuantity() * item.getPrice());
				}
			}

			return objectMapper.writeValueAsString(root);
		} catch (Exception exception) {
			throw new IllegalStateException("Project snapshot could not be created");
		}
	}

	private boolean isAssignedToProject(Project project, int workerID) {
		boolean assignedThroughWorkOrder = project.getWorkOrders().stream()
				.flatMap(workOrder -> workOrder.getWorkers().stream())
				.anyMatch(worker -> worker.getWorkerID() == workerID);

		if (assignedThroughWorkOrder) {
			return true;
		}

		return project.getTeams().stream()
				.flatMap((Team team) -> team.getWorkers().stream())
				.anyMatch(worker -> worker.getWorkerID() == workerID);
	}
}
