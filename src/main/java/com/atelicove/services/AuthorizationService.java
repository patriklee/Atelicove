package com.atelicove.services;

import java.util.List;
import java.util.Objects;

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
        if (current.isAdmin() || Objects.equals(current.getWorkerID(), workerID)) {
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
        boolean assigned = canAccessWorkOrder(workOrder, current);
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
        boolean assigned = canAccessProject(project, current);
        if (!assigned) {
            throw new AccessDeniedException("Worker is not assigned to this project");
        }
        return current;
    }

    public List<WorkOrder> visibleWorkOrders(List<WorkOrder> workOrders, Authentication authentication) {
        Worker current = currentWorker(authentication);
        if (current.isAdmin()) {
            return workOrders;
        }
        return workOrders.stream()
                .filter(workOrder -> canAccessWorkOrder(workOrder, current))
                .toList();
    }

    public List<Project> visibleProjects(List<Project> projects, Authentication authentication) {
        Worker current = currentWorker(authentication);
        if (current.isAdmin()) {
            return projects;
        }
        return projects.stream()
                .filter(project -> canAccessProject(project, current))
                .toList();
    }

    private boolean canAccessWorkOrder(WorkOrder workOrder, Worker current) {
        return workOrder.getWorkers().stream()
                .anyMatch(worker -> Objects.equals(worker.getWorkerID(), current.getWorkerID()));
    }

    private boolean canAccessProject(Project project, Worker current) {
        boolean assignedThroughWorkOrder = project.getWorkOrders().stream()
                .anyMatch(workOrder -> canAccessWorkOrder(workOrder, current));
        boolean assignedThroughTeam = project.getTeams().stream()
                .flatMap(team -> team.getWorkers().stream())
                .anyMatch(worker -> Objects.equals(worker.getWorkerID(), current.getWorkerID()));
        return assignedThroughWorkOrder || assignedThroughTeam;
    }
}
