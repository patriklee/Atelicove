package com.atelicove.services;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atelicove.entities.Company;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.DraftWorkOrderItem;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.entities.Worker;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.DraftWorkOrderRepository;
import com.atelicove.repositories.WorkOrderRepository;
import com.atelicove.repositories.WorkerRepository;

@Service
public class WorkOrderService{

    private final WorkOrderRepository workOrderRepository;
    private final DraftWorkOrderRepository draftWorkOrderRepository;
    private final WorkerRepository workerRepository;
    private final CompanyRepository companyRepository;

    public WorkOrderService(
            WorkOrderRepository workOrderRepository,
            DraftWorkOrderRepository draftWorkOrderRepository,
            WorkerRepository workerRepository,
            CompanyRepository companyRepository) {
        this.workOrderRepository = workOrderRepository;
        this.draftWorkOrderRepository = draftWorkOrderRepository;
        this.workerRepository = workerRepository;
        this.companyRepository = companyRepository;
    }
    
    /**
     * Moves an open work order into active work. Only work orders that have not
     * already been started, submitted, completed, or drafted can enter this state.
     *
     * @param workOrderID work order to start
     * @return the saved work order with an active status
     */
    @Transactional
    public WorkOrder startWorkOrder(Integer workOrderID) {
    	WorkOrder workOrder = getRequiredWorkOrder(workOrderID);
		ensureWorkOrderCanBeEdited(workOrder);
    	
    	if(workOrder.getStatus() != WorkOrderStatus.OPEN) {
    		throw new IllegalStateException("Only open work orders can be started");
    	}
    	
        workOrder.setStatus(WorkOrderStatus.ACTIVE);
    	
    	return workOrderRepository.save(workOrder);
    }

    public List<WorkOrder> findByCompanyID(Integer companyID) {
        return workOrderRepository.findByCompany_CompanyIDAndArchivedFalse(companyID);
    }
    
    public Optional<WorkOrder> findById(Integer id) {
        return workOrderRepository.findById(id);
    }
    
    public List<WorkOrder> findActive() {
        return workOrderRepository.findByArchivedFalse();
    }

    public List<DraftWorkOrder> findDrafts() {
        return draftWorkOrderRepository.findByArchivedFalse().stream()
                .filter(draftWorkOrder -> draftWorkOrder.getDraftProject() == null
                        || !draftWorkOrder.getDraftProject().isArchived())
                .toList();
    }

    public Optional<DraftWorkOrder> findDraftById(Integer id) {
        return draftWorkOrderRepository.findById(id)
                .filter(draftWorkOrder -> !draftWorkOrder.isArchived())
                .filter(draftWorkOrder -> draftWorkOrder.getDraftProject() == null
                        || !draftWorkOrder.getDraftProject().isArchived());
    }

    public List<DraftWorkOrder> findArchivedDrafts() {
        return draftWorkOrderRepository.findByArchivedTrue();
    }

    public List<WorkOrder> findAll() {
        return workOrderRepository.findAll();
    }

    public List<WorkOrder> findArchived() {
        return workOrderRepository.findByArchivedTrue();
    }

