package com.atelicove.dto;

import java.time.LocalDateTime;

public class WorkerProfileResponse extends WorkerSummaryResponse {

    public WorkerProfileResponse(Integer workerID, String workerFName, String workerLName,
            String workerDisplayName, String workerUser, String workerEmail, String roleTitle,
            String roleDescription, boolean admin, boolean archived, LocalDateTime archivedAt,
            LocalDateTime lastLoginAt) {
        super(workerID, workerFName, workerLName, workerDisplayName, workerUser, workerEmail,
                roleTitle, roleDescription, admin, archived, archivedAt, lastLoginAt);
    }
}
