package com.atelicove.controllers;

import org.springframework.web.bind.annotation.*;

import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.services.WorkOrderService;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;

@RestController
@RequestMapping("/workorders")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    public WorkOrderController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/start")
    public WorkOrder startWorkOrder(@PathVariable Integer id) {
    	return workOrderService.startWorkOrder(id);
    }

    @GetMapping
    public List<WorkOrder> getAllWorkOrders() {
        return workOrderService.findActive();
    }

    @GetMapping("/all-with-archived")
    public List<WorkOrder> getAllWorkOrdersIncludingArchived() {
        return workOrderService.findAll();
    }

    @GetMapping("/archived")
    public List<WorkOrder> getArchivedWorkOrders() {
        return workOrderService.findArchived();
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrder> getWorkOrderById(@PathVariable Integer id) {
    	
    	Optional<WorkOrder> workOrder = workOrderService.findById(id);
    	
    	if(workOrder.isPresent()) {
    		return ResponseEntity.ok(workOrder.get());
    	}
    	
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/company/{companyID}")
    public List<WorkOrder> getWorkOrderByCompany(@PathVariable Integer companyID) {
        return workOrderService.findByCompanyID(companyID);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public WorkOrder addWorkOrder(@RequestBody WorkOrder workOrder) {
        return workOrderService.createWorkOrder(workOrder);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/assign")
    public WorkOrder reassignWorkOrder(@PathVariable Integer id, @RequestBody Map<String, Integer> request) {
    	return workOrderService.reassignWorkOrder(id, request.get("workerID"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/workers/{workerID}")
    public WorkOrder removeWorkerFromWorkOrder(@PathVariable Integer id, @PathVariable Integer workerID) {
    	return workOrderService.removeWorkerFromWorkOrder(id, workerID);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/company")
    public WorkOrder removeCompanyFromWorkOrder(@PathVariable Integer id) {
    	return workOrderService.removeCompanyFromWorkOrder(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/company")
    public WorkOrder assignCompanyToWorkOrder(@PathVariable Integer id, @RequestBody Map<String, Integer> request) {
    	return workOrderService.assignCompanyToWorkOrder(id, request.get("companyID"));
    }

    @PutMapping("/{id}/comment")
    public WorkOrder updateComment(@PathVariable Integer id, @RequestBody Map<String, String> request) {
    	return workOrderService.updateComment(id, request.get("comment"));
    }

    @PostMapping("/{id}/items")
    public WorkOrder addItem(@PathVariable Integer id, @RequestBody WorkOrderItem item) {
    	return workOrderService.addItem(id, item);
    }

    @PutMapping("/{id}/items/{itemID}")
    public WorkOrder updateItem(@PathVariable Integer id, @PathVariable Integer itemID, @RequestBody WorkOrderItem item) {
    	return workOrderService.updateItem(id, itemID, item);
    }

    @DeleteMapping("/{id}/items/{itemID}")
    public WorkOrder deleteItem(@PathVariable Integer id, @PathVariable Integer itemID) {
    	return workOrderService.deleteItem(id, itemID);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archiveWorkOrder(@PathVariable Integer id) {
    	workOrderService.archiveById(id);
    	return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/restore")
    public WorkOrder restoreWorkOrder(@PathVariable Integer id) {
    	return workOrderService.restoreById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> deleteWorkOrderPermanently(@PathVariable Integer id) {
    	workOrderService.deletePermanentlyById(id);
    	return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/count")
    public long getWorkOrderCount() {
        return workOrderService.count();
    }
    
    @PutMapping("/{id}/submit")
    public WorkOrder submitForReview(@PathVariable Integer id) {
    	return workOrderService.submitForReview(id);
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/approve")
    public WorkOrder approveWorkOrder(@PathVariable Integer id) {
    	return workOrderService.approveWorkOrder(id);
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/reject")
    public WorkOrder rejectWorkOrder(@PathVariable Integer id) {
    	return workOrderService.rejectWorkOrder(id);
    }
}
