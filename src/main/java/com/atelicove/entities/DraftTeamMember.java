package com.atelicove.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class DraftTeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer workerID;
    private String workerName;

    private String roleName; 
    // Examples: "Electrician", "Project Lead", "Painter", "Installer"

    @Column(length = 1000)
    private String roleDescription;

    @ManyToOne
    @JoinColumn(name = "draft_team_id")
    private DraftTeam draftTeam;

	public Integer getWorkerID() {
		return workerID;
	}

	public void setWorkerID(Integer workerID) {
		this.workerID = workerID;
	}

	public String getWorkerName() {
		return workerName;
	}

	public void setWorkerName(String workerName) {
		this.workerName = workerName;
	}

	public String getRoleName() {
		return roleName;
	}

	public void setRoleName(String roleName) {
		this.roleName = roleName;
	}

    // getters/setters
}
