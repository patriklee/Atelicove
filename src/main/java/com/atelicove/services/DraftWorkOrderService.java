package com.atelicove.services;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atelicove.dto.DraftWorkOrderRequest;
import com.atelicove.entities.Company;
import com.atelicove.entities.DraftProject;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.DraftWorkOrderItem;
import com.atelicove.entities.PlannedStaffing;
import com.atelicove.entities.Project;
import com.atelicove.entities.WorkOrder;
import com.atelicove.entities.WorkOrderItem;
import com.atelicove.enums.DraftProposalStatus;
import com.atelicove.enums.ItemType;
import com.atelicove.enums.WorkOrderStatus;
import com.atelicove.repositories.CompanyRepository;
import com.atelicove.repositories.DraftProjectRepository;
import com.atelicove.repositories.DraftWorkOrderRepository;
import com.atelicove.repositories.ProjectRepository;
import com.atelicove.repositories.WorkOrderRepository;

@Service
public class DraftWorkOrderService {

    private final DraftProjectRepository draftProjectRepository;
    private final DraftWorkOrderRepository draftWorkOrderRepository;
    private final WorkOrderRepository workOrderRepository;
    private final CompanyRepository companyRepository;
    private final ProjectRepository projectRepository;

    public DraftWorkOrderService(
            DraftProjectRepository draftProjectRepository,
            DraftWorkOrderRepository draftWorkOrderRepository,
            WorkOrderRepository workOrderRepository,
            CompanyRepository companyRepository,
            ProjectRepository projectRepository) {
        this.draftProjectRepository = draftProjectRepository;
        this.draftWorkOrderRepository = draftWorkOrderRepository;
        this.workOrderRepository = workOrderRepository;
        this.companyRepository = companyRepository;
        this.projectRepository = projectRepository;
    }

    public Optional<DraftWorkOrder> find(Long draftProjectID, Integer draftWorkOrderID) {
        return draftProjectRepository.findById(draftProjectID)
                .flatMap(draft -> draft.getDraftWorkOrders().stream()
                        .filter(draftWorkOrder -> draftWorkOrder.getDraftWorkOrderID() == draftWorkOrderID)
                        .findFirst());
    }

    @Transactional
    public DraftProject create(Long draftProjectID, DraftWorkOrderRequest request) {
        DraftProject draft = requiredEditableDraft(draftProjectID);
        DraftWorkOrder draftWorkOrder = new DraftWorkOrder();
        apply(draft, draftWorkOrder, request, true);
        draft.addDraftWorkOrder(draftWorkOrder);
        return draftProjectRepository.save(draft);
    }

    @Transactional
    public DraftProject update(
            Long draftProjectID,
            Integer draftWorkOrderID,
            DraftWorkOrderRequest request) {
        DraftProject draft = requiredEditableDraft(draftProjectID);
        DraftWorkOrder draftWorkOrder = requiredDraftWorkOrder(draft, draftWorkOrderID);
        if (draftWorkOrder.isArchived()) {
            throw new IllegalStateException("Archived draft work orders cannot be edited");
        }
        apply(draft, draftWorkOrder, request, false);
        return draftProjectRepository.save(draft);
    }

    @Transactional
    public DraftProject delete(Long draftProjectID, Integer draftWorkOrderID) {
        DraftProject draft = requiredEditableDraft(draftProjectID);
        DraftWorkOrder draftWorkOrder = requiredDraftWorkOrder(draft, draftWorkOrderID);
        draft.removeDraftWorkOrder(draftWorkOrder);
        draftWorkOrderRepository.delete(draftWorkOrder);
        return draftProjectRepository.save(draft);
    }

    private void apply(
            DraftProject draft,
            DraftWorkOrder target,
            DraftWorkOrderRequest request,
            boolean creating) {
        if (request == null) {
            throw new IllegalArgumentException("Draft work order details are required");
        }

        WorkOrder source = resolveSourceWorkOrder(request.sourceWorkOrderID());
        PlannedStaffing staffing = resolvePlannedStaffing(draft, request.plannedStaffingID());
        Company company = request.plannedCompanyID() == null && source != null
                ? source.getCompany()
                : resolveCompany(request.plannedCompanyID());
        if (company != null && company.isArchived()) {
            throw new IllegalStateException("Archived companies cannot be used in draft work orders");
        }

        target.setSourceWorkOrderID(request.sourceWorkOrderID());
        target.setPlannedTeamID(staffing == null ? null : staffing.getPlannedStaffingID());
        target.setPlannedTeamName(staffing == null ? null : staffing.getStaffingName());
        target.setPlannedCompanyID(company == null ? null : company.getCompanyID());
        target.setPlannedCompanyName(company == null ? null : company.getCompanyName());
        target.setSourceProjectID(request.sourceProjectID());
        target.setWorkOrderName(normalizeOptional(request.workOrderName()));
        target.setProposalStatus(request.proposalStatus() == null
                ? DraftProposalStatus.PRIVATE
                : request.proposalStatus());
        target.setComment(request.comment() != null
                ? request.comment()
                : source == null ? null : source.getComment());
        target.setArchived(false);
        target.setArchivedAt(null);

        validateSourceProject(request.sourceProjectID());

        if (request.items() != null) {
            replaceDraftItems(target, request.items());
        } else if (creating && source != null) {
            copySourceItems(target, source.getItems());
        }
    }

