package com.atelicove.services;

import java.util.*;
import org.springframework.stereotype.Service;

import com.atelicove.entities.WorkOrderItem;
import com.atelicove.repositories.WOItemRepository;

@Service
public class WOItemService {
	
	 private final WOItemRepository repository;

	    public WOItemService(WOItemRepository repository) {
	        this.repository = repository;
	    }

	    public List<WorkOrderItem> findAll() {
	        return repository.findAll();
	    }

	    public Optional<WorkOrderItem> findById(Integer id) {
	        return repository.findById(id);
	    }

	    public WorkOrderItem save(WorkOrderItem item) {
	        return repository.save(item);
	    }

	    public void deleteById(Integer id) {
	        repository.deleteById(id);
	    }
}
