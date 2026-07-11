package com.atelicove.entities;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "team")
public class Team {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private int teamID;

	@Column(length = 255)
	private String teamName;

	@ManyToMany
	@JoinTable(
			name = "team_worker",
			joinColumns = @JoinColumn(name = "team_id"),
			inverseJoinColumns = @JoinColumn(name = "worker_id"))
	private Set<Worker> workers = new HashSet<>();

	public Team() {}

	public int getTeamID() {
		return teamID;
	}

	public String getTeamName() {
		return teamName;
	}

	public Set<Worker> getWorkers() {
		return workers;
	}

	public void setTeamID(int teamID) {
		this.teamID = teamID;
	}

	public void setTeamName(String teamName) {
		this.teamName = teamName;
	}

	public void setWorkers(Set<Worker> workers) {
		this.workers = workers == null ? new HashSet<>() : workers;
	}
}
