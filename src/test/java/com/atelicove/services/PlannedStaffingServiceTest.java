package com.atelicove.services;

import static com.atelicove.support.TestFixtures.WORKER_ID;
import static com.atelicove.support.TestFixtures.aTeam;
import static com.atelicove.support.TestFixtures.aWorker;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.atelicove.dto.PlannedStaffingRequest;
import com.atelicove.entities.DraftProject;
import com.atelicove.entities.DraftWorkOrder;
import com.atelicove.entities.PlannedStaffing;
import com.atelicove.entities.Team;
import com.atelicove.entities.Worker;
import com.atelicove.repositories.DraftProjectRepository;
import com.atelicove.repositories.PlannedStaffingRepository;
import com.atelicove.repositories.TeamRepository;
import com.atelicove.repositories.WorkerRepository;

@ExtendWith(MockitoExtension.class)
class PlannedStaffingServiceTest {

    private static final long DRAFT_ID = 4L;
    private static final int STAFFING_ID = 6;
    private static final String STAFFING_NAME = "Inspection crew";

    @Mock private DraftProjectRepository draftProjectRepository;
    @Mock private PlannedStaffingRepository plannedStaffingRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private WorkerRepository workerRepository;
    @InjectMocks private PlannedStaffingService service;

    @Nested
    class Find {

        @Test
        void find_ShouldReturnOnlyStaffingOwnedByDraft() {
            // Given
            DraftProject draft = draftWithStaffing();
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));

            // When / Then
            assertThat(service.find(DRAFT_ID, STAFFING_ID)).isPresent();
            assertThat(service.find(DRAFT_ID, 999)).isEmpty();

