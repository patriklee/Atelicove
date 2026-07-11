package com.atelicove.dto;

import java.util.Set;

public class TeamDTO {

	private int teamID;
	private String teamName;
	private Integer projectID;
	private Set<Integer> workerIDs;

	public int getTeamID() {
		return teamID;
	}

	public String getTeamName() {
		return teamName;
	}

	public Integer getProjectID() {
		return projectID;
	}

	public Set<Integer> getWorkerIDs() {
		return workerIDs;
	}

	public void setTeamID(int teamID) {
		this.teamID = teamID;
	}

	public void setTeamName(String teamName) {
		this.teamName = teamName;
	}

	public void setProjectID(Integer projectID) {
		this.projectID = projectID;
	}

	public void setWorkerIDs(Set<Integer> workerIDs) {
		this.workerIDs = workerIDs;
	}

}
