package com.atelicove.services;

import static com.atelicove.support.TestFixtures.PROJECT_ID;
import static com.atelicove.support.TestFixtures.USERNAME;
import static com.atelicove.support.TestFixtures.WORKER_ID;
import static com.atelicove.support.TestFixtures.WORK_ORDER_ID;
import static com.atelicove.support.TestFixtures.aProject;
import static com.atelicove.support.TestFixtures.aTeam;
import static com.atelicove.support.TestFixtures.aWorkOrder;
import static com.atelicove.support.TestFixtures.aWorker;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
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

    private static final int OTHER_WORKER_ID = 999;

    @Mock private WorkerRepository workerRepository;
    @Mock private WorkOrderRepository workOrderRepository;
    @Mock private ProjectRepository projectRepository;
    @InjectMocks private AuthorizationService service;

    private final Authentication authentication = new TestingAuthenticationToken(USERNAME, "n/a", "ROLE_WORKER");

    @Nested
    class CurrentWorker {

        @Test
        void currentWorker_ShouldReturnActiveWorker_WhenAuthenticationIsValid() {
            // Given
            Worker worker = aWorker().build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(worker));

            // When
            Worker result = service.currentWorker(authentication);

            // Then
            assertThat(result).isSameAs(worker);
        }

        @Test
        void currentWorker_ShouldRejectMissingOrUnauthenticatedPrincipal() {
            // Given
            Authentication unauthenticated = new TestingAuthenticationToken(USERNAME, "n/a");
            unauthenticated.setAuthenticated(false);

            // When / Then
            assertThatThrownBy(() -> service.currentWorker(null))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessage("Authentication is required");
            assertThatThrownBy(() -> service.currentWorker(unauthenticated))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessage("Authentication is required");
            verify(workerRepository, never()).findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME);
        }

        @Test
        void currentWorker_ShouldRejectAuthentication_WhenActiveWorkerCannotBeFound() {
            // Given
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.currentWorker(authentication))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessage("Authenticated worker was not found");
        }
    }

    @Nested
    class OwnWorkerAccess {

        @Test
        void requireOwnWorkerOrAdmin_ShouldAllowOwnerAndAdministrator() {
            // Given
            Worker owner = aWorker().build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(owner));

            // When / Then
            assertThat(service.requireOwnWorkerOrAdmin(WORKER_ID, authentication)).isSameAs(owner);

            // Given
            Worker admin = aWorker().asAdmin().build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(admin));

            // When / Then
            assertThat(service.requireOwnWorkerOrAdmin(OTHER_WORKER_ID, authentication)).isSameAs(admin);
        }

        @Test
        void requireOwnWorkerOrAdmin_ShouldRejectUnrelatedWorker() {
            // Given
            Worker worker = aWorker().build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(worker));

            // When / Then
            assertThatThrownBy(() -> service.requireOwnWorkerOrAdmin(OTHER_WORKER_ID, authentication))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessage("Only your own worker account can be accessed");
        }

        @Test
        void requireOwnUsernameOrAdmin_ShouldAllowOwnerAndAdministrator() {
            Worker owner = aWorker().build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(owner));

            assertThat(service.requireOwnUsernameOrAdmin(USERNAME.toUpperCase(), authentication))
                    .isSameAs(owner);

            Worker admin = aWorker().asAdmin().build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(admin));

            assertThat(service.requireOwnUsernameOrAdmin("another.worker", authentication))
                    .isSameAs(admin);
        }

        @Test
        void requireOwnUsernameOrAdmin_ShouldRejectUnrelatedWorker() {
            Worker worker = aWorker().build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(worker));

            assertThatThrownBy(() -> service.requireOwnUsernameOrAdmin("another.worker", authentication))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessage("Only your own worker account can be accessed");
        }
    }

    @Nested
    class WorkOrderAccess {

        @Test
        void requireWorkOrderAccess_ShouldAllowAssignedWorkerAndAdmin() {
            // Given
            Worker assigned = aWorker().build();
            WorkOrder order = aWorkOrder().assignedTo(assigned).build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(assigned));
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));

            // When / Then
            assertThat(service.requireWorkOrderAccess(WORK_ORDER_ID, authentication)).isSameAs(assigned);

            // Given
            Worker admin = aWorker().asAdmin().build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(admin));

            // When / Then
            assertThat(service.requireWorkOrderAccess(999, authentication)).isSameAs(admin);
            verify(workOrderRepository, never()).findById(999);
        }

        @Test
        void requireWorkOrderAccess_ShouldDistinguishMissingOrderFromUnassignedWorker() {
            // Given
            Worker worker = aWorker().build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(worker));
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.requireWorkOrderAccess(WORK_ORDER_ID, authentication))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Work order not found");

            // Given
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(aWorkOrder().build()));

            // When / Then
            assertThatThrownBy(() -> service.requireWorkOrderAccess(WORK_ORDER_ID, authentication))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessage("Worker is not assigned to this work order");
        }
    }

    @Nested
    class ProjectAccess {

        @Test
        void requireProjectAccess_ShouldAllowAssignmentThroughWorkOrderOrTeam() {
            // Given
            Worker worker = aWorker().build();
            Project throughOrder = aProject().build();
            throughOrder.addWorkOrder(aWorkOrder().assignedTo(worker).build());
            Team team = aTeam().withWorker(worker).build();
            Project throughTeam = aProject().withId(PROJECT_ID + 1).build();
            throughTeam.addTeam(team);
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(worker));
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(throughOrder));
            when(projectRepository.findById(PROJECT_ID + 1)).thenReturn(Optional.of(throughTeam));

            // When / Then
            assertThat(service.requireProjectAccess(PROJECT_ID, authentication)).isSameAs(worker);
            assertThat(service.requireProjectAccess(PROJECT_ID + 1, authentication)).isSameAs(worker);
        }

        @Test
        void requireProjectAccess_ShouldDistinguishMissingProjectFromUnassignedWorker() {
            // Given
            Worker worker = aWorker().build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(worker));
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.requireProjectAccess(PROJECT_ID, authentication))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Project not found");

            // Given
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(aProject().build()));

            // When / Then
            assertThatThrownBy(() -> service.requireProjectAccess(PROJECT_ID, authentication))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessage("Worker is not assigned to this project");
        }
    }

    @Nested
    class Visibility {

        @Test
        void workOrderLists_ShouldUseGlobalQueriesForAdminAndAssignedQueriesForWorker() {
            Worker worker = aWorker().build();
            WorkOrder assignedOrder = aWorkOrder().assignedTo(worker).build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(worker));
            when(workOrderRepository.findDistinctByWorkers_WorkerIDAndArchivedFalse(WORKER_ID))
                    .thenReturn(List.of(assignedOrder));

            assertThat(service.visibleActiveWorkOrders(authentication)).containsExactly(assignedOrder);
            verify(workOrderRepository, never()).findByArchivedFalse();

            Worker admin = aWorker().asAdmin().build();
            WorkOrder unrelatedOrder = aWorkOrder().withId(999).build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(admin));
            when(workOrderRepository.findByArchivedFalse())
                    .thenReturn(List.of(assignedOrder, unrelatedOrder));

            assertThat(service.visibleActiveWorkOrders(authentication))
                    .containsExactly(assignedOrder, unrelatedOrder);
        }

        @Test
        void projectVisibility_ShouldFilterRecordsForWorker_ButReturnOriginalListForAdmin() {
            // Given
            Worker worker = aWorker().build();
            WorkOrder assignedOrder = aWorkOrder().assignedTo(worker).build();
            Project assignedProject = aProject().build();
            assignedProject.addWorkOrder(assignedOrder);
            Project unrelatedProject = aProject().withId(999).build();
            List<Project> projects = List.of(assignedProject, unrelatedProject);
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(worker));

            // When / Then
            assertThat(service.visibleProjects(projects, authentication)).containsExactly(assignedProject);

            // Given
            Worker admin = aWorker().asAdmin().build();
            when(workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(USERNAME))
                    .thenReturn(Optional.of(admin));

            // When / Then
            assertThat(service.visibleProjects(projects, authentication)).isSameAs(projects);
        }
    }
}
