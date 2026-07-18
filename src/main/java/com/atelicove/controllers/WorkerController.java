package com.atelicove.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;

import com.atelicove.dto.PasswordResetRequest;
import com.atelicove.dto.CreateWorkerRequest;
import com.atelicove.dto.UpdateWorkerProfileRequest;
import com.atelicove.dto.UpdateWorkerRequest;
import com.atelicove.dto.WorkerProfileResponse;
import com.atelicove.dto.WorkerSummaryResponse;
import com.atelicove.entities.Worker;
import com.atelicove.mappers.WorkerMapper;
import com.atelicove.services.WorkerService;
import com.atelicove.services.AuthorizationService;

import java.util.List;
import java.util.Optional;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/workers")
public class WorkerController {

    private final WorkerService workerService;
    private final AuthorizationService authorizationService;
    private final WorkerMapper workerMapper;

    public WorkerController(WorkerService workerService, AuthorizationService authorizationService,
            WorkerMapper workerMapper) {
        this.workerService = workerService;
        this.authorizationService = authorizationService;
        this.workerMapper = workerMapper;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<WorkerSummaryResponse> getAllWorkers() {
        return workerService.findActive().stream().map(workerMapper::toSummaryResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all-with-archived")
    public List<WorkerSummaryResponse> getAllWorkersIncludingArchived() {
        return workerService.findAll().stream().map(workerMapper::toSummaryResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/archived")
    public List<WorkerSummaryResponse> getArchivedWorkers() {
        return workerService.findArchived().stream().map(workerMapper::toSummaryResponse).toList();
    }

    @GetMapping("/me")
    public WorkerProfileResponse getCurrentWorker(Authentication authentication) {
        return workerMapper.toProfileResponse(authorizationService.currentWorker(authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkerProfileResponse> getWorkerById(
            @PathVariable Integer id, Authentication authentication) {
        authorizationService.requireOwnWorkerOrAdmin(id, authentication);
    	
    	Optional<Worker> worker = workerService.findById(id);
    	
    	if(worker.isPresent()) {
            return ResponseEntity.ok(workerMapper.toProfileResponse(worker.get()));
    	}
    	
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<WorkerProfileResponse> getWorkerByUsername(
            @PathVariable String username, Authentication authentication) {
        authorizationService.requireOwnUsernameOrAdmin(username, authentication);
        Optional<Worker> worker = workerService.findByUsername(username);

        if (worker.isPresent()) {
            return ResponseEntity.ok(workerMapper.toProfileResponse(worker.get()));
        }
        
        return ResponseEntity.notFound().build();
     }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public WorkerProfileResponse addWorker(@Valid @RequestBody CreateWorkerRequest request) {
        return workerMapper.toProfileResponse(workerService.createWorker(workerMapper.toWorker(request)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public WorkerProfileResponse updateWorker(
            @PathVariable Integer id, @Valid @RequestBody UpdateWorkerRequest request) {
		return workerMapper.toProfileResponse(workerService.updateWorker(id, workerMapper.toWorker(request)));
    }

    /**
     * Allows workers to update their own profile while still allowing admins to
     * make the same profile-only update for any worker.
     *
     * @param id worker profile to update
     * @param worker profile fields to apply
     * @param authentication current logged-in user
     * @return the saved worker profile
     */
    @PutMapping("/{id}/profile")
    public WorkerProfileResponse updateProfile(@PathVariable Integer id,
            @Valid @RequestBody UpdateWorkerProfileRequest request, Authentication authentication) {
        authorizationService.requireOwnWorkerOrAdmin(id, authentication);
        return workerMapper.toProfileResponse(workerService.updateProfile(id, workerMapper.toWorker(request)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archiveWorker(@PathVariable Integer id) {
    	workerService.archiveById(id);
    	return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/restore")
    public WorkerProfileResponse restoreWorker(@PathVariable Integer id) {
		return workerMapper.toProfileResponse(workerService.restoreById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> deleteWorkerPermanently(@PathVariable Integer id) {
    	workerService.deletePermanentlyById(id);
    	return ResponseEntity.noContent().build();
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/password")
    public ResponseEntity<Void> resetPassword(
            @PathVariable Integer id, @Valid @RequestBody PasswordResetRequest request){
    	workerService.resetPassword(id,  request.getNewPassword());
    	return ResponseEntity.noContent().build();
    }
}
