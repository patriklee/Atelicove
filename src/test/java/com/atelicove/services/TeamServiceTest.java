package com.atelicove.services;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.dto.TeamDTO;
import com.atelicove.entities.Project;
import com.atelicove.entities.Team;
import com.atelicove.enums.ProjectStatus;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.TeamRepository;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock private TeamRepository teamRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private WorkerRepository workerRepository;
    @InjectMocks private TeamService teamService;

    @Test
    void teamUsedByCompletedProjectCannotBeUpdatedOrDeleted() {
        Team team = new Team();
        team.setTeamID(4);
        Project completed = new Project();
        completed.setProjectStatus(ProjectStatus.COMPLETE);
        completed.addTeam(team);
        when(teamRepository.findById(4)).thenReturn(Optional.of(team));
        when(projectRepository.findAll()).thenReturn(List.of(completed));

        assertThrows(IllegalStateException.class,
                () -> teamService.updateTeam(4, new TeamDTO()));
        assertThrows(IllegalStateException.class,
                () -> teamService.deleteTeam(4));

        verify(teamRepository, never()).save(team);
        verify(teamRepository, never()).delete(team);
    }
}
