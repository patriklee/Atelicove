package com.atelicove.services;

import java.time.LocalDateTime;
import java.math.BigDecimal;
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
import com.atelicove.entities.Worker;
import com.atelicove.enums.ProjectStatus;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.TeamRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

@Service
public class ProjectService {

	private final ProjectRepository projectRepository;
	private final WorkOrderRepository workOrderRepository;
	private final WorkerRepository workerRepository;
	private final TeamRepository teamRepository;
	private final CompanyRepository companyRepository;

	public ProjectService(
			ProjectRepository projectRepository,
			WorkOrderRepository workOrderRepository,
			WorkerRepository workerRepository,
			TeamRepository teamRepository,
			CompanyRepository companyRepository) {
		this.projectRepository = projectRepository;
		this.workOrderRepository = workOrderRepository;
		this.workerRepository = workerRepository;
		this.teamRepository = teamRepository;
		this.companyRepository = companyRepository;
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

	public Optional<Project> findById(Integer id) {
		return projectRepository.findById(id);
	}

	public long count() {
		return projectRepository.countByArchivedFalse();
	}

	@Transactional
	public Project createProject(Project project) {
		validateProjectDetails(project.getProjectName(), project.getBudget());
		project.setProjectID(0);
		project.setArchived(false);
		project.setArchivedAt(null);
		project.setCompletedAt(null);
		project.setActivatedAt(null);

		if (project.getProjectStatus() == null) {
			project.setProjectStatus(ProjectStatus.OPEN);
		}

		return projectRepository.save(project);
	}

	/**
	 * Creates a new operational project from request data.
	 *
	 * @param projectDTO project fields and relationship IDs from the request
	 * @return the saved project
	 */
	@Transactional
	public Project createProject(ProjectDTO projectDTO) {
		Project project = new Project();
		applyDTO(project, projectDTO);
		project.setProjectStatus(ProjectStatus.OPEN);
		return createProject(project);
	}

	/**
	 * Updates an editable operational project.
	 *
	 * @param projectID project being updated
	 * @param projectDTO replacement project details
	 * @return the saved project
	 */
	@Transactional
	public Project updateProject(Integer projectID, ProjectDTO projectDTO) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);
		applyDTO(project, projectDTO);
		return projectRepository.save(project);
	}

	/**
	 * Moves an active project into review after all of its work orders are complete.
	 *
	 * @param projectID active project to submit
	 * @return the saved project with an in-review status
	 */
	@Transactional
	public Project submitForReview(Integer projectID) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);

		if (project.getProjectStatus() != ProjectStatus.OPEN) {
			throw new IllegalStateException("Only active projects can be submitted for review");
		}

		if (!allWorkOrdersComplete(project)) {
			throw new IllegalStateException("Projects can only be submitted when all work orders are complete");
		}

		ensureAssociatedTeamsAreNotEmpty(project);
		project.setProjectStatus(ProjectStatus.IN_REVIEW);

		return projectRepository.save(project);
	}

	/**
	 * Marks a reviewed project complete once every linked work order is complete.
	 *
	 * @param projectID project under review
	 * @return the completed project
	 */
	@Transactional
	public Project completeProject(Integer projectID) {
		Project project = getRequiredProject(projectID);
		ensureProjectIsNotArchived(project);

		if (project.getProjectStatus() != ProjectStatus.IN_REVIEW) {
			throw new IllegalStateException("Only projects under review can be completed");
		}

		if (!allWorkOrdersComplete(project)) {
			throw new IllegalStateException("Projects can only be completed when all work orders are complete");
		}

		ensureAssociatedTeamsAreNotEmpty(project);
		project.setProjectStatus(ProjectStatus.COMPLETE);
		project.setCompletedAt(LocalDateTime.now());

		return projectRepository.save(project);
	}

	@Transactional
	public Project rejectProject(Integer projectID) {
		Project project = getRequiredProject(projectID);
		ensureProjectIsNotArchived(project);

		if (project.getProjectStatus() != ProjectStatus.IN_REVIEW) {
			throw new IllegalStateException("Only projects under review can be rejected");
		}

		project.setProjectStatus(ProjectStatus.OPEN);

		return projectRepository.save(project);
	}

	/**
	 * Archives a project after all associated work orders are complete.
	 *
	 * @param projectID project to archive
	 */
	@Transactional
	public void archiveById(Integer projectID) {
		Project project = getRequiredProject(projectID);

		if (project.getProjectStatus() != ProjectStatus.OPEN) {
			if (!allWorkOrdersComplete(project)) {
				throw new IllegalStateException("Projects can only be archived when all work orders are complete");
			}

			ensureAssociatedTeamsAreNotEmpty(project);
		}
		project.setArchived(true);
		project.setArchivedAt(LocalDateTime.now());
		projectRepository.save(project);
	}

	@Transactional
	public Project restoreById(Integer projectID) {
		Project project = getRequiredProject(projectID);
		project.setArchived(false);
		project.setArchivedAt(null);

		return projectRepository.save(project);
	}

	/**
	 * Permanently deletes only an accidental empty open project. Archived,
	 * completed, and historically populated projects remain available for review.
	 *
	 * @param projectID project to permanently delete
	 */
	@Transactional
	public void deletePermanentlyById(Integer projectID) {
		Project project = getRequiredProject(projectID);

		if (!canDeleteMistakenProject(project)) {
			throw new IllegalStateException("Only empty open projects without business history can be permanently deleted");
		}

		projectRepository.delete(project);
	}

	private boolean canDeleteMistakenProject(Project project) {
		return !project.isArchived() &&
				project.getProjectStatus() == ProjectStatus.OPEN &&
				project.getWorkOrders().isEmpty() &&
				project.getComments().isEmpty() &&
				project.getActionItems().isEmpty() &&
				project.getSnapshots().isEmpty() &&
				project.getDocuments().isEmpty();
	}

	@Transactional
	public Project assignWorkOrder(Integer projectID, Integer workOrderID) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);

		WorkOrder workOrder = workOrderRepository.findById(workOrderID)
				.orElseThrow(() -> new IllegalArgumentException("Work order not found"));

		if (project.getProjectStatus() != ProjectStatus.OPEN) {
			throw new IllegalStateException("Existing work orders can only be attached to active projects");
		}
		if (workOrder.getProject() != null && workOrder.getProject().getProjectID() != projectID) {
			throw new IllegalStateException("Work order is already associated with another project");
		}
		if (workOrder.getStatus() != WorkOrderStatus.OPEN && workOrder.getStatus() != WorkOrderStatus.IN_PROCESS) {
			throw new IllegalStateException("Only open or active work orders can be attached to active projects");
		}

		project.addWorkOrder(workOrder);

		return projectRepository.save(project);
	}

	@Transactional
	public Project createWorkOrderForProject(
			Integer projectID,
			Integer teamID,
			Integer companyID,
			String comment) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);

		if (project.getProjectStatus() != ProjectStatus.OPEN) {
			throw new IllegalStateException("Active project work orders can only be created for active projects");
		}

		Team team = null;
		if (teamID != null) {
			team = teamRepository.findById(teamID)
					.orElseThrow(() -> new IllegalArgumentException("Team not found"));
			ensureTeamCanBeAssignedToProject(team);
			if (!project.getTeams().contains(team)) {
				Set<Team> previousTeams = new HashSet<>(project.getTeams());
				project.addTeam(team);
				syncActiveProjectTeamWorkers(project, previousTeams, new HashSet<>(project.getTeams()));
			}
		}

		WorkOrder workOrder = new WorkOrder();
		workOrder.setStatus(WorkOrderStatus.OPEN);
		workOrder.setComment(comment);
		workOrder.setStartDateTime(LocalDateTime.now());
		workOrder.setEndDateTime(null);

		if (team != null && !team.getWorkers().isEmpty()) {
			workOrder.setWorkers(new HashSet<>(team.getWorkers()));
			workOrder.setStatus(WorkOrderStatus.IN_PROCESS);
		}

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

	/**
	 * Adds a project comment after verifying that the author is either an admin or
	 * assigned to the project through a team or work order.
	 *
	 * @param projectID project receiving the comment
	 * @param comment comment details
	 * @param authorWorkerID worker creating the comment
	 * @return the saved project
	 */
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
		actionItem.setDueDate(request.getDueDate());
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
		ensureProjectCanBeEdited(project);
		ProjectSnapshot snapshot = project.getSnapshots().stream()
				.filter(item -> item.getProjectSnapshotID() == snapshotID)
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException("Snapshot not found"));

		project.removeSnapshot(snapshot);

		return projectRepository.save(project);
	}

	/**
	 * Marks an action item complete or incomplete. Action items can be checked off
	 * before the project is completed or archived.
	 *
	 * @param projectID project containing the action item
	 * @param actionItemID action item to update
	 * @param completed true when the item is finished
	 * @return the saved project
	 */
	@Transactional
	public Project setActionItemCompleted(Integer projectID, Integer actionItemID, boolean completed) {
		Project project = getRequiredProject(projectID);

		if (project.isArchived() || project.getProjectStatus() == ProjectStatus.COMPLETE) {
			throw new IllegalStateException("Action items cannot be completed on completed or archived projects");
		}

		ProjectActionItem actionItem = getRequiredActionItem(project, actionItemID);
		actionItem.setCompleted(completed);
		actionItem.setCompletedAt(completed ? LocalDateTime.now() : null);

		return projectRepository.save(project);
	}

	/**
	 * Applies editable DTO fields and resolves relationship IDs into managed
	 * entities before the project is saved.
	 *
	 * @param project project being changed
	 * @param projectDTO incoming fields and IDs
	 */
	private void applyDTO(Project project, ProjectDTO projectDTO) {
		if (projectDTO == null) {
			return;
		}

		validateProjectDetails(projectDTO.getProjectName(), projectDTO.getBudget());
		project.setProjectName(projectDTO.getProjectName().trim());
		project.setDescription(projectDTO.getDescription());
		project.setBudget(projectDTO.getBudget());

		if (projectDTO.getWorkOrderIDs() != null) {
			Set<WorkOrder> workOrders = new HashSet<>(workOrderRepository.findAllById(projectDTO.getWorkOrderIDs()));
			if (workOrders.size() != projectDTO.getWorkOrderIDs().size()) {
				throw new IllegalArgumentException("One or more work orders were not found");
			}
			for (WorkOrder workOrder : workOrders) {
				if (workOrder.isArchived() || workOrder.getStatus() == WorkOrderStatus.COMPLETE) {
					throw new IllegalStateException("Archived or completed work orders cannot be reassigned");
				}
				if (workOrder.getProject() != null && workOrder.getProject() != project) {
					throw new IllegalStateException("Work order is already associated with another project");
				}
			}
			project.setWorkOrders(List.copyOf(workOrders));
		}

		if (projectDTO.getTeamIDs() != null) {
			Set<Team> previousTeams = new HashSet<>(project.getTeams());
			Set<Team> teams = new HashSet<>(teamRepository.findAllById(projectDTO.getTeamIDs()));
			if (teams.size() != projectDTO.getTeamIDs().size()) {
				throw new IllegalArgumentException("One or more teams were not found");
			}
			ensureTeamsCanBeAssignedToProject(teams);
			project.setTeams(List.copyOf(teams));
			syncActiveProjectTeamWorkers(project, previousTeams, teams);
		}
	}

	private void validateProjectDetails(String projectName, BigDecimal budget) {
		if (projectName == null || projectName.isBlank()) {
			throw new IllegalArgumentException("Project name is required");
		}
		if (budget != null && budget.signum() < 0) {
			throw new IllegalArgumentException("Project budget cannot be negative");
		}
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

	/**
	 * Validates action item text and resolves assignment to one active worker or one
	 * team.
	 *
	 * @param actionItem action item to validate and normalize
	 */
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
		ensureProjectIsNotArchived(project);

		if (project.getProjectStatus() == ProjectStatus.COMPLETE ||
				project.getProjectStatus() == ProjectStatus.IN_REVIEW) {
			throw new IllegalStateException("Completed or review projects cannot be edited");
		}
	}

	private void ensureProjectIsNotArchived(Project project) {
		if (project.isArchived()) {
			throw new IllegalStateException("Archived projects cannot be edited");
		}
	}

	private void ensureProjectCanReceiveComments(Project project) {
		if (project.isArchived() ||
				project.getProjectStatus() == ProjectStatus.COMPLETE) {
			throw new IllegalStateException("Completed or archived projects cannot receive comments");
		}
	}

	private void ensureAssociatedTeamsAreNotEmpty(Project project) {
		ensureTeamsCanBeAssignedToProject(new HashSet<>(project.getTeams()));
	}

	private void ensureTeamsCanBeAssignedToProject(Set<Team> teams) {
		for (Team team : teams) {
			ensureTeamCanBeAssignedToProject(team);
		}
	}

	private void ensureTeamCanBeAssignedToProject(Team team) {
		if (team == null || team.getWorkers().isEmpty()) {
			throw new IllegalStateException("Associated team is empty");
		}
	}

	private void ensureProjectActionItemsCanBeEdited(Project project) {
		if (project.isArchived() ||
				project.getProjectStatus() == ProjectStatus.COMPLETE) {
			throw new IllegalStateException("Action items cannot be edited on completed or archived projects");
		}
	}

	private boolean allWorkOrdersComplete(Project project) {
		return project.getWorkOrders().stream()
				.allMatch(workOrder -> workOrder.getStatus() == WorkOrderStatus.COMPLETE);
	}

	private void syncActiveProjectTeamWorkers(Project project, Set<Team> previousTeams, Set<Team> currentTeams) {
		if (project.getProjectStatus() != ProjectStatus.OPEN) {
			return;
		}

		Set<Worker> previousWorkers = workersForTeams(previousTeams);
		Set<Worker> currentWorkers = workersForTeams(currentTeams);

		Set<Worker> removedWorkers = new HashSet<>(previousWorkers);
		removedWorkers.removeAll(currentWorkers);

		Set<Worker> addedWorkers = new HashSet<>(currentWorkers);
		addedWorkers.removeAll(previousWorkers);

		for (WorkOrder workOrder : project.getWorkOrders()) {
			if (workOrder.getStatus() != WorkOrderStatus.OPEN &&
					workOrder.getStatus() != WorkOrderStatus.IN_PROCESS) {
				continue;
			}

			for (Worker worker : removedWorkers) {
				workOrder.removeWorker(worker);
			}

			for (Worker worker : addedWorkers) {
				workOrder.addWorker(worker);
			}

			workOrder.setStatus(workOrder.getWorkers().isEmpty()
					? WorkOrderStatus.OPEN
					: WorkOrderStatus.IN_PROCESS);
		}
	}

	private Set<Worker> workersForTeams(Set<Team> teams) {
		Set<Worker> workers = new HashSet<>();
		for (Team team : teams) {
			workers.addAll(team.getWorkers());
		}
		return workers;
	}

	private boolean isAssignedToProject(Project project, int workerID) {
		boolean assignedThroughTeam = project.getTeams().stream()
				.flatMap((Team team) -> team.getWorkers().stream())
				.anyMatch(worker -> worker.getWorkerID() == workerID);
		boolean assignedThroughWorkOrder = project.getWorkOrders().stream()
				.flatMap(workOrder -> workOrder.getWorkers().stream())
				.anyMatch(worker -> worker.getWorkerID() == workerID);
		return assignedThroughTeam || assignedThroughWorkOrder;
	}
}
