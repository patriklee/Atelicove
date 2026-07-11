package com.atelicove.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.atelicove.entities.DraftWorkOrder;

public interface DraftWorkOrderRepository extends JpaRepository<DraftWorkOrder, Integer> {}
