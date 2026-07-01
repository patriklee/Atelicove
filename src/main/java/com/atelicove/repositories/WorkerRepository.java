package com.atelicove.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.atelicove.entities.Worker;

public interface WorkerRepository extends JpaRepository<Worker, Integer> {
    Optional<Worker> findByWorkerUserIgnoreCase(String workerUser);
    Optional<Worker> findByWorkerUserIgnoreCaseAndArchivedFalse(String workerUser);
    Optional<Worker> findByWorkerEmailIgnoreCase(String workerEmail);
    List<Worker> findByArchivedFalse();
    List<Worker> findByArchivedTrue();
}