    /**
     * Creates a normal work order and attaches only active workers and companies.
     * New work orders are opened when no worker is assigned and moved directly to
     * active when workers are provided.
     *
     * @param workOrder work order details from the request
     * @return the saved work order
     */
    public WorkOrder createWorkOrder(WorkOrder workOrder) {
		if (workOrder == null) {
			throw new IllegalArgumentException("Work order is required");
		}
		validateDateRange(workOrder.getStartDateTime(), workOrder.getEndDateTime());
    	workOrder.setWorkOrderID(0);
    	workOrder.setArchived(false);
		workOrder.setArchivedAt(null);
		workOrder.setProject(null);

		for (WorkOrderItem item : workOrder.getItems()) {
			validateItem(item.getItemName(), item.getQuantity(), item.getPrice(), item.getItemType());
			item.setWorkOrderItemID(0);
			item.setWorkOrder(workOrder);
		}

    	if (workOrder.getWorkers() == null || workOrder.getWorkers().isEmpty()) {
    		workOrder.setStatus(WorkOrderStatus.OPEN);
    	} else {
    		Set<Worker> assignedWorkers = new HashSet<>();
    		for (Worker worker : workOrder.getWorkers()) {
    			Worker managedWorker = workerRepository.findById(worker.getWorkerID())
    					.orElseThrow(() -> new IllegalArgumentException("Worker not found"));

    			if (managedWorker.isArchived()) {
    				throw new IllegalStateException("Archived workers cannot be assigned");
    			}

    			assignedWorkers.add(managedWorker);
    		}
    		workOrder.setWorkers(assignedWorkers);
    		for (Worker worker : assignedWorkers) {
    			if (worker.isArchived()) {
    				throw new IllegalStateException("Archived workers cannot be assigned");
    			}
    		}
            workOrder.setStatus(WorkOrderStatus.ACTIVE);
    	}

    	if (workOrder.getCompany() != null) {
    		Company company = companyRepository.findById(workOrder.getCompany().getCompanyID())
    				.orElseThrow(() -> new IllegalArgumentException("Company not found"));

    		if (company.isArchived()) {
    			throw new IllegalStateException("Archived companies cannot be assigned");
    		}

    		workOrder.setCompany(company);
    	}
    	
        return workOrderRepository.save(workOrder);
    }

    /**
     * Adds a worker to an editable work order. If the worker is already assigned,
     * the work order is returned unchanged.
     *
     * @param workOrderID work order receiving the worker
     * @param workerID worker to assign
     * @return the saved work order
     */
    @Transactional
    public WorkOrder reassignWorkOrder(Integer workOrderID, Integer workerID) {
        WorkOrder workOrder = getRequiredWorkOrder(workOrderID);
        ensureWorkOrderCanBeEdited(workOrder);

        Worker worker = workerRepository.findById(workerID)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found"));

        if (worker.isArchived()) {
            throw new IllegalStateException("Archived workers cannot be assigned");
        }

        boolean alreadyAssigned = workOrder.getWorkers().stream()
                .anyMatch(assignedWorker -> assignedWorker.getWorkerID() == workerID);

        if (alreadyAssigned) {
            return workOrder;
        }

        workOrder.addWorker(worker);
        workOrder.setStatus(WorkOrderStatus.ACTIVE);

        return workOrderRepository.save(workOrder);
    }

    /**
     * Removes a worker from an editable work order and reopens the work order when
     * no workers remain.
     *
     * @param workOrderID work order being changed
     * @param workerID worker to remove
     * @return the saved work order
     */
    @Transactional
    public WorkOrder removeWorkerFromWorkOrder(Integer workOrderID, Integer workerID) {
        WorkOrder workOrder = getRequiredWorkOrder(workOrderID);
        ensureWorkOrderCanBeEdited(workOrder);

        Worker worker = workerRepository.findById(workerID)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found"));

        Worker assignedWorker = workOrder.getWorkers().stream()
                .filter(item -> item.getWorkerID() == worker.getWorkerID())
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Worker is not assigned to this work order"));

        workOrder.removeWorker(assignedWorker);

        if (workOrder.getWorkers().isEmpty()) {
            workOrder.setStatus(WorkOrderStatus.OPEN);
        }

        return workOrderRepository.save(workOrder);
    }

    @Transactional
    public WorkOrder removeCompanyFromWorkOrder(Integer workOrderID) {
        WorkOrder workOrder = getRequiredWorkOrder(workOrderID);
        ensureWorkOrderCanBeEdited(workOrder);
        workOrder.setCompany(null);

        return workOrderRepository.save(workOrder);
    }

    @Transactional
    public WorkOrder assignCompanyToWorkOrder(Integer workOrderID, Integer companyID) {
        WorkOrder workOrder = getRequiredWorkOrder(workOrderID);
        ensureWorkOrderCanBeEdited(workOrder);

        Company company = companyRepository.findById(companyID)
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        if (company.isArchived()) {
            throw new IllegalStateException("Archived companies cannot be assigned");
        }

        workOrder.setCompany(company);

        return workOrderRepository.save(workOrder);
    }

