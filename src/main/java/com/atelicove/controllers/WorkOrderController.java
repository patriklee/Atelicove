package com.atelicove.controllers;

import org.springframework.web.bind.annotation.*;

import com.atelicove.entities.WorkOrder;
import com.atelicove.dto.AssignCompanyRequest;
import com.atelicove.dto.AssignWorkerRequest;
import com.atelicove.dto.CreateWorkOrderItemRequest;
import com.atelicove.dto.CreateWorkOrderRequest;
import com.atelicove.dto.UpdateWorkOrderCommentRequest;
import com.atelicove.dto.UpdateWorkOrderItemRequest;
import com.atelicove.services.WorkOrderService;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import com.atelicove.services.AuthorizationService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/workorders")
public class WorkOrderController {

    private final WorkOrderService workOrderService;
    private final AuthorizationService authorizationService;

    public WorkOrderController(WorkOrderService workOrderService, AuthorizationService authorizationService) {
        this.workOrderService = workOrderService;
        this.authorizationService = authorizationService;
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/start")
    public WorkOrder startWorkOrder(@PathVariable Integer id) {
    	return workOrderService.startWorkOrder(id);
    }

    @GetMapping
    public List<WorkOrder> getAllWorkOrders(Authentication authentication) {
        return authorizationService.visibleActiveWorkOrders(authentication);
    }

    @GetMapping("/all-with-archived")
    public List<WorkOrder> getAllWorkOrdersIncludingArchived(Authentication authentication) {
        return authorizationService.visibleAllWorkOrders(authentication);
    }

    @GetMapping("/archived")
    public List<WorkOrder> getArchivedWorkOrders(Authentication authentication) {
        return authorizationService.visibleArchivedWorkOrders(authentication);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrder> getWorkOrderById(@PathVariable Integer id, Authentication authentication) {
        authorizationService.requireWorkOrderAccess(id, authentication);
    	
    	Optional<WorkOrder> workOrder = workOrderService.findById(id);
    	
    	if(workOrder.isPresent()) {
    		return ResponseEntity.ok(workOrder.get());
    	}
    	
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/company/{companyID}")
    public List<WorkOrder> getWorkOrderByCompany(@PathVariable Integer companyID, Authentication authentication) {
        return authorizationService.visibleActiveWorkOrdersForCompany(companyID, authentication);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public WorkOrder addWorkOrder(@Valid @RequestBody CreateWorkOrderRequest request) {
        return workOrderService.createWorkOrder(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/assign")
    public WorkOrder reassignWorkOrder(@PathVariable Integer id, @Valid @RequestBody AssignWorkerRequest request) {
        return workOrderService.reassignWorkOrder(id, request.workerID());
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
    public WorkOrder assignCompanyToWorkOrder(@PathVariable Integer id, @Valid @RequestBody AssignCompanyRequest request) {
        return workOrderService.assignCompanyToWorkOrder(id, request.companyID());
    }

    @PutMapping("/{id}/comment")
    public WorkOrder updateComment(@PathVariable Integer id, @Valid @RequestBody UpdateWorkOrderCommentRequest request, Authentication authentication) {
        authorizationService.requireWorkOrderAccess(id, authentication);
        return workOrderService.updateComment(id, request.comment());
    }

    @PostMapping("/{id}/items")
    public WorkOrder addItem(@PathVariable Integer id, @Valid @RequestBody CreateWorkOrderItemRequest request, Authentication authentication) {
        authorizationService.requireWorkOrderAccess(id, authentication);
        return workOrderService.addItem(id, request);
    }

    @PutMapping("/{id}/items/{itemID}")
    public WorkOrder updateItem(@PathVariable Integer id, @PathVariable Integer itemID, @Valid @RequestBody UpdateWorkOrderItemRequest request, Authentication authentication) {
        authorizationService.requireWorkOrderAccess(id, authentication);
        return workOrderService.updateItem(id, itemID, request);
    }

    @DeleteMapping("/{id}/items/{itemID}")
    public WorkOrder deleteItem(@PathVariable Integer id, @PathVariable Integer itemID, Authentication authentication) {
        authorizationService.requireWorkOrderAccess(id, authentication);
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
    
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/count")
    public long getWorkOrderCount() {
        return workOrderService.count();
    }
    
    @PutMapping("/{id}/submit")
    public WorkOrder submitForReview(@PathVariable Integer id, Authentication authentication) {
        authorizationService.requireWorkOrderAccess(id, authentication);
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
