package com.atelicove.services;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

@Service
public class TeamService {

	private final TeamRepository teamRepository;
	private final ProjectRepository projectRepository;
	private final WorkerRepository workerRepository;

	public TeamService(
			TeamRepository teamRepository,
			ProjectRepository projectRepository,
			WorkerRepository workerRepository) {
		this.teamRepository = teamRepository;
		this.projectRepository = projectRepository;
		this.workerRepository = workerRepository;
	}

	public List<Team> findAll() {
		return teamRepository.findAll();
	}

	public List<Team> findByProject(Integer projectID) {
		Project project = projectRepository.findById(projectID)
				.orElseThrow(() -> new IllegalArgumentException("Project not found"));
		return project.getTeams();
	}

	public Optional<Team> findById(Integer teamID) {
		return teamRepository.findById(teamID);
	}

	@Transactional
	public Team createTeam(TeamDTO teamDTO) {
		Team team = new Team();
		team.setTeamID(0);
		applyDTO(team, teamDTO);

		return teamRepository.save(team);
	}

	@Transactional
	public Team updateTeam(Integer teamID, TeamDTO teamDTO) {
		Team team = getRequiredTeam(teamID);
		Set<Worker> previousWorkers = new HashSet<>(team.getWorkers());
		applyDTO(team, teamDTO);
		syncUpdatedTeamWorkers(team, previousWorkers);

		return teamRepository.save(team);
	}

	/**
	 * Deletes a team after first removing it from every project that references it.
	 *
	 * @param teamID team to delete
	 */
	@Transactional
	public void deleteTeam(Integer teamID) {
		Team team = getRequiredTeam(teamID);

		for (Project project : projectRepository.findAll()) {
			if (project.getTeams().contains(team)) {
				project.removeTeam(team);
				removeTeamWorkersFromActiveProjectWorkOrders(project, team);
				projectRepository.save(project);
			}
		}

		teamRepository.delete(team);
	}

	/**
	 * Applies team request data, resolves project and worker IDs, and enforces that
	 * every saved team has at least one worker.
	 *
	 * @param team team being created or updated
	 * @param teamDTO incoming team details
	 */
	private void applyDTO(Team team, TeamDTO teamDTO) {
		if (teamDTO == null) {
			throw new IllegalArgumentException("Team details are required");
		}

		team.setTeamName(teamDTO.getTeamName());

		if (teamDTO.getProjectID() != null) {
			Project project = projectRepository.findById(teamDTO.getProjectID())
					.orElseThrow(() -> new IllegalArgumentException("Project not found"));
			if (project.isArchived()) {
				throw new IllegalStateException("Teams cannot be changed on archived projects");
			}
			project.addTeam(team);

			if (project.getProjectStatus() == ProjectStatus.ACTIVE && team.getProjectStartedAt() == null) {
				team.setProjectStartedAt(LocalDateTime.now());
			}
		}

		if (teamDTO.getProjectStartedAt() != null) {
			team.setProjectStartedAt(teamDTO.getProjectStartedAt());
		}

		if (teamDTO.getWorkerIDs() != null) {
			Set<Worker> workers = new HashSet<>(workerRepository.findAllById(teamDTO.getWorkerIDs()));
			if (workers.size() != teamDTO.getWorkerIDs().size()) {
				throw new IllegalArgumentException("One or more workers were not found");
			}
			if (workers.isEmpty()) {
				throw new IllegalStateException("A team must have at least one worker");
			}
			team.setWorkers(workers);
		}

		if (team.getWorkers().isEmpty()) {
			throw new IllegalStateException("A team must have at least one worker");
		}

	}

	private Team getRequiredTeam(Integer teamID) {
		return teamRepository.findById(teamID)
				.orElseThrow(() -> new IllegalArgumentException("Team not found"));
	}

	private void removeTeamWorkersFromActiveProjectWorkOrders(Project project, Team team) {
		if (project.getProjectStatus() != ProjectStatus.ACTIVE) {
			return;
		}

		Set<Worker> remainingProjectWorkers = new HashSet<>();
		for (Team remainingTeam : project.getTeams()) {
			remainingProjectWorkers.addAll(remainingTeam.getWorkers());
		}

		Set<Worker> workersToRemove = new HashSet<>(team.getWorkers());
		workersToRemove.removeAll(remainingProjectWorkers);

		for (WorkOrder workOrder : project.getWorkOrders()) {
			if (workOrder.getStatus() != WorkOrderStatus.OPEN &&
					workOrder.getStatus() != WorkOrderStatus.IN_PROCESS) {
				continue;
			}

			for (Worker worker : workersToRemove) {
				workOrder.removeWorker(worker);
			}

			workOrder.setStatus(workOrder.getWorkers().isEmpty()
					? WorkOrderStatus.OPEN
					: WorkOrderStatus.IN_PROCESS);
		}
	}

	private void syncUpdatedTeamWorkers(Team team, Set<Worker> previousWorkers) {
		Set<Worker> currentWorkers = new HashSet<>(team.getWorkers());
		Set<Worker> removedWorkers = new HashSet<>(previousWorkers);
		removedWorkers.removeAll(currentWorkers);
		Set<Worker> addedWorkers = new HashSet<>(currentWorkers);
		addedWorkers.removeAll(previousWorkers);

		for (Project project : projectRepository.findAll()) {
			if (!project.getTeams().contains(team) ||
					project.getProjectStatus() != ProjectStatus.ACTIVE) {
				continue;
			}

			Set<Worker> remainingProjectWorkers = new HashSet<>();
			for (Team projectTeam : project.getTeams()) {
				remainingProjectWorkers.addAll(projectTeam.getWorkers());
			}

			Set<Worker> projectRemovedWorkers = new HashSet<>(removedWorkers);
			projectRemovedWorkers.removeAll(remainingProjectWorkers);

			for (WorkOrder workOrder : project.getWorkOrders()) {
				if (workOrder.getStatus() != WorkOrderStatus.OPEN &&
						workOrder.getStatus() != WorkOrderStatus.IN_PROCESS) {
					continue;
				}

				for (Worker worker : projectRemovedWorkers) {
					workOrder.removeWorker(worker);
				}

				for (Worker worker : addedWorkers) {
					workOrder.addWorker(worker);
				}

				workOrder.setStatus(workOrder.getWorkers().isEmpty()
						? WorkOrderStatus.OPEN
						: WorkOrderStatus.IN_PROCESS);
			}

			projectRepository.save(project);
		}
	}

}
