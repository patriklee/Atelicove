package com.atelicove.services;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.dto.ProjectDTO;
import com.atelicove.entities.Project;
import com.atelicove.entities.ProjectComments;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.Worker;
import com.atelicove.enums.CommentType;
import com.atelicove.enums.ProjectStatus;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.TeamRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock private ProjectRepository projectRepository;
    @Mock private WorkOrderRepository workOrderRepository;
    @Mock private WorkerRepository workerRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private CompanyRepository companyRepository;
    @InjectMocks private ProjectService projectService;

    @Test
    void archivedAndCompletedProjectsCannotBeEdited() {
        Project archived = project(1, ProjectStatus.OPEN);
        archived.setArchived(true);
        Project completed = project(2, ProjectStatus.COMPLETE);
        when(projectRepository.findById(1)).thenReturn(Optional.of(archived));
        when(projectRepository.findById(2)).thenReturn(Optional.of(completed));

        assertThrows(IllegalStateException.class,
                () -> projectService.updateProject(1, new ProjectDTO()));
        assertThrows(IllegalStateException.class,
                () -> projectService.removeSnapshot(2, 10));
        verify(projectRepository, never()).save(archived);
        verify(projectRepository, never()).save(completed);
    }

    @Test
    void permanentDeleteRejectsHistoricalProjectButAllowsEmptyOpenProject() {
        Project historical = project(1, ProjectStatus.OPEN);
        historical.addComment(new ProjectComments());
        Project empty = project(2, ProjectStatus.OPEN);
        when(projectRepository.findById(1)).thenReturn(Optional.of(historical));
        when(projectRepository.findById(2)).thenReturn(Optional.of(empty));

        assertThrows(IllegalStateException.class,
                () -> projectService.deletePermanentlyById(1));
        projectService.deletePermanentlyById(2);

        verify(projectRepository, never()).delete(historical);
        verify(projectRepository).delete(empty);
    }

    @Test
    void workerAssignedThroughWorkOrderCanCommentOnProject() {
        Worker worker = new Worker();
        worker.setWorkerID(8);
        WorkOrder workOrder = new WorkOrder();
        workOrder.addWorker(worker);
        Project project = project(3, ProjectStatus.OPEN);
        project.addWorkOrder(workOrder);
        ProjectComments comment = new ProjectComments();
        comment.setCommentText("Work is ready");
        comment.setCommentType(CommentType.UPDATE);
        when(projectRepository.findById(3)).thenReturn(Optional.of(project));
        when(workerRepository.findById(8)).thenReturn(Optional.of(worker));
        when(projectRepository.save(project)).thenReturn(project);

        assertSame(project, projectService.addComment(3, comment, 8));
        assertSame(worker, comment.getAuthor());
    }

    private Project project(int id, ProjectStatus status) {
        Project project = new Project();
        project.setProjectID(id);
        project.setProjectStatus(status);
        return project;
    }
}
