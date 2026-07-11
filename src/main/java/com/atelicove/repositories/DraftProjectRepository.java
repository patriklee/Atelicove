package com.atelicove.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.atelicove.entities.DraftProject;

public interface DraftProjectRepository extends JpaRepository<DraftProject, Long> {
	List<DraftProject> findByArchivedFalse();
	List<DraftProject> findByArchivedTrue();
}
