package com.atelicove.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import com.atelicove.entities.Project;
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
}
