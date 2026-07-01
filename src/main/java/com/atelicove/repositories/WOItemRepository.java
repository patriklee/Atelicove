package com.atelicove.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.atelicove.entities.WorkOrderItem;

public interface WOItemRepository extends JpaRepository<WorkOrderItem, Integer> {

}
