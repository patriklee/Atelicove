package com.atelicove.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.atelicove.entities.WorkOrderDocument;

public interface WODocumentRepository extends JpaRepository<WorkOrderDocument, Integer> {
    List<WorkOrderDocument> findByWorkOrder_WorkOrderIDOrderByCreatedAtDesc(Integer workOrderID);
    Optional<WorkOrderDocument> findByDocumentIDAndWorkOrder_WorkOrderID(Integer documentID, Integer workOrderID);
}
