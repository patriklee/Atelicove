package com.atelicove.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.atelicove.entities.Team;

@Repository
public interface TeamRepository extends JpaRepository<Team, Integer> {
}