            // Given
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThat(service.find(DRAFT_ID, STAFFING_ID)).isEmpty();
        }
    }

    @Nested
    class CreateAndUpdate {

        @Test
        void create_ShouldSnapshotActiveWorkerDetails() {
            // Given
            DraftProject draft = draft();
            Worker worker = aWorker().build();
            worker.setRoleTitle("Inspector");
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(worker));
            when(draftProjectRepository.save(draft)).thenReturn(draft);

            // When
            DraftProject result = service.create(DRAFT_ID, request(null, STAFFING_NAME,
                    List.of(new PlannedStaffingRequest.Slot(null, WORKER_ID, null, null, null))));

            // Then
            assertThat(result.getPlannedStaffing()).singleElement().satisfies(staffing -> {
                assertThat(staffing.getStaffingName()).isEqualTo(STAFFING_NAME);
                assertThat(staffing.getStaffingSlots()).singleElement().satisfies(slot -> {
                    assertThat(slot.getWorkerID()).isEqualTo(WORKER_ID);
                    assertThat(slot.getWorkerName()).isEqualTo("Pat Lee");
                    assertThat(slot.getRoleName()).isEqualTo("Inspector");
                });
            });
            verify(plannedStaffingRepository).save(any(PlannedStaffing.class));
            verify(draftProjectRepository).save(draft);
        }

        @Test
        void create_ShouldUseSourceTeamName_WhenStaffingNameIsMissing() {
            // Given
            DraftProject draft = draft();
            Team team = aTeam().named("Source crew").build();
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));
            when(teamRepository.findById(team.getTeamID())).thenReturn(Optional.of(team));
            when(draftProjectRepository.save(draft)).thenReturn(draft);

            // When
            DraftProject result = service.create(DRAFT_ID, request(team.getTeamID(), null, null));

            // Then
            assertThat(result.getPlannedStaffing()).singleElement()
                    .extracting(PlannedStaffing::getStaffingName).isEqualTo("Source crew");
        }

        @Test
        void update_ShouldReplaceStaffingSlots_WhenRequestIsValid() {
            // Given
            DraftProject draft = draftWithStaffing();
            PlannedStaffing staffing = draft.getPlannedStaffing().get(0);
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));
            when(draftProjectRepository.save(draft)).thenReturn(draft);

            // When
            DraftProject result = service.update(DRAFT_ID, STAFFING_ID,
                    request(null, "Updated", List.of(new PlannedStaffingRequest.Slot(null, null, "Future hire", "Designer", null))));

            // Then
            assertThat(result).isSameAs(draft);
            assertThat(staffing.getStaffingName()).isEqualTo("Updated");
            assertThat(staffing.getStaffingSlots()).singleElement()
                    .satisfies(slot -> assertThat(slot.getRoleName()).isEqualTo("Designer"));
            verify(plannedStaffingRepository).save(staffing);
        }

        @Test
        void mutations_ShouldRejectUnknownOrArchivedDraftAndUnknownStaffing() {
            // Given
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> service.create(DRAFT_ID, request(null, STAFFING_NAME, null)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Draft project not found");

            // Given
            DraftProject archived = draft();
            archived.setArchived(true);
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(archived));

            // When / Then
            assertThatThrownBy(() -> service.create(DRAFT_ID, request(null, STAFFING_NAME, null)))
                    .isInstanceOf(IllegalStateException.class).hasMessage("Archived draft projects cannot be edited");

            // Given
            DraftProject active = draft();
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(active));

            // When / Then
            assertThatThrownBy(() -> service.update(DRAFT_ID, STAFFING_ID, request(null, STAFFING_NAME, null)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Planned staffing not found");
        }

        @Test
        void create_ShouldRejectInvalidRequestTeamWorkerAndOpenSlot() {
            // Given
            DraftProject draft = draft();
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));

            // When / Then
            assertThatThrownBy(() -> service.create(DRAFT_ID, null))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Planned staffing details are required");
            assertThatThrownBy(() -> service.create(DRAFT_ID, request(null, " ", null)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Planned staffing name is required");

            // Given / When / Then
            when(teamRepository.findById(999)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.create(DRAFT_ID, request(999, null, null)))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Source team not found");

            // Given / When / Then
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.create(DRAFT_ID, request(null, STAFFING_NAME,
                    List.of(new PlannedStaffingRequest.Slot(null, WORKER_ID, null, null, null)))))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("Worker not found");

            // Given / When / Then
            Worker archived = aWorker().archived().build();
            when(workerRepository.findById(WORKER_ID)).thenReturn(Optional.of(archived));
            assertThatThrownBy(() -> service.create(DRAFT_ID, request(null, STAFFING_NAME,
                    List.of(new PlannedStaffingRequest.Slot(null, WORKER_ID, null, null, null)))))
                    .isInstanceOf(IllegalStateException.class).hasMessage("Archived workers cannot be used in planned staffing");

            // When / Then
            assertThatThrownBy(() -> service.create(DRAFT_ID, request(null, STAFFING_NAME,
                    List.of(new PlannedStaffingRequest.Slot(null, null, null, " ", null)))))
                    .isInstanceOf(IllegalArgumentException.class).hasMessage("An open staffing slot requires a role name");
        }
    }

    @Nested
    class Delete {

        @Test
        void delete_ShouldRemoveUnreferencedStaffing() {
            // Given
            DraftProject draft = draftWithStaffing();
            PlannedStaffing staffing = draft.getPlannedStaffing().get(0);
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));
            when(draftProjectRepository.save(draft)).thenReturn(draft);

            // When
            DraftProject result = service.delete(DRAFT_ID, STAFFING_ID);

            // Then
            assertThat(result.getPlannedStaffing()).isEmpty();
            verify(plannedStaffingRepository).delete(staffing);
            verify(draftProjectRepository).save(draft);
        }

        @Test
        void delete_ShouldRejectStaffingReferencedByActiveDraftWorkOrder() {
            // Given
            DraftProject draft = draftWithStaffing();
            DraftWorkOrder workOrder = new DraftWorkOrder();
            workOrder.setPlannedTeamID(STAFFING_ID);
            draft.addDraftWorkOrder(workOrder);
            when(draftProjectRepository.findById(DRAFT_ID)).thenReturn(Optional.of(draft));

            // When / Then
            assertThatThrownBy(() -> service.delete(DRAFT_ID, STAFFING_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Planned staffing cannot be removed while a draft work order uses it");
            verify(plannedStaffingRepository, never()).delete(any());
        }
    }

    private DraftProject draft() {
        DraftProject draft = new DraftProject();
        draft.setDraftProjectId(DRAFT_ID);
        draft.setDraftName("Draft");
        return draft;
    }

    private DraftProject draftWithStaffing() {
        DraftProject draft = draft();
        PlannedStaffing staffing = new PlannedStaffing();
        staffing.setPlannedStaffingID(STAFFING_ID);
        staffing.setStaffingName(STAFFING_NAME);
        draft.addPlannedStaffing(staffing);
        return draft;
    }

    private PlannedStaffingRequest request(Integer teamId, String name, List<PlannedStaffingRequest.Slot> slots) {
        return new PlannedStaffingRequest(teamId, name, "notes", slots);
    }
}
