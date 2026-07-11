package com.atelicove.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.atelicove.entities.DraftProject;
import com.atelicove.services.DraftProjectService;

@RestController
@RequestMapping("/draft-projects")
public class DraftProjectController {

    private final DraftProjectService draftProjectService;

    public DraftProjectController(DraftProjectService draftProjectService) {
        this.draftProjectService = draftProjectService;
    }

    @GetMapping
    public List<DraftProject> getDraftProjects() {
        return draftProjectService.findActive();
    }

    @GetMapping("/archived")
    public List<DraftProject> getArchivedDraftProjects() {
        return draftProjectService.findArchived();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archive(@PathVariable Long id) {
        draftProjectService.archive(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/restore")
    public DraftProject restore(@PathVariable Long id) {
        return draftProjectService.restore(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> deletePermanently(@PathVariable Long id) {
        draftProjectService.deletePermanently(id);
        return ResponseEntity.noContent().build();
    }
}
