package com.atelicove.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import com.atelicove.entities.Project;
import com.atelicove.entities.Team;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Worker;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class AuthorizationServiceTest {

    @Mock private WorkerRepository workerRepository;
    @Mock private WorkOrderRepository workOrderRepository;
    @Mock private ProjectRepository projectRepository;
    @InjectMocks private AuthorizationService authorizationService;

    private final Authentication authentication =
            UsernamePasswordAuthenticationToken.authenticated("worker", "n/a", java.util.List.of());

    @Test
    void unrelatedWorkerIsDeniedButAssignedWorkerIsAllowed() {
        Worker worker = worker(1, false);
        WorkOrder workOrder = new WorkOrder();
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("worker")).thenReturn(Optional.of(worker));
        when(workOrderRepository.findById(9)).thenReturn(Optional.of(workOrder));

        assertThatThrownBy(() -> authorizationService.requireWorkOrderAccess(9, authentication))
                .isInstanceOf(AccessDeniedException.class);

        workOrder.addWorker(worker);
        assertThat(authorizationService.requireWorkOrderAccess(9, authentication)).isSameAs(worker);
    }

    @Test
    void projectAssignmentFlowsThroughWorkOrderAndAdminBypassesAssignment() {
        Worker worker = worker(1, false);
        WorkOrder workOrder = new WorkOrder();
        workOrder.addWorker(worker);
        Project project = new Project();
        project.addWorkOrder(workOrder);
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("worker")).thenReturn(Optional.of(worker));
        when(projectRepository.findById(3)).thenReturn(Optional.of(project));

        assertThat(authorizationService.requireProjectAccess(3, authentication)).isSameAs(worker);

        Worker admin = worker(2, true);
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("worker")).thenReturn(Optional.of(admin));
        assertThat(authorizationService.requireProjectAccess(99, authentication)).isSameAs(admin);
    }

    @Test
    void visibilityKeepsOnlyAssignedWorkOrdersAndProjectsForWorkers() {
        Worker worker = worker(1, false);
        Worker other = worker(2, false);
        WorkOrder assignedOrder = new WorkOrder();
        assignedOrder.addWorker(worker);
        WorkOrder unrelatedOrder = new WorkOrder();
        unrelatedOrder.addWorker(other);

        Team assignedTeam = new Team();
        assignedTeam.setWorkers(Set.of(worker));
        Project teamProject = new Project();
        teamProject.setProjectID(3);
        teamProject.addTeam(assignedTeam);
        Project unrelatedProject = new Project();

        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("worker"))
                .thenReturn(Optional.of(worker));
        when(projectRepository.findById(3)).thenReturn(Optional.of(teamProject));

        assertThat(authorizationService.visibleWorkOrders(
                List.of(assignedOrder, unrelatedOrder), authentication))
                .containsExactly(assignedOrder);
        assertThat(authorizationService.visibleProjects(
                List.of(teamProject, unrelatedProject), authentication))
                .containsExactly(teamProject);
        assertThat(authorizationService.requireProjectAccess(3, authentication)).isSameAs(worker);
    }

    @Test
    void adminSeesAllRecords() {
        Worker admin = worker(1, true);
        List<WorkOrder> workOrders = List.of(new WorkOrder());
        List<Project> projects = List.of(new Project());
        when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse("worker"))
                .thenReturn(Optional.of(admin));

        assertThat(authorizationService.visibleWorkOrders(workOrders, authentication)).isSameAs(workOrders);
        assertThat(authorizationService.visibleProjects(projects, authentication)).isSameAs(projects);
    }

    private Worker worker(int id, boolean admin) {
        Worker worker = new Worker();
        worker.setWorkerID(id);
        worker.setAdmin(admin);
        return worker;
    }
}
