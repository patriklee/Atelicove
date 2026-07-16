package com.atelicove.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import com.atelicove.entities.Project;
import com.atelicove.entities.ProjectActionItem;
import com.atelicove.entities.ProjectComments;
import com.atelicove.entities.Worker;
import com.atelicove.dto.ProjectDTO;
import com.atelicove.services.AuthorizationService;
import com.atelicove.services.ProjectService;

@ExtendWith(MockitoExtension.class)
class ProjectControllerTest {

    @Mock private ProjectService projectService;
    @Mock private AuthorizationService authorizationService;
    @Mock private Authentication authentication;
    @InjectMocks private ProjectController controller;

    @Test
    void projectCollectionsAreScopedThroughAuthorizationService() {
        Project visible = new Project();
        List<Project> allProjects = List.of(new Project(), visible);
        when(projectService.findActive()).thenReturn(allProjects);
        when(authorizationService.visibleProjects(allProjects, authentication))
                .thenReturn(List.of(visible));

        assertThat(controller.getAllProjects(authentication)).containsExactly(visible);
        verify(authorizationService).visibleProjects(allProjects, authentication);
    }

    @Test
    void projectDetailRequiresProjectAccessBeforeReturningData() {
        Project project = new Project();
        project.setProjectID(7);
        when(projectService.findById(7)).thenReturn(Optional.of(project));

        assertThat(controller.getProjectById(7, authentication).getBody()).isSameAs(project);
        verify(authorizationService).requireProjectAccess(7, authentication);
    }

    @Test
    void remainingProjectEndpoints_ShouldDelegateWithPathAndBodyValues() {
        Project project = new Project();
        ProjectDTO dto = new ProjectDTO();
        ProjectComments comment = new ProjectComments();
        ProjectActionItem actionItem = new ProjectActionItem();
        Worker worker = new Worker();
        worker.setWorkerID(11);
        when(authorizationService.requireProjectAccess(org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.eq(authentication)))
                .thenReturn(worker);
        when(authorizationService.visibleProjects(org.mockito.ArgumentMatchers.anyList(), org.mockito.ArgumentMatchers.eq(authentication)))
                .thenReturn(List.of(project));
        when(projectService.findAll()).thenReturn(List.of(project));
        when(projectService.findArchived()).thenReturn(List.of(project));
        when(projectService.createProject(dto)).thenReturn(project);
        when(projectService.updateProject(7, dto)).thenReturn(project);
        when(projectService.completeProject(7)).thenReturn(project);
        when(projectService.submitForReview(7)).thenReturn(project);
        when(projectService.rejectProject(7)).thenReturn(project);
        when(projectService.assignWorkOrder(7, 4)).thenReturn(project);
        when(projectService.createWorkOrderForProject(7, 3, 2, "brief")).thenReturn(project);
        when(projectService.createWorkOrderForProject(7, null, null, null)).thenReturn(project);
        when(projectService.removeWorkOrder(7, 4)).thenReturn(project);
        when(projectService.addComment(7, comment, 11)).thenReturn(project);
        when(projectService.addActionItem(7, actionItem)).thenReturn(project);
        when(projectService.updateActionItem(7, 5, actionItem)).thenReturn(project);
        when(projectService.setActionItemCompleted(7, 5, true)).thenReturn(project);
        when(projectService.removeActionItem(7, 5)).thenReturn(project);
        when(projectService.removeSnapshot(7, 6)).thenReturn(project);
        when(projectService.restoreById(7)).thenReturn(project);
        when(projectService.count()).thenReturn(9L);

        assertThat(controller.getAllProjectsIncludingArchived(authentication)).containsExactly(project);
        assertThat(controller.getArchivedProjects(authentication)).containsExactly(project);
        assertThat(controller.getProjectById(99, authentication).getStatusCode().value()).isEqualTo(404);
        assertThat(controller.addProject(dto)).isSameAs(project);
        assertThat(controller.updateProject(7, dto)).isSameAs(project);
        assertThat(controller.completeProject(7)).isSameAs(project);
        assertThat(controller.submitForReview(7, authentication)).isSameAs(project);
        assertThat(controller.rejectProject(7)).isSameAs(project);
        assertThat(controller.assignWorkOrder(7, Map.of("workOrderID", 4))).isSameAs(project);
        assertThat(controller.createWorkOrderForProject(7, Map.of("teamID", "3", "companyID", 2, "comment", "brief"))).isSameAs(project);
        assertThat(controller.createWorkOrderForProject(7, new java.util.HashMap<>())).isSameAs(project);
        assertThat(controller.removeWorkOrder(7, 4)).isSameAs(project);
        assertThat(controller.addComment(7, comment, authentication)).isSameAs(project);
        assertThat(controller.addActionItem(7, actionItem, authentication)).isSameAs(project);
        assertThat(controller.updateActionItem(7, 5, actionItem, authentication)).isSameAs(project);
        assertThat(controller.completeActionItem(7, 5, Map.of("completed", true), authentication)).isSameAs(project);
        assertThat(controller.removeActionItem(7, 5, authentication)).isSameAs(project);
        assertThat(controller.removeSnapshot(7, 6)).isSameAs(project);
        assertThat(controller.archiveProject(7).getStatusCode().value()).isEqualTo(204);
        assertThat(controller.restoreProject(7)).isSameAs(project);
        assertThat(controller.deleteProjectPermanently(7).getStatusCode().value()).isEqualTo(204);
        assertThat(controller.getProjectCount()).isEqualTo(9L);
        verify(projectService).archiveById(7);
        verify(projectService).deletePermanentlyById(7);
    }
}
