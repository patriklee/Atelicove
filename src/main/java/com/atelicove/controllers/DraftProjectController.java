package com.atelicove.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.atelicove.entities.DraftProject;
import com.atelicove.entities.Project;
import com.atelicove.services.DraftProjectLaunchService;
import com.atelicove.services.DraftProjectService;

@RestController
@RequestMapping("/draft-projects")
@PreAuthorize("hasRole('ADMIN')")
public class DraftProjectController {

    private final DraftProjectService draftProjectService;
    private final DraftProjectLaunchService draftProjectLaunchService;

    public DraftProjectController(
            DraftProjectService draftProjectService,
            DraftProjectLaunchService draftProjectLaunchService) {
        this.draftProjectService = draftProjectService;
        this.draftProjectLaunchService = draftProjectLaunchService;
    }

    @GetMapping
    public List<DraftProject> getDraftProjects() {
        return draftProjectService.findActive();
    }

    @GetMapping("/archived")
    public List<DraftProject> getArchivedDraftProjects() {
        return draftProjectService.findArchived();
    }

    @PostMapping("/{id}/launch")
    public Project launch(@PathVariable Integer id) {
        return draftProjectLaunchService.launch(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archive(@PathVariable Long id) {
        draftProjectService.archive(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/restore")
    public DraftProject restore(@PathVariable Long id) {
        return draftProjectService.restore(id);
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> deletePermanently(@PathVariable Long id) {
        draftProjectService.deletePermanently(id);
        return ResponseEntity.noContent().build();
    }
}
