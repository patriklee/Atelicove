package com.atelicove.services;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.atelicove.entities.Project;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Worker;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

@Service
public class AuthorizationService {

    private final WorkerRepository workerRepository;
    private final WorkOrderRepository workOrderRepository;
    private final ProjectRepository projectRepository;

    public AuthorizationService(WorkerRepository workerRepository,
            WorkOrderRepository workOrderRepository, ProjectRepository projectRepository) {
        this.workerRepository = workerRepository;
        this.workOrderRepository = workOrderRepository;
        this.projectRepository = projectRepository;
    }

    public Worker currentWorker(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication is required");
        }
        return workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Authenticated worker was not found"));
    }

    public Worker requireOwnWorkerOrAdmin(Integer workerID, Authentication authentication) {
        Worker current = currentWorker(authentication);
        if (current.isAdmin() || current.getWorkerID() == workerID) {
            return current;
        }
        throw new AccessDeniedException("Only your own worker account can be accessed");
    }

    public Worker requireWorkOrderAccess(Integer workOrderID, Authentication authentication) {
        Worker current = currentWorker(authentication);
        if (current.isAdmin()) {
            return current;
        }
        WorkOrder workOrder = workOrderRepository.findById(workOrderID)
                .orElseThrow(() -> new IllegalArgumentException("Work order not found"));
        boolean assigned = workOrder.getWorkers().stream()
                .anyMatch(worker -> worker.getWorkerID() == current.getWorkerID());
        if (!assigned) {
            throw new AccessDeniedException("Worker is not assigned to this work order");
        }
        return current;
    }

    public Worker requireProjectAccess(Integer projectID, Authentication authentication) {
        Worker current = currentWorker(authentication);
        if (current.isAdmin()) {
            return current;
        }
        Project project = projectRepository.findById(projectID)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        boolean assigned = project.getWorkOrders().stream()
                .flatMap(workOrder -> workOrder.getWorkers().stream())
                .anyMatch(worker -> worker.getWorkerID() == current.getWorkerID());
        if (!assigned) {
            throw new AccessDeniedException("Worker is not assigned to this project");
        }
        return current;
    }
}
