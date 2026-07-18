package com.atelicove.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PasswordResetRequest {
	
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must contain between 8 and 100 characters")
    private String newPassword;

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
