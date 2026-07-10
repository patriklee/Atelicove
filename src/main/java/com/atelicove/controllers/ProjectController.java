package com.atelicove.controllers;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.atelicove.dto.ProjectDTO;
import com.atelicove.entities.Project;
import com.atelicove.entities.ProjectActionItem;
import com.atelicove.entities.ProjectComments;
import com.atelicove.services.ProjectService;

@RestController
@RequestMapping("/projects")
public class ProjectController {

	private final ProjectService projectService;

	public ProjectController(ProjectService projectService) {
		this.projectService = projectService;
	}

	@GetMapping
	public List<Project> getAllProjects() {
		return projectService.findActive();
	}

	@GetMapping("/all-with-archived")
	public List<Project> getAllProjectsIncludingArchived() {
		return projectService.findAll();
	}

	@GetMapping("/archived")
	public List<Project> getArchivedProjects() {
		return projectService.findArchived();
	}

	@GetMapping("/drafts")
	public List<Project> getDraftProjects() {
		return projectService.findDrafts();
	}

	@GetMapping("/drafts/archived")
	public List<Project> getArchivedDraftProjects() {
		return projectService.findArchivedDrafts();
	}

	@GetMapping("/{id}")
	public ResponseEntity<Project> getProjectById(@PathVariable Integer id) {
		Optional<Project> project = projectService.findById(id);

		if (project.isPresent()) {
			return ResponseEntity.ok(project.get());
		}

		return ResponseEntity.notFound().build();
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping
	public Project addProject(@RequestBody ProjectDTO projectDTO) {
		return projectService.createProject(projectDTO);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}")
	public Project updateProject(@PathVariable Integer id, @RequestBody ProjectDTO projectDTO) {
		return projectService.updateProject(id, projectDTO);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}/activate")
	public Project activateProject(
			@PathVariable Integer id,
			@RequestBody(required = false) Map<String, Object> request) {
		List<Integer> activateDraftWorkOrderIDs = optionalIntegerList(
				request == null ? null : request.get("activateDraftWorkOrderIDs"));
		return projectService.activateProject(id, activateDraftWorkOrderIDs);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}/complete")
	public Project completeProject(@PathVariable Integer id) {
		return projectService.completeProject(id);
	}

	@PutMapping("/{id}/submit")
	public Project submitForReview(@PathVariable Integer id) {
		return projectService.submitForReview(id);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}/reject")
	public Project rejectProject(@PathVariable Integer id) {
		return projectService.rejectProject(id);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}/workorders")
	public Project assignWorkOrder(@PathVariable Integer id, @RequestBody Map<String, Integer> request) {
		return projectService.assignWorkOrder(id, request.get("workOrderID"));
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping("/{id}/workorders")
	public Project createWorkOrderForProject(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
		Integer teamID = optionalInteger(request.get("teamID"));
		Integer companyID = optionalInteger(request.get("companyID"));
		String comment = request.get("comment") == null ? null : request.get("comment").toString();
		return projectService.createWorkOrderForProject(id, teamID, companyID, comment);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{id}/workorders/{workOrderID}")
	public Project removeWorkOrder(@PathVariable Integer id, @PathVariable Integer workOrderID) {
		return projectService.removeWorkOrder(id, workOrderID);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping("/{id}/draft-workorders")
	public Project createDraftWorkOrderForTeam(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
		Integer workOrderID = optionalInteger(request.get("workOrderID"));
		Integer companyID = optionalInteger(request.get("companyID"));
		String comment = request.get("comment") == null ? null : request.get("comment").toString();
		if (workOrderID != null) {
			return projectService.createDraftWorkOrderFromExisting(id, workOrderID, comment);
		}
		Integer teamID = optionalInteger(request.get("teamID"));
		if (teamID == null) {
			return projectService.createDraftWorkOrder(id, companyID, comment);
		}
		return projectService.createDraftWorkOrderForTeam(id, teamID, companyID, comment);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{id}/draft-workorders/{draftWorkOrderID}")
	public Project removeDraftWorkOrder(@PathVariable Integer id, @PathVariable Integer draftWorkOrderID) {
		return projectService.removeDraftWorkOrder(id, draftWorkOrderID);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}/draft-workorders/{draftWorkOrderID}")
	public Project updateDraftWorkOrder(
			@PathVariable Integer id,
			@PathVariable Integer draftWorkOrderID,
			@RequestBody Map<String, Object> request) {
		Integer companyID = optionalInteger(request.get("companyID"));
		Integer teamID = optionalInteger(request.get("teamID"));
		String comment = request.get("comment") == null ? null : request.get("comment").toString();
		return projectService.updateDraftWorkOrder(id, draftWorkOrderID, companyID, comment, teamID, request.containsKey("teamID"));
	}

	@PostMapping("/{id}/comments")
	public Project addComment(@PathVariable Integer id, @RequestBody ProjectComments comment) {
		Integer authorWorkerID = comment.getAuthor() == null ? null : comment.getAuthor().getWorkerID();
		return projectService.addComment(id, comment, authorWorkerID);
	}

	@PostMapping("/{id}/action-items")
	public Project addActionItem(@PathVariable Integer id, @RequestBody ProjectActionItem actionItem) {
		return projectService.addActionItem(id, actionItem);
	}

	@PutMapping("/{id}/action-items/{actionItemID}")
	public Project updateActionItem(
			@PathVariable Integer id,
			@PathVariable Integer actionItemID,
			@RequestBody ProjectActionItem actionItem) {
		return projectService.updateActionItem(id, actionItemID, actionItem);
	}

	@PutMapping("/{id}/action-items/{actionItemID}/complete")
	public Project completeActionItem(
			@PathVariable Integer id,
			@PathVariable Integer actionItemID,
			@RequestBody Map<String, Boolean> request) {
		return projectService.setActionItemCompleted(id, actionItemID, Boolean.TRUE.equals(request.get("completed")));
	}

	@DeleteMapping("/{id}/action-items/{actionItemID}")
	public Project removeActionItem(@PathVariable Integer id, @PathVariable Integer actionItemID) {
		return projectService.removeActionItem(id, actionItemID);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{id}/snapshots/{snapshotID}")
	public Project removeSnapshot(@PathVariable Integer id, @PathVariable Integer snapshotID) {
		return projectService.removeSnapshot(id, snapshotID);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> archiveProject(@PathVariable Integer id) {
		projectService.archiveById(id);
		return ResponseEntity.noContent().build();
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}/restore")
	public Project restoreProject(@PathVariable Integer id) {
		return projectService.restoreById(id);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{id}/permanent")
	public ResponseEntity<Void> deleteProjectPermanently(@PathVariable Integer id) {
		projectService.deletePermanentlyById(id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/count")
	public long getProjectCount() {
		return projectService.count();
	}

	private Integer requiredInteger(Object value, String message) {
		Integer result = optionalInteger(value);
		if (result == null) {
			throw new IllegalArgumentException(message);
		}
		return result;
	}

	private Integer optionalInteger(Object value) {
		if (value == null || value.toString().isBlank()) {
			return null;
		}
		if (value instanceof Number number) {
			return number.intValue();
		}
		return Integer.valueOf(value.toString());
	}

	private List<Integer> optionalIntegerList(Object value) {
		if (!(value instanceof List<?> list)) {
			return List.of();
		}
		return list.stream()
				.map(this::optionalInteger)
				.filter(item -> item != null)
				.toList();
	}
}