    private WorkOrder resolveSourceWorkOrder(Integer sourceWorkOrderID) {
        if (sourceWorkOrderID == null) {
            return null;
        }
        WorkOrder source = workOrderRepository.findById(sourceWorkOrderID)
                .orElseThrow(() -> new IllegalArgumentException("Source work order not found"));
        if (source.isArchived()
                || (source.getStatus() != WorkOrderStatus.OPEN
                        && source.getStatus() != WorkOrderStatus.ACTIVE)) {
            throw new IllegalStateException("Archived or read-only work orders cannot be used as draft sources");
        }
        return source;
    }

    private void validateSourceProject(Integer sourceProjectID) {
        if (sourceProjectID == null) {
            return;
        }
        Project sourceProject = projectRepository.findById(sourceProjectID)
                .orElseThrow(() -> new IllegalArgumentException("Source project not found"));
        if (sourceProject.isArchived()) {
            throw new IllegalStateException("Archived projects cannot be used as draft sources");
        }
    }

    private PlannedStaffing resolvePlannedStaffing(DraftProject draft, Integer plannedStaffingID) {
        if (plannedStaffingID == null) {
            return null;
        }
        return draft.getPlannedStaffing().stream()
                .filter(staffing -> staffing.getPlannedStaffingID() == plannedStaffingID)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Planned staffing not found"));
    }

    private Company resolveCompany(Integer companyID) {
        if (companyID == null) {
            return null;
        }
        Company company = companyRepository.findById(companyID)
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        if (company.isArchived()) {
            throw new IllegalStateException("Archived companies cannot be used in draft work orders");
        }
        return company;
    }

    private void replaceDraftItems(DraftWorkOrder target, List<DraftWorkOrderRequest.Item> requests) {
        for (DraftWorkOrderItem item : List.copyOf(target.getItems())) {
            target.removeItem(item);
        }
        for (DraftWorkOrderRequest.Item request : requests) {
            validateItem(request.itemName(), request.quantity(), request.price(), request.itemType());
            DraftWorkOrderItem item = new DraftWorkOrderItem();
            item.setItemName(request.itemName().trim());
            item.setQuantity(request.quantity());
            item.setPrice(request.price());
            item.setItemType(request.itemType());
            target.addItem(item);
        }
    }

    private void copySourceItems(DraftWorkOrder target, List<WorkOrderItem> sourceItems) {
        for (WorkOrderItem sourceItem : sourceItems) {
            DraftWorkOrderItem item = new DraftWorkOrderItem();
            item.setItemName(sourceItem.getItemName());
            item.setQuantity(sourceItem.getQuantity());
            item.setPrice(sourceItem.getPrice());
            item.setItemType(sourceItem.getItemType());
            target.addItem(item);
        }
    }

    private void validateItem(String name, int quantity, BigDecimal price, ItemType itemType) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Draft work order item name is required");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Draft work order item quantity must be greater than zero");
        }
        if (price == null || price.signum() < 0) {
            throw new IllegalArgumentException("Draft work order item price cannot be negative");
        }
        if (itemType == null) {
            throw new IllegalArgumentException("Draft work order item type is required");
        }
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private DraftProject requiredEditableDraft(Long id) {
        DraftProject draft = draftProjectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Draft project not found"));
        if (draft.isArchived()) {
            throw new IllegalStateException("Archived draft projects cannot be edited");
        }
        return draft;
    }

    private DraftWorkOrder requiredDraftWorkOrder(DraftProject draft, Integer draftWorkOrderID) {
        return draft.getDraftWorkOrders().stream()
                .filter(draftWorkOrder -> draftWorkOrder.getDraftWorkOrderID() == draftWorkOrderID)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Draft work order not found"));
    }
}
