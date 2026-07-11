package com.atelicove.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.atelicove.entities.DraftWorkOrder;

public interface DraftWorkOrderRepository extends JpaRepository<DraftWorkOrder, Integer> {
    List<DraftWorkOrder> findByArchivedFalse();
    List<DraftWorkOrder> findByArchivedTrue();
}
