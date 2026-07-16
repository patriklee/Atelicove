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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.atelicove.dto.DraftProjectDTO;
import com.atelicove.dto.DraftProjectDTO.DraftWorkOrderDTO;
import com.atelicove.dto.DraftProjectDTO.PlannedStaffingDTO;
import com.atelicove.dto.DraftProjectRequest;
import com.atelicove.dto.DraftWorkOrderRequest;
import com.atelicove.dto.PlannedStaffingRequest;
import com.atelicove.entities.Project;
import com.atelicove.services.DraftProjectLaunchService;
import com.atelicove.services.DraftProjectService;
import com.atelicove.services.DraftWorkOrderService;
import com.atelicove.services.PlannedStaffingService;

@RestController
@RequestMapping("/draft-projects")
@PreAuthorize("hasRole('ADMIN')")
public class DraftProjectController {

    private final DraftProjectService draftProjectService;
    private final DraftWorkOrderService draftWorkOrderService;
    private final PlannedStaffingService plannedStaffingService;
    private final DraftProjectLaunchService draftProjectLaunchService;

    public DraftProjectController(
            DraftProjectService draftProjectService,
            DraftWorkOrderService draftWorkOrderService,
            PlannedStaffingService plannedStaffingService,
            DraftProjectLaunchService draftProjectLaunchService) {
        this.draftProjectService = draftProjectService;
        this.draftWorkOrderService = draftWorkOrderService;
        this.plannedStaffingService = plannedStaffingService;
        this.draftProjectLaunchService = draftProjectLaunchService;
    }

    @GetMapping
    public List<DraftProjectDTO> getDraftProjects() {
        return draftProjectService.findActive().stream().map(DraftProjectDTO::from).toList();
    }

    @GetMapping("/archived")
    public List<DraftProjectDTO> getArchivedDraftProjects() {
        return draftProjectService.findArchived().stream().map(DraftProjectDTO::from).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DraftProjectDTO> getDraftProject(@PathVariable Long id) {
        return draftProjectService.findById(id)
                .map(DraftProjectDTO::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public DraftProjectDTO createDraftProject(@RequestBody DraftProjectRequest request) {
        return DraftProjectDTO.from(draftProjectService.create(request));
    }

    @PutMapping("/{id}")
    public DraftProjectDTO updateDraftProject(
            @PathVariable Long id,
            @RequestBody DraftProjectRequest request) {
        return DraftProjectDTO.from(draftProjectService.update(id, request));
    }

    @GetMapping("/{id}/work-orders")
    public List<DraftWorkOrderDTO> getDraftWorkOrders(@PathVariable Long id) {
        return draftProjectService.findById(id)
                .map(DraftProjectDTO::from)
                .map(DraftProjectDTO::draftWorkOrders)
                .orElseThrow(() -> new IllegalArgumentException("Draft project not found"));
    }

    @PostMapping("/{id}/work-orders")
    public DraftProjectDTO createDraftWorkOrder(
            @PathVariable Long id,
            @RequestBody DraftWorkOrderRequest request) {
        return DraftProjectDTO.from(draftWorkOrderService.create(id, request));
    }

    @GetMapping("/{id}/work-orders/{draftWorkOrderID}")
    public ResponseEntity<DraftWorkOrderDTO> getDraftWorkOrder(
            @PathVariable Long id,
            @PathVariable Integer draftWorkOrderID) {
        return draftWorkOrderService.find(id, draftWorkOrderID)
                .map(DraftWorkOrderDTO::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/work-orders/{draftWorkOrderID}")
    public DraftProjectDTO updateDraftWorkOrder(
            @PathVariable Long id,
            @PathVariable Integer draftWorkOrderID,
            @RequestBody DraftWorkOrderRequest request) {
        return DraftProjectDTO.from(
                draftWorkOrderService.update(id, draftWorkOrderID, request));
    }

    @DeleteMapping("/{id}/work-orders/{draftWorkOrderID}")
    public DraftProjectDTO deleteDraftWorkOrder(
            @PathVariable Long id,
            @PathVariable Integer draftWorkOrderID) {
        return DraftProjectDTO.from(
                draftWorkOrderService.delete(id, draftWorkOrderID));
    }

    @GetMapping("/{id}/planned-staffing")
    public List<PlannedStaffingDTO> getPlannedStaffing(@PathVariable Long id) {
        return draftProjectService.findById(id)
                .map(DraftProjectDTO::from)
                .map(DraftProjectDTO::plannedStaffing)
                .orElseThrow(() -> new IllegalArgumentException("Draft project not found"));
    }

    @PostMapping("/{id}/planned-staffing")
    public DraftProjectDTO createPlannedStaffing(
            @PathVariable Long id,
            @RequestBody PlannedStaffingRequest request) {
        return DraftProjectDTO.from(plannedStaffingService.create(id, request));
    }

    @GetMapping("/{id}/planned-staffing/{plannedStaffingID}")
    public ResponseEntity<PlannedStaffingDTO> getPlannedStaffing(
            @PathVariable Long id,
            @PathVariable Integer plannedStaffingID) {
        return plannedStaffingService.find(id, plannedStaffingID)
                .map(PlannedStaffingDTO::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/planned-staffing/{plannedStaffingID}")
    public DraftProjectDTO updatePlannedStaffing(
            @PathVariable Long id,
            @PathVariable Integer plannedStaffingID,
            @RequestBody PlannedStaffingRequest request) {
        return DraftProjectDTO.from(
                plannedStaffingService.update(id, plannedStaffingID, request));
    }

    @DeleteMapping("/{id}/planned-staffing/{plannedStaffingID}")
    public DraftProjectDTO deletePlannedStaffing(
            @PathVariable Long id,
            @PathVariable Integer plannedStaffingID) {
        return DraftProjectDTO.from(
                plannedStaffingService.delete(id, plannedStaffingID));
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
    public DraftProjectDTO restore(@PathVariable Long id) {
        return DraftProjectDTO.from(draftProjectService.restore(id));
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> deletePermanently(@PathVariable Long id) {
        draftProjectService.deletePermanently(id);
        return ResponseEntity.noContent().build();
    }
}
