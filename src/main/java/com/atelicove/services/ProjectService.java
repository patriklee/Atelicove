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
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.DraftWorkOrderItem;
import com.atelicove.entities.PlannedStaffing;
import com.atelicove.entities.Project;
import com.atelicove.entities.ProjectActionItem;
import com.atelicove.entities.ProjectComments;
import com.atelicove.entities.ProjectSnapshot;
import com.atelicove.entities.StaffingSlot;
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
		return projectRepository.findByProjectStatusAndArchivedFalse(ProjectStatus.OPEN);
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
			project.setProjectStatus(ProjectStatus.OPEN);
		}

		return projectRepository.save(project);
	}

	/**
	 * Creates a new draft project from request data and records a snapshot when the
	 * draft is attached to an existing active project.
	 *
	 * @param projectDTO project fields and relationship IDs from the request
	 * @return the saved draft project
	 */
	@Transactional
	public Project createProject(ProjectDTO projectDTO) {
		Project project = new Project();
		applyDTO(project, projectDTO);
		project.setProjectStatus(ProjectStatus.OPEN);
		Project saved = createProject(project);
		addAssociatedDraftSnapshot(saved);
		return saved;
	}

	/**
	 * Updates an editable project and refreshes the active project's snapshot when
	 * this project is an associated draft.
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
		addAssociatedDraftSnapshot(project);

		return projectRepository.save(project);
	}

	/**
	 * Launches a draft project. A launch snapshot is kept, attached teams receive a
	 * start time, and planning-only draft work orders are discarded.
	 *
	 * @param projectID draft project to activate
	 * @return the activated project
	 */
	@Transactional
	public Project activateProject(Integer projectID) {
		return activateProject(projectID, List.of());
	}

	@Transactional
	public Project activateProject(Integer projectID, List<Integer> activateDraftWorkOrderIDs) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);

		if (project.getProjectStatus() != ProjectStatus.OPEN) {
			throw new IllegalStateException("Only draft projects can be activated");
		}

		if (project.getAssociatedActiveProject() != null) {
			throw new IllegalStateException("Draft projects attached to an active project cannot be activated");
		}

		createDraftSnapshot(project, "Launch snapshot");
		Set<Team> previousTeams = new HashSet<>(project.getTeams());
		Set<Team> launchTeams = plannedTeamsForLaunch(project);
		Set<Integer> draftIDsToActivate = new HashSet<>(activateDraftWorkOrderIDs == null
				? List.of()
				: activateDraftWorkOrderIDs);

		project.setProjectStatus(ProjectStatus.ACTIVE);
		LocalDateTime activatedAt = LocalDateTime.now();
		project.setActivatedAt(activatedAt);
		project.setTeams(List.copyOf(launchTeams));
		for (Team team : launchTeams) {
			if (team.getProjectStartedAt() == null) {
				team.setProjectStartedAt(activatedAt);
			}
		}
		syncActiveProjectTeamWorkers(project, previousTeams, launchTeams);

		for (DraftWorkOrder draftWorkOrder : project.getDraftWorkOrders()) {
			if (draftWorkOrder.isArchived()) {
				continue;
			}
			if (draftIDsToActivate.contains(draftWorkOrder.getDraftWorkOrderID())) {
				WorkOrder workOrder = createBlankWorkOrderFromDraft(project, draftWorkOrder, launchTeams, activatedAt);
				project.addWorkOrder(workOrder);
			}
		}

		for (DraftWorkOrder draftWorkOrder : new ArrayList<>(project.getDraftWorkOrders())) {
			project.removeDraftWorkOrder(draftWorkOrder);
		}
		for (PlannedStaffing staffing : new ArrayList<>(project.getPlannedStaffing())) {
			project.removePlannedStaffing(staffing);
		}

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

		if (project.getProjectStatus() != ProjectStatus.ACTIVE) {
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

		if (project.getProjectStatus() != ProjectStatus.IN_REVIEW) {
			throw new IllegalStateException("Only projects under review can be rejected");
		}

		project.setProjectStatus(ProjectStatus.ACTIVE);

		return projectRepository.save(project);
	}

	/**
	 * Archives a non-draft project after all work orders are complete, then removes
	 * any temporary draft projects that were attached to it.
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
		if (project.getProjectStatus() != ProjectStatus.OPEN) {
			for (Project draft : new ArrayList<>(projectRepository.findByAssociatedActiveProject_ProjectID(projectID))) {
				deleteDraftProjectContents(draft);
				projectRepository.delete(draft);
			}
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

	/**
	 * Permanently deletes a project only when it is archived or still a draft. Work
	 * orders are detached before deletion so their project relationship is cleared.
	 *
	 * @param projectID project to permanently delete
	 */
	@Transactional
	public void deletePermanentlyById(Integer projectID) {
		Project project = getRequiredProject(projectID);

		if (!project.isArchived() && project.getProjectStatus() != ProjectStatus.OPEN) {
			throw new IllegalStateException("Only archived or draft projects can be permanently deleted");
		}

		if (project.getProjectStatus() == ProjectStatus.OPEN) {
			deleteDraftProjectContents(project);
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

		if (project.getProjectStatus() != ProjectStatus.ACTIVE) {
			throw new IllegalStateException("Existing work orders can only be attached to active projects");
		}
		if (workOrder.getProject() != null && workOrder.getProject().getProjectID() != projectID) {
			throw new IllegalStateException("Work order is already associated with another project");
		}
		if (workOrder.getStatus() != WorkOrderStatus.OPEN && workOrder.getStatus() != WorkOrderStatus.ACTIVE) {
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

		if (project.getProjectStatus() != ProjectStatus.ACTIVE) {
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
			workOrder.setStatus(WorkOrderStatus.ACTIVE);
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

	/**
	 * Creates a draft work order from a team while the project is still in draft.
	 * The work order starts with the team's workers and can optionally carry a
	 * company and planning comment.
	 *
	 * @param projectID draft project that owns the work order
	 * @param teamID team providing the initial workers
	 * @param companyID optional company to assign
	 * @param comment optional planning note
	 * @return the saved project with the new draft work order
	 */
	@Transactional
	public Project createDraftWorkOrderForTeam(
			Integer projectID,
			Integer teamID,
			Integer companyID,
			String comment) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);

		if (project.getProjectStatus() != ProjectStatus.OPEN) {
			throw new IllegalStateException("Draft work orders can only be created for draft projects");
		}

		Team team = teamRepository.findById(teamID)
				.orElseThrow(() -> new IllegalArgumentException("Team not found"));
		ensureTeamCanBeAssignedToProject(team);
		PlannedStaffing staffing = addPlannedStaffing(project, team);

		DraftWorkOrder draftWorkOrder = new DraftWorkOrder();
		draftWorkOrder.setComment(comment);
		draftWorkOrder.setPlannedTeamID(staffing.getSourceTeamID());
		draftWorkOrder.setPlannedTeamName(staffing.getStaffingName());

		if (companyID != null) {
			Company company = companyRepository.findById(companyID)
					.orElseThrow(() -> new IllegalArgumentException("Company not found"));
			if (company.isArchived()) {
				throw new IllegalStateException("Archived companies cannot be assigned");
			}
			draftWorkOrder.setPlannedCompanyID(company.getCompanyID());
			draftWorkOrder.setPlannedCompanyName(company.getCompanyName());
		}

		project.addDraftWorkOrder(draftWorkOrder);

		return projectRepository.save(project);
	}

	@Transactional
	public Project createDraftWorkOrderFromExisting(Integer projectID, Integer workOrderID, String comment) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);

		if (project.getProjectStatus() != ProjectStatus.OPEN) {
			throw new IllegalStateException("Draft planning copies can only be created for draft projects");
		}

		WorkOrder source = workOrderRepository.findById(workOrderID)
				.orElseThrow(() -> new IllegalArgumentException("Work order not found"));

		DraftWorkOrder draftWorkOrder = new DraftWorkOrder();
		draftWorkOrder.setWorkOrderName("COPY Work Order #" + source.getWorkOrderID());
		draftWorkOrder.setSourceWorkOrderID(source.getWorkOrderID());
		draftWorkOrder.setSourceProjectID(source.getProject() == null ? null : source.getProject().getProjectID());
		draftWorkOrder.setComment(comment == null || comment.isBlank() ? source.getComment() : comment);
		if (source.getCompany() != null) {
			draftWorkOrder.setPlannedCompanyID(source.getCompany().getCompanyID());
			draftWorkOrder.setPlannedCompanyName(source.getCompany().getCompanyName());
		}
		for (WorkOrderItem item : source.getItems()) {
			DraftWorkOrderItem copiedItem = new DraftWorkOrderItem();
			copiedItem.setItemName(item.getItemName());
			copiedItem.setQuantity(item.getQuantity());
			copiedItem.setPrice(item.getPrice());
			copiedItem.setItemType(item.getItemType());
			draftWorkOrder.addItem(copiedItem);
		}

		project.addDraftWorkOrder(draftWorkOrder);

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
	public Project removeDraftWorkOrder(Integer projectID, Integer draftWorkOrderID) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);

		DraftWorkOrder draftWorkOrder = project.getDraftWorkOrders().stream()
				.filter(item -> item.getDraftWorkOrderID() == draftWorkOrderID)
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException("Draft work order is not assigned to this project"));

		project.removeDraftWorkOrder(draftWorkOrder);

		return projectRepository.save(project);
	}

	@Transactional
	public Project updateDraftWorkOrder(
			Integer projectID,
			Integer draftWorkOrderID,
			Integer companyID,
			String comment,
			Integer teamID,
			boolean updateTeam) {
		Project project = getRequiredProject(projectID);
		ensureProjectCanBeEdited(project);

		if (project.getProjectStatus() != ProjectStatus.OPEN) {
			throw new IllegalStateException("Draft work orders can only be edited for draft projects");
		}

		DraftWorkOrder draftWorkOrder = project.getDraftWorkOrders().stream()
				.filter(item -> item.getDraftWorkOrderID() == draftWorkOrderID)
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException("Draft work order is not assigned to this project"));

		if (companyID == null) {
			draftWorkOrder.setPlannedCompanyID(null);
			draftWorkOrder.setPlannedCompanyName(null);
		} else {
			Company company = companyRepository.findById(companyID)
					.orElseThrow(() -> new IllegalArgumentException("Company not found"));
			if (company.isArchived()) {
				throw new IllegalStateException("Archived companies cannot be assigned");
			}
			draftWorkOrder.setPlannedCompanyID(company.getCompanyID());
			draftWorkOrder.setPlannedCompanyName(company.getCompanyName());
		}

		if (updateTeam) {
			if (teamID == null) {
				draftWorkOrder.setPlannedTeamID(null);
				draftWorkOrder.setPlannedTeamName(null);
			} else {
				Team team = teamRepository.findById(teamID)
						.orElseThrow(() -> new IllegalArgumentException("Team not found"));
				ensureTeamCanBeAssignedToProject(team);
				PlannedStaffing staffing = addPlannedStaffing(project, team);
				draftWorkOrder.setPlannedTeamID(staffing.getSourceTeamID());
				draftWorkOrder.setPlannedTeamName(staffing.getStaffingName());
			}
		}

		draftWorkOrder.setComment(comment);

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

		project.setProjectName(projectDTO.getProjectName());
		project.setDescription(projectDTO.getDescription());
		project.setBudget(projectDTO.getBudget());
		if (projectDTO.getPlannedTeams() != null) {
			applyPlannedStaffing(project, projectDTO.getPlannedTeams());
		}

		if (projectDTO.getWorkOrderIDs() != null) {
			Set<WorkOrder> workOrders = new HashSet<>(workOrderRepository.findAllById(projectDTO.getWorkOrderIDs()));
			if (workOrders.size() != projectDTO.getWorkOrderIDs().size()) {
				throw new IllegalArgumentException("One or more work orders were not found");
			}
			project.setWorkOrders(List.copyOf(workOrders));
		}

		if (projectDTO.getTeamIDs() != null) {
			if (project.getProjectStatus() == null || project.getProjectStatus() == ProjectStatus.OPEN) {
				if (projectDTO.getPlannedTeams() == null) {
					applyPlannedStaffingFromTeams(project, projectDTO.getTeamIDs());
				}
			} else {
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

		if (projectDTO.getAssociatedActiveProjectID() != null) {
			if (project.getProjectStatus() != ProjectStatus.OPEN) {
				throw new IllegalStateException("Only draft projects can be attached to an active project");
			}
			if (project.getProjectID() == projectDTO.getAssociatedActiveProjectID()) {
				throw new IllegalStateException("A project cannot be attached to itself");
			}
			Project activeProject = projectRepository.findById(projectDTO.getAssociatedActiveProjectID())
					.orElseThrow(() -> new IllegalArgumentException("Associated active project not found"));
			if (activeProject.getProjectStatus() == ProjectStatus.OPEN) {
				throw new IllegalStateException("A draft project cannot reference another draft project");
			}
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
		if (project.isArchived()) {
			throw new IllegalStateException("Archived projects cannot be edited");
		}

		if (project.getProjectStatus() == ProjectStatus.COMPLETE ||
				project.getProjectStatus() == ProjectStatus.IN_REVIEW) {
			throw new IllegalStateException("Completed or review projects cannot be edited");
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
		if (project.getProjectStatus() != ProjectStatus.ACTIVE) {
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
					workOrder.getStatus() != WorkOrderStatus.ACTIVE) {
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
					: WorkOrderStatus.ACTIVE);
		}
	}

	private Set<Worker> workersForTeams(Set<Team> teams) {
		Set<Worker> workers = new HashSet<>();
		for (Team team : teams) {
			workers.addAll(team.getWorkers());
		}
		return workers;
	}

	private Set<Team> plannedTeamsForLaunch(Project project) {
		Set<Team> teams = new HashSet<>();
		for (PlannedStaffing staffing : project.getPlannedStaffing()) {
			Team plannedTeam = createTeamFromPlannedStaffing(staffing);
			if (plannedTeam != null) {
				teams.add(plannedTeam);
			}
		}

		if (teams.isEmpty()) {
			teams.addAll(project.getTeams());
		}
		ensureTeamsCanBeAssignedToProject(teams);
		return teams;
	}

	private Team createTeamFromPlannedStaffing(PlannedStaffing staffing) {
		Set<Integer> workerIDs = new HashSet<>();
		for (StaffingSlot slot : staffing.getStaffingSlots()) {
			if (slot.getWorkerID() != null) {
				workerIDs.add(slot.getWorkerID());
			}
		}

		if (workerIDs.isEmpty()) {
			return null;
		}

		Set<Worker> workers = new HashSet<>(workerRepository.findAllById(workerIDs));
		if (workers.size() != workerIDs.size()) {
			throw new IllegalStateException("One or more planned workers could not be found");
		}

		Team team = new Team();
		team.setTeamName(staffing.getStaffingName() == null || staffing.getStaffingName().isBlank()
				? "Planned Staffing"
				: staffing.getStaffingName());
		team.setWorkers(workers);
		return teamRepository.save(team);
	}

	private WorkOrder createBlankWorkOrderFromDraft(
			Project project,
			DraftWorkOrder draftWorkOrder,
			Set<Team> launchTeams,
			LocalDateTime activatedAt) {
		WorkOrder workOrder = new WorkOrder();
		workOrder.setStatus(WorkOrderStatus.OPEN);
		workOrder.setStartDateTime(activatedAt);
		workOrder.setEndDateTime(null);
		workOrder.setComment(null);

		Set<Worker> workers = workersForDraftWorkOrder(draftWorkOrder, launchTeams);
		if (!workers.isEmpty()) {
			workOrder.setWorkers(workers);
			workOrder.setStatus(WorkOrderStatus.ACTIVE);
		}

		workOrder = workOrderRepository.save(workOrder);
		workOrder.setProject(project);
		return workOrder;
	}

	private Set<Worker> workersForDraftWorkOrder(DraftWorkOrder draftWorkOrder, Set<Team> launchTeams) {
		if (draftWorkOrder.getPlannedTeamID() == null) {
			return workersForTeams(launchTeams);
		}

		Set<Team> matchingTeams = new HashSet<>();
		for (Team team : launchTeams) {
			if (team.getTeamID() == draftWorkOrder.getPlannedTeamID()) {
				matchingTeams.add(team);
			}
		}
		return workersForTeams(matchingTeams);
	}

	private PlannedStaffing addPlannedStaffing(Project project, Team team) {
		for (PlannedStaffing staffing : project.getPlannedStaffing()) {
			if (staffing.getSourceTeamID() != null && staffing.getSourceTeamID() == team.getTeamID()) {
				return staffing;
			}
		}

		PlannedStaffing staffing = plannedStaffingFromTeam(team);
		project.addPlannedStaffing(staffing);
		return staffing;
	}

	private void applyPlannedStaffingFromTeams(Project project, List<Integer> teamIDs) {
		List<PlannedStaffing> staffingPlans = new ArrayList<>();
		for (Team team : teamRepository.findAllById(teamIDs)) {
			staffingPlans.add(plannedStaffingFromTeam(team));
		}
		project.setPlannedStaffing(staffingPlans);
	}

	private PlannedStaffing plannedStaffingFromTeam(Team team) {
		PlannedStaffing staffing = new PlannedStaffing();
		staffing.setSourceTeamID(team.getTeamID());
		staffing.setStaffingName(team.getTeamName());
		for (Worker worker : team.getWorkers()) {
			StaffingSlot slot = new StaffingSlot();
			slot.setWorkerID(worker.getWorkerID());
			slot.setWorkerName(worker.getWorkerDisplayName() == null || worker.getWorkerDisplayName().isBlank()
					? (worker.getWorkerFName() + " " + worker.getWorkerLName()).trim()
					: worker.getWorkerDisplayName());
			slot.setRoleName(worker.getRoleTitle());
			slot.setRoleDescription(worker.getRoleDescription());
			staffing.addStaffingSlot(slot);
		}
		return staffing;
	}

	private void applyPlannedStaffing(Project project, List<PlannedStaffing> requestedPlans) {
		List<PlannedStaffing> staffingPlans = new ArrayList<>();
		for (PlannedStaffing requested : requestedPlans) {
			PlannedStaffing staffing = new PlannedStaffing();
			staffing.setSourceTeamID(requested.getSourceTeamID());
			staffing.setStaffingName(requested.getStaffingName() == null || requested.getStaffingName().isBlank()
					? requested.getTeamName()
					: requested.getStaffingName());
			staffing.setNotes(requested.getNotes());
			for (StaffingSlot requestedSlot : requested.getStaffingSlots()) {
				StaffingSlot slot = new StaffingSlot();
				slot.setWorkerID(requestedSlot.getWorkerID());
				slot.setWorkerName(requestedSlot.getWorkerName());
				slot.setRoleName(requestedSlot.getRoleName());
				slot.setRoleDescription(requestedSlot.getRoleDescription());
				staffing.addStaffingSlot(slot);
			}
			staffingPlans.add(staffing);
		}
		project.setPlannedStaffing(staffingPlans);
	}

	private void deleteDraftProjectContents(Project draft) {
		for (DraftWorkOrder draftWorkOrder : new ArrayList<>(draft.getDraftWorkOrders())) {
			draft.removeDraftWorkOrder(draftWorkOrder);
		}
	}

	private void createDraftSnapshot(Project project, String snapshotName) {
		createDraftSnapshot(project, project, snapshotName);
	}

	/**
	 * Captures the current draft project details as a snapshot owned by either the
	 * draft itself or its associated active project.
	 *
	 * @param snapshotOwner project that stores the snapshot
	 * @param draftProject draft content being captured
	 * @param snapshotName display name for the snapshot
	 */
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

	/**
	 * Builds a compact JSON copy of draft work order planning data for later review.
	 *
	 * @param project draft project to serialize
	 * @return JSON snapshot data
	 */
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
			ArrayNode plannedTeams = root.putArray("plannedTeams");
			for (PlannedStaffing staffing : project.getPlannedStaffing()) {
				ObjectNode staffingNode = plannedTeams.addObject();
				staffingNode.put("plannedStaffingID", staffing.getPlannedStaffingID());
				staffingNode.put("teamName", staffing.getStaffingName());
				ArrayNode slots = staffingNode.putArray("staffingSlots");
				for (StaffingSlot slot : staffing.getStaffingSlots()) {
					ObjectNode slotNode = slots.addObject();
					slotNode.put("staffingSlotID", slot.getStaffingSlotID());
					slotNode.put("workerID", slot.getWorkerID());
					slotNode.put("workerName", slot.getWorkerName());
					slotNode.put("roleName", slot.getRoleName());
					slotNode.put("roleDescription", slot.getRoleDescription());
				}
			}

			ArrayNode workOrders = root.putArray("draftWorkOrders");
			for (DraftWorkOrder workOrder : project.getDraftWorkOrders()) {
				ObjectNode workOrderNode = workOrders.addObject();
				workOrderNode.put("workOrderID", workOrder.getWorkOrderID());
				workOrderNode.put("sourceWorkOrderID", workOrder.getSourceWorkOrderID());
				workOrderNode.put("plannedTeamName", workOrder.getPlannedTeamName());
				workOrderNode.put("plannedCompanyName", workOrder.getPlannedCompanyName());
				workOrderNode.put("comment", workOrder.getComment());

				ArrayNode items = workOrderNode.putArray("items");
				for (DraftWorkOrderItem item : workOrder.getItems()) {
					ObjectNode itemNode = items.addObject();
					itemNode.put("draftWorkOrderItemID", item.getDraftWorkOrderItemID());
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
		return project.getTeams().stream()
				.flatMap((Team team) -> team.getWorkers().stream())
				.anyMatch(worker -> worker.getWorkerID() == workerID);
	}
}
