package com.atelicove.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.atelicove.entities.Project;
import com.atelicove.enums.ProjectStatus;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Integer> {
	List<Project> findByArchivedFalse();
	List<Project> findByArchivedTrue();
	List<Project> findByProjectStatusAndArchivedFalse(ProjectStatus projectStatus);
	List<Project> findByAssociatedActiveProject_ProjectID(Integer projectID);
	long countByArchivedFalse();
}
