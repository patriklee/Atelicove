package com.atelicove.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateWorkOrderCommentRequest(
        @NotBlank @Size(max = 4000) String comment) {
}
