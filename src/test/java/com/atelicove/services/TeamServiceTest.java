package com.atelicove.services;

import static com.atelicove.support.TestFixtures.PROJECT_ID;
import static com.atelicove.support.TestFixtures.TEAM_ID;
import static com.atelicove.support.TestFixtures.WORKER_ID;
import static com.atelicove.support.TestFixtures.aProject;
import static com.atelicove.support.TestFixtures.aTeam;
import static com.atelicove.support.TestFixtures.aWorkOrder;
import static com.atelicove.support.TestFixtures.aWorker;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.dto.TeamDTO;
import com.atelicove.entities.Project;
import com.atelicove.entities.Team;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Worker;
import com.atelicove.enums.ProjectStatus;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.TeamRepository;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    private static final String TEAM_NAME = "Design";

    @Mock TeamRepository teamRepository;
    @Mock ProjectRepository projectRepository;
    @Mock WorkerRepository workerRepository;
    @InjectMocks TeamService service;

    @Nested
    class Queries {
        @Test
        void findMethods_ShouldReturnRepositoryAndProjectResults() {
            // Given
            Team team = aTeam().build();
            Project project = aProject().teams(team).build();
            when(teamRepository.findAll()).thenReturn(List.of(team));
            when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));

            // When / Then
            assertThat(service.findAll()).containsExactly(team);
            assertThat(service.findById(TEAM_ID)).contains(team);
            assertThat(service.findByProject(PROJECT_ID)).containsExactly(team);
        }

        @Test
        void findByProject_ShouldExplainMissingProject() {
            // Given
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.findByProject(PROJECT_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Project not found");
        }
    }

    @Nested
    class Creation {
        @Test
        void createTeam_ShouldResolveWorkersAndAttachProject_WhenRequestIsValid() {
            // Given
            Worker worker = aWorker().build();
            Project project = aProject().build();
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));
            when(workerRepository.findAllById(Set.of(WORKER_ID))).thenReturn(List.of(worker));
            when(teamRepository.save(any(Team.class))).thenAnswer(call -> call.getArgument(0));

            // When
            Team created = service.createTeam(dto(TEAM_NAME, PROJECT_ID, Set.of(WORKER_ID)));

            // Then
            assertThat(created.getTeamName()).isEqualTo(TEAM_NAME);
            assertThat(created.getWorkers()).containsExactly(worker);
            assertThat(project.getTeams()).containsExactly(created);
            verify(teamRepository).save(created);
        }

        @ParameterizedTest
        @NullAndEmptySource
        void createTeam_ShouldRequireAtLeastOneWorker(Set<Integer> workerIDs) {
            // Given
            TeamDTO request = dto(TEAM_NAME, null, workerIDs);

            // When / Then
            assertThatThrownBy(() -> service.createTeam(request))
                    .isInstanceOf(IllegalStateException.class).hasMessage("A team must have at least one worker");
            verify(teamRepository, never()).save(any());
        }

        @Test
        void createTeam_ShouldRejectMissingDetailsUnknownWorkersAndProtectedProjects() {
            // Given
            when(workerRepository.findAllById(Set.of(WORKER_ID))).thenReturn(List.of());

            // When / Then
            assertThatThrownBy(() -> service.createTeam(null))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Team details are required");
            assertThatThrownBy(() -> service.createTeam(dto(TEAM_NAME, null, Set.of(WORKER_ID))))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("One or more workers were not found");

            // Given
            Project completed = aProject().status(ProjectStatus.COMPLETE).build();
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(completed));

            // When / Then
            assertThatThrownBy(() -> service.createTeam(dto(TEAM_NAME, PROJECT_ID, Set.of(WORKER_ID))))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Teams cannot be changed on archived or completed projects");
        }
    }

    @Nested
    class UpdatesAndDeletion {
        @Test
        void updateTeam_ShouldSynchronizeActiveWorkOrderAssignments() {
            // Given
            Worker removed = aWorker().id(WORKER_ID).build();
            Worker added = aWorker().id(WORKER_ID + 1).username("added").email("added@test.com").build();
            Team team = aTeam().workers(removed).build();
            WorkOrder order = aWorkOrder().status(WorkOrderStatus.ACTIVE).assignedTo(removed).build();
            Project project = aProject().teams(team).workOrders(order).build();
            when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));
            when(projectRepository.findAll()).thenReturn(List.of(project));
            when(workerRepository.findAllById(Set.of(WORKER_ID + 1))).thenReturn(List.of(added));
            when(teamRepository.save(team)).thenReturn(team);

            // When
            Team result = service.updateTeam(TEAM_ID, dto("Updated", null, Set.of(WORKER_ID + 1)));

            // Then
            assertThat(result.getWorkers()).containsExactly(added);
            assertThat(order.getWorkers()).containsExactly(added);
            assertThat(order.getStatus()).isEqualTo(WorkOrderStatus.ACTIVE);
            verify(projectRepository).save(project);
        }

        @Test
        void deleteTeam_ShouldDetachTeamAndUnassignedWorkersFromOpenOrders() {
            // Given
            Worker worker = aWorker().build();
            Team team = aTeam().workers(worker).build();
            WorkOrder order = aWorkOrder().status(WorkOrderStatus.ACTIVE).assignedTo(worker).build();
            Project project = aProject().teams(team).workOrders(order).build();
            when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));
            when(projectRepository.findAll()).thenReturn(List.of(project));

            // When
            service.deleteTeam(TEAM_ID);

            // Then
            assertThat(project.getTeams()).doesNotContain(team);
            assertThat(order.getWorkers()).isEmpty();
            assertThat(order.getStatus()).isEqualTo(WorkOrderStatus.OPEN);
            verify(projectRepository).save(project);
            verify(teamRepository).delete(team);
        }

        @Test
        void updateAndDelete_ShouldProtectTeamsUsedByCompletedProjects() {
            // Given
            Team team = aTeam().build();
            Project completed = aProject().status(ProjectStatus.COMPLETE).teams(team).build();
            when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));
            when(projectRepository.findAll()).thenReturn(List.of(completed));

            // When / Then
            assertThatThrownBy(() -> service.updateTeam(TEAM_ID, dto(TEAM_NAME, null, Set.of(WORKER_ID))))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Teams used by archived or completed projects cannot be changed");
            assertThatThrownBy(() -> service.deleteTeam(TEAM_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Teams used by archived or completed projects cannot be changed");
            verify(teamRepository, never()).delete(team);
        }

        @Test
        void updateAndDelete_ShouldExplainMissingTeam() {
            // Given
            when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.updateTeam(TEAM_ID, dto(TEAM_NAME, null, Set.of(WORKER_ID))))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Team not found");
            assertThatThrownBy(() -> service.deleteTeam(TEAM_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Team not found");
        }
    }

    private TeamDTO dto(String name, Integer projectID, Set<Integer> workerIDs) {
        TeamDTO dto = new TeamDTO();
        dto.setTeamName(name);
        dto.setProjectID(projectID);
        dto.setWorkerIDs(workerIDs);
        return dto;
    }
}