    @Transactional
    public WorkOrder updateComment(Integer workOrderID, String comment) {
        WorkOrder workOrder = getRequiredWorkOrder(workOrderID);
        ensureWorkOrderCanBeEdited(workOrder);
        workOrder.setComment(comment);

        return workOrderRepository.save(workOrder);
    }

    @Transactional
    public WorkOrder addItem(Integer workOrderID, WorkOrderItem item) {
        WorkOrder workOrder = getRequiredWorkOrder(workOrderID);
        ensureWorkOrderCanBeEdited(workOrder);

        validateItem(item.getItemName(), item.getQuantity(), item.getPrice(), item.getItemType());
        item.setWorkOrderItemID(0);
        workOrder.addItem(item);

        return workOrderRepository.save(workOrder);
    }

    @Transactional
    public WorkOrder updateItem(Integer workOrderID, Integer itemID, WorkOrderItem request) {
        WorkOrder workOrder = getRequiredWorkOrder(workOrderID);
        ensureWorkOrderCanBeEdited(workOrder);

        validateItem(request.getItemName(), request.getQuantity(), request.getPrice(), request.getItemType());
        WorkOrderItem item = workOrder.getItems().stream()
                .filter(existingItem -> existingItem.getWorkOrderItemID() == itemID)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Work order item not found"));

        item.setItemName(request.getItemName());
        item.setQuantity(request.getQuantity());
        item.setPrice(request.getPrice());
        item.setItemType(request.getItemType());

        return workOrderRepository.save(workOrder);
    }

    @Transactional
    public WorkOrder deleteItem(Integer workOrderID, Integer itemID) {
        WorkOrder workOrder = getRequiredWorkOrder(workOrderID);
        ensureWorkOrderCanBeEdited(workOrder);

        WorkOrderItem item = workOrder.getItems().stream()
                .filter(existingItem -> existingItem.getWorkOrderItemID() == itemID)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Work order item not found"));

        workOrder.removeItem(item);

        return workOrderRepository.save(workOrder);
    }

    @Transactional
    public DraftWorkOrder addDraftItem(Integer draftWorkOrderID, DraftWorkOrderItem item) {
        DraftWorkOrder draftWorkOrder = getRequiredDraftWorkOrder(draftWorkOrderID);

        validateItem(item.getItemName(), item.getQuantity(), item.getPrice(), item.getItemType());
        item.setDraftWorkOrderItemID(0);
        draftWorkOrder.addItem(item);

        return draftWorkOrderRepository.save(draftWorkOrder);
    }

    @Transactional
    public DraftWorkOrder updateDraftItem(Integer draftWorkOrderID, Integer itemID, DraftWorkOrderItem request) {
        DraftWorkOrder draftWorkOrder = getRequiredDraftWorkOrder(draftWorkOrderID);

        validateItem(request.getItemName(), request.getQuantity(), request.getPrice(), request.getItemType());
        DraftWorkOrderItem item = draftWorkOrder.getItems().stream()
                .filter(existingItem -> existingItem.getDraftWorkOrderItemID() == itemID)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Draft work order item not found"));

        item.setItemName(request.getItemName());
        item.setQuantity(request.getQuantity());
        item.setPrice(request.getPrice());
        item.setItemType(request.getItemType());

        return draftWorkOrderRepository.save(draftWorkOrder);
    }

    private void validateItem(String itemName, int quantity, java.math.BigDecimal price, com.atelicove.enums.ItemType itemType) {
        if (itemName == null || itemName.isBlank()) {
            throw new IllegalArgumentException("Item name is required");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Item quantity must be greater than zero");
        }
        if (price == null || price.signum() < 0) {
            throw new IllegalArgumentException("Item price is required and cannot be negative");
        }
        if (itemType == null) {
            throw new IllegalArgumentException("Item type is required");
        }
    }

	private void validateDateRange(LocalDateTime startDateTime, LocalDateTime endDateTime) {
		if (startDateTime != null && endDateTime != null && endDateTime.isBefore(startDateTime)) {
			throw new IllegalArgumentException("End date cannot precede start date");
		}
	}

