package com.atelicove.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.atelicove.entities.DraftProject;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.DraftWorkOrderItem;
import com.atelicove.entities.PlannedStaffing;
import com.atelicove.entities.StaffingSlot;
import com.atelicove.enums.DraftProposalStatus;
import com.atelicove.enums.ItemType;

public record DraftProjectDTO(
        Long draftProjectID,
        String draftName,
        String description,
        BigDecimal budget,
        SourceProject sourceProject,
        boolean archived,
        LocalDateTime archivedAt,
        LocalDateTime createdAt,
        LocalDateTime lastModifiedAt,
        List<DraftWorkOrderDTO> draftWorkOrders,
        List<PlannedStaffingDTO> plannedStaffing) {

    public static DraftProjectDTO from(DraftProject draft) {
        SourceProject source = draft.getSourceProject() == null
                ? null
                : new SourceProject(
                        draft.getSourceProject().getProjectID(),
                        draft.getSourceProject().getProjectName());
        return new DraftProjectDTO(
                draft.getDraftProjectId(),
                draft.getDraftName(),
                draft.getDescription(),
                draft.getBudget(),
                source,
                draft.isArchived(),
                draft.getArchivedAt(),
                draft.getCreatedAt(),
                draft.getLastModifiedAt(),
                draft.getDraftWorkOrders().stream().map(DraftWorkOrderDTO::from).toList(),
                draft.getPlannedStaffing().stream().map(PlannedStaffingDTO::from).toList());
    }

    public record SourceProject(Integer projectID, String projectName) {
    }

    public record DraftWorkOrderDTO(
            Integer draftWorkOrderID,
            Integer workOrderID,
            String status,
            Integer sourceWorkOrderID,
            Integer plannedTeamID,
            String plannedTeamName,
            Integer plannedCompanyID,
            String plannedCompanyName,
            Integer sourceProjectID,
            String workOrderName,
            DraftProposalStatus proposalStatus,
            String comment,
            boolean archived,
            LocalDateTime archivedAt,
            List<DraftWorkOrderItemDTO> items) {

        public static DraftWorkOrderDTO from(DraftWorkOrder draft) {
            return new DraftWorkOrderDTO(
                    draft.getDraftWorkOrderID(),
                    draft.getDraftWorkOrderID(),
                    "DRAFT",
                    draft.getSourceWorkOrderID(),
                    draft.getPlannedTeamID(),
                    draft.getPlannedTeamName(),
                    draft.getPlannedCompanyID(),
                    draft.getPlannedCompanyName(),
                    draft.getSourceProjectID(),
                    draft.getWorkOrderName(),
                    draft.getProposalStatus(),
                    draft.getComment(),
                    draft.isArchived(),
                    draft.getArchivedAt(),
                    draft.getItems().stream().map(DraftWorkOrderItemDTO::from).toList());
        }
    }

    public record DraftWorkOrderItemDTO(
            Integer draftWorkOrderItemID,
            String itemName,
            int quantity,
            BigDecimal price,
            ItemType itemType) {

        static DraftWorkOrderItemDTO from(DraftWorkOrderItem item) {
            return new DraftWorkOrderItemDTO(
                    item.getDraftWorkOrderItemID(),
                    item.getItemName(),
                    item.getQuantity(),
                    item.getPrice(),
                    item.getItemType());
        }
    }

    public record PlannedStaffingDTO(
            Integer plannedStaffingID,
            Integer teamID,
            Integer sourceTeamID,
            String staffingName,
            String teamName,
            String notes,
            List<StaffingSlotDTO> staffingSlots,
            List<StaffingSlotDTO> workers) {

        public static PlannedStaffingDTO from(PlannedStaffing staffing) {
            List<StaffingSlotDTO> slots = staffing.getStaffingSlots().stream()
                    .map(StaffingSlotDTO::from)
                    .toList();
            return new PlannedStaffingDTO(
                    staffing.getPlannedStaffingID(),
                    staffing.getPlannedStaffingID(),
                    staffing.getSourceTeamID(),
                    staffing.getStaffingName(),
                    staffing.getStaffingName(),
                    staffing.getNotes(),
                    slots,
                    slots);
        }
    }

    public record StaffingSlotDTO(
            Integer staffingSlotID,
            Integer workerID,
            String workerName,
            String workerDisplayName,
            String roleName,
            String roleTitle,
            String roleDescription) {

        static StaffingSlotDTO from(StaffingSlot slot) {
            return new StaffingSlotDTO(
                    slot.getStaffingSlotID(),
                    slot.getWorkerID(),
                    slot.getWorkerName(),
                    slot.getWorkerName(),
                    slot.getRoleName(),
                    slot.getRoleName(),
                    slot.getRoleDescription());
        }
    }
}
