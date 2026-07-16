package com.atelicove.controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.atelicove.dto.TeamDTO;
import com.atelicove.entities.Team;
import com.atelicove.services.TeamService;

@RestController
@RequestMapping("/teams")
@PreAuthorize("hasRole('ADMIN')")
public class TeamController {

	private final TeamService teamService;

	public TeamController(TeamService teamService) {
		this.teamService = teamService;
	}

	@GetMapping
	public List<Team> getAllTeams() {
		return teamService.findAll();
	}

	@GetMapping("/project/{projectID}")
	public List<Team> getTeamsByProject(@PathVariable Integer projectID) {
		return teamService.findByProject(projectID);
	}

	@GetMapping("/{id}")
	public ResponseEntity<Team> getTeamById(@PathVariable Integer id) {
		Optional<Team> team = teamService.findById(id);

		if (team.isPresent()) {
			return ResponseEntity.ok(team.get());
		}

		return ResponseEntity.notFound().build();
	}

	@PostMapping
	public Team addTeam(@RequestBody TeamDTO teamDTO) {
		return teamService.createTeam(teamDTO);
	}

	@PutMapping("/{id}")
	public Team updateTeam(@PathVariable Integer id, @RequestBody TeamDTO teamDTO) {
		return teamService.updateTeam(id, teamDTO);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteTeam(@PathVariable Integer id) {
		teamService.deleteTeam(id);
		return ResponseEntity.noContent().build();
	}
}
