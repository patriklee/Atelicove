package com.atelicove.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;

import com.atelicove.dto.PasswordResetRequest;
import com.atelicove.entities.Worker;
import com.atelicove.services.WorkerService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/workers")
public class WorkerController {

    private final WorkerService workerService;

    public WorkerController(WorkerService WorkerService) {
        this.workerService = WorkerService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<Worker> getAllWorkers() {
        return workerService.findActive();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all-with-archived")
    public List<Worker> getAllWorkersIncludingArchived() {
        return workerService.findAll();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/archived")
    public List<Worker> getArchivedWorkers() {
        return workerService.findArchived();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Worker> getWorkerById(@PathVariable Integer id) {
    	
    	Optional<Worker> worker = workerService.findById(id);
    	
    	if(worker.isPresent()) {
    		return ResponseEntity.ok(worker.get());
    	}
    	
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<Worker> getWorkerByUsername(@PathVariable String username) {
    	
        Optional<Worker> worker = workerService.findByUsername(username);

        if (worker.isPresent()) {
            return ResponseEntity.ok(worker.get());
        }
        
        return ResponseEntity.notFound().build();
     }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public Worker addWorker(@RequestBody Worker worker) {
        return workerService.createWorker(worker);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Worker updateWorker(@PathVariable Integer id, @RequestBody Worker worker) {
    	return workerService.updateWorker(id, worker);
    }

    @PutMapping("/{id}/profile")
    public Worker updateProfile(@PathVariable Integer id, @RequestBody Worker worker, Authentication authentication) {
        Optional<Worker> currentWorker = workerService.findByUsername(authentication.getName());
        boolean isOwnProfile = currentWorker.isPresent() && currentWorker.get().getWorkerID() == id;
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));

        if (!isOwnProfile && !isAdmin) {
            throw new IllegalStateException("Only your own profile can be updated");
        }

    	return workerService.updateProfile(id, worker);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archiveWorker(@PathVariable Integer id) {
    	workerService.archiveById(id);
    	return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/restore")
    public Worker restoreWorker(@PathVariable Integer id) {
    	return workerService.restoreById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> deleteWorkerPermanently(@PathVariable Integer id) {
    	workerService.deletePermanentlyById(id);
    	return ResponseEntity.noContent().build();
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/password")
    public ResponseEntity<Void> resetPassword(@PathVariable Integer id, @RequestBody PasswordResetRequest request){
    	workerService.resetPassword(id,  request.getNewPassword());
    	return ResponseEntity.noContent().build();
    }
}
