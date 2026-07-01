package com.atelicove.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.atelicove.entities.WorkOrderDocument;

public interface WODocumentRepository extends JpaRepository<WorkOrderDocument, Integer> {

}
