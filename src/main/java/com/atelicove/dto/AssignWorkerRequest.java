package com.atelicove.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AssignWorkerRequest(
        @NotNull @Positive Integer workerID) {
}
