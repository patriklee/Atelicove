package com.atelicove.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.atelicove.entities.Document;

public interface WODocumentRepository extends JpaRepository<Document, Integer> {
    List<Document> findByWorkOrder_WorkOrderIDOrderByCreatedAtDesc(Integer workOrderID);
    List<Document> findByProject_ProjectIDOrderByCreatedAtDesc(Integer projectID);
    Optional<Document> findByDocumentIDAndWorkOrder_WorkOrderID(Integer documentID, Integer workOrderID);
    Optional<Document> findByDocumentIDAndProject_ProjectID(Integer documentID, Integer projectID);
    boolean existsByWorkOrder_WorkOrderID(Integer workOrderID);
    boolean existsByUploadedByWorker_WorkerID(Integer workerID);
}
