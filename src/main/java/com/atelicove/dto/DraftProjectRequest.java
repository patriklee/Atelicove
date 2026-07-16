package com.atelicove.dto;

import java.math.BigDecimal;

public record DraftProjectRequest(
        String draftName,
        String description,
        BigDecimal budget,
        Integer sourceProjectID) {
}
