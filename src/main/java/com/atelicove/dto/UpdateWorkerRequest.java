package com.atelicove.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateWorkerRequest {

    @NotBlank @Size(max = 100)
    private String workerFName;
    @NotBlank @Size(max = 100)
    private String workerLName;
    @Size(max = 150)
    private String workerDisplayName;
    @NotBlank @Size(min = 3, max = 100)
    private String workerUser;
    @NotBlank @Email @Size(max = 254)
    private String workerEmail;
    @Size(max = 150)
    private String roleTitle;
    @Size(max = 1000)
    private String roleDescription;
    private boolean admin;

    public String getWorkerFName() { return workerFName; }
    public void setWorkerFName(String workerFName) { this.workerFName = workerFName; }
    public String getWorkerLName() { return workerLName; }
    public void setWorkerLName(String workerLName) { this.workerLName = workerLName; }
    public String getWorkerDisplayName() { return workerDisplayName; }
    public void setWorkerDisplayName(String workerDisplayName) { this.workerDisplayName = workerDisplayName; }
    public String getWorkerUser() { return workerUser; }
    public void setWorkerUser(String workerUser) { this.workerUser = workerUser; }
    public String getWorkerEmail() { return workerEmail; }
    public void setWorkerEmail(String workerEmail) { this.workerEmail = workerEmail; }
    public String getRoleTitle() { return roleTitle; }
    public void setRoleTitle(String roleTitle) { this.roleTitle = roleTitle; }
    public String getRoleDescription() { return roleDescription; }
    public void setRoleDescription(String roleDescription) { this.roleDescription = roleDescription; }
    public boolean isAdmin() { return admin; }
    public void setAdmin(boolean admin) { this.admin = admin; }
}
