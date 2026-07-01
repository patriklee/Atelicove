package com.atelicove.dto;

import java.time.LocalDateTime;

public class LoginResponse {
    private Integer workerID;
    private String workerUser;
    private String workerFName;
    private String workerLName;
    private String workerDisplayName;
    private String workerEmail;
    private LocalDateTime lastLoginAt;
    private boolean admin;

    public LoginResponse(Integer workerID, String workerUser, String workerFName, String workerLName, String workerEmail, boolean admin) {
        this(workerID, workerUser, workerFName, workerLName, null, workerEmail, null, admin);
    }

    public LoginResponse(
            Integer workerID,
            String workerUser,
            String workerFName,
            String workerLName,
            String workerDisplayName,
            String workerEmail,
            LocalDateTime lastLoginAt,
            boolean admin) {
        this.workerID = workerID;
        this.workerUser = workerUser;
        this.workerFName = workerFName;
        this.workerLName = workerLName;
        this.workerDisplayName = workerDisplayName;
        this.workerEmail = workerEmail;
        this.lastLoginAt = lastLoginAt;
        this.admin = admin;
    }

    public Integer getWorkerID() { return workerID; }
    public String getWorkerUser() { return workerUser; }
    public String getWorkerFName() { return workerFName; }
    public String getWorkerLName() { return workerLName; }
    public String getWorkerDisplayName() { return workerDisplayName; }
    public String getWorkerEmail() { return workerEmail; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public boolean isAdmin() { return admin; }
}
