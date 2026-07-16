package com.atelicove.controllers;

import org.springframework.web.bind.annotation.*;

import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.DraftWorkOrderItem;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.services.WorkOrderService;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import com.atelicove.services.AuthorizationService;
import java.util.Map;

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
        return authorizationService.visibleWorkOrders(workOrderService.findActive(), authentication);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/drafts")
    public List<DraftWorkOrder> getDraftWorkOrders() {
        return workOrderService.findDrafts();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/drafts/{id}")
    public ResponseEntity<DraftWorkOrder> getDraftWorkOrderById(@PathVariable Integer id) {
        return workOrderService.findDraftById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/drafts/archived")
    public List<DraftWorkOrder> getArchivedDraftWorkOrders() {
        return workOrderService.findArchivedDrafts();
    }

    @GetMapping("/all-with-archived")
    public List<WorkOrder> getAllWorkOrdersIncludingArchived(Authentication authentication) {
        return authorizationService.visibleWorkOrders(workOrderService.findAll(), authentication);
    }

    @GetMapping("/archived")
    public List<WorkOrder> getArchivedWorkOrders(Authentication authentication) {
        return authorizationService.visibleWorkOrders(workOrderService.findArchived(), authentication);
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
        return authorizationService.visibleWorkOrders(workOrderService.findByCompanyID(companyID), authentication);
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
    public WorkOrder updateComment(@PathVariable Integer id, @RequestBody Map<String, String> request, Authentication authentication) {
        authorizationService.requireWorkOrderAccess(id, authentication);
    	return workOrderService.updateComment(id, request.get("comment"));
    }

    @PostMapping("/{id}/items")
    public WorkOrder addItem(@PathVariable Integer id, @RequestBody WorkOrderItem item, Authentication authentication) {
        authorizationService.requireWorkOrderAccess(id, authentication);
    	return workOrderService.addItem(id, item);
    }

    @PutMapping("/{id}/items/{itemID}")
    public WorkOrder updateItem(@PathVariable Integer id, @PathVariable Integer itemID, @RequestBody WorkOrderItem item, Authentication authentication) {
        authorizationService.requireWorkOrderAccess(id, authentication);
    	return workOrderService.updateItem(id, itemID, item);
    }

    @DeleteMapping("/{id}/items/{itemID}")
    public WorkOrder deleteItem(@PathVariable Integer id, @PathVariable Integer itemID, Authentication authentication) {
        authorizationService.requireWorkOrderAccess(id, authentication);
    	return workOrderService.deleteItem(id, itemID);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/drafts/{id}/items")
    public DraftWorkOrder addDraftItem(@PathVariable Integer id, @RequestBody DraftWorkOrderItem item) {
        return workOrderService.addDraftItem(id, item);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/drafts/{id}/items/{itemID}")
    public DraftWorkOrder updateDraftItem(@PathVariable Integer id, @PathVariable Integer itemID, @RequestBody DraftWorkOrderItem item) {
        return workOrderService.updateDraftItem(id, itemID, item);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/drafts/{id}/items/{itemID}")
    public DraftWorkOrder deleteDraftItem(@PathVariable Integer id, @PathVariable Integer itemID) {
        return workOrderService.deleteDraftItem(id, itemID);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/drafts/{id}")
    public ResponseEntity<Void> archiveDraftWorkOrder(@PathVariable Integer id) {
        workOrderService.archiveDraftById(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/drafts/{id}/restore")
    public DraftWorkOrder restoreDraftWorkOrder(@PathVariable Integer id) {
        return workOrderService.restoreDraftById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/drafts/{id}/permanent")
    public ResponseEntity<Void> deleteDraftWorkOrderPermanently(@PathVariable Integer id) {
        workOrderService.deleteDraftPermanentlyById(id);
        return ResponseEntity.noContent().build();
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
