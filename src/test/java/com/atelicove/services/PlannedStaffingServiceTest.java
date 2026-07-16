package com.atelicove.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.dto.PlannedStaffingRequest;
import com.atelicove.entities.DraftProject;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.PlannedStaffing;
import com.atelicove.entities.Worker;
import com.atelicove.repositories.DraftProjectRepository;
import com.atelicove.repositories.PlannedStaffingRepository;
import com.atelicove.repositories.TeamRepository;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class PlannedStaffingServiceTest {

    @Mock private DraftProjectRepository draftProjectRepository;
    @Mock private PlannedStaffingRepository plannedStaffingRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private WorkerRepository workerRepository;
    @InjectMocks private PlannedStaffingService service;

    @Test
    void createSnapshotsActiveWorkerDetails() {
        DraftProject draft = draft();
        Worker worker = new Worker();
        worker.setWorkerID(8);
        worker.setWorkerFName("Pat");
        worker.setWorkerLName("Lee");
        worker.setRoleTitle("Inspector");
        when(draftProjectRepository.findById(4L)).thenReturn(Optional.of(draft));
        when(workerRepository.findById(8)).thenReturn(Optional.of(worker));
        when(draftProjectRepository.save(draft)).thenReturn(draft);

        DraftProject updated = service.create(4L, new PlannedStaffingRequest(
                null,
                "Inspection crew",
                null,
                List.of(new PlannedStaffingRequest.Slot(null, 8, null, null, null))));

        assertThat(updated.getPlannedStaffing()).hasSize(1);
        assertThat(updated.getPlannedStaffing().get(0).getStaffingSlots()).singleElement()
                .satisfies(slot -> {
                    assertThat(slot.getWorkerID()).isEqualTo(8);
                    assertThat(slot.getWorkerName()).isEqualTo("Pat Lee");
                    assertThat(slot.getRoleName()).isEqualTo("Inspector");
                });
    }

    @Test
    void deleteRejectsStaffingUsedByDraftWorkOrder() {
        DraftProject draft = draft();
        PlannedStaffing staffing = new PlannedStaffing();
        staffing.setPlannedStaffingID(6);
        staffing.setStaffingName("Crew A");
        draft.addPlannedStaffing(staffing);
        DraftWorkOrder workOrder = new DraftWorkOrder();
        workOrder.setPlannedTeamID(6);
        draft.addDraftWorkOrder(workOrder);
        when(draftProjectRepository.findById(4L)).thenReturn(Optional.of(draft));

        assertThatThrownBy(() -> service.delete(4L, 6))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("draft work order");
    }

    private DraftProject draft() {
        DraftProject draft = new DraftProject();
        draft.setDraftProjectId(4L);
        draft.setDraftName("Draft");
        return draft;
    }
}
