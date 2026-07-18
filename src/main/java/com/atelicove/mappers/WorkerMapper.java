package com.atelicove.mappers;

import org.springframework.stereotype.Component;

import com.atelicove.dto.CreateWorkerRequest;
import com.atelicove.dto.UpdateWorkerProfileRequest;
import com.atelicove.dto.UpdateWorkerRequest;
import com.atelicove.dto.WorkerProfileResponse;
import com.atelicove.dto.WorkerSummaryResponse;
import com.atelicove.entities.Worker;

@Component
public class WorkerMapper {

    public Worker toWorker(CreateWorkerRequest request) {
        Worker worker = new Worker();
        worker.setWorkerFName(request.getWorkerFName());
        worker.setWorkerLName(request.getWorkerLName());
        worker.setWorkerDisplayName(request.getWorkerDisplayName());
        worker.setWorkerUser(request.getWorkerUser());
        worker.setWorkerEmail(request.getWorkerEmail());
        worker.setWorkerPW(request.getWorkerPW());
        worker.setRoleTitle(request.getRoleTitle());
        worker.setRoleDescription(request.getRoleDescription());
        worker.setAdmin(request.isAdmin());
        return worker;
    }

    public Worker toWorker(UpdateWorkerRequest request) {
        Worker worker = new Worker();
        worker.setWorkerFName(request.getWorkerFName());
        worker.setWorkerLName(request.getWorkerLName());
        worker.setWorkerDisplayName(request.getWorkerDisplayName());
        worker.setWorkerUser(request.getWorkerUser());
        worker.setWorkerEmail(request.getWorkerEmail());
        worker.setRoleTitle(request.getRoleTitle());
        worker.setRoleDescription(request.getRoleDescription());
        worker.setAdmin(request.isAdmin());
        return worker;
    }

    public Worker toWorker(UpdateWorkerProfileRequest request) {
        Worker worker = new Worker();
        worker.setWorkerFName(request.getWorkerFName());
        worker.setWorkerLName(request.getWorkerLName());
        worker.setWorkerDisplayName(request.getWorkerDisplayName());
        worker.setWorkerEmail(request.getWorkerEmail());
        return worker;
    }

    public WorkerSummaryResponse toSummaryResponse(Worker worker) {
        return new WorkerSummaryResponse(
                worker.getWorkerID(), worker.getWorkerFName(), worker.getWorkerLName(),
                worker.getWorkerDisplayName(), worker.getWorkerUser(), worker.getWorkerEmail(),
                worker.getRoleTitle(), worker.getRoleDescription(), worker.isAdmin(),
                worker.isArchived(), worker.getArchivedAt(), worker.getLastLoginAt());
    }

    public WorkerProfileResponse toProfileResponse(Worker worker) {
        return new WorkerProfileResponse(
                worker.getWorkerID(), worker.getWorkerFName(), worker.getWorkerLName(),
                worker.getWorkerDisplayName(), worker.getWorkerUser(), worker.getWorkerEmail(),
                worker.getRoleTitle(), worker.getRoleDescription(), worker.isAdmin(),
                worker.isArchived(), worker.getArchivedAt(), worker.getLastLoginAt());
    }
}
