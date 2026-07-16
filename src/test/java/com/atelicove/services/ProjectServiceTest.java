package com.atelicove.services;

import static com.atelicove.support.TestFixtures.COMPANY_ID;
import static com.atelicove.support.TestFixtures.PROJECT_ID;
import static com.atelicove.support.TestFixtures.TEAM_ID;
import static com.atelicove.support.TestFixtures.WORKER_ID;
import static com.atelicove.support.TestFixtures.WORK_ORDER_ID;
import static com.atelicove.support.TestFixtures.aCompany;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.dto.ProjectDTO;
import com.atelicove.entities.Company;
import com.atelicove.entities.Project;
import com.atelicove.entities.ProjectActionItem;
import com.atelicove.entities.ProjectComments;
import com.atelicove.entities.ProjectSnapshot;
import com.atelicove.entities.Team;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Worker;
import com.atelicove.enums.CommentType;
import com.atelicove.enums.ProjectStatus;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.TeamRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    private static final int ACTION_ITEM_ID = 91;
    private static final int SNAPSHOT_ID = 92;

    @Mock private ProjectRepository projectRepository;
    @Mock private WorkOrderRepository workOrderRepository;
    @Mock private WorkerRepository workerRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private CompanyRepository companyRepository;
    @InjectMocks private ProjectService service;

    @Nested
    class Queries {

        @Test
        void queryMethods_ShouldReturnExactRepositoryResults() {
            // Given
            Project project = aProject().build();
            List<Project> projects = List.of(project);
            when(projectRepository.findByArchivedFalse()).thenReturn(projects);
            when(projectRepository.findAll()).thenReturn(projects);
            when(projectRepository.findByArchivedTrue()).thenReturn(projects);
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));
            when(projectRepository.countByArchivedFalse()).thenReturn(3L);

            // When / Then
            assertThat(service.findActive()).isSameAs(projects);
            assertThat(service.findAll()).isSameAs(projects);
            assertThat(service.findArchived()).isSameAs(projects);
            assertThat(service.findById(PROJECT_ID)).containsSame(project);
            assertThat(service.count()).isEqualTo(3L);
        }
    }

    @Nested
    class CreationAndUpdate {

        @Test
        void createProject_ShouldResetServerOwnedFieldsAndDefaultStatus() {
            // Given
            Project project = aProject().withId(999).build();
            project.setProjectStatus(null);
            project.setArchived(true);
            when(projectRepository.save(project)).thenReturn(project);

            // When
            Project result = service.createProject(project);

            // Then
            assertThat(result).isSameAs(project);
            assertThat(project.getProjectID()).isZero();
            assertThat(project.getProjectStatus()).isEqualTo(ProjectStatus.OPEN);
            assertThat(project.isArchived()).isFalse();
            assertThat(project.getArchivedAt()).isNull();
            assertThat(project.getCompletedAt()).isNull();
        }

        @Test
        void createAndUpdateFromDto_ShouldResolveRelationshipsAndSynchronizeWorkers() {
            // Given
            Worker worker = aWorker().build();
            Team team = aTeam().withWorker(worker).build();
            WorkOrder order = aWorkOrder().build();
            ProjectDTO request = dto("  Campaign  ", List.of(WORK_ORDER_ID), List.of(TEAM_ID));
            when(workOrderRepository.findAllById(List.of(WORK_ORDER_ID))).thenReturn(List.of(order));
            when(teamRepository.findAllById(List.of(TEAM_ID))).thenReturn(List.of(team));
            when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            Project created = service.createProject(request);

            // Then
            assertThat(created.getProjectName()).isEqualTo("Campaign");
            assertThat(created.getWorkOrders()).containsExactly(order);
            assertThat(created.getTeams()).containsExactly(team);
            assertThat(order.getWorkers()).containsExactly(worker);
            assertThat(order.getStatus()).isEqualTo(WorkOrderStatus.ACTIVE);

            // Given
            ProjectDTO update = dto("Updated", null, null);
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(created));

            // When
            Project result = service.updateProject(PROJECT_ID, update);

            // Then
            assertThat(result.getProjectName()).isEqualTo("Updated");
        }

        @ParameterizedTest
        @NullAndEmptySource
        void createProject_ShouldRejectMissingName(String name) {
            // Given
            Project project = aProject().named(name).build();

            // When / Then
            assertThatThrownBy(() -> service.createProject(project))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Project name is required");
            verify(projectRepository, never()).save(project);
        }

        @Test
        void createProject_ShouldRejectNegativeBudgetAndIncompleteRelationshipIds() {
            // Given / When / Then
            Project project = aProject().build();
            project.setBudget(BigDecimal.valueOf(-1));
            assertThatThrownBy(() -> service.createProject(project))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Project budget cannot be negative");

            // Given / When / Then
            ProjectDTO missingOrder = dto("Project", List.of(WORK_ORDER_ID), null);
            when(workOrderRepository.findAllById(List.of(WORK_ORDER_ID))).thenReturn(List.of());
            assertThatThrownBy(() -> service.createProject(missingOrder))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("One or more work orders were not found");

            // Given / When / Then
            ProjectDTO missingTeam = dto("Project", null, List.of(TEAM_ID));
            when(teamRepository.findAllById(List.of(TEAM_ID))).thenReturn(List.of());
            assertThatThrownBy(() -> service.createProject(missingTeam))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("One or more teams were not found");
        }

        @Test
        void updateProject_ShouldRejectUnknownArchivedReviewOrCompletedProject() {
            // Given
            ProjectDTO request = dto("Updated", null, null);
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.updateProject(PROJECT_ID, request))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Project not found");

            for (Project blocked : List.of(
                    aProject().archived().build(),
                    aProject().withStatus(ProjectStatus.IN_REVIEW).build(),
                    aProject().withStatus(ProjectStatus.COMPLETE).build())) {
                when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(blocked));
                assertThatThrownBy(() -> service.updateProject(PROJECT_ID, request))
                        .isInstanceOf(IllegalStateException.class);
            }
        }
    }

    @Nested
    class Lifecycle {

        @Test
        void projectLifecycle_ShouldMoveOpenToReviewToComplete() {
            // Given
            Project project = projectWithCompletedOrder(ProjectStatus.OPEN);
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));
            when(projectRepository.save(project)).thenReturn(project);

            // When
            Project inReview = service.submitForReview(PROJECT_ID);

            // Then
            assertThat(inReview.getProjectStatus()).isEqualTo(ProjectStatus.IN_REVIEW);

            // When
            Project completed = service.completeProject(PROJECT_ID);

            // Then
            assertThat(completed.getProjectStatus()).isEqualTo(ProjectStatus.COMPLETE);
            assertThat(completed.getCompletedAt()).isNotNull();
        }

        @Test
        void rejectProject_ShouldReturnReviewProjectToOpen() {
            // Given
            Project project = aProject().withStatus(ProjectStatus.IN_REVIEW).build();
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));
            when(projectRepository.save(project)).thenReturn(project);

            // When
            Project result = service.rejectProject(PROJECT_ID);

            // Then
            assertThat(result.getProjectStatus()).isEqualTo(ProjectStatus.OPEN);
        }

        @Test
        void submitAndComplete_ShouldEnforceStatusAndCompletedOrders() {
            // Given
            Project active = aProject().build();
            active.addWorkOrder(aWorkOrder().withStatus(WorkOrderStatus.ACTIVE).build());
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(active));

            // When / Then
            assertThatThrownBy(() -> service.submitForReview(PROJECT_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Projects can only be submitted when all work orders are complete");

            // Given
            Project open = aProject().build();
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(open));

            // When / Then
            assertThatThrownBy(() -> service.completeProject(PROJECT_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Only projects under review can be completed");
            assertThatThrownBy(() -> service.rejectProject(PROJECT_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Only projects under review can be rejected");
        }

        @Test
        void archiveRestoreAndPermanentDelete_ShouldPreserveHistoryRules() {
            // Given
            Project project = aProject().build();
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));
            when(projectRepository.save(project)).thenReturn(project);

            // When
            service.archiveById(PROJECT_ID);

            // Then
            assertThat(project.isArchived()).isTrue();
            assertThat(project.getArchivedAt()).isNotNull();

            // When
            Project restored = service.restoreById(PROJECT_ID);

            // Then
            assertThat(restored.isArchived()).isFalse();

            // When
            service.deletePermanentlyById(PROJECT_ID);

            // Then
            verify(projectRepository).delete(project);
        }

        @Test
        void deletePermanently_ShouldRejectProjectWithHistory() {
            // Given
            Project project = aProject().build();
            project.addComment(new ProjectComments());
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));

            // When / Then
            assertThatThrownBy(() -> service.deletePermanentlyById(PROJECT_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Only empty open projects without business history can be permanently deleted");
        }
    }

    @Nested
    class WorkOrders {

        @Test
        void assignAndRemoveWorkOrder_ShouldMaintainBothSides() {
            // Given
            Project project = aProject().build();
            WorkOrder order = aWorkOrder().build();
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.of(order));
            when(projectRepository.save(project)).thenReturn(project);

            // When
            service.assignWorkOrder(PROJECT_ID, WORK_ORDER_ID);

            // Then
            assertThat(project.getWorkOrders()).containsExactly(order);
            assertThat(order.getProject()).isSameAs(project);

            // When
            service.removeWorkOrder(PROJECT_ID, WORK_ORDER_ID);

            // Then
            assertThat(project.getWorkOrders()).isEmpty();
            assertThat(order.getProject()).isNull();
        }

        @Test
        void createWorkOrderForProject_ShouldApplyTeamCompanyAndComment() {
            // Given
            Worker worker = aWorker().build();
            Team team = aTeam().withWorker(worker).build();
            Company company = aCompany().build();
            Project project = aProject().build();
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));
            when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));
            when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(projectRepository.save(project)).thenReturn(project);

            // When
            Project result = service.createWorkOrderForProject(PROJECT_ID, TEAM_ID, COMPANY_ID, "brief");

            // Then
            assertThat(result.getTeams()).contains(team);
            assertThat(result.getWorkOrders()).singleElement().satisfies(order -> {
                assertThat(order.getWorkers()).containsExactly(worker);
                assertThat(order.getCompany()).isSameAs(company);
                assertThat(order.getComment()).isEqualTo("brief");
                assertThat(order.getStatus()).isEqualTo(WorkOrderStatus.ACTIVE);
            });
        }

        @Test
        void workOrderMutations_ShouldRejectInvalidRelationships() {
            // Given
            Project project = aProject().build();
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));
            when(workOrderRepository.findById(WORK_ORDER_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.assignWorkOrder(PROJECT_ID, WORK_ORDER_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Work order not found");
            assertThatThrownBy(() -> service.removeWorkOrder(PROJECT_ID, WORK_ORDER_ID))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Work order is not assigned to this project");

            // Given / When / Then
            when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.createWorkOrderForProject(PROJECT_ID, TEAM_ID, null, null))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Team not found");
        }
    }

    @Nested
    class Collaboration {

        @Test
        void commentsActionItemsAndSnapshots_ShouldFollowProjectOwnership() {
            // Given
            Worker worker = aWorker().build();
            Project project = aProject().build();
            project.addWorkOrder(aWorkOrder().assignedTo(worker).build());
            ProjectComments comment = comment();
            ProjectActionItem action = actionItem(ACTION_ITEM_ID, "Prepare brief");
            ProjectSnapshot snapshot = new ProjectSnapshot();
            snapshot.setProjectSnapshotID(SNAPSHOT_ID);
            project.addSnapshot(snapshot);
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(worker));
            when(projectRepository.save(project)).thenReturn(project);

            // When / Then
            assertThat(service.addComment(PROJECT_ID, comment, WORKER_ID).getComments()).contains(comment);
            assertThat(comment.getAuthor()).isSameAs(worker);
            assertThat(service.addActionItem(PROJECT_ID, action).getActionItems()).contains(action);
            assertThat(action.isCompleted()).isFalse();
            // Simulate the identifier assigned by JPA after the mocked save.
            action.setActionItemID(ACTION_ITEM_ID);

            // When / Then
            ProjectActionItem update = actionItem(0, "Updated brief");
            service.updateActionItem(PROJECT_ID, ACTION_ITEM_ID, update);
            assertThat(action.getItemText()).isEqualTo("Updated brief");
            service.setActionItemCompleted(PROJECT_ID, ACTION_ITEM_ID, true);
            assertThat(action.isCompleted()).isTrue();
            assertThat(action.getCompletedAt()).isNotNull();
            service.removeActionItem(PROJECT_ID, ACTION_ITEM_ID);
            assertThat(project.getActionItems()).isEmpty();
            service.removeSnapshot(PROJECT_ID, SNAPSHOT_ID);
            assertThat(project.getSnapshots()).isEmpty();
        }

        @Test
        void collaboration_ShouldRejectInvalidBodiesAndMissingChildren() {
            // Given
            Project project = aProject().build();
            when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));

            // When / Then
            assertThatThrownBy(() -> service.addComment(PROJECT_ID, null, WORKER_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Comment text is required");
            assertThatThrownBy(() -> service.addActionItem(PROJECT_ID, null))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Action item text is required");
            assertThatThrownBy(() -> service.updateActionItem(PROJECT_ID, ACTION_ITEM_ID, actionItem(0, "Update")))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Action item not found");
            assertThatThrownBy(() -> service.removeActionItem(PROJECT_ID, ACTION_ITEM_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Action item not found");
            assertThatThrownBy(() -> service.removeSnapshot(PROJECT_ID, SNAPSHOT_ID))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Snapshot not found");
        }
    }

    private ProjectDTO dto(String name, List<Integer> orderIds, List<Integer> teamIds) {
        ProjectDTO dto = new ProjectDTO();
        dto.setProjectName(name);
        dto.setDescription("Description");
        dto.setBudget(new BigDecimal("1000.00"));
        dto.setWorkOrderIDs(orderIds);
        dto.setTeamIDs(teamIds);
        return dto;
    }

    private Project projectWithCompletedOrder(ProjectStatus status) {
        Project project = aProject().withStatus(status).build();
        project.addWorkOrder(aWorkOrder().withStatus(WorkOrderStatus.COMPLETE).build());
        return project;
    }

    private ProjectComments comment() {
        ProjectComments comment = new ProjectComments();
        comment.setCommentText("Work is ready");
        comment.setCommentType(CommentType.UPDATE);
        return comment;
    }

    private ProjectActionItem actionItem(int id, String text) {
        ProjectActionItem action = new ProjectActionItem();
        action.setActionItemID(id);
        action.setItemText(text);
        return action;
    }
}
