package com.atelicove.services;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atelicove.dto.PlannedStaffingRequest;
import com.atelicove.entities.DraftProject;
import com.atelicove.entities.PlannedStaffing;
import com.atelicove.entities.StaffingSlot;
import com.atelicove.entities.Team;
import com.atelicove.entities.Worker;
import com.atelicove.repositories.DraftProjectRepository;
import com.atelicove.repositories.PlannedStaffingRepository;
import com.atelicove.repositories.TeamRepository;
import com.atelicove.repositories.WorkerRepository;

@Service
public class PlannedStaffingService {

    private final DraftProjectRepository draftProjectRepository;
    private final PlannedStaffingRepository plannedStaffingRepository;
    private final TeamRepository teamRepository;
    private final WorkerRepository workerRepository;

    public PlannedStaffingService(
            DraftProjectRepository draftProjectRepository,
            PlannedStaffingRepository plannedStaffingRepository,
            TeamRepository teamRepository,
            WorkerRepository workerRepository) {
        this.draftProjectRepository = draftProjectRepository;
        this.plannedStaffingRepository = plannedStaffingRepository;
        this.teamRepository = teamRepository;
        this.workerRepository = workerRepository;
    }

    public Optional<PlannedStaffing> find(Long draftProjectID, Integer plannedStaffingID) {
        return draftProjectRepository.findById(draftProjectID)
                .flatMap(draft -> draft.getPlannedStaffing().stream()
                        .filter(staffing -> staffing.getPlannedStaffingID() == plannedStaffingID)
                        .findFirst());
    }

    @Transactional
    public DraftProject create(Long draftProjectID, PlannedStaffingRequest request) {
        DraftProject draft = requiredEditableDraft(draftProjectID);
        PlannedStaffing staffing = new PlannedStaffing();
        apply(staffing, request);
        draft.addPlannedStaffing(staffing);
        plannedStaffingRepository.save(staffing);
        return draftProjectRepository.save(draft);
    }

    @Transactional
    public DraftProject update(
            Long draftProjectID,
            Integer plannedStaffingID,
            PlannedStaffingRequest request) {
        DraftProject draft = requiredEditableDraft(draftProjectID);
        PlannedStaffing staffing = requiredPlannedStaffing(draft, plannedStaffingID);
        apply(staffing, request);
        plannedStaffingRepository.save(staffing);
        return draftProjectRepository.save(draft);
    }

    @Transactional
    public DraftProject delete(Long draftProjectID, Integer plannedStaffingID) {
        DraftProject draft = requiredEditableDraft(draftProjectID);
        PlannedStaffing staffing = requiredPlannedStaffing(draft, plannedStaffingID);
        boolean referenced = draft.getDraftWorkOrders().stream()
                .filter(draftWorkOrder -> !draftWorkOrder.isArchived())
                .anyMatch(draftWorkOrder -> plannedStaffingID.equals(draftWorkOrder.getPlannedTeamID()));
        if (referenced) {
            throw new IllegalStateException("Planned staffing cannot be removed while a draft work order uses it");
        }
        draft.removePlannedStaffing(staffing);
        plannedStaffingRepository.delete(staffing);
        return draftProjectRepository.save(draft);
    }

    private void apply(PlannedStaffing staffing, PlannedStaffingRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Planned staffing details are required");
        }
        Team sourceTeam = null;
        if (request.sourceTeamID() != null) {
            sourceTeam = teamRepository.findById(request.sourceTeamID())
                    .orElseThrow(() -> new IllegalArgumentException("Source team not found"));
        }
        String name = normalizeOptional(request.staffingName());
        if (name == null && sourceTeam != null) {
            name = sourceTeam.getTeamName();
        }
        if (name == null) {
            throw new IllegalArgumentException("Planned staffing name is required");
        }

        staffing.setSourceTeamID(request.sourceTeamID());
        staffing.setStaffingName(name);
        staffing.setNotes(request.notes());

        if (request.staffingSlots() != null) {
            for (StaffingSlot slot : List.copyOf(staffing.getStaffingSlots())) {
                staffing.removeStaffingSlot(slot);
            }
            for (PlannedStaffingRequest.Slot slotRequest : request.staffingSlots()) {
                staffing.addStaffingSlot(toStaffingSlot(slotRequest));
            }
        }
    }

    private StaffingSlot toStaffingSlot(PlannedStaffingRequest.Slot request) {
        Worker worker = null;
        if (request.workerID() != null) {
            worker = workerRepository.findById(request.workerID())
                    .orElseThrow(() -> new IllegalArgumentException("Worker not found"));
            if (worker.isArchived()) {
                throw new IllegalStateException("Archived workers cannot be used in planned staffing");
            }
        }
        String roleName = normalizeOptional(request.roleName());
        if (worker == null && roleName == null) {
            throw new IllegalArgumentException("An open staffing slot requires a role name");
        }

        StaffingSlot slot = new StaffingSlot();
        slot.setWorkerID(worker == null ? null : worker.getWorkerID());
        slot.setWorkerName(worker == null
                ? normalizeOptional(request.workerName())
                : workerDisplayName(worker));
        slot.setRoleName(roleName == null && worker != null ? worker.getRoleTitle() : roleName);
        slot.setRoleDescription(request.roleDescription() == null && worker != null
                ? worker.getRoleDescription()
                : request.roleDescription());
        return slot;
    }

    private String workerDisplayName(Worker worker) {
        if (worker.getWorkerDisplayName() != null && !worker.getWorkerDisplayName().isBlank()) {
            return worker.getWorkerDisplayName();
        }
        return (worker.getWorkerFName() + " " + worker.getWorkerLName()).trim();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private DraftProject requiredEditableDraft(Long id) {
        DraftProject draft = draftProjectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Draft project not found"));
        if (draft.isArchived()) {
            throw new IllegalStateException("Archived draft projects cannot be edited");
        }
        return draft;
    }

    private PlannedStaffing requiredPlannedStaffing(DraftProject draft, Integer plannedStaffingID) {
        return draft.getPlannedStaffing().stream()
                .filter(staffing -> staffing.getPlannedStaffingID() == plannedStaffingID)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Planned staffing not found"));
    }
}
