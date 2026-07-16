package com.atelicove.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import com.atelicove.services.AuthorizationService;
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
	private final AuthorizationService authorizationService;

	public ProjectController(ProjectService projectService, AuthorizationService authorizationService) {
		this.projectService = projectService;
		this.authorizationService = authorizationService;
	}

	@GetMapping
	public List<Project> getAllProjects(Authentication authentication) {
		return authorizationService.visibleProjects(projectService.findActive(), authentication);
	}

	@GetMapping("/all-with-archived")
	public List<Project> getAllProjectsIncludingArchived(Authentication authentication) {
		return authorizationService.visibleProjects(projectService.findAll(), authentication);
	}

	@GetMapping("/archived")
	public List<Project> getArchivedProjects(Authentication authentication) {
		return authorizationService.visibleProjects(projectService.findArchived(), authentication);
	}

	@GetMapping("/{id}")
	public ResponseEntity<Project> getProjectById(@PathVariable Integer id, Authentication authentication) {
		authorizationService.requireProjectAccess(id, authentication);
		return projectService.findById(id)
				.map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.notFound().build());
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
	@PutMapping("/{id}/complete")
	public Project completeProject(@PathVariable Integer id) {
		return projectService.completeProject(id);
	}

	@PutMapping("/{id}/submit")
	public Project submitForReview(@PathVariable Integer id, Authentication authentication) {
		authorizationService.requireProjectAccess(id, authentication);
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

	@PostMapping("/{id}/comments")
	public Project addComment(@PathVariable Integer id, @RequestBody ProjectComments comment, Authentication authentication) {
		var currentWorker = authorizationService.requireProjectAccess(id, authentication);
		return projectService.addComment(id, comment, currentWorker.getWorkerID());
	}

	@PostMapping("/{id}/action-items")
	public Project addActionItem(@PathVariable Integer id, @RequestBody ProjectActionItem actionItem, Authentication authentication) {
		authorizationService.requireProjectAccess(id, authentication);
		return projectService.addActionItem(id, actionItem);
	}

	@PutMapping("/{id}/action-items/{actionItemID}")
	public Project updateActionItem(
			@PathVariable Integer id,
			@PathVariable Integer actionItemID,
			@RequestBody ProjectActionItem actionItem, Authentication authentication) {
		authorizationService.requireProjectAccess(id, authentication);
		return projectService.updateActionItem(id, actionItemID, actionItem);
	}

	@PutMapping("/{id}/action-items/{actionItemID}/complete")
	public Project completeActionItem(
			@PathVariable Integer id,
			@PathVariable Integer actionItemID,
			@RequestBody Map<String, Boolean> request, Authentication authentication) {
		authorizationService.requireProjectAccess(id, authentication);
		return projectService.setActionItemCompleted(id, actionItemID, Boolean.TRUE.equals(request.get("completed")));
	}

	@DeleteMapping("/{id}/action-items/{actionItemID}")
	public Project removeActionItem(@PathVariable Integer id, @PathVariable Integer actionItemID, Authentication authentication) {
		authorizationService.requireProjectAccess(id, authentication);
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

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping("/count")
	public long getProjectCount() {
		return projectService.count();
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
}