    @Transactional
    public DraftWorkOrder deleteDraftItem(Integer draftWorkOrderID, Integer itemID) {
        DraftWorkOrder draftWorkOrder = getRequiredDraftWorkOrder(draftWorkOrderID);

        DraftWorkOrderItem item = draftWorkOrder.getItems().stream()
                .filter(existingItem -> existingItem.getDraftWorkOrderItemID() == itemID)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Draft work order item not found"));

        draftWorkOrder.removeItem(item);

        return draftWorkOrderRepository.save(draftWorkOrder);
    }

    @Transactional
    public void archiveDraftById(Integer draftWorkOrderID) {
        DraftWorkOrder draftWorkOrder = draftWorkOrderRepository.findById(draftWorkOrderID)
                .orElseThrow(() -> new IllegalArgumentException("Draft work order not found"));
        draftWorkOrder.setArchived(true);
        draftWorkOrder.setArchivedAt(LocalDateTime.now());
        draftWorkOrderRepository.save(draftWorkOrder);
    }

    @Transactional
    public DraftWorkOrder restoreDraftById(Integer draftWorkOrderID) {
        DraftWorkOrder draftWorkOrder = draftWorkOrderRepository.findById(draftWorkOrderID)
                .orElseThrow(() -> new IllegalArgumentException("Draft work order not found"));
        draftWorkOrder.setArchived(false);
        draftWorkOrder.setArchivedAt(null);
        return draftWorkOrderRepository.save(draftWorkOrder);
    }

    @Transactional
    public void deleteDraftPermanentlyById(Integer draftWorkOrderID) {
        DraftWorkOrder draftWorkOrder = draftWorkOrderRepository.findById(draftWorkOrderID)
                .orElseThrow(() -> new IllegalArgumentException("Draft work order not found"));
        if (!draftWorkOrder.isArchived()) {
            throw new IllegalStateException("Only archived draft work orders can be permanently deleted");
        }
        if (draftWorkOrder.getDraftProject() != null) {
            draftWorkOrder.getDraftProject().removeDraftWorkOrder(draftWorkOrder);
        }
        draftWorkOrderRepository.delete(draftWorkOrder);
    }

    /**
     * Archives a completed work order instead of deleting it. Open, active,
     * review, and draft work orders stay visible so unfinished work is not hidden.
     *
     * @param id completed work order to archive
     */
    @Transactional
    public void archiveById(Integer id) {
        WorkOrder workOrder = getRequiredWorkOrder(id);

        if (workOrder.getStatus() != WorkOrderStatus.COMPLETE) {
            throw new IllegalStateException("Only completed work orders can be archived");
        }

        archiveWorkOrder(workOrder);
    }

    private void archiveWorkOrder(WorkOrder workOrder) {
        workOrder.setArchived(true);
        workOrder.setArchivedAt(LocalDateTime.now());
        workOrderRepository.save(workOrder);
    }

    @Transactional
    public WorkOrder restoreById(Integer id) {
        WorkOrder workOrder = getRequiredWorkOrder(id);
        workOrder.setArchived(false);
        workOrder.setArchivedAt(null);
        return workOrderRepository.save(workOrder);
    }

    /**
     * Permanently removes only an accidental empty open work order. Archived and
     * completed records remain available as business history.
     *
     * @param id work order to permanently delete
     */
    @Transactional
    public void deletePermanentlyById(Integer id) {
        WorkOrder workOrder = getRequiredWorkOrder(id);

        if (!canDeleteMistakenWorkOrder(workOrder)) {
            throw new IllegalStateException("Only empty open work orders without business history can be permanently deleted");
        }

        workOrder.setWorkers(new HashSet<>());
        workOrderRepository.delete(workOrder);
    }

    private boolean canDeleteMistakenWorkOrder(WorkOrder workOrder) {
        boolean hasItems = workOrder.getItems() != null && !workOrder.getItems().isEmpty();
        boolean hasWorkers = workOrder.getWorkers() != null && !workOrder.getWorkers().isEmpty();

        return !workOrder.isArchived() &&
                workOrder.getStatus() == WorkOrderStatus.OPEN &&
                workOrder.getEndDateTime() == null &&
                !hasItems &&
                !hasWorkers &&
                workOrder.getCompany() == null &&
                workOrder.getProject() == null &&
                (workOrder.getComment() == null || workOrder.getComment().isBlank());
    }
    
