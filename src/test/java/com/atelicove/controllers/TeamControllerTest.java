package com.atelicove.controllers;

import static com.atelicove.support.ControllerTestSupport.mockMvcFor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.atelicove.dto.TeamDTO;
import com.atelicove.entities.Team;
import com.atelicove.services.TeamService;

@ExtendWith(MockitoExtension.class)
class TeamControllerTest {

    @Mock private TeamService teamService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = mockMvcFor(new TeamController(teamService));
    }

    @Test
    void collectionAndDetailEndpoints_ShouldReturnTeamsAndNotFound() throws Exception {
        Team team = team(3, "Design");
        when(teamService.findAll()).thenReturn(List.of(team));
        when(teamService.findByProject(8)).thenReturn(List.of(team));
        when(teamService.findById(3)).thenReturn(Optional.of(team));
        when(teamService.findById(99)).thenReturn(Optional.empty());

        mockMvc.perform(get("/teams")).andExpect(status().isOk()).andExpect(jsonPath("$[0].teamName").value("Design"));
        mockMvc.perform(get("/teams/project/8")).andExpect(status().isOk()).andExpect(jsonPath("$[0].teamID").value(3));
        mockMvc.perform(get("/teams/3")).andExpect(status().isOk()).andExpect(jsonPath("$.teamName").value("Design"));
        mockMvc.perform(get("/teams/99")).andExpect(status().isNotFound());
    }

    @Test
    void mutationEndpoints_ShouldReturnServiceResultsAndNoContent() throws Exception {
        when(teamService.createTeam(any(TeamDTO.class))).thenReturn(team(4, "New team"));
        when(teamService.updateTeam(eq(4), any(TeamDTO.class))).thenReturn(team(4, "Updated team"));

        mockMvc.perform(post("/teams").contentType(MediaType.APPLICATION_JSON).content("{\"teamName\":\"New team\",\"workerIDs\":[]}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.teamID").value(4));
        mockMvc.perform(put("/teams/4").contentType(MediaType.APPLICATION_JSON).content("{\"teamName\":\"Updated team\",\"workerIDs\":[]}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.teamName").value("Updated team"));
        mockMvc.perform(delete("/teams/4")).andExpect(status().isNoContent());
        verify(teamService).deleteTeam(4);
    }

    private Team team(int id, String name) {
        Team team = new Team();
        team.setTeamID(id);
        team.setTeamName(name);
        return team;
    }
}
