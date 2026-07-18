package com.atelicove.dto;

import java.math.BigDecimal;

import com.atelicove.enums.ItemType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record UpdateWorkOrderItemRequest(
        @NotBlank @Size(max = 255) String itemName,
        @Positive int quantity,
        @NotNull @PositiveOrZero BigDecimal price,
        @NotNull ItemType itemType) {
}
