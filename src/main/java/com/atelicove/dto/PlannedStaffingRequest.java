package com.atelicove.dto;

import java.util.List;

public record PlannedStaffingRequest(
        Integer sourceTeamID,
        String staffingName,
        String notes,
        List<Slot> staffingSlots) {

    public record Slot(
            Integer staffingSlotID,
            Integer workerID,
            String workerName,
            String roleName,
            String roleDescription) {
    }
}
