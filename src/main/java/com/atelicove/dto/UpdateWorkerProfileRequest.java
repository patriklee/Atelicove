package com.atelicove.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateWorkerProfileRequest {

    @NotBlank @Size(max = 100)
    private String workerFName;
    @NotBlank @Size(max = 100)
    private String workerLName;
    @Size(max = 150)
    private String workerDisplayName;
    @NotBlank @Email @Size(max = 254)
    private String workerEmail;

    public String getWorkerFName() { return workerFName; }
    public void setWorkerFName(String workerFName) { this.workerFName = workerFName; }
    public String getWorkerLName() { return workerLName; }
    public void setWorkerLName(String workerLName) { this.workerLName = workerLName; }
    public String getWorkerDisplayName() { return workerDisplayName; }
    public void setWorkerDisplayName(String workerDisplayName) { this.workerDisplayName = workerDisplayName; }
    public String getWorkerEmail() { return workerEmail; }
    public void setWorkerEmail(String workerEmail) { this.workerEmail = workerEmail; }
}