    public long count() {
        return workOrderRepository.countByArchivedFalse();
    }
    
    // Work order add/delete/submit stuff
    
    /**
     * Sends an editable work order to admin review after the worker-facing edits are
     * finished.
     *
     * @param workOrderID work order to submit
     * @return the saved work order with an in-review status
     */
    @Transactional
    public WorkOrder submitForReview(Integer workOrderID) {
        WorkOrder workOrder = getRequiredWorkOrder(workOrderID);
        ensureWorkOrderCanBeEdited(workOrder);

        if (workOrder.getStatus() != WorkOrderStatus.ACTIVE &&
                workOrder.getStatus() != WorkOrderStatus.OPEN) {
            throw new IllegalStateException("Only open or active work orders can be submitted");
        }

        workOrder.setStatus(WorkOrderStatus.IN_REVIEW);

        return workOrderRepository.save(workOrder);
    }
    
    /**
     * Completes a work order after review. Completion requires a valid company,
     * worker assignment, dates, and at least one item.
     *
     * @param workOrderID work order to approve
     * @return the saved completed work order
     */
    @Transactional
    public WorkOrder approveWorkOrder(Integer workOrderID) {
    	WorkOrder workOrder = getRequiredWorkOrder(workOrderID);
		ensureWorkOrderCanBeEdited(workOrder);
    	
    	if(workOrder.getStatus() != WorkOrderStatus.IN_REVIEW) {
    		throw new IllegalStateException("Only work orders under review can be approved");
    	}
    	
    	validateForCompletion(workOrder);
    	workOrder.setStatus(WorkOrderStatus.COMPLETE);
    	
    	return workOrderRepository.save(workOrder);
    }
    
    @Transactional
    public WorkOrder rejectWorkOrder(Integer workOrderID) {
    	WorkOrder workOrder = getRequiredWorkOrder(workOrderID);
		ensureWorkOrderCanBeEdited(workOrder);
    	
    	if(workOrder.getStatus() != WorkOrderStatus.IN_REVIEW) {
    		throw new IllegalStateException("Only work orders under review can be rejected");
    	}
    	
        workOrder.setStatus(WorkOrderStatus.ACTIVE);
        
        return workOrderRepository.save(workOrder);
    }
    
    // Private Helper for getting Required Work Order
    private WorkOrder getRequiredWorkOrder(Integer workOrderId) {
        Optional<WorkOrder> result =
                workOrderRepository.findById(workOrderId);

        if (result.isEmpty()) {
            throw new IllegalArgumentException("Work order not found");
        }

        return result.get();
    }

    private DraftWorkOrder getRequiredDraftWorkOrder(Integer draftWorkOrderID) {
        return findDraftById(draftWorkOrderID)
                .orElseThrow(() -> new IllegalArgumentException("Draft work order not found"));
    }

    private void ensureWorkOrderCanBeEdited(WorkOrder workOrder) {
        if (workOrder.isArchived()) {
            throw new IllegalStateException("Archived work orders cannot be edited");
        }
        if (workOrder.getStatus() == WorkOrderStatus.COMPLETE) {
            throw new IllegalStateException("Completed work orders are sealed and cannot be edited");
        }
    }
    
    /**
     * Checks the required fields that make a work order complete enough to seal.
     *
     * @param workOrder work order being approved
     */
    private void validateForCompletion(WorkOrder workOrder) {
        if (workOrder.getWorkOrderID() <= 0) {
            throw new IllegalStateException("Work order ID is required");
        }

        if (workOrder.getWorkers() == null ||
                workOrder.getWorkers().isEmpty()) {
            throw new IllegalStateException("At least one worker must be assigned");
        }

        if (workOrder.getCompany() == null ||
                workOrder.getCompany().getCompanyID() <= 0) {
            throw new IllegalStateException(
                    "A valid company must be assigned");
        }

        if (workOrder.getStartDateTime() == null) {
            throw new IllegalStateException("Start date and time are required");
        }

        if (workOrder.getEndDateTime() == null) {
            throw new IllegalStateException("End date and time are required");
        }

        if (workOrder.getItems() == null ||
                workOrder.getItems().isEmpty()) {
            throw new IllegalStateException("At least one item is required");
        }
    }
}
