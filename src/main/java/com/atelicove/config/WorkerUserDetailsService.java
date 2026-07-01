package com.atelicove.config;
import java.util.Optional;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.atelicove.entities.Worker;
import com.atelicove.repositories.WorkerRepository;

@Service
public class WorkerUserDetailsService implements UserDetailsService{
	
	private final WorkerRepository workerRepository;
	
	public WorkerUserDetailsService(WorkerRepository workerRepository) {
		this.workerRepository = workerRepository;
	}
	
	@Override
	public UserDetails loadUserByUsername(String username) {
		Optional<Worker> result = workerRepository.findByWorkerUserIgnoreCaseAndArchivedFalse(username);
		
		if(result.isEmpty()) {
			throw new UsernameNotFoundException("Worker not found");
		}
		
		Worker worker = result.get();
		
		String role;
		
		if (worker.isAdmin()){
			role = "ADMIN";
		} else {
			role = "WORKER";
		}
		
		return User.withUsername(worker.getWorkerUser()).password(worker.getWorkerPW()).roles(role).build();
	}
}
