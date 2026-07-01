package com.atelicove.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atelicove.entities.Worker;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.WorkerRepository;

@Service
public class WorkerService {

    private final WorkerRepository workerRepository;
    private final PasswordEncoder passwordEncoder;


    public WorkerService(WorkerRepository workerRepository, PasswordEncoder passwordEncoder) {
        this.workerRepository = workerRepository;
		this.passwordEncoder = passwordEncoder;
    }
    
    public Worker createWorker(Worker worker) {
    	validateWorkerRequiredFields(worker);
    	validateUniqueUsername(worker.getWorkerUser(), null);
    	validateUniqueEmail(worker.getWorkerEmail(), null);

    	String password = worker.getWorkerPW();
    	
    	if(password == null || password.isBlank()) {
    		throw new IllegalArgumentException("Password is required");
    	}
    	
    	if (password.length() < 8) {
    	    throw new IllegalArgumentException(
    	            "Password must contain at least 8 characters");
    	}
    	
    	worker.setWorkerPW(passwordEncoder.encode(password));
    	worker.setArchived(false);
    	worker.setArchivedAt(null);
    	
    	return workerRepository.save(worker);
    }

    public Optional<Worker> findByUsername(String username) {
        return workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(username);
    }
    
    public List<Worker> findActive() {
        return workerRepository.findByArchivedFalse();
    }

    public List<Worker> findAll() {
        return workerRepository.findAll();
    }

    public List<Worker> findArchived() {
        return workerRepository.findByArchivedTrue();
    }

    public Optional<Worker> findById(Integer id) {
        return workerRepository.findById(id);
    }

    public Worker updateWorker(Integer id, Worker request) {
    	Worker worker = workerRepository.findById(id)
    			.orElseThrow(() -> new IllegalArgumentException("Worker not found"));

    	updateWorkerProfileFields(worker, request);

    	if (request.getWorkerUser() != null) {
    		if (request.getWorkerUser().isBlank()) {
    			throw new IllegalArgumentException("Username is required");
    		}
    		validateUniqueUsername(request.getWorkerUser(), id);
    		worker.setWorkerUser(request.getWorkerUser());
    	}

    	worker.setAdmin(request.isAdmin());

    	return workerRepository.save(worker);
    }

    public Worker updateProfile(Integer id, Worker request) {
    	Worker worker = workerRepository.findById(id)
    			.orElseThrow(() -> new IllegalArgumentException("Worker not found"));

    	updateWorkerProfileFields(worker, request);

    	return workerRepository.save(worker);
    }

    public Worker recordLogin(String username) {
        Worker worker = workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(username)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found"));
        worker.setLastLoginAt(LocalDateTime.now());
        return workerRepository.save(worker);
    }

    private void updateWorkerProfileFields(Worker worker, Worker request) {
    	if (request.getWorkerFName() != null) {
    		worker.setWorkerFName(request.getWorkerFName());
    	}

    	if (request.getWorkerLName() != null) {
    		worker.setWorkerLName(request.getWorkerLName());
    	}

    	if (request.getWorkerDisplayName() != null) {
    		worker.setWorkerDisplayName(request.getWorkerDisplayName());
    	}

    	if (request.getWorkerEmail() != null) {
    		if (request.getWorkerEmail().isBlank()) {
    			throw new IllegalArgumentException("Email is required");
    		}
    		validateUniqueEmail(request.getWorkerEmail(), worker.getWorkerID());
    		worker.setWorkerEmail(request.getWorkerEmail());
    	}
    }

    @Transactional
    public void archiveById(Integer id) {
    	Optional<Worker> result = workerRepository.findById(id);
    	
    	if(result.isEmpty()) {
    		throw new IllegalArgumentException("Worker not found");
    	}
    	
    	Worker worker = result.get();
        boolean hasOpenWorkOrders = worker.getWorkOrders().stream()
                .anyMatch(workOrder -> workOrder.getStatus() != WorkOrderStatus.COMPLETE);

        if (hasOpenWorkOrders) {
            throw new IllegalStateException("Worker cannot be archived while assigned to open work orders");
        }

    	worker.setArchived(true);
    	worker.setArchivedAt(LocalDateTime.now());

        workerRepository.save(worker);
    }

    @Transactional
    public Worker restoreById(Integer id) {
    	Worker worker = workerRepository.findById(id)
    			.orElseThrow(() -> new IllegalArgumentException("Worker not found"));
    	worker.setArchived(false);
    	worker.setArchivedAt(null);
    	return workerRepository.save(worker);
    }

    @Transactional
    public void deletePermanentlyById(Integer id) {
    	Worker worker = workerRepository.findById(id)
    			.orElseThrow(() -> new IllegalArgumentException("Worker not found"));

    	if (worker.isArchived()) {
    		throw new IllegalStateException("Archived workers can only be restored");
    	}

    	if (!worker.getWorkOrders().isEmpty()) {
    		throw new IllegalStateException("Worker cannot be permanently deleted while work orders are attached");
    	}

    	workerRepository.delete(worker);
    }
    
    public void resetPassword(Integer workerID, String newPassword) {
    	if (newPassword == null || newPassword.isBlank()) {
    		throw new IllegalArgumentException("Password is required");
    	}
    	
    	if (newPassword.length() < 8) {
    	    throw new IllegalArgumentException(
    	            "Password must contain at least 8 characters");
    	}
    	
    	Optional<Worker> result = workerRepository.findById(workerID);
    	
    	if(result.isEmpty()) {
    		throw new IllegalArgumentException("Worker not found");
    	}
    	
    	Worker worker = result.get();
    	worker.setWorkerPW(passwordEncoder.encode(newPassword));
    	workerRepository.save(worker);
    }

    private void validateWorkerRequiredFields(Worker worker) {
    	if (worker.getWorkerFName() == null || worker.getWorkerFName().isBlank()) {
    		throw new IllegalArgumentException("First name is required");
    	}

    	if (worker.getWorkerLName() == null || worker.getWorkerLName().isBlank()) {
    		throw new IllegalArgumentException("Last name is required");
    	}

    	if (worker.getWorkerUser() == null || worker.getWorkerUser().isBlank()) {
    		throw new IllegalArgumentException("Username is required");
    	}

    	if (worker.getWorkerEmail() == null || worker.getWorkerEmail().isBlank()) {
    		throw new IllegalArgumentException("Email is required");
    	}
    }

    private void validateUniqueUsername(String username, Integer currentWorkerID) {
    	Optional<Worker> existing = workerRepository.findByWorkerUserIgnoreCase(username);
    	if (existing.isPresent() && !Integer.valueOf(existing.get().getWorkerID()).equals(currentWorkerID)) {
    		throw new IllegalArgumentException("Username already exists");
    	}
    }

    private void validateUniqueEmail(String email, Integer currentWorkerID) {
    	Optional<Worker> existing = workerRepository.findByWorkerEmailIgnoreCase(email);
    	if (existing.isPresent() && !Integer.valueOf(existing.get().getWorkerID()).equals(currentWorkerID)) {
    		throw new IllegalArgumentException("Email already exists");
    	}
    }
    
}
