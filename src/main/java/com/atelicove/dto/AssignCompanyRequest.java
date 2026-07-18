package com.atelicove.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AssignCompanyRequest(
        @NotNull @Positive Integer companyID) {
}
