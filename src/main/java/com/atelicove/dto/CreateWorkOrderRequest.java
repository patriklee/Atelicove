package com.atelicove.dto;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateWorkOrderRequest(
        LocalDateTime startDateTime,
        LocalDateTime endDateTime,
        @Size(max = 4000) String comment,
        @Positive Integer companyID,
        List<@NotNull @Positive Integer> workerIDs) {
}
