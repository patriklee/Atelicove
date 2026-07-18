package com.atelicove.dto;

import java.time.LocalDateTime;

public class WorkerSummaryResponse {

    private final Integer workerID;
    private final String workerFName;
    private final String workerLName;
    private final String workerDisplayName;
    private final String workerUser;
    private final String workerEmail;
    private final String roleTitle;
    private final String roleDescription;
    private final boolean admin;
    private final boolean archived;
    private final LocalDateTime archivedAt;
    private final LocalDateTime lastLoginAt;

    public WorkerSummaryResponse(Integer workerID, String workerFName, String workerLName,
            String workerDisplayName, String workerUser, String workerEmail, String roleTitle,
            String roleDescription, boolean admin, boolean archived, LocalDateTime archivedAt,
            LocalDateTime lastLoginAt) {
        this.workerID = workerID;
        this.workerFName = workerFName;
        this.workerLName = workerLName;
        this.workerDisplayName = workerDisplayName;
        this.workerUser = workerUser;
        this.workerEmail = workerEmail;
        this.roleTitle = roleTitle;
        this.roleDescription = roleDescription;
        this.admin = admin;
        this.archived = archived;
        this.archivedAt = archivedAt;
        this.lastLoginAt = lastLoginAt;
    }

    public Integer getWorkerID() { return workerID; }
    public String getWorkerFName() { return workerFName; }
    public String getWorkerLName() { return workerLName; }
    public String getWorkerDisplayName() { return workerDisplayName; }
    public String getWorkerUser() { return workerUser; }
    public String getWorkerEmail() { return workerEmail; }
    public String getRoleTitle() { return roleTitle; }
    public String getRoleDescription() { return roleDescription; }
    public boolean isAdmin() { return admin; }
    public boolean isArchived() { return archived; }
    public LocalDateTime getArchivedAt() { return archivedAt; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
}
