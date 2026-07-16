package com.atelicove.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.atelicove.entities.PlannedStaffing;

public interface PlannedStaffingRepository extends JpaRepository<PlannedStaffing, Integer> {
}
