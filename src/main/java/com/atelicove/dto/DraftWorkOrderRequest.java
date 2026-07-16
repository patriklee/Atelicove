package com.atelicove.dto;

import java.math.BigDecimal;
import java.util.List;

import com.atelicove.enums.DraftProposalStatus;
import com.atelicove.enums.ItemType;

public record DraftWorkOrderRequest(
        Integer sourceWorkOrderID,
        Integer plannedStaffingID,
        Integer plannedCompanyID,
        Integer sourceProjectID,
        String workOrderName,
        DraftProposalStatus proposalStatus,
        String comment,
        List<Item> items) {

    public record Item(
            Integer draftWorkOrderItemID,
            String itemName,
            int quantity,
            BigDecimal price,
            ItemType itemType) {
    }
}
